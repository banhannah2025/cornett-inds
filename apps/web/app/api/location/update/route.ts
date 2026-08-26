import { createHash, timingSafeEqual } from "node:crypto";
import { getSanityWriteClient } from "@/sanity/lib/writeClient";

const LOCATION_DOCUMENT_ID = "currentLocation";
const TIME_ZONE = process.env.LOCATION_TIME_ZONE ?? "America/Los_Angeles";

type Daypart = "morning" | "afternoon" | "evening";
type StoredLocation = {
  _rev: string;
  lastMorningDate?: string;
  lastAfternoonDate?: string;
  lastEveningDate?: string;
};

function authorized(request: Request) {
  const configuredSecret = process.env.LOCATION_UPDATE_SECRET;
  const suppliedSecret = request.headers
    .get("authorization")
    ?.replace(/^Bearer\s+/i, "");
  if (!configuredSecret || !suppliedSecret) return false;

  const expected = createHash("sha256").update(configuredSecret).digest();
  const supplied = createHash("sha256").update(suppliedSecret).digest();
  return timingSafeEqual(expected, supplied);
}

function localWindow(now: Date): { dateKey: string; daypart: Daypart | null } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  const hour = Number(value("hour"));
  const dateKey = `${value("year")}-${value("month")}-${value("day")}`;

  if (hour >= 5 && hour < 12) return { dateKey, daypart: "morning" };
  if (hour >= 12 && hour < 18) return { dateKey, daypart: "afternoon" };
  if (hour >= 18) return { dateKey, daypart: "evening" };
  return { dateKey, daypart: null };
}

function dateField(daypart: Daypart) {
  return `last${daypart.charAt(0).toUpperCase()}${daypart.slice(1)}Date` as
    "lastMorningDate" | "lastAfternoonDate" | "lastEveningDate";
}

function coordinate(value: unknown, min: number, max: number) {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= min &&
    value <= max
  );
}

async function reverseGeocode(latitude: number, longitude: number) {
  const endpoint =
    process.env.LOCATION_GEOCODER_URL ??
    "https://nominatim.openstreetmap.org/reverse";
  const url = new URL(endpoint);
  url.searchParams.set("format", "jsonv2");
  // About 1 km of precision is plenty for a city lookup and minimizes what
  // leaves our server. The unrounded coordinates are never persisted.
  url.searchParams.set("lat", latitude.toFixed(2));
  url.searchParams.set("lon", longitude.toFixed(2));
  url.searchParams.set("zoom", "10");
  url.searchParams.set("addressdetails", "1");

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent":
        process.env.LOCATION_GEOCODER_USER_AGENT ??
        "BlendedWorksLocation/1.0 (blendedworks.com)",
    },
    cache: "no-store",
  });
  if (!response.ok)
    throw new Error(`Location lookup failed with ${response.status}.`);

  const result = (await response.json()) as {
    address?: Record<string, string | undefined>;
  };
  const address = result.address ?? {};
  const city =
    address.city ??
    address.town ??
    address.village ??
    address.municipality ??
    address.county;
  const region = address.state ?? address.region;
  if (!city)
    throw new Error(
      "The location lookup did not return a city or general area.",
    );

  return {
    city,
    region,
    country: address.country,
    displayName: region && region !== city ? `${city}, ${region}` : city,
  };
}

export async function POST(request: Request) {
  if (!authorized(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { dateKey, daypart } = localWindow(new Date());
  if (!daypart) {
    return Response.json(
      { error: "Updates are paused between midnight and 5:00 a.m." },
      { status: 409 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { latitude, longitude } = (body ?? {}) as Record<string, unknown>;
  if (!coordinate(latitude, -90, 90) || !coordinate(longitude, -180, 180)) {
    return Response.json(
      { error: "Valid latitude and longitude are required." },
      { status: 400 },
    );
  }

  const client = getSanityWriteClient();
  const current =
    await client.getDocument<StoredLocation>(LOCATION_DOCUMENT_ID);
  const acceptedField = dateField(daypart);
  if (current?.[acceptedField] === dateKey) {
    return Response.json(
      { error: `The ${daypart} update was already accepted.` },
      { status: 409 },
    );
  }

  const place = await reverseGeocode(latitude as number, longitude as number);
  const updatedAt = new Date().toISOString();
  const fields = { ...place, updatedAt, daypart, [acceptedField]: dateKey };

  try {
    if (current) {
      await client
        .patch(LOCATION_DOCUMENT_ID)
        .ifRevisionId(current._rev)
        .set(fields)
        .commit();
    } else {
      await client.create({
        _id: LOCATION_DOCUMENT_ID,
        _type: "currentLocation",
        ...fields,
      });
    }
  } catch (error) {
    if (error instanceof Error && /conflict/i.test(error.message)) {
      return Response.json(
        { error: "Another update was accepted first." },
        { status: 409 },
      );
    }
    throw error;
  }

  return Response.json({ location: place.displayName, updatedAt, daypart });
}
