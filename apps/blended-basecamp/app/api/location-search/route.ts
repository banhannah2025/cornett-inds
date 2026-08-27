import { NextResponse } from "next/server";

type NominatimPlace = {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  type: string;
};

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q")?.trim();
  if (!query || query.length < 3) return NextResponse.json({ results: [] });

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", query);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("limit", "6");

  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "BlendedWorks-Basecamp/1.0 (location autocomplete)",
      },
      next: { revalidate: 86400 },
    });
    if (!response.ok) throw new Error("Location provider unavailable");
    const places = (await response.json()) as NominatimPlace[];
    return NextResponse.json({
      results: places.map((place) => ({
        id: place.place_id,
        label: place.display_name,
        latitude: Number(place.lat),
        longitude: Number(place.lon),
        type: place.type,
      })),
    });
  } catch {
    return NextResponse.json({ results: [] }, { status: 503 });
  }
}
