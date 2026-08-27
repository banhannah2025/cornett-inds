"use client";
import { useEffect, useMemo, useState } from "react";
import {
  BatteryCharging,
  Fuel,
  Plus,
  Sun,
  Trash2,
  Zap,
} from "lucide-react";
type Load = { id: number; name: string; watts: number; hours: number };
export function SolarBatteryPlanner() {
  const [capacity, setCapacity] = useState(5120),
    [charge, setCharge] = useState(78),
    [solar, setSolar] = useState(1200),
    [sunHours, setSunHours] = useState(4.5),
    [efficiency, setEfficiency] = useState(80),
    [backup, setBackup] = useState(0),
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
        setLoads(d.loads);
      }
    } catch {}
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
          loads,
        }),
      );
  }, [capacity, charge, solar, sunHours, efficiency, backup, loads, loaded]);
  const dailyUse = useMemo(
      () => loads.reduce((t, l) => t + l.watts * l.hours, 0),
      [loads],
    ),
    solarYield = Math.round(solar * sunHours * (efficiency / 100)),
    totalIn = solarYield + backup,
    balance = totalIn - dailyUse,
    available = Math.round(capacity * (charge / 100)),
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
          <div className="mt-5 h-3 overflow-hidden rounded-full bg-[#e8e1d5]">
            <i
              className="block h-full bg-[#527568]"
              style={{ width: `${Math.min(100, charge)}%` }}
            />
          </div>
          <p className="mt-2 text-xs font-bold">
            {charge}% charged · {available.toLocaleString()} Wh available
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
              : `Projected daily deficit: ${Math.abs(balance).toLocaleString()} Wh — reduce loads or add charging.`}
          </div>
          <div className="panel overflow-hidden">
            <div className="border-b border-black/10 p-5">
              <p className="eyebrow">Daily load planner</p>
              <h3 className="basecamp-serif text-2xl font-bold">
                What needs power?
              </h3>
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
                  <p className="text-[10px] text-[#68746f]">
                    {l.watts}W × {l.hours}h
                  </p>
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
