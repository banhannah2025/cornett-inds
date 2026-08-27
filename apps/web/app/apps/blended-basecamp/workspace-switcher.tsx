"use client";
import { useEffect, useState } from "react";
import {
  BriefcaseBusiness,
  Caravan,
  House,
  Plus,
  Trash2,
  Users,
} from "lucide-react";
type Kind = "personal" | "family" | "business" | "trip";
type WS = { id: string; name: string; kind: Kind };
const keys = [
    "blended-basecamp",
    "blended-basecamp-calendar",
    "blended-basecamp-travel",
    "blended-basecamp-connectivity",
    "blended-basecamp-hazards",
    "blended-basecamp-power",
    "blended-basecamp-equipment",
    "blended-basecamp-finance",
    "blended-basecamp-location-journal",
    "blended-basecamp-checkins",
  ],
  icons = {
    personal: House,
    family: Users,
    business: BriefcaseBusiness,
    trip: Caravan,
  };
export function WorkspaceSwitcher() {
  const [list, setList] = useState<WS[]>([
      { id: "personal", name: "Personal Basecamp", kind: "personal" },
    ]),
    [active, setActive] = useState("personal"),
    [name, setName] = useState(""),
    [kind, setKind] = useState<Kind>("business"),
    [loaded, setLoaded] = useState(false);
  useEffect(() => {
    try {
      const l = localStorage.getItem("blended-basecamp-workspaces"),
        a = localStorage.getItem("blended-basecamp-active-workspace");
      if (l) setList(JSON.parse(l));
      if (a) setActive(a);
    } catch {}
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (loaded) {
      localStorage.setItem("blended-basecamp-workspaces", JSON.stringify(list));
      localStorage.setItem("blended-basecamp-active-workspace", active);
    }
  }, [list, active, loaded]);
  const save = (id: string) =>
      keys.forEach((k) => {
        const v = localStorage.getItem(k),
          to = `blended-basecamp-workspace:${id}:${k}`;
        v === null ? localStorage.removeItem(to) : localStorage.setItem(to, v);
      }),
    load = (id: string) =>
      keys.forEach((k) => {
        const v = localStorage.getItem(`blended-basecamp-workspace:${id}:${k}`);
        v === null ? localStorage.removeItem(k) : localStorage.setItem(k, v);
      }),
    change = (id: string) => {
      if (id === active) return;
      save(active);
      load(id);
      localStorage.setItem("blended-basecamp-active-workspace", id);
      location.reload();
    },
    create = () => {
      if (!name.trim()) return;
      const w = { id: `ws-${Date.now()}`, name: name.trim(), kind };
      save(active);
      const next = [...list, w];
      localStorage.setItem("blended-basecamp-workspaces", JSON.stringify(next));
      keys.forEach((k) => localStorage.removeItem(k));
      localStorage.setItem("blended-basecamp-active-workspace", w.id);
      location.reload();
    },
    remove = (id: string) => {
      if (id === active) return;
      keys.forEach((k) =>
        localStorage.removeItem(`blended-basecamp-workspace:${id}:${k}`),
      );
      setList((v) => v.filter((w) => w.id !== id));
    };
  return (
    <section className="border-b border-[#d7d0c0] bg-[#e9e2d4] px-4 py-4 sm:px-7">
      <div className="mx-auto max-w-[1500px]">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="eyebrow">Separate workspaces</p>
            <h2 className="basecamp-serif text-2xl font-bold">
              Choose the Basecamp you’re working in.
            </h2>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="New workspace name"
              className="rounded-xl border border-black/10 bg-white px-3 py-3 text-sm"
            />
            <select
              value={kind}
              onChange={(e) => setKind(e.target.value as Kind)}
              className="rounded-xl border border-black/10 bg-white px-3 py-3 text-sm"
            >
              <option value="personal">Personal</option>
              <option value="family">Family</option>
              <option value="business">Business</option>
              <option value="trip">Trip</option>
            </select>
            <button
              onClick={create}
              className="flex items-center justify-center gap-2 rounded-xl bg-[#244a40] px-4 py-3 text-xs font-bold text-white"
            >
              <Plus size={16} />
              New workspace
            </button>
          </div>
        </div>
        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {list.map((w) => {
            const I = icons[w.kind];
            return (
              <div
                key={w.id}
                className={`flex shrink-0 items-center rounded-xl border p-1 ${w.id === active ? "border-[#527568] bg-[#e2eee7]" : "border-black/10 bg-[#fffdf8]"}`}
              >
                <button
                  onClick={() => change(w.id)}
                  className="flex items-center gap-2 px-3 py-2 text-left"
                >
                  <I size={17} />
                  <span>
                    <b className="block text-xs">{w.name}</b>
                    <small className="capitalize">{w.kind}</small>
                  </span>
                </button>
                {w.id !== active && (
                  <button
                    aria-label="Delete workspace"
                    onClick={() => remove(w.id)}
                    className="p-2 text-[#9a5845]"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
        <p className="mt-2 text-[10px] text-[#68746f]">
          The active workspace keeps separate plans, logs, finances, journals,
          equipment, and check-ins on this device.
        </p>
      </div>
    </section>
  );
}
