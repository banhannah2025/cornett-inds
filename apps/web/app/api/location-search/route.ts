import { NextResponse } from "next/server";

type NominatimPlace = {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  type: string;
};

const headers = {
  Accept: "application/json",
  "User-Agent": "BlendedWorks-Basecamp/1.0 (location autocomplete)",
};

async function findCenter(near: string) {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", near);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "1");
  const response = await fetch(url, { headers, next: { revalidate: 86400 } });
  if (!response.ok) return null;
  const [place] = (await response.json()) as NominatimPlace[];
  return place ? { latitude: Number(place.lat), longitude: Number(place.lon) } : null;
}

function milesBetween(aLat: number, aLon: number, bLat: number, bLon: number) {
  const radians = (degrees: number) => (degrees * Math.PI) / 180;
  const dLat = radians(bLat - aLat);
  const dLon = radians(bLon - aLon);
  const value = Math.sin(dLat / 2) ** 2 + Math.cos(radians(aLat)) * Math.cos(radians(bLat)) * Math.sin(dLon / 2) ** 2;
  return 3958.8 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const query = params.get("q")?.trim();
  const near = params.get("near")?.trim();
  const hasCoordinates = params.has("lat") && params.has("lon");
  const suppliedLatitude = Number(params.get("lat"));
  const suppliedLongitude = Number(params.get("lon"));

  if (!query && hasCoordinates && Number.isFinite(suppliedLatitude) && Number.isFinite(suppliedLongitude)) {
    const reverseUrl = new URL("https://nominatim.openstreetmap.org/reverse");
    reverseUrl.searchParams.set("format", "jsonv2");
    reverseUrl.searchParams.set("lat", String(suppliedLatitude));
    reverseUrl.searchParams.set("lon", String(suppliedLongitude));
    reverseUrl.searchParams.set("zoom", "16");
    try {
      const response = await fetch(reverseUrl, { headers, next: { revalidate: 86400 } });
      if (!response.ok) throw new Error("Location provider unavailable");
      const place = (await response.json()) as NominatimPlace;
      return NextResponse.json({ result: { id: place.place_id, label: place.display_name, latitude: Number(place.lat), longitude: Number(place.lon), type: place.type } });
    } catch {
      return NextResponse.json({ result: null }, { status: 503 });
    }
  }
  if (!query || query.length < 3) return NextResponse.json({ results: [] });

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", query);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("limit", "10");

  try {
    const center =
      hasCoordinates && Number.isFinite(suppliedLatitude) && Number.isFinite(suppliedLongitude)
        ? { latitude: suppliedLatitude, longitude: suppliedLongitude }
        : near
          ? await findCenter(near)
          : null;
    if (center) {
      const latitudeDelta = 100 / 69;
      const longitudeDelta = 100 / (69 * Math.max(0.2, Math.cos((center.latitude * Math.PI) / 180)));
      url.searchParams.set("viewbox", `${center.longitude - longitudeDelta},${center.latitude + latitudeDelta},${center.longitude + longitudeDelta},${center.latitude - latitudeDelta}`);
      url.searchParams.set("bounded", "1");
    }
    const response = await fetch(url, {
      headers,
      next: { revalidate: 86400 },
    });
    if (!response.ok) throw new Error("Location provider unavailable");
    const places = (await response.json()) as NominatimPlace[];
    const results = places.map((place) => ({
        id: place.place_id,
        label: place.display_name,
        latitude: Number(place.lat),
        longitude: Number(place.lon),
        type: place.type,
        distanceMiles: center ? milesBetween(center.latitude, center.longitude, Number(place.lat), Number(place.lon)) : undefined,
      }))
      .filter((place) => place.distanceMiles === undefined || place.distanceMiles <= 100)
      .sort((a, b) => (a.distanceMiles ?? 0) - (b.distanceMiles ?? 0))
      .slice(0, 6);
    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ results: [] }, { status: 503 });
  }
}
