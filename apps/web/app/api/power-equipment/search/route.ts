import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type EquipmentKind = "load" | "source";
type EquipmentResult = {
  id: string;
  kind: EquipmentKind;
  category: string;
  name: string;
  watts: number;
  capacityWh?: number;
  sourceUrl?: string;
  description: string;
  confidence: "catalog" | "web-estimate";
};

const catalog: EquipmentResult[] = [
  { id: "load-starlink-standard", kind: "load", category: "Internet", name: "Starlink Standard", watts: 75, description: "Typical operating draw; actual use varies by conditions.", confidence: "catalog", sourceUrl: "https://www.starlink.com/specifications" },
  { id: "load-starlink-mini", kind: "load", category: "Internet", name: "Starlink Mini", watts: 40, description: "Typical operating draw for the compact terminal.", confidence: "catalog", sourceUrl: "https://www.starlink.com/specifications" },
  { id: "load-laptop", kind: "load", category: "Office", name: "USB-C laptop", watts: 65, description: "Common USB-C charging load; confirm the adapter rating.", confidence: "catalog" },
  { id: "load-fridge", kind: "load", category: "Appliance", name: "12V compressor refrigerator", watts: 60, description: "Representative running load; compressor duty cycle varies.", confidence: "catalog" },
  { id: "load-microwave", kind: "load", category: "Appliance", name: "Compact microwave", watts: 1200, description: "Representative input load; check the appliance nameplate.", confidence: "catalog" },
  { id: "load-air-conditioner", kind: "load", category: "Climate", name: "RV air conditioner", watts: 1500, description: "Representative running load; startup surge may be much higher.", confidence: "catalog" },
  { id: "source-solar-200", kind: "source", category: "Solar", name: "200W solar panel", watts: 200, description: "Rated panel output before weather and conversion losses.", confidence: "catalog" },
  { id: "source-solar-400", kind: "source", category: "Solar", name: "400W solar panel", watts: 400, description: "Rated panel output before weather and conversion losses.", confidence: "catalog" },
  { id: "source-ecoflow-delta2", kind: "source", category: "Battery", name: "EcoFlow DELTA 2", watts: 1800, capacityWh: 1024, description: "Portable power station with battery storage and AC inverter.", confidence: "catalog", sourceUrl: "https://www.ecoflow.com/us/delta-2-portable-power-station" },
  { id: "source-jackery-1000", kind: "source", category: "Battery", name: "Jackery Explorer 1000 v2", watts: 1500, capacityWh: 1070, description: "Portable power station; verify the exact model before use.", confidence: "catalog", sourceUrl: "https://www.jackery.com/products/explorer-1000-v2-portable-power-station" },
  { id: "source-honda-eu2200", kind: "source", category: "Generator", name: "Honda EU2200i generator", watts: 1800, description: "Rated continuous output; 2200W maximum output.", confidence: "catalog", sourceUrl: "https://powerequipment.honda.com/generators/models/eu2200i" },
  { id: "source-f150-pro-power", kind: "source", category: "Vehicle inverter", name: "Ford F-150 Pro Power Onboard", watts: 2000, description: "Representative 2.0kW configuration; some trims offer higher output.", confidence: "catalog", sourceUrl: "https://www.ford.com/trucks/f150/features/technology/" },
  { id: "source-rivian-outlets", kind: "source", category: "Vehicle inverter", name: "Rivian onboard outlets", watts: 1500, description: "Vehicle AC outlet supply; confirm limits for the vehicle model year.", confidence: "catalog" },
  { id: "source-shore", kind: "source", category: "Shore power", name: "30A RV shore power", watts: 3600, description: "Theoretical 120V × 30A supply; continuous usable power may be lower.", confidence: "catalog" },
];

function extractNumber(text: string, unit: "w" | "wh") {
  const pattern = unit === "wh"
    ? /(\d[\d,.]*)\s*(k?wh)\b/i
    : /(\d[\d,.]*)\s*(kw|watts?|w)\b/i;
  const match = text.match(pattern);
  if (!match) return undefined;
  const [, rawValue = "", rawUnit = ""] = match;
  const value = Number(rawValue.replace(/,/g, ""));
  if (!Number.isFinite(value)) return undefined;
  return rawUnit.toLowerCase().startsWith("k") ? value * 1000 : value;
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const query = params.get("q")?.trim() ?? "";
  const kind: EquipmentKind = params.get("kind") === "source" ? "source" : "load";
  if (query.length < 2) return NextResponse.json({ results: [], webEnabled: Boolean(process.env.BRAVE_SEARCH_API_KEY) });

  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  const local = catalog
    .filter((item) => item.kind === kind)
    .map((item) => ({ item, score: words.reduce((score, word) => score + (item.name.toLowerCase().includes(word) ? 3 : 0) + (item.category.toLowerCase().includes(word) ? 1 : 0), 0) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ item }) => item)
    .slice(0, 6);

  const apiKey = process.env.BRAVE_SEARCH_API_KEY;
  if (!apiKey) return NextResponse.json({ results: local, webEnabled: false });

  try {
    const url = new URL("https://api.search.brave.com/res/v1/web/search");
    url.searchParams.set("q", `${query} ${kind === "source" ? "output watts capacity Wh specifications" : "power consumption watts specifications"}`);
    url.searchParams.set("count", "6");
    url.searchParams.set("safesearch", "strict");
    const response = await fetch(url, { headers: { Accept: "application/json", "X-Subscription-Token": apiKey }, cache: "no-store" });
    if (!response.ok) throw new Error("Search provider unavailable");
    const data = (await response.json()) as { web?: { results?: Array<{ title: string; url: string; description?: string; extra_snippets?: string[] }> } };
    const web = (data.web?.results ?? []).map((result, index): EquipmentResult => {
      const detail = [result.description, ...(result.extra_snippets ?? [])].filter(Boolean).join(" ");
      return {
        id: `web-${index}-${result.url}`,
        kind,
        category: kind === "source" ? "Web power source" : "Web device",
        name: result.title,
        watts: extractNumber(detail, "w") ?? 0,
        capacityWh: extractNumber(detail, "wh"),
        sourceUrl: result.url,
        description: result.description ?? "Web search result; verify its electrical nameplate before planning.",
        confidence: "web-estimate",
      };
    });
    return NextResponse.json({ results: [...local, ...web].slice(0, 10), webEnabled: true });
  } catch {
    return NextResponse.json({ results: local, webEnabled: true, warning: "Live web results are temporarily unavailable." });
  }
}
