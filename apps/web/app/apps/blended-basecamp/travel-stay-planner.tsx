"use client";
import { cloneElement, useEffect, useMemo, useState } from "react";
import {
  BedDouble,
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
  destination: string;
  destinationLatitude?: number;
  destinationLongitude?: number;
  property: string;
  type: StayType;
  arrival: string;
  departure: string;
  confirmation: string;
  cost: string;
  notes: string;
  reserved: boolean;
};
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
export function TravelStayPlanner() {
  const [plans, setPlans] = useState<Stay[]>([]),
    [activeId, setActiveId] = useState<number | null>(null),
    [done, setDone] = useState<Record<string, boolean>>({}),
    [loaded, setLoaded] = useState(false);
  useEffect(() => {
    try {
      const raw = localStorage.getItem("blended-basecamp-travel");
      if (raw) {
        const d = JSON.parse(raw);
        setPlans(d.plans ?? []);
        setDone(d.done ?? {});
        setActiveId(d.plans?.[0]?.id ?? null);
      }
    } catch {
      localStorage.removeItem("blended-basecamp-travel");
    }
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (loaded)
      localStorage.setItem(
        "blended-basecamp-travel",
        JSON.stringify({ plans, done }),
      );
  }, [plans, done, loaded]);
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
  const add = () => {
    const id = Date.now(),
      p: Stay = {
        id,
        destination: "",
        property: "",
        type: "campsite",
        arrival: "",
        departure: "",
        confirmation: "",
        cost: "",
        notes: "",
        reserved: false,
      };
    setPlans((v) => [...v, p]);
    setActiveId(id);
  };
  const update = <K extends keyof Stay>(key: K, value: Stay[K]) =>
    active &&
    setPlans((v) =>
      v.map((p) => (p.id === active.id ? { ...p, [key]: value } : p)),
    );
  const selectDestination = (place: Place) =>
    active && setPlans((plans) => plans.map((plan) => plan.id === active.id ? { ...plan, destination: place.label, destinationLatitude: place.latitude, destinationLongitude: place.longitude } : plan));
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
                    setPlans((v) => v.filter((p) => p.id !== active.id));
                    setActiveId(null);
                  }}
                >
                  <Trash2 className="text-[#9a5845]" size={18} />
                </button>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Field label="Destination">
                  <LocationAutocomplete
                    label="Destination"
                    value={active.destination}
                    onChange={(value) => { update("destination", value); update("destinationLatitude", undefined); update("destinationLongitude", undefined); }}
                    onSelect={selectDestination}
                    placeholder="City, park, or region"
                  />
                </Field>
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
                value={active?.cost || "—"}
                label="Estimated"
              />
            </div>
            <p className="mt-4 flex gap-2 rounded-xl bg-white/10 p-3 text-xs">
              <MapPinned size={16} />
              {active?.destination || "Destination not set"}
            </p>
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
