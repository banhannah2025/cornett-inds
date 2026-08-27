"use client";
import { cloneElement, useEffect, useMemo, useState } from "react";
import {
  Compass,
  ExternalLink,
  LocateFixed,
  MapPinned,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
type Entry = {
  id: number;
  title: string;
  place: string;
  lat: string;
  lon: string;
  kind: string;
  conditions: string;
  body: string;
  created: string;
};
const kinds = [
  "Camp journal",
  "Workday",
  "Travel stop",
  "Trail note",
  "Wildlife sighting",
  "Reflection",
];
export function LocationJournal() {
  const [entries, setEntries] = useState<Entry[]>([]),
    [title, setTitle] = useState(""),
    [place, setPlace] = useState(""),
    [lat, setLat] = useState(""),
    [lon, setLon] = useState(""),
    [kind, setKind] = useState(kinds[0] ?? "Camp journal"),
    [conditions, setConditions] = useState(""),
    [body, setBody] = useState(""),
    [search, setSearch] = useState(""),
    [status, setStatus] = useState(""),
    [loaded, setLoaded] = useState(false);
  useEffect(() => {
    try {
      const r = localStorage.getItem("blended-basecamp-location-journal");
      if (r) setEntries(JSON.parse(r));
    } catch {}
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (loaded)
      localStorage.setItem(
        "blended-basecamp-location-journal",
        JSON.stringify(entries),
      );
  }, [entries, loaded]);
  const locate = () => {
    setStatus("Finding location…");
    navigator.geolocation?.getCurrentPosition(
      (p) => {
        setLat(p.coords.latitude.toFixed(5));
        setLon(p.coords.longitude.toFixed(5));
        setStatus("Location captured");
      },
      () => setStatus("Location permission was not available."),
      { timeout: 10000, maximumAge: 300000 },
    );
  };
  const save = () => {
    if (!title.trim() && !body.trim()) return;
    setEntries((v) => [
      {
        id: Date.now(),
        title: title.trim() || "Field note",
        place: place.trim(),
        lat,
        lon,
        kind,
        conditions: conditions.trim(),
        body: body.trim(),
        created: new Date().toLocaleString(),
      },
      ...v,
    ]);
    setTitle("");
    setBody("");
    setConditions("");
  };
  const shown = useMemo(
    () =>
      entries.filter((e) =>
        [e.title, e.place, e.kind, e.body]
          .join(" ")
          .toLowerCase()
          .includes(search.toLowerCase()),
      ),
    [entries, search],
  );
  return (
    <section id="location-journal" className="mb-10">
      <div className="mb-5">
        <p className="eyebrow">Location journal</p>
        <h2 className="basecamp-serif text-3xl font-bold sm:text-4xl">
          Remember the place—not just the day.
        </h2>
      </div>
      <div className="grid items-start gap-5 xl:grid-cols-[.72fr_1.28fr]">
        <aside className="panel p-5 sm:p-6">
          <div className="flex justify-between">
            <div>
              <p className="eyebrow">New field entry</p>
              <h3 className="basecamp-serif text-2xl font-bold">
                Pin this moment.
              </h3>
            </div>
            <Compass className="text-[#b66e38]" />
          </div>
          <Field label="Title">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What happened here?"
            />
          </Field>
          <Field label="Place or campsite">
            <input
              value={place}
              onChange={(e) => setPlace(e.target.value)}
              placeholder="Name this location"
            />
          </Field>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Field label="Latitude">
              <input value={lat} onChange={(e) => setLat(e.target.value)} />
            </Field>
            <Field label="Longitude">
              <input value={lon} onChange={(e) => setLon(e.target.value)} />
            </Field>
          </div>
          <button
            onClick={locate}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-black/10 bg-white py-3 text-xs font-bold"
          >
            <LocateFixed size={16} />
            Use current location
          </button>
          {status && (
            <p className="mt-2 text-[10px] text-[#68746f]">{status}</p>
          )}
          <Field label="Entry type">
            <select value={kind} onChange={(e) => setKind(e.target.value)}>
              {kinds.map((k) => (
                <option key={k}>{k}</option>
              ))}
            </select>
          </Field>
          <Field label="Conditions">
            <input
              value={conditions}
              onChange={(e) => setConditions(e.target.value)}
              placeholder="Weather, signal, trail, camp..."
            />
          </Field>
          <Field label="Journal entry">
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="What did you notice, learn, decide, or want to remember?"
            />
          </Field>
          <button
            onClick={save}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#244a40] py-3 text-sm font-bold text-white"
          >
            <Plus size={17} />
            Save location entry
          </button>
        </aside>
        <div className="panel overflow-hidden">
          <div className="border-b border-black/10 p-5">
            <label className="relative block">
              <Search
                className="absolute left-3 top-3 text-[#77817d]"
                size={17}
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search places and journal entries"
                className="w-full rounded-xl border border-black/10 py-3 pl-10 pr-3 text-sm"
              />
            </label>
          </div>
          {shown.length === 0 ? (
            <div className="grid min-h-72 place-items-center text-center">
              <div>
                <MapPinned className="mx-auto text-[#b66e38]" size={34} />
                <p className="mt-3 text-sm text-[#68746f]">
                  No saved location entries yet.
                </p>
              </div>
            </div>
          ) : (
            shown.map((e) => (
              <article
                key={e.id}
                className="border-b border-black/10 p-5 last:border-0"
              >
                <div className="flex items-start gap-3">
                  <MapPinned className="shrink-0 text-[#527568]" />
                  <div className="min-w-0 flex-1">
                    <span className="text-[9px] font-extrabold uppercase tracking-wider text-[#a76536]">
                      {e.kind} · {e.created}
                    </span>
                    <h3 className="basecamp-serif mt-1 text-xl font-bold">
                      {e.title}
                    </h3>
                    <p className="text-xs font-semibold text-[#68746f]">
                      {e.place || "Unnamed location"}
                      {e.conditions && ` · ${e.conditions}`}
                    </p>
                    {e.body && (
                      <p className="mt-3 whitespace-pre-line text-sm leading-6 text-[#55645e]">
                        {e.body}
                      </p>
                    )}{" "}
                    {e.lat && e.lon && (
                      <a
                        href={`https://www.google.com/maps?q=${e.lat},${e.lon}`}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-[#527568]"
                      >
                        Open map <ExternalLink size={12} />
                      </a>
                    )}
                  </div>
                  <button
                    onClick={() =>
                      setEntries((v) => v.filter((x) => x.id !== e.id))
                    }
                    className="text-[#9a5845]"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
const control =
  "mt-2 w-full rounded-xl border border-black/10 bg-[#fffdf8] px-3 py-3 text-sm outline-[#527568]";
function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  const child = children as React.ReactElement<{ className?: string }>;
  return (
    <label className="mt-3 block text-[10px] font-extrabold uppercase tracking-wider">
      {label}
      {cloneElement(child, { className: control })}
    </label>
  );
}
