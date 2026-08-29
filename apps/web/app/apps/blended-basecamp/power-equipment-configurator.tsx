"use client";
import { useEffect, useState } from "react";
import { LoaderCircle, Plus } from "lucide-react";

type MenuItem = { text: string; value: string };
export type EquipmentResult = { id: string; kind: "load" | "source"; category: string; name: string; watts: number; surgeWatts?: number; capacityWh?: number; sourceUrl?: string; description: string; confidence: "catalog" | "web-estimate" };
type SourceType = "Solar" | "Vehicle inverter" | "Generator" | "Battery" | "Shore power";
const years = Array.from({ length: new Date().getFullYear() - 1983 }, (_, index) => String(new Date().getFullYear() + 1 - index));
const loadCategories = ["Internet", "Computer / office", "Refrigeration", "Cooking appliance", "Climate control", "Lighting", "Medical", "Tool", "Other"];

export function PowerEquipmentConfigurator({ kind, onAdd }: { kind: "load" | "source"; onAdd: (result: EquipmentResult) => void }) {
  const [sourceType, setSourceType] = useState<SourceType>("Solar"), [category, setCategory] = useState<string>(loadCategories[0] ?? "Other"), [manufacturer, setManufacturer] = useState(""), [model, setModel] = useState(""), [watts, setWatts] = useState(0), [surgeWatts, setSurgeWatts] = useState(0), [capacityWh, setCapacityWh] = useState(0), [quantity, setQuantity] = useState(1), [volts, setVolts] = useState(120), [amps, setAmps] = useState(30), [fuel, setFuel] = useState("Gasoline"), [results, setResults] = useState<EquipmentResult[]>([]), [searching, setSearching] = useState(false), [webEnabled, setWebEnabled] = useState<boolean | null>(null);
  const [year, setYear] = useState(""), [make, setMake] = useState(""), [vehicleModel, setVehicleModel] = useState(""), [makes, setMakes] = useState<MenuItem[]>([]), [models, setModels] = useState<MenuItem[]>([]);
  const formCategory = kind === "source" ? sourceType : category;
  const query = [kind === "source" && sourceType === "Vehicle inverter" ? `${year} ${make} ${vehicleModel}` : "", manufacturer, model, formCategory].filter(Boolean).join(" ");

  useEffect(() => {
    if (kind !== "source" || sourceType !== "Vehicle inverter" || !year) return;
    setMake(""); setVehicleModel(""); setMakes([]); setModels([]);
    fetch(`/api/vehicle-data?action=makes&year=${year}`).then((response) => response.ok ? response.json() : Promise.reject()).then((data: { results?: MenuItem[] }) => setMakes(data.results ?? [])).catch(() => setMakes([]));
  }, [kind, sourceType, year]);
  useEffect(() => {
    if (!year || !make) return;
    setVehicleModel(""); setModels([]);
    fetch(`/api/vehicle-data?action=models&year=${year}&make=${encodeURIComponent(make)}`).then((response) => response.ok ? response.json() : Promise.reject()).then((data: { results?: MenuItem[] }) => setModels(data.results ?? [])).catch(() => setModels([]));
  }, [make, year]);

  useEffect(() => {
    if (query.trim().length < 4 || (!model.trim() && sourceType !== "Vehicle inverter")) { setResults([]); return; }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setSearching(true);
      try {
        const response = await fetch(`/api/power-equipment/search?kind=${kind}&q=${encodeURIComponent(query)}`, { signal: controller.signal });
        const data = (await response.json()) as { results?: EquipmentResult[]; webEnabled?: boolean };
        setResults(response.ok ? (data.results ?? []) : []); setWebEnabled(Boolean(data.webEnabled));
      } catch (error) { if (!(error instanceof DOMException && error.name === "AbortError")) setResults([]); }
      finally { if (!controller.signal.aborted) setSearching(false); }
    }, 450);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [kind, model, query, sourceType]);

  const selectResult = (result: EquipmentResult) => {
    setModel(result.name); setWatts(result.watts); setCapacityWh(result.capacityWh ?? 0); setResults([]);
  };
  const calculatedWatts = sourceType === "Shore power" && kind === "source" ? volts * amps : watts;
  const add = () => {
    const vehicleName = sourceType === "Vehicle inverter" ? [year, make, vehicleModel, manufacturer, model].filter(Boolean).join(" ") : "";
    const name = vehicleName || [manufacturer, model].filter(Boolean).join(" ") || `${formCategory} item`;
    if (!calculatedWatts || (!model.trim() && !vehicleName && sourceType !== "Shore power")) return;
    onAdd({ id: `configured-${Date.now()}`, kind, category: formCategory, name: quantity > 1 ? `${quantity}ÃƒÆ’Ã¢â‚¬â€ ${name}` : name, watts: calculatedWatts * quantity, surgeWatts: surgeWatts * quantity || undefined, capacityWh: capacityWh * quantity || undefined, description: `Configured entry${surgeWatts ? ` Ãƒâ€šÃ‚Â· ${surgeWatts.toLocaleString()}W surge` : ""}${fuel && sourceType === "Generator" ? ` Ãƒâ€šÃ‚Â· ${fuel}` : ""}.`, confidence: "catalog" });
    setModel(""); setManufacturer(""); setWatts(0); setSurgeWatts(0); setCapacityWh(0); setQuantity(1); setResults([]);
  };

  return <div className="mt-4 rounded-2xl border border-black/10 bg-[#f7f3ea] p-4">
    <div className="grid gap-3 sm:grid-cols-2">
      {kind === "source" ? <Select label="Power source type" value={sourceType} set={(value) => setSourceType(value as SourceType)} options={["Solar", "Vehicle inverter", "Generator", "Battery", "Shore power"]} /> : <Select label="Device category" value={category} set={setCategory} options={loadCategories} />}
      <Field label="Quantity" type="number" value={quantity} set={(value) => setQuantity(Math.max(1, Number(value)))} />
    </div>
    {kind === "source" && sourceType === "Vehicle inverter" ? <div className="mt-3 grid gap-3 sm:grid-cols-3"><Select label="Vehicle year" value={year} set={setYear} options={years} placeholder="Select year"/><Select label="Vehicle make" value={make} set={setMake} options={makes.map((item) => item.value)} disabled={!year}/><Select label="Vehicle model" value={vehicleModel} set={setVehicleModel} options={models.map((item) => item.value)} disabled={!make}/></div> : null}
    {kind === "source" && sourceType === "Shore power" ? <div className="mt-3 grid grid-cols-2 gap-3"><Field label="Voltage" type="number" value={volts} set={(value) => setVolts(Number(value))}/><Field label="Amperage" type="number" value={amps} set={(value) => setAmps(Number(value))}/></div> : <>
      <div className="mt-3 grid gap-3 sm:grid-cols-2"><Field label={sourceType === "Vehicle inverter" ? "Inverter manufacturer" : "Manufacturer"} value={manufacturer} set={setManufacturer} placeholder="Brand name"/><Field label={sourceType === "Vehicle inverter" ? "Inverter / package" : "Model or product number"} value={model} set={setModel} placeholder="Start typing a model"/></div>
      {kind === "source" && sourceType === "Generator" ? <div className="mt-3"><Select label="Fuel type" value={fuel} set={setFuel} options={["Gasoline", "Diesel", "Propane", "Dual fuel", "Natural gas"]}/></div> : null}
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3"><Field label={kind === "load" ? "Running watts" : "Continuous output (W)"} type="number" value={watts} set={(value) => setWatts(Math.max(0, Number(value)))}/><Field label="Startup / surge watts" type="number" value={surgeWatts} set={(value) => setSurgeWatts(Math.max(0, Number(value)))}/>{kind === "source" && sourceType === "Battery" ? <Field label="Battery capacity (Wh)" type="number" value={capacityWh} set={(value) => setCapacityWh(Math.max(0, Number(value)))}/> : null}</div>
    </>}
    {searching ? <p className="mt-3 flex items-center gap-2 text-xs font-bold text-[#527568]"><LoaderCircle className="size-4 animate-spin"/> Looking up matching products and specificationsÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦</p> : null}
    {results.length ? <div className="mt-2 max-h-64 overflow-y-auto rounded-xl border border-black/10 bg-white p-1">{results.map((result) => <button className="flex w-full items-start justify-between gap-3 rounded-lg px-3 py-2 text-left hover:bg-[#e8efe8]" key={result.id} onClick={() => selectResult(result)} type="button"><span><b className="block text-xs">{result.name}</b><small className="line-clamp-2 text-[10px] text-[#68746f]">{result.description}</small></span><b className="shrink-0 text-xs">{result.watts ? `${result.watts.toLocaleString()}W` : "Review"}</b></button>)}</div> : null}
    {webEnabled === false && model.trim() ? <p className="mt-2 text-[10px] text-[#8a6846]">Built-in matches only. Configure BRAVE_SEARCH_API_KEY for live manufacturer and retailer results.</p> : null}
    <button className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#244a40] px-4 py-3 text-sm font-bold text-white disabled:opacity-40" disabled={!calculatedWatts} onClick={add} type="button"><Plus size={17}/> Add configured {kind === "source" ? "power source" : "device"}</button>
  </div>;
}

function Field({ label, value, set, placeholder, type = "text" }: { label: string; value: string | number; set: (value: string) => void; placeholder?: string; type?: string }) { return <label className="text-[10px] font-extrabold uppercase tracking-wider text-[#766c5e]">{label}<input className="mt-2 w-full rounded-xl border border-black/10 bg-white px-3 py-3 text-sm normal-case tracking-normal" min={type === "number" ? 0 : undefined} onChange={(event) => set(event.target.value)} placeholder={placeholder} type={type} value={value}/></label>; }
function Select({ label, value, set, options, disabled, placeholder }: { label: string; value: string; set: (value: string) => void; options: string[]; disabled?: boolean; placeholder?: string }) { return <label className="text-[10px] font-extrabold uppercase tracking-wider text-[#766c5e]">{label}<select className="mt-2 w-full rounded-xl border border-black/10 bg-white px-3 py-3 text-sm normal-case tracking-normal disabled:opacity-50" disabled={disabled} onChange={(event) => set(event.target.value)} value={value}><option value="">{placeholder ?? `Select ${label.toLowerCase()}`}</option>{options.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>; }




