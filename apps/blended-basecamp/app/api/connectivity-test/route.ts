export const dynamic = "force-dynamic";

const noStoreHeaders = { "Cache-Control": "no-store, no-cache, must-revalidate" };

export async function GET(request: Request) {
  const mode = new URL(request.url).searchParams.get("mode");
  if (mode === "ping") return new Response(null, { status: 204, headers: noStoreHeaders });

  const chunks = Array.from({ length: 18000 }, () => crypto.randomUUID()).join("");
  return new Response(chunks, {
    headers: { ...noStoreHeaders, "Content-Type": "application/octet-stream", "Content-Length": String(chunks.length) },
  });
}

export async function POST(request: Request) {
  const bytes = (await request.arrayBuffer()).byteLength;
  return Response.json({ bytes }, { headers: noStoreHeaders });
}
