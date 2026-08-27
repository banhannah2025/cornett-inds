"use client";
import { useEffect, useState } from "react";
import { Plus, Settings2, Trash2, X } from "lucide-react";
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
];
export function WorkspaceSwitcher() {
  const [list, setList] = useState<WS[]>([
      { id: "personal", name: "Personal Basecamp", kind: "personal" },
    ]),
    [active, setActive] = useState("personal"),
    [manage, setManage] = useState(false),
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
    if (loaded)
      localStorage.setItem("blended-basecamp-workspaces", JSON.stringify(list));
  }, [list, loaded]);
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
      localStorage.setItem(
        "blended-basecamp-workspaces",
        JSON.stringify([...list, w]),
      );
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
    <div className="relative flex items-center gap-2">
      <label className="text-[9px] font-bold uppercase tracking-wider text-[#789488]">
        Workspace
      </label>
      <select
        value={active}
        onChange={(e) => change(e.target.value)}
        className="max-w-44 rounded-lg border border-white/10 bg-[#20342e] px-3 py-2 text-xs font-bold text-white outline-none sm:max-w-56"
      >
        {list.map((w) => (
          <option key={w.id} value={w.id}>
            {w.name}
          </option>
        ))}
      </select>
      <button
        aria-label="Manage workspaces"
        onClick={() => setManage(!manage)}
        className="grid size-9 place-items-center rounded-lg border border-white/10 text-[#acc0b7] hover:bg-white/5"
      >
        {manage ? <X size={16} /> : <Settings2 size={16} />}
      </button>
      {manage && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-2xl border border-[#6d8e7f]/30 bg-[#182a25] p-4 text-white shadow-2xl">
          <p className="text-[9px] font-bold uppercase tracking-wider text-[#7fa393]">
            Manage workspaces
          </p>
          <div className="mt-3 grid grid-cols-[1fr_90px_auto] gap-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Workspace name"
              className="min-w-0 rounded-lg border border-white/10 bg-white/5 px-3 text-xs"
            />
            <select
              value={kind}
              onChange={(e) => setKind(e.target.value as Kind)}
              className="min-w-0 rounded-lg border border-white/10 bg-[#20342e] px-2 text-xs"
            >
              <option value="personal">Personal</option>
              <option value="family">Family</option>
              <option value="business">Business</option>
              <option value="trip">Trip</option>
            </select>
            <button
              onClick={create}
              className="grid size-9 place-items-center rounded-lg bg-[#e7b65f] text-[#182a25]"
            >
              <Plus size={16} />
            </button>
          </div>
          <div className="mt-3 space-y-1">
            {list.map((w) => (
              <div
                key={w.id}
                className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2"
              >
                <span>
                  <b className="block text-xs">{w.name}</b>
                  <small className="capitalize text-[#8fa79c]">{w.kind}</small>
                </span>
                {w.id !== active && (
                  <button
                    onClick={() => remove(w.id)}
                    className="text-[#dc8c75]"
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
