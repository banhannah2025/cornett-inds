import { auth } from "@clerk/nextjs/server";
import { getSanityWriteClient } from "@/sanity/lib/writeClient";

export const dynamic = "force-dynamic";

type TripInput = Record<string, unknown> & { id: number; departure?: string; departureTime?: string };
type ReadinessDone = Record<string, boolean>;

const readinessLabels = {
  confirmHours: "Confirm check-in or gate hours",
  internetBackup: "Verify internet and cell backup",
  utilities: "Check power, water, and hookups",
  weatherRoads: "Review weather and road conditions",
} as const;

const allowedFields = [
  "origin", "originLatitude", "originLongitude", "destination", "destinationLatitude",
  "destinationLongitude", "property", "arrival", "arrivalTime", "departure", "departureTime", "timeZoneOffsetMinutes",
  "confirmation", "cost", "notes", "reserved", "travelMode", "vehicleId", "fuelPrice",
  "customMpg", "otherTravelCost", "estimatedMiles", "estimatedFuelCost",
  "estimatedMaintenance", "estimatedOwnership", "estimatedTravelTotal",
] as const;

function tripDocumentId(userId: string, localId: number) {
  return `basecampTrip.${userId.replace(/[^A-Za-z0-9_-]/g, "-")}.${localId}`;
}

function completionTime(trip: TripInput) {
  const departure = trip.departure ?? "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(departure)) return null;
  const time = /^\d{2}:\d{2}$/.test(trip.departureTime ?? "") ? (trip.departureTime ?? "23:59") : "23:59";
  const [year = 0, month = 1, day = 1] = departure.split("-").map(Number);
  const [hour = 23, minute = 59] = time.split(":").map(Number);
  const offset = typeof trip.timeZoneOffsetMinutes === "number" ? trip.timeZoneOffsetMinutes : 0;
  const value = Date.UTC(year, month - 1, day, hour, minute) + offset * 60_000;
  return Number.isNaN(value) ? null : value;
}

function isCompleted(trip: TripInput) {
  const completedAt = completionTime(trip);
  return completedAt !== null && completedAt < Date.now();
}

function sanitizeTrip(userId: string, trip: TripInput, done: ReadinessDone): { _id: string; _type: string; [key: string]: unknown } {
  if (!Number.isSafeInteger(trip.id) || trip.id <= 0) throw new Error("Invalid trip ID");
  const document: { _id: string; _type: string; [key: string]: unknown } = {
    _id: tripDocumentId(userId, trip.id),
    _type: "basecampTrip",
    ownerId: userId,
    localId: trip.id,
    archived: false,
    stayType: ["campsite", "hotel", "rental", "boondocking"].includes(String(trip.type)) ? trip.type : "campsite",
    readinessDone: Object.fromEntries(Object.entries(readinessLabels).map(([key, label]) => [key, Boolean(done[label])])),
  };
  for (const key of allowedFields) {
    const value = trip[key];
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") document[key] = value;
  }
  return document;
}

async function authenticatedUserId() {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) return null;
  return (await auth()).userId;
}

export async function GET() {
  const userId = await authenticatedUserId();
  if (!userId) return Response.json({ error: "Sign in to sync trips." }, { status: 401 });
  try {
    const client = getSanityWriteClient();
    const documents = await client.fetch<Array<TripInput & { _id: string; stayType?: string }>>(
      `*[_type == "basecampTrip" && ownerId == $userId] | order(arrival asc){...}`, { userId },
    );
    const completed = documents.filter((trip) => !trip.archived && isCompleted(trip));
    if (completed.length) {
      const transaction = client.transaction();
      const archivedAt = new Date().toISOString();
      completed.forEach((trip) => transaction.patch(trip._id, (patch) => patch.set({ archived: true, archivedAt })));
      await transaction.commit();
    }
    const archivedIds = new Set(completed.map((trip) => trip.localId));
    const serialize = (trip: TripInput & { stayType?: string }) => {
      const result: Record<string, unknown> = { id: trip.localId, type: trip.stayType ?? "campsite" };
      for (const key of allowedFields) {
        const value = trip[key];
        if (value !== undefined) result[key] = value;
      }
      return result;
    };
    const trips = documents.filter((trip) => !trip.archived && !archivedIds.has(trip.localId)).map(serialize);
    const archivedTrips = documents.filter((trip) => trip.archived || archivedIds.has(trip.localId)).map(serialize);
    const readiness = documents.find((trip) => !trip.archived && !archivedIds.has(trip.localId))?.readinessDone as Record<string, boolean> | undefined;
    const done = Object.fromEntries(Object.entries(readinessLabels).map(([key, label]) => [label, Boolean(readiness?.[key])]));
    return Response.json({ trips, archivedTrips, done, archivedIds: [...archivedIds] });
  } catch (error) {
    console.error("[basecamp-trips] load failed", error);
    return Response.json({ error: "Trips could not be loaded." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const userId = await authenticatedUserId();
  if (!userId) return Response.json({ error: "Sign in to sync trips." }, { status: 401 });
  try {
    const body = (await request.json()) as { trips?: TripInput[]; done?: ReadinessDone };
    if (!Array.isArray(body.trips) || body.trips.length > 200) return Response.json({ error: "Invalid trip list." }, { status: 400 });
    const activeTrips = body.trips.filter((trip) => !isCompleted(trip));
    const client = getSanityWriteClient();
    const transaction = client.transaction();
    for (const trip of activeTrips) transaction.createOrReplace(sanitizeTrip(userId, trip, body.done ?? {}));
    const archivedAt = new Date().toISOString();
    for (const trip of body.trips.filter(isCompleted)) transaction.createOrReplace({ ...sanitizeTrip(userId, trip, body.done ?? {}), archived: true, archivedAt });
    if (body.trips.length) await transaction.commit();
    return Response.json({ saved: activeTrips.length, archivedIds: body.trips.filter(isCompleted).map((trip) => trip.id) });
  } catch (error) {
    console.error("[basecamp-trips] save failed", error);
    return Response.json({ error: "Trips could not be saved." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const userId = await authenticatedUserId();
  if (!userId) return Response.json({ error: "Sign in to sync trips." }, { status: 401 });
  const id = Number(new URL(request.url).searchParams.get("id"));
  if (!Number.isSafeInteger(id) || id <= 0) return Response.json({ error: "Invalid trip ID." }, { status: 400 });
  try {
    await getSanityWriteClient().delete(tripDocumentId(userId, id));
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error("[basecamp-trips] delete failed", error);
    return Response.json({ error: "Trip could not be deleted." }, { status: 500 });
  }
}
