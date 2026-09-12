import { getOugmAccess } from "@/lib/ougm/auth";
export const runtime = "nodejs";
export const maxDuration = 60;
export async function POST(request: Request) {
  const headers = { "Cache-Control": "no-store" };
  if (!(await getOugmAccess()))
    return Response.json(
      { error: "Mission staff access required." },
      { status: 403, headers },
    );
  const key = process.env.OPENAI_API_SECRET_KEY || process.env.OPENAI_API_KEY;
  if (!key)
    return Response.json(
      { error: "OpenAI transcription has not been configured yet." },
      { status: 503, headers },
    );
  if (Number(request.headers.get("content-length")) > 4_000_000)
    return Response.json(
      { error: "Record a shorter clip (under 4 MB)." },
      { status: 413, headers },
    );
  try {
    const input = await request.formData();
    const audio = input.get("audio");
    if (
      !(audio instanceof File) ||
      audio.size === 0 ||
      audio.size > 4_000_000 ||
      ![
        "audio/webm",
        "audio/mp4",
        "video/mp4",
        "audio/mpeg",
        "audio/wav",
        "audio/ogg",
      ].includes(audio.type.split(";")[0]!)
    )
      return Response.json(
        { error: "Use a supported audio clip under 4 MB." },
        { status: 400, headers },
      );
    const payload = new FormData();
    payload.set("file", audio);
    payload.set(
      "model",
      process.env.OUGM_TRANSCRIPTION_MODEL || "gpt-4o-mini-transcribe",
    );
    payload.set("response_format", "json");
    const response = await fetch(
      "https://api.openai.com/v1/audio/transcriptions",
      {
        method: "POST",
        headers: { Authorization: `Bearer ${key}` },
        body: payload,
        signal: AbortSignal.any([request.signal, AbortSignal.timeout(50000)]),
      },
    );
    const data = await response.json();
    if (!response.ok || typeof data.text !== "string")
      return Response.json(
        {
          error:
            "OpenAI could not transcribe this recording. Please try again.",
        },
        { status: 502, headers },
      );
    return Response.json({ text: data.text }, { headers });
  } catch {
    return Response.json(
      { error: "Transcription failed. Please try again." },
      { status: 502, headers },
    );
  }
}
