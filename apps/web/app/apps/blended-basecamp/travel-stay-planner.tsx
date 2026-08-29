"use client";
import { cloneElement, useEffect, useMemo, useRef, useState } from "react";
import {
  BedDouble,
  CalendarCheck,
  CalendarRange,
  Check,
  CircleDollarSign,
  MapPinned,
  Plus,
  Route,
  TentTree,
  Trash2,
} from "lucide-react";
import { LocationAutocomplete, type Place } from "./location-autocomplete";
type StayType = "campsite" | "hotel" | "rental" | "boondocking";
type Stay = {
  id: number;
  origin?: string;
  originLatitude?: number;
  originLongitude?: number;
  destination: string;
  destinationLatitude?: number;
  destinationLongitude?: number;
  property: string;
  type: StayType;
  arrival: string;
  arrivalTime?: string;
  departure: string;
  departureTime?: string;
  timeZoneOffsetMinutes?: number;
  confirmation: string;
  cost: string;
  notes: string;
  reserved: boolean;
  travelMode?: string;
  vehicleId?: string;
  fuelPrice?: number;
  customMpg?: number;
  otherTravelCost?: number;
  estimatedMiles?: number;
  estimatedFuelCost?: number;
  estimatedMaintenance?: number;
  estimatedOwnership?: number;
  estimatedTravelTotal?: number;
};
type VehicleAsset = { id: string; year: number; make: string; model: string; combinedMpg: number | null; maintenanceBudget?: number; insuranceBudget?: number; registrationBudget?: number };
const labels: Record<StayType, string> = {
  campsite: "Campsite",
  hotel: "Hotel / motel",
  rental: "Rental",
  boondocking: "Boondocking",
};
const checks = [
  "Confirm check-in or gate hours",
  "Verify internet and cell backup",
  "Check power, water, and hookups",
  "Review weather and road conditions",
];
function completedLocally(trip: Stay) {
  if (!trip.departure) return false;
  const time = trip.departureTime || "23:59";
  const value = new Date(`${trip.departure}T${time}:00`);
  return !Number.isNaN(value.getTime()) && value.getTime() < Date.now();
}
const calendarIds = (stayId: number): [number, number] => [stayId * 10 + 1, stayId * 10 + 2];
type TripCalendarItem = { id: number; date: string; title: string; type: "travel"; time: string; source?: "trip"; tripId?: number };
function syncTripsToCalendar(trips: Stay[]) {
  const saved = JSON.parse(localStorage.getItem("blended-basecamp-calendar") ?? "[]") as TripCalendarItem[];
  const currentIds = new Set(trips.flatMap((trip) => calendarIds(trip.id)));
  const next = saved.filter((item) => item.source !== "trip" && !currentIds.has(item.id));
  for (const trip of trips) {
    if (!trip.destination || !trip.arrival) continue;
    const ids = calendarIds(trip.id), location = trip.property || trip.destination;
    next.push({ id: ids[0], date: trip.arrival, title: `Check in: ${location}`, type: "travel", time: trip.arrivalTime || "15:00", source: "trip", tripId: trip.id });
    if (trip.departure) next.push({ id: ids[1], date: trip.departure, title: `Check out: ${location}`, type: "travel", time: trip.departureTime || "11:00", source: "trip", tripId: trip.id });
  }
  localStorage.setItem("blended-basecamp-calendar", JSON.stringify(next));
}
function removeCalendarStay(stayId: number) {
  try {
    const ids = new Set(calendarIds(stayId));
    const items = JSON.parse(localStorage.getItem("blended-basecamp-calendar") ?? "[]") as { id: number }[];
    localStorage.setItem("blended-basecamp-calendar", JSON.stringify(items.filter((item) => !ids.has(item.id))));
  } catch { localStorage.removeItem("blended-basecamp-calendar"); }
}
function removeTravelEstimate(stayId: number) {
  try {
    const finance = JSON.parse(localStorage.getItem("blended-basecamp-finance") ?? "{}");
    localStorage.setItem("blended-basecamp-finance", JSON.stringify({ ...finance, travelEstimates: (finance.travelEstimates ?? []).filter((item: { id: number }) => item.id !== stayId) }));
  } catch { return; }
}
export function TravelStayPlanner() {
  const [plans, setPlans] = useState<Stay[]>([]),
    [activeId, setActiveId] = useState<number | null>(null),
    [done, setDone] = useState<Record<string, boolean>>({}),
    [calendarMessage, setCalendarMessage] = useState(""),
    [estimateMessage, setEstimateMessage] = useState(""),
    [estimating, setEstimating] = useState(false),
    [vehicles, setVehicles] = useState<VehicleAsset[]>([]),
    [loaded, setLoaded] = useState(false),
    [syncEnabled, setSyncEnabled] = useState(false),
    [archivedPlans, setArchivedPlans] = useState<Stay[]>([]),
    [syncMessage, setSyncMessage] = useState("Loading saved trips…"),
    saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    const load = async () => {
      let localPlans: Stay[] = [];
      let localTripsForMigration: Stay[] = [];
      let localDone: Record<string, boolean> = {};
      try {
        const raw = localStorage.getItem("blended-basecamp-travel");
        if (raw) {
          const data = JSON.parse(raw);
          const restored = (data.plans ?? []).map((trip: Stay) => ({ ...trip, timeZoneOffsetMinutes: trip.timeZoneOffsetMinutes ?? new Date().getTimezoneOffset() }));
          localTripsForMigration = restored;
          const completedIds = restored.filter(completedLocally).map((trip: Stay) => trip.id);
          completedIds.forEach((id: number) => { removeCalendarStay(id); removeTravelEstimate(id); });
          localPlans = restored.filter((trip: Stay) => !completedLocally(trip));
          localDone = data.done ?? {};
          setDone(localDone);
        }
      } catch { localStorage.removeItem("blended-basecamp-travel"); }
      setPlans(localPlans);
      setActiveId(localPlans[0]?.id ?? null);
      try {
        let response = await fetch("/api/basecamp/trips", { cache: "no-store" });
        if (response.status === 401) { setSyncMessage("Sign in to save trips across devices."); return; }
        if (!response.ok) throw new Error();
        const migrationKey = "blended-basecamp-travel-sanity-migrated";
        if (localTripsForMigration.length && !localStorage.getItem(migrationKey)) {
          const migration = await fetch("/api/basecamp/trips", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ trips: localTripsForMigration, done: localDone }) });
          if (!migration.ok) throw new Error();
          localStorage.setItem(migrationKey, "true");
          response = await fetch("/api/basecamp/trips", { cache: "no-store" });
        }
        const data = await response.json() as { trips?: Stay[]; archivedTrips?: Stay[]; done?: Record<string, boolean>; archivedIds?: number[] };
        for (const id of data.archivedIds ?? []) { removeCalendarStay(id); removeTravelEstimate(id); }
        const remotePlans = data.trips ?? [];
        setArchivedPlans(data.archivedTrips ?? []);
        setDone(data.done ?? {});
        setPlans(remotePlans);
        setActiveId(remotePlans[0]?.id ?? null);
        setSyncEnabled(true);
        setSyncMessage("Trips are synced securely.");
      } catch { setSyncMessage("Trip sync is temporarily unavailable. Changes remain on this device."); }
      finally { setLoaded(true); }
    };
    void load();
    try { setVehicles(JSON.parse(localStorage.getItem("blended-basecamp-vehicles") ?? "[]")); } catch { setVehicles([]); }
  }, []);
  useEffect(() => {
    if (loaded) {
      localStorage.setItem(
        "blended-basecamp-travel",
        JSON.stringify({ plans, done }),
      );
      try { syncTripsToCalendar(plans); }
      catch { setCalendarMessage("Trips are saved, but the calendar could not be updated."); }
      if (syncEnabled) {
        if (saveTimer.current) clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(async () => {
          try {
            const response = await fetch("/api/basecamp/trips", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ trips: plans, done }) });
            if (!response.ok) throw new Error();
            const result = await response.json() as { archivedIds?: number[] };
            if (result.archivedIds?.length) {
              const archived = new Set(result.archivedIds);
              result.archivedIds.forEach((id) => { removeCalendarStay(id); removeTravelEstimate(id); });
              setArchivedPlans((value) => [...plans.filter((trip) => archived.has(trip.id)), ...value.filter((trip) => !archived.has(trip.id))]);
              setPlans((value) => value.filter((trip) => !archived.has(trip.id)));
              setActiveId((value) => value && archived.has(value) ? null : value);
            }
            setSyncMessage("Trips are synced securely.");
          } catch { setSyncMessage("Trip sync failed. Changes remain on this device."); }
        }, 700);
      }
    }
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [plans, done, loaded, syncEnabled]);
  const active = plans.find((p) => p.id === activeId) ?? plans[0];
  const nights = useMemo(
    () =>
      !active?.arrival || !active.departure
        ? 0
        : Math.max(
            0,
            Math.ceil(
              (new Date(active.departure).getTime() -
                new Date(active.arrival).getTime()) /
                86400000,
            ),
          ),
    [active],
  );
  const lodgingEstimate = Number((active?.cost || "").replace(/[^0-9.-]/g, "")) || 0;
  const combinedEstimate = lodgingEstimate + (active?.estimatedTravelTotal ?? 0);
  const add = () => {
    const id = Date.now(),
      p: Stay = {
        id,
        origin: "",
        destination: "",
        property: "",
        type: "campsite",
        arrival: "",
        arrivalTime: "15:00",
        departure: "",
        departureTime: "11:00",
        timeZoneOffsetMinutes: new Date().getTimezoneOffset(),
        confirmation: "",
        cost: "",
        notes: "",
        reserved: false,
        travelMode: "driving",
        fuelPrice: 4,
        customMpg: 25,
        otherTravelCost: 0,
      };
    setPlans((v) => [...v, p]);
    setActiveId(id);
  };
  const update = <K extends keyof Stay>(key: K, value: Stay[K]) => {
    if (!active) return;
    setCalendarMessage("");
    setPlans((v) => v.map((p) => (p.id === active.id ? { ...p, [key]: value, estimatedTravelTotal: undefined } : p)));
  };
  const deleteStay = async (stayId: number) => {
    removeCalendarStay(stayId);
    removeTravelEstimate(stayId);
    setPlans((value) => value.filter((plan) => plan.id !== stayId));
    setActiveId(null);
    if (!syncEnabled) return;
    try {
      const response = await fetch(`/api/basecamp/trips?id=${stayId}`, { method: "DELETE" });
      if (!response.ok) throw new Error();
    } catch { setSyncMessage("The trip was removed here, but cloud deletion needs to be retried."); }
  };
  const syncStayToCalendar = () => {
    if (!active?.destination || !active.arrival) return;
    try {
      syncTripsToCalendar(plans);
      localStorage.setItem("blended-basecamp-calendar-focus", active.arrival);
      setCalendarMessage("Trip is synced to the calendar.");
    } catch {
      setCalendarMessage("The stay could not be added to the calendar.");
    }
  };
  const selectDestination = (place: Place) =>
    active && setPlans((plans) => plans.map((plan) => plan.id === active.id ? { ...plan, destination: place.label, destinationLatitude: place.latitude, destinationLongitude: place.longitude } : plan));
  const selectOrigin = (place: Place) => active && setPlans((plans) => plans.map((plan) => plan.id === active.id ? { ...plan, origin: place.label, originLatitude: place.latitude, originLongitude: place.longitude } : plan));
  const resolveLocation = async (label: string, latitude?: number, longitude?: number) => {
    if (latitude !== undefined && longitude !== undefined) return { latitude, longitude };
    const response = await fetch(`/api/location-search?q=${encodeURIComponent(label)}`);
    const data = (await response.json()) as { results?: Place[] };
    const place = data.results?.[0];
    if (!response.ok || !place) throw new Error(`Could not locate ${label}`);
    return { latitude: place.latitude, longitude: place.longitude };
  };
  const estimateTrip = async (silent = false) => {
    if (!active?.origin?.trim() || !active.destination.trim()) { if (!silent) setEstimateMessage("Enter both a starting location and destination."); return; }
    if (!silent) { setEstimating(true); setEstimateMessage("Locating the route…"); }
    try {
    const [origin, destination] = await Promise.all([resolveLocation(active.origin, active.originLatitude, active.originLongitude), resolveLocation(active.destination, active.destinationLatitude, active.destinationLongitude)]);
    const radians = (degrees: number) => degrees * Math.PI / 180, dLat = radians(destination.latitude - origin.latitude), dLon = radians(destination.longitude - origin.longitude);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(radians(origin.latitude)) * Math.cos(radians(destination.latitude)) * Math.sin(dLon / 2) ** 2;
    const miles = 3958.8 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 1.18;
    const vehicle = vehicles.find((item) => item.id === active.vehicleId), mpg = vehicle?.combinedMpg || active.customMpg || 25;
    const roadMode = ["driving", "rv", "motorcycle"].includes(active.travelMode || "driving");
    const fuel = roadMode ? miles / mpg * (active.fuelPrice ?? 4) : 0;
    const maintenance = roadMode ? miles * ((vehicle?.maintenanceBudget ?? 1200) / 12000) : 0;
    const ownership = roadMode ? miles * (((vehicle?.insuranceBudget ?? 0) + (vehicle?.registrationBudget ?? 0)) / 12000) : 0;
    const total = fuel + maintenance + ownership + (active.otherTravelCost || 0);
    const estimate = { estimatedMiles: Math.round(miles * 100) / 100, estimatedFuelCost: fuel, estimatedMaintenance: maintenance, estimatedOwnership: ownership, estimatedTravelTotal: total };
    setPlans((plans) => plans.map((plan) => plan.id === active.id ? { ...plan, ...estimate, originLatitude: origin.latitude, originLongitude: origin.longitude, destinationLatitude: destination.latitude, destinationLongitude: destination.longitude } : plan));
    const finance = JSON.parse(localStorage.getItem("blended-basecamp-finance") ?? "{}");
    const record = { id: active.id, name: `${active.origin} to ${active.destination}`, date: active.arrival, mode: active.travelMode || "driving", vehicleId: active.vehicleId, miles: estimate.estimatedMiles, fuel, maintenance, ownership, other: active.otherTravelCost || 0, total };
    localStorage.setItem("blended-basecamp-finance", JSON.stringify({ ...finance, travelEstimates: [...(finance.travelEstimates ?? []).filter((item: { id: number }) => item.id !== active.id), record] }));
    if (!silent) setEstimateMessage("Trip estimate updated and sent to Money.");
    } catch { if (!silent) setEstimateMessage("We could not match one of those locations. Select a suggestion or add a more specific city, state, or address."); }
    finally { if (!silent) setEstimating(false); }
  };
  useEffect(() => {
    if (active?.originLatitude !== undefined && active.originLongitude !== undefined && active.destinationLatitude !== undefined && active.destinationLongitude !== undefined) void estimateTrip(true);
  }, [active?.originLatitude, active?.originLongitude, active?.destinationLatitude, active?.destinationLongitude, active?.travelMode, active?.vehicleId, active?.fuelPrice, active?.customMpg, active?.otherTravelCost]);
  return (
    <section id="travel-planner" className="mb-10">
      <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow">Travel & stay planner</p>
          <h2 className="basecamp-serif text-3xl font-bold sm:text-4xl">
            Know where you’re going—and where you’ll land.
          </h2>
        </div>
        <button
          onClick={add}
          className="flex items-center justify-center gap-2 rounded-xl bg-[#244a40] px-4 py-3 text-sm font-bold text-white"
        >
          <Plus size={18} />
          Add a stay
        </button>
      </div>
      <p className="mb-4 text-xs font-bold text-[#527568]" role="status">{syncMessage}</p>
      <div className="grid items-start gap-5 xl:grid-cols-[.42fr_1fr_.58fr]">
        <aside className="panel overflow-hidden">
          <div className="border-b border-black/10 p-4 text-[10px] font-extrabold uppercase tracking-wider">
            Trip stops
          </div>
          {plans.length === 0 ? (
            <p className="p-5 text-sm text-[#68746f]">
              Add your next campsite, hotel, rental, or overnight stop.
            </p>
          ) : (
            plans.map((p, i) => (
              <button
                key={p.id}
                onClick={() => setActiveId(p.id)}
                className={`flex w-full items-center gap-3 border-b border-black/10 p-4 text-left ${active?.id === p.id ? "bg-[#e8efe8]" : "hover:bg-[#f7f2e8]"}`}
              >
                <span className="grid size-9 place-items-center rounded-xl bg-[#eee9df] text-[#a76536]">
                  {p.type === "campsite" || p.type === "boondocking" ? (
                    <TentTree size={18} />
                  ) : (
                    <BedDouble size={18} />
                  )}
                </span>
                <span className="min-w-0">
                  <b className="block truncate text-sm">
                    {p.destination || `Stop ${i + 1}`}
                  </b>
                  <small>{labels[p.type]}</small>
                </span>
              </button>
            ))
          )}
        </aside>
        <div className="panel p-5 sm:p-6">
          {!active ? (
            <div className="grid min-h-80 place-items-center text-center">
              <div>
                <Route className="mx-auto text-[#b66e38]" size={36} />
                <h3 className="basecamp-serif mt-3 text-2xl font-bold">
                  Plan the next stop.
                </h3>
              </div>
            </div>
          ) : (
            <>
              <div className="flex justify-between">
                <div>
                  <p className="eyebrow">Stay details</p>
                  <h3 className="basecamp-serif text-2xl font-bold">
                    {active.destination || "New destination"}
                  </h3>
                </div>
                <button
                  aria-label="Delete stay"
                  onClick={() => {
                    void deleteStay(active.id);
                  }}
                >
                  <Trash2 className="text-[#9a5845]" size={18} />
                </button>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Field label="Starting location">
                  <LocationAutocomplete label="Starting location" value={active.origin || ""} onChange={(value) => { update("origin", value); update("originLatitude", undefined); update("originLongitude", undefined); }} onSelect={selectOrigin} placeholder="Address, city, or current camp" />
                </Field>
                <Field label="Destination">
                  <LocationAutocomplete
                    label="Destination"
                    value={active.destination}
                    onChange={(value) => { update("destination", value); update("destinationLatitude", undefined); update("destinationLongitude", undefined); }}
                    onSelect={selectDestination}
                    placeholder="City, park, or region"
                  />
                </Field>
                <Field label="Mode of travel">
                  <select value={active.travelMode || "driving"} onChange={(e) => update("travelMode", e.target.value)}><option value="driving">Driving</option><option value="rv">RV / towing</option><option value="motorcycle">Motorcycle</option><option value="flight">Air travel</option><option value="transit">Bus / train / transit</option><option value="other">Other</option></select>
                </Field>
                {vehicles.length ? <Field label="Managed vehicle"><select value={active.vehicleId || ""} onChange={(e) => update("vehicleId", e.target.value)}><option value="">Use a custom MPG</option>{vehicles.map((vehicle) => <option value={vehicle.id} key={vehicle.id}>{vehicle.year} {vehicle.make} {vehicle.model}</option>)}</select></Field> : null}
                <Field label="Fuel price per gallon"><input type="number" min="0" step=".01" value={active.fuelPrice ?? 4} onChange={(e) => update("fuelPrice", Number(e.target.value))} /></Field>
                {!active.vehicleId ? <Field label="Estimated MPG"><input type="number" min="1" step=".1" value={active.customMpg ?? 25} onChange={(e) => update("customMpg", Number(e.target.value))} /></Field> : null}
                <Field label="Tolls, tickets, or other travel cost"><input type="number" min="0" step=".01" value={active.otherTravelCost || ""} onChange={(e) => update("otherTravelCost", Number(e.target.value))} placeholder="0.00" /></Field>
                <Field label="Property or campground">
                  <LocationAutocomplete
                    label="Property or campground"
                    near={{ label: active.destination, latitude: active.destinationLatitude, longitude: active.destinationLongitude }}
                    value={active.property}
                    onChange={(value) => update("property", value)}
                    placeholder="Campground, hotel, or address"
                  />
                </Field>
                <Field label="Stay type">
                  <select
                    value={active.type}
                    onChange={(e) => update("type", e.target.value as StayType)}
                  >
                    {Object.entries(labels).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Confirmation">
                  <input
                    value={active.confirmation}
                    onChange={(e) => update("confirmation", e.target.value)}
                    placeholder="Optional"
                  />
                </Field>
                <Field label="Arrival">
                  <input
                    type="date"
                    value={active.arrival}
                    onChange={(e) => update("arrival", e.target.value)}
                  />
                </Field>
                <Field label="Departure">
                  <input
                    type="date"
                    value={active.departure}
                    onChange={(e) => update("departure", e.target.value)}
                  />
                </Field>
                <Field label="Arrival time">
                  <input
                    type="time"
                    value={active.arrivalTime || "15:00"}
                    onChange={(e) => update("arrivalTime", e.target.value)}
                  />
                </Field>
                <Field label="Departure time">
                  <input
                    type="time"
                    value={active.departureTime || "11:00"}
                    onChange={(e) => update("departureTime", e.target.value)}
                  />
                </Field>
                <Field label="Estimated total">
                  <input
                    value={active.cost}
                    onChange={(e) => update("cost", e.target.value)}
                    placeholder="$0.00"
                  />
                </Field>
                <label className="mt-3 flex items-center gap-3 rounded-xl border border-black/10 bg-[#fffdf8] px-4 py-3 text-sm font-bold">
                  <input
                    type="checkbox"
                    checked={active.reserved}
                    onChange={(e) => update("reserved", e.target.checked)}
                    className="size-4 accent-[#527568]"
                  />
                  Reservation confirmed
                </label>
              </div>
              <Field label="Route, arrival, or work notes">
                <textarea
                  value={active.notes}
                  onChange={(e) => update("notes", e.target.value)}
                  placeholder="Directions, gate code, workspace notes..."
                />
              </Field>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
                <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#244a40] px-4 py-3 text-sm font-bold text-white disabled:opacity-45" disabled={estimating || !active.origin?.trim() || !active.destination.trim()} onClick={() => void estimateTrip()} type="button"><Route size={18}/> {estimating ? "Calculating…" : "Estimate trip costs"}</button>
                <button
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#b66e38] px-4 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-45"
                  disabled={!active.destination || !active.arrival}
                  onClick={syncStayToCalendar}
                  type="button"
                >
                  <CalendarCheck size={18} />
                  Refresh calendar entry
                </button>
                {calendarMessage ? <p className="text-xs font-bold text-[#527568]" role="status">{calendarMessage}</p> : null}
              </div>
              {estimateMessage ? <p className="mt-2 text-xs font-bold text-[#527568]" role="status">{estimateMessage}</p> : null}
            </>
          )}
        </div>
        <aside className="space-y-4">
          <div className="rounded-[26px] bg-[#203f37] p-5 text-white">
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#e6c57d]">
              Stay summary
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Summary
                icon={CalendarRange}
                value={String(nights)}
                label="Nights"
              />
              <Summary
                icon={CircleDollarSign}
                value={lodgingEstimate || active?.estimatedTravelTotal !== undefined ? `$${combinedEstimate.toFixed(2)}` : "—"}
                label="Trip + stay"
              />
            </div>
            <p className="mt-4 flex gap-2 rounded-xl bg-white/10 p-3 text-xs">
              <MapPinned size={16} />
              {active?.destination || "Destination not set"}
            </p>
            {active?.estimatedTravelTotal !== undefined ? <div className="mt-3 rounded-xl bg-[#e6c57d] p-3 text-[#203f37]"><p className="text-[9px] font-extrabold uppercase tracking-wider">Estimated travel cost</p><b className="mt-1 block text-2xl">${active.estimatedTravelTotal.toFixed(2)}</b><p className="mt-1 text-[10px]">{active.estimatedMiles} mi · Fuel ${active.estimatedFuelCost?.toFixed(2)} · Maintenance ${active.estimatedMaintenance?.toFixed(2)} · Ownership ${active.estimatedOwnership?.toFixed(2)}</p>{lodgingEstimate > 0 ? <p className="mt-2 border-t border-[#203f37]/20 pt-2 text-xs font-bold">Travel ${active.estimatedTravelTotal.toFixed(2)} + stay ${lodgingEstimate.toFixed(2)} = ${combinedEstimate.toFixed(2)}</p> : null}</div> : null}
          </div>
          <div className="panel p-5">
            <p className="eyebrow">Before arrival</p>
            <h3 className="basecamp-serif text-xl font-bold">
              Readiness checklist
            </h3>
            <div className="mt-3 space-y-1">
              {checks.map((item) => (
                <button
                  key={item}
                  onClick={() => setDone((v) => ({ ...v, [item]: !v[item] }))}
                  className="flex w-full items-start gap-3 rounded-xl p-2 text-left text-xs font-semibold hover:bg-[#eee9df]"
                >
                  <span
                    className={`grid size-5 shrink-0 place-items-center rounded-full border ${done[item] ? "bg-[#527568] text-white" : ""}`}
                  >
                    {done[item] && <Check size={12} />}
                  </span>
                  {item}
                </button>
              ))}
            </div>
          </div>
        </aside>
      </div>
      {archivedPlans.length ? (
        <section className="panel mt-6 p-5 sm:p-6" aria-labelledby="trip-archive-title">
          <p className="eyebrow">Completed travel</p>
          <h3 className="basecamp-serif text-2xl font-bold" id="trip-archive-title">Trip archive</h3>
          <p className="mt-1 text-xs text-[#68746f]">Completed trips remain available here for future reference.</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {archivedPlans.map((trip) => (
              <details className="rounded-xl border border-black/10 bg-[#fffdf8] p-4" key={trip.id}>
                <summary className="cursor-pointer text-sm font-bold text-[#244a40]">
                  {trip.property || trip.destination || "Archived trip"}
                  <span className="mt-1 block text-[10px] font-medium uppercase text-[#78827e]">{trip.arrival || "Date unknown"} – {trip.departure || "Date unknown"}</span>
                </summary>
                <div className="mt-3 space-y-2 border-t border-black/10 pt-3 text-xs text-[#52615c]">
                  {trip.origin ? <p><b>Route:</b> {trip.origin} to {trip.destination}</p> : null}
                  {trip.confirmation ? <p><b>Confirmation:</b> {trip.confirmation}</p> : null}
                  {trip.cost ? <p><b>Stay cost:</b> {trip.cost}</p> : null}
                  {trip.estimatedTravelTotal !== undefined ? <p><b>Travel estimate:</b> ${trip.estimatedTravelTotal.toFixed(2)}</p> : null}
                  {trip.notes ? <p className="whitespace-pre-wrap"><b>Notes:</b> {trip.notes}</p> : null}
                </div>
              </details>
            ))}
          </div>
        </section>
      ) : null}
    </section>
  );
}
const control =
  "mt-2 w-full rounded-xl border border-black/10 bg-[#fffdf8] px-3 py-3 text-sm font-medium text-[#1d352f] outline-[#527568]";
function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  const child = children as React.ReactElement<{ className?: string }>;
  return (
    <label className="mt-3 block text-[10px] font-extrabold uppercase tracking-wider text-[#766c5e]">
      {label}
      {cloneElement(child, { className: control })}
    </label>
  );
}
function Summary({
  icon: Icon,
  value,
  label,
}: {
  icon: typeof CalendarRange;
  value: string;
  label: string;
}) {
  return (
    <div className="rounded-xl bg-white/10 p-3">
      <Icon className="text-[#e6c57d]" size={18} />
      <b className="mt-2 block text-lg">{value}</b>
      <span className="text-[9px] uppercase tracking-wider">{label}</span>
    </div>
  );
}
