export const dynamic = "force-dynamic";

const noStoreHeaders = { "Cache-Control": "no-store, no-cache, must-revalidate" };
const downloadPayload = Array.from({ length: 55000 }, () => crypto.randomUUID()).join("");

type IpProfile = { success?: boolean; connection?: { isp?: string; org?: string; domain?: string }; type?: string };

export async function GET(request: Request) {
  const mode = new URL(request.url).searchParams.get("mode");
  if (mode === "ping") return new Response(null, { status: 204, headers: noStoreHeaders });
  if (mode === "profile") {
    const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    const clientIp = forwarded || request.headers.get("x-real-ip")?.trim();
    if (!clientIp) return Response.json({ provider: null, connectionType: null }, { headers: noStoreHeaders });
    try {
      const response = await fetch(`https://ipwho.is/${encodeURIComponent(clientIp)}`, { cache: "no-store", signal: AbortSignal.timeout(5000) });
      if (!response.ok) throw new Error("Provider lookup failed");
      const profile = (await response.json()) as IpProfile;
      return Response.json({ provider: profile.connection?.isp || profile.connection?.org || null, organization: profile.connection?.org || null, connectionType: profile.type || null }, { headers: noStoreHeaders });
    } catch {
      return Response.json({ provider: null, connectionType: null }, { headers: noStoreHeaders });
    }
  }

  return new Response(downloadPayload, {
    headers: { ...noStoreHeaders, "Content-Type": "application/octet-stream", "Content-Encoding": "identity", "Content-Length": String(downloadPayload.length) },
  });
}

export async function POST(request: Request) {
  const bytes = (await request.arrayBuffer()).byteLength;
  return Response.json({ bytes }, { headers: noStoreHeaders });
}
