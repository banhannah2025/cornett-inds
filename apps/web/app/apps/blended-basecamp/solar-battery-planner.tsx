"use client";
import { useEffect, useMemo, useState } from "react";
import {
  BatteryCharging,
  ExternalLink,
  Fuel,
  Plus,
  Sun,
  Trash2,
  Zap,
} from "lucide-react";
import { PowerEquipmentConfigurator, type EquipmentResult } from "./power-equipment-configurator";
type Load = { id: number; name: string; watts: number; surgeWatts?: number; hours: number };
type PowerSource = { id: number; name: string; category: string; watts: number; surgeWatts?: number; capacityWh: number; hours: number; sourceUrl?: string };
export function SolarBatteryPlanner() {
  const [capacity, setCapacity] = useState(5120),
    [charge, setCharge] = useState(78),
    [solar, setSolar] = useState(1200),
    [sunHours, setSunHours] = useState(4.5),
    [efficiency, setEfficiency] = useState(80),
    [backup, setBackup] = useState(0),
    [sources, setSources] = useState<PowerSource[]>([]),
    [loads, setLoads] = useState<Load[]>([
      { id: 1, name: "Starlink", watts: 75, hours: 8 },
      { id: 2, name: "Laptops & office", watts: 140, hours: 8 },
      { id: 3, name: "Refrigeration", watts: 60, hours: 24 },
    ]),
    [name, setName] = useState(""),
    [watts, setWatts] = useState(100),
    [hours, setHours] = useState(1),
    [loaded, setLoaded] = useState(false);
  useEffect(() => {
    try {
      const raw = localStorage.getItem("blended-basecamp-power");
      if (raw) {
        const d = JSON.parse(raw);
        setCapacity(d.capacity);
        setCharge(d.charge);
        setSolar(d.solar);
        setSunHours(d.sunHours);
        setEfficiency(d.efficiency);
        setBackup(d.backup);
        setSources(d.sources ?? []);
        setLoads(d.loads);
      }
    } catch {
      localStorage.removeItem("blended-basecamp-power");
    }
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (loaded)
      localStorage.setItem(
        "blended-basecamp-power",
        JSON.stringify({
          capacity,
          charge,
          solar,
          sunHours,
          efficiency,
          backup,
          sources,
          loads,
        }),
      );
  }, [capacity, charge, solar, sunHours, efficiency, backup, sources, loads, loaded]);
  const dailyUse = useMemo(
      () => loads.reduce((t, l) => t + l.watts * l.hours, 0),
      [loads],
    ),
    solarYield = Math.round(solar * sunHours * (efficiency / 100)),
    addedSupply = Math.round(sources.reduce((total, source) => total + (source.category === "Battery" ? 0 : source.watts * source.hours * (source.category === "Solar" ? efficiency / 100 : 1)), 0)),
    addedCapacity = sources.reduce((total, source) => total + source.capacityWh, 0),
    peakSupply = solar + sources.reduce((total, source) => total + (source.surgeWatts ?? source.watts), 0),
    peakLoad = loads.reduce((highest, load) => Math.max(highest, load.surgeWatts ?? load.watts), 0),
    totalIn = solarYield + backup + addedSupply,
    balance = totalIn - dailyUse,
    available = Math.round((capacity + addedCapacity) * (charge / 100)),
    autonomy = dailyUse ? available / dailyUse : 0,
    recharge = solar
      ? Math.max(0, (capacity - available) / (solar * (efficiency / 100)))
      : 0;
  const add = () => {
    if (!name.trim()) return;
    setLoads((v) => [
      ...v,
      { id: Date.now(), name: name.trim(), watts, hours },
    ]);
    setName("");
  };
  const addResult = (result: EquipmentResult) => {
    if (result.kind === "load") {
      setLoads((value) => [...value, { id: Date.now(), name: result.name, watts: result.watts || 100, surgeWatts: result.surgeWatts, hours: 1 }]);
    } else {
      setSources((value) => [...value, { id: Date.now(), name: result.name, category: result.category, watts: result.watts || 100, surgeWatts: result.surgeWatts, capacityWh: result.capacityWh ?? 0, hours: result.category === "Solar" ? sunHours : 1, sourceUrl: result.sourceUrl }]);
    }
  };
  return (
    <section id="power-planner" className="mb-10">
      <div className="mb-5">
        <p className="eyebrow">Solar & battery planner</p>
        <h2 className="basecamp-serif text-3xl font-bold sm:text-4xl">
          Plan enough power for work and life.
        </h2>
      </div>
      <div className="grid items-start gap-5 xl:grid-cols-[.75fr_1.25fr]">
        <div className="panel p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="eyebrow">System profile</p>
              <h3 className="basecamp-serif text-2xl font-bold">
                Your off-grid supply
              </h3>
            </div>
            <Sun className="text-[#b66e38]" />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Num
              label="Battery capacity (Wh)"
              value={capacity}
              set={setCapacity}
            />
            <Num label="Current charge (%)" value={charge} set={setCharge} />
            <Num label="Solar array (W)" value={solar} set={setSolar} />
            <Num
              label="Peak sun hours"
              value={sunHours}
              set={setSunHours}
              step=".5"
            />
            <Num
              label="System efficiency (%)"
              value={efficiency}
              set={setEfficiency}
            />
            <Num
              label="Generator/shore daily Wh"
              value={backup}
              set={setBackup}
            />
          </div>
          <div className="mt-5 border-t border-black/10 pt-5">
            <p className="eyebrow">Add power sources</p>
            <p className="mt-1 text-xs leading-5 text-[#68746f]">Search solar panels, battery stations, generators, shore power, or vehicle inverters.</p>
            <PowerEquipmentConfigurator kind="source" onAdd={addResult} />
          </div>
          <div className="mt-4 space-y-2">
            {sources.map((source) => (
              <div className="rounded-xl border border-black/10 bg-[#fffdf8] p-3" key={source.id}>
                <div className="flex items-start gap-2">
                  <div className="min-w-0 flex-1"><b className="block truncate text-sm">{source.name}</b><span className="text-[10px] font-bold uppercase text-[#78827e]">{source.category}</span></div>
                  {source.sourceUrl ? <a aria-label={`Open specifications for ${source.name}`} href={source.sourceUrl} rel="noreferrer" target="_blank"><ExternalLink size={15} /></a> : null}
                  <button aria-label={`Remove ${source.name}`} onClick={() => setSources((value) => value.filter((item) => item.id !== source.id))} className="text-[#9a5845]"><Trash2 size={15} /></button>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <SmallNum label="Output W" value={source.watts} set={(value) => setSources((items) => items.map((item) => item.id === source.id ? { ...item, watts: value } : item))} />
                  <SmallNum label="Surge W" value={source.surgeWatts ?? 0} set={(value) => setSources((items) => items.map((item) => item.id === source.id ? { ...item, surgeWatts: value || undefined } : item))} />
                  <SmallNum label="Capacity Wh" value={source.capacityWh} set={(value) => setSources((items) => items.map((item) => item.id === source.id ? { ...item, capacityWh: value } : item))} />
                  <SmallNum label="Hours/day" value={source.hours} step=".25" set={(value) => setSources((items) => items.map((item) => item.id === source.id ? { ...item, hours: value } : item))} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 h-3 overflow-hidden rounded-full bg-[#e8e1d5]">
            <i
              className="block h-full bg-[#527568]"
              style={{ width: `${Math.min(100, charge)}%` }}
            />
          </div>
          <p className="mt-2 text-xs font-bold">
            {charge}% charged Ãƒâ€šÃ‚Â· {available.toLocaleString()} Wh available
          </p>
        </div>
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Metric icon={Zap} value={dailyUse} label="Daily use" unit="Wh" />
            <Metric
              icon={Sun}
              value={solarYield}
              label="Solar yield"
              unit="Wh"
            />
            <Metric
              icon={BatteryCharging}
              value={Number(autonomy.toFixed(1))}
              label="Autonomy"
              unit="days"
            />
            <Metric
              icon={Fuel}
              value={Number(recharge.toFixed(1))}
              label="Recharge"
              unit="sun hrs"
            />
          </div>
          <div
            className={`rounded-2xl p-4 text-sm font-bold ${balance >= 0 ? "bg-[#e2eee7] text-[#315b4c]" : "bg-[#f5e4dc] text-[#884936]"}`}
          >
            {balance >= 0
              ? `Projected daily surplus: ${balance.toLocaleString()} Wh`
              : `Projected daily deficit: ${Math.abs(balance).toLocaleString()} Wh ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â reduce loads or add charging.`}
          </div>
          {peakLoad > peakSupply ? <div className="rounded-2xl bg-[#f5e4dc] p-4 text-sm font-bold text-[#884936]">Peak-load warning: the largest device needs {peakLoad.toLocaleString()}W, but configured sources provide {peakSupply.toLocaleString()}W. Check inverter surge and continuous ratings.</div> : null}
          <div className="panel overflow-hidden">
            <div className="border-b border-black/10 p-5">
              <p className="eyebrow">Daily load planner</p>
              <h3 className="basecamp-serif text-2xl font-bold">
                What needs power?
              </h3>
              <p className="mt-1 text-xs leading-5 text-[#68746f]">Search for a device to estimate its load, then adjust the result using its nameplate or manual.</p>
              <PowerEquipmentConfigurator kind="load" onAdd={addResult} />
              <div className="mt-3 grid grid-cols-[1fr_80px_70px_auto] gap-2">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Appliance or device"
                  className="min-w-0 rounded-xl border border-black/10 px-3 text-sm"
                />
                <input
                  aria-label="Watts"
                  type="number"
                  value={watts}
                  onChange={(e) => setWatts(Number(e.target.value))}
                  className="min-w-0 rounded-xl border border-black/10 px-2 text-xs"
                />
                <input
                  aria-label="Hours"
                  type="number"
                  value={hours}
                  onChange={(e) => setHours(Number(e.target.value))}
                  className="min-w-0 rounded-xl border border-black/10 px-2 text-xs"
                />
                <button
                  onClick={add}
                  className="grid size-11 place-items-center rounded-xl bg-[#244a40] text-white"
                >
                  <Plus />
                </button>
              </div>
            </div>
            {loads.map((l) => (
              <div
                key={l.id}
                className="flex items-center gap-3 border-b border-black/10 p-4 last:border-0"
              >
                <span className="grid size-9 place-items-center rounded-xl bg-[#eee9df]">
                  <Zap size={16} />
                </span>
                <div className="flex-1">
                  <b className="text-sm">{l.name}</b>
                  <div className="mt-1 flex flex-wrap gap-2">
                    <label className="text-[9px] text-[#68746f]">Watts <input className="ml-1 w-16 rounded border border-black/10 px-1 py-0.5" min="0" onChange={(event) => setLoads((items) => items.map((item) => item.id === l.id ? { ...item, watts: Math.max(0, Number(event.target.value)) } : item))} type="number" value={l.watts} /></label>
                    <label className="text-[9px] text-[#68746f]">Hours/day <input className="ml-1 w-14 rounded border border-black/10 px-1 py-0.5" min="0" onChange={(event) => setLoads((items) => items.map((item) => item.id === l.id ? { ...item, hours: Math.max(0, Number(event.target.value)) } : item))} step=".25" type="number" value={l.hours} /></label>
                    <label className="text-[9px] text-[#68746f]">Surge W <input className="ml-1 w-16 rounded border border-black/10 px-1 py-0.5" min="0" onChange={(event) => setLoads((items) => items.map((item) => item.id === l.id ? { ...item, surgeWatts: Math.max(0, Number(event.target.value)) || undefined } : item))} type="number" value={l.surgeWatts ?? 0} /></label>
                  </div>
                </div>
                <b className="text-xs">
                  {(l.watts * l.hours).toLocaleString()} Wh
                </b>
                <button
                  onClick={() =>
                    setLoads((v) => v.filter((x) => x.id !== l.id))
                  }
                  className="text-[#9a5845]"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
function Num({
  label,
  value,
  set,
  step = "1",
}: {
  label: string;
  value: number;
  set: (n: number) => void;
  step?: string;
}) {
  return (
    <label className="text-[10px] font-extrabold uppercase tracking-wider text-[#766c5e]">
      {label}
      <input
        type="number"
        step={step}
        value={value}
        onChange={(e) => set(Number(e.target.value))}
        className="mt-2 w-full rounded-xl border border-black/10 bg-[#fffdf8] px-3 py-3 text-sm"
      />
    </label>
  );
}
function SmallNum({ label, value, set, step = "1" }: { label: string; value: number; set: (n: number) => void; step?: string }) {
  return <label className="text-[8px] font-extrabold uppercase tracking-wider text-[#766c5e]">{label}<input className="mt-1 w-full rounded-lg border border-black/10 bg-white px-2 py-2 text-xs" min="0" onChange={(event) => set(Math.max(0, Number(event.target.value)))} step={step} type="number" value={value} /></label>;
}
function Metric({
  icon: Icon,
  value,
  label,
  unit,
}: {
  icon: typeof Zap;
  value: number;
  label: string;
  unit: string;
}) {
  return (
    <div className="panel p-4 text-center">
      <Icon className="mx-auto text-[#527568]" size={18} />
      <b className="mt-2 block text-xl">{value.toLocaleString()}</b>
      <span className="text-[9px] font-bold">{unit}</span>
      <small className="mt-1 block text-[9px] uppercase tracking-wider">
        {label}
      </small>
    </div>
  );
}

