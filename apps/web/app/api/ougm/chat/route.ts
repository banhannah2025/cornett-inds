import { getOugmAccess } from "@/lib/ougm/auth";
export async function POST(request: Request) {
  if (!(await getOugmAccess()))
    return Response.json(
      { error: "Mission staff access required." },
      { status: 403 },
    );
  const body = await request.json().catch(() => null);
  if (
    !body ||
    typeof body.prompt !== "string" ||
    !body.prompt.trim() ||
    body.prompt.length > 8000
  )
    return Response.json(
      { error: "Enter a message of up to 8,000 characters." },
      { status: 400 },
    );
  const key = process.env.OPENAI_API_SECRET_KEY || process.env.OPENAI_API_KEY;
  if (!key)
    return Response.json(
      { error: "The devotional AI service has not been configured yet." },
      { status: 503 },
    );
  const history = Array.isArray(body.history)
    ? body.history
        .filter(
          (v: { role?: string; content?: string }) =>
            (v?.role === "user" || v?.role === "assistant") &&
            typeof v.content === "string" &&
            v.content.length <= 20000,
        )
        .slice(-8)
    : [];
  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(90000),
      body: JSON.stringify({
        model: process.env.OUGM_AI_MODEL || "gpt-4.1-mini",
        store: false,
        max_output_tokens: 3000,
        input: [
          {
            role: "system",
            content:
              "You help Olympia Union Gospel Mission staff write Christian meal devotionals for guests experiencing homelessness. Write conversational complete paragraphs, compassionate practical application, and a closing prayer. Default to a 5–7 minute read. Do not invent personal events, promise housing or healing, or shame guests. Cite real Scripture; label paraphrases and do not invent exact Bible quotations. Follow requests for revisions. Return only a JSON object with string fields title, excerpt (max 240 chars), scriptureReference (max 80 chars), scriptureText, bodyText, prayer. Do not claim to publish anything; the staff must review and explicitly publish using the app.",
          },
          ...history,
          { role: "user", content: body.prompt },
        ],
      }),
    });
    const data = await response.json();
    if (!response.ok)
      return Response.json(
        {
          error:
            "The AI service could not complete this draft. Please try again.",
        },
        { status: 502 },
      );
    const answer =
      data.output_text ??
      data.output
        ?.flatMap(
          (v: { content?: { type?: string; text?: string }[] }) =>
            v.content ?? [],
        )
        .filter((v: { type?: string }) => v.type === "output_text")
        .map((v: { text?: string }) => v.text)
        .join("");
    const draft = JSON.parse(answer.replace(/^```(?:json)?\s*|\s*```$/g, ""));
    const fields = [
      "title",
      "excerpt",
      "scriptureReference",
      "scriptureText",
      "bodyText",
      "prayer",
    ];
    if (
      !fields.every((k) => typeof draft[k] === "string") ||
      draft.title.length > 100 ||
      draft.excerpt.length > 240 ||
      draft.scriptureReference.length > 80
    )
      throw new Error("Invalid draft");
    return Response.json(
      { draft },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json(
      {
        error:
          "The draft could not be completed. Try again or write in the editor.",
      },
      { status: 502 },
    );
  }
}
