import { NextResponse } from "next/server";

const base = "https://www.fueleconomy.gov/ws/rest/vehicle";
const headers = { Accept: "application/json", "User-Agent": "BlendedWorks-Basecamp/1.0" };

function items(value: unknown) {
  const data = value as { menuItem?: unknown } | undefined;
  if (!data?.menuItem) return [];
  return Array.isArray(data.menuItem) ? data.menuItem : [data.menuItem];
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const action = params.get("action");
  const year = params.get("year");
  const make = params.get("make");
  const model = params.get("model");
  const id = params.get("id");
  let endpoint = "";
  if (action === "makes" && year) endpoint = `/menu/make?year=${encodeURIComponent(year)}`;
  if (action === "models" && year && make) endpoint = `/menu/model?year=${encodeURIComponent(year)}&make=${encodeURIComponent(make)}`;
  if (action === "options" && year && make && model) endpoint = `/menu/options?year=${encodeURIComponent(year)}&make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}`;
  if (action === "details" && id) endpoint = `/${encodeURIComponent(id)}`;
  if (!endpoint) return NextResponse.json({ error: "Invalid vehicle request" }, { status: 400 });
  try {
    const response = await fetch(base + endpoint, { headers, next: { revalidate: 604800 } });
    if (!response.ok) throw new Error("Vehicle provider unavailable");
    const data = await response.json();
    if (action !== "details") return NextResponse.json({ results: items(data) });
    const v = (data.vehicle ?? data) as Record<string, string | number>;
    return NextResponse.json({ vehicle: {
      id: String(v.id), year: Number(v.year), make: String(v.make), model: String(v.model), trim: String(v.trany || "Standard configuration"),
      engine: `${v.cylinders || "—"} cyl · ${v.displ || "—"}L`, cylinders: Number(v.cylinders) || null, displacementLiters: Number(v.displ) || null,
      transmission: String(v.trany || "Not listed"), drive: String(v.drive || "Not listed"), fuelType: String(v.fuelType1 || v.fuelType || "Not listed"),
      cityMpg: Number(v.city08) || null, highwayMpg: Number(v.highway08) || null, combinedMpg: Number(v.comb08) || null,
      annualFuelCost: Number(v.fuelCost08) || 0, barrelsPerYear: Number(v.barrels08) || null, co2GramsPerMile: Number(v.co2TailpipeGpm) || null,
      vehicleClass: String(v.VClass || "Not listed"), electricRange: Number(v.range) || null, phevRange: Number(v.rangeA) || null,
    }});
  } catch { return NextResponse.json({ error: "Vehicle data is temporarily unavailable" }, { status: 503 }); }
}
