import { createHash } from "node:crypto";
import { getLegalAiUser } from "@/lib/legal-ai/auth";
import {
  appendLegalAiMessages,
  getLegalAiFiles,
  getLegalAiConversation,
  getLegalAiProjectUsage,
  makeLegalAiMessage,
} from "@/lib/legal-ai/store";
type OutputItem = { type: string; content?: Array<{ type: string; text?: string }> };
type OpenAiResponse = { id: string; output?: OutputItem[]; output_text?: string; usage?: { input_tokens?: number; output_tokens?: number }; error?: { message?: string } };

const instructions = `You are Legal AI, an AI-assisted legal research, document-analysis, and matter-management workspace from Blended Works.

Help users understand legal issues, organize facts and evidence, analyze uploaded documents, identify questions and deadlines, draft and review legal writing, and research legal authorities. Clearly distinguish law from facts supplied by the user and from your own analysis. Never invent statutes, cases, quotations, docket information, citations, deadlines, or procedural requirements. When jurisdiction or procedural posture matters and is not known, say so and ask for it or clearly qualify the answer.

Legal AI is not a law firm and does not replace a licensed attorney. Do not imply an attorney-client relationship. For consequential legal decisions, encourage verification of current law, court rules, filing requirements, and deadlines. Be especially careful with criminal, family, housing, employment, immigration, and other high-impact matters.

Focus on the user's legal question and the materials attached to the matter. Developer and repository tooling are not part of the Legal AI user experience.

The signed-in owner account is the Legal AI administrator and may have unrestricted administrative capabilities. Future customer accounts may have plan-based feature and usage limits.`;


function answerFrom(response: OpenAiResponse) {
  if (response.output_text) return response.output_text;
  return response.output
    ?.flatMap((item) => ("content" in item ? item.content ?? [] : []))
    .filter((item) => item.type === "output_text")
    .map((item) => item.text ?? "")
    .join("\n")
    .trim();
}

async function readOpenAiStream(response: Response, onDelta: (delta: string) => void) {
  if (!response.ok) {
    const error = await response.json().catch(() => ({})) as { error?: { message?: string } };
    throw new Error(error.error?.message ?? "OpenAI request failed.");
  }
  if (!response.body) throw new Error("OpenAI returned no response stream.");
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let completed: OpenAiResponse | null = null;
  while (true) {
    const { value, done } = await reader.read();
    buffer += decoder.decode(value, { stream: !done });
    const events = buffer.split("\n\n");
    buffer = events.pop() ?? "";
    for (const event of events) {
      const line = event.split("\n").find((item) => item.startsWith("data: "));
      if (!line || line === "data: [DONE]") continue;
      const payload = JSON.parse(line.slice(6)) as { type?: string; delta?: string; response?: OpenAiResponse; error?: { message?: string } };
      if (payload.type === "response.output_text.delta" && payload.delta) onDelta(payload.delta);
      if (payload.type === "response.completed" && payload.response) completed = payload.response;
      if (payload.type === "response.failed") throw new Error(payload.error?.message ?? "OpenAI response failed.");
    }
    if (done) break;
  }
  if (!completed) throw new Error("OpenAI stream ended before completion.");
  return completed;
}

export async function POST(request: Request) {
  const user = await getLegalAiUser();
  if (!user) return Response.json({ error: "Forbidden" }, { status: 403 });
  const body = (await request.json().catch(() => null)) as
    | { conversationId?: string; projectId?: string; message?: string; model?: string; attachmentIds?: string[] }
    | null;
  const message = body?.message?.trim();
  const conversationId = body?.conversationId;
  const allowedModels = ["gpt-5.6-luna", "gpt-5.6-terra", "gpt-5.6-sol"];
  const model = body?.model && allowedModels.includes(body.model) ? body.model : process.env.LEGAL_AI_MODEL ?? process.env.CODE_AI_MODEL ?? "gpt-5.6-terra";
  if (!message || message.length > 20000 || !conversationId) {
    return Response.json({ error: "A conversation and message are required." }, { status: 400 });
  }
  const apiKey = process.env.OPENAI_API_SECRET_KEY;
  if (!apiKey) return Response.json({ error: "OpenAI is not configured." }, { status: 503 });

  if (body.projectId && !user.isAdmin) {
    const usage = await getLegalAiProjectUsage(body.projectId, user.userId);
    const budget = usage.project?.monthlyBudgetUsd ?? 5;
    if (budget > 0 && usage.estimatedCostUsd >= budget) return Response.json({ error: `This matter's $${budget.toFixed(2)} monthly budget has been reached. Increase it in matter settings to continue.` }, { status: 429 });
  }

  const encoder = new TextEncoder();
  return new Response(new ReadableStream({
    async start(controller) {
      const send = (payload: unknown) => controller.enqueue(encoder.encode(`${JSON.stringify(payload)}\n`));
      try {
    const conversation = await getLegalAiConversation(conversationId, user.userId);
    if (!conversation) throw new Error("Conversation not found.");
    const userMessage = makeLegalAiMessage("user", message);
    await appendLegalAiMessages(conversationId, user.userId, [userMessage]);

    const attachments = body.projectId && Array.isArray(body.attachmentIds) ? await getLegalAiFiles(body.attachmentIds.slice(0, 5), body.projectId, user.userId) : [];
    const attachmentContent: unknown[] = [];
    for (const file of attachments) {
      if (file.mimeType.startsWith("image/")) attachmentContent.push({ type: "input_image", image_url: file.url });
      else if (file.mimeType === "application/pdf") attachmentContent.push({ type: "input_file", file_url: file.url, filename: file.name });
      else if (file.size <= 250_000 && (/^(text\/|application\/(json|javascript|xml))/.test(file.mimeType) || /\.(ts|tsx|js|jsx|css|md|json|ya?ml|txt|sh|kt|java|xml)$/i.test(file.name))) {
        const text = await fetch(file.url).then((result) => result.ok ? result.text() : "").catch(() => "");
        attachmentContent.push({ type: "input_text", text: `Attached file: ${file.name}\n\n${text.slice(0, 250_000)}` });
      } else attachmentContent.push({ type: "input_text", text: `Attached file available for reference: ${file.name} (${file.mimeType}, ${file.size} bytes).` });
    }
    const input: unknown[] = [
      { role: "system", content: instructions },
      ...conversation.messages.slice(-20).map(({ role, content }) => ({ role, content })),
      { role: "user", content: [{ type: "input_text", text: message }, ...attachmentContent] },
    ];
    const apiResponse = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      signal: request.signal,
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        store: false,
        safety_identifier: createHash("sha256").update(user.userId).digest("hex"),
        reasoning: { effort: "medium" },
        max_output_tokens: 4000,
        stream: true,
        input,
      }),
    });
    const response = await readOpenAiStream(apiResponse, (delta) => send({ type: "delta", delta }));

    const answer = response ? answerFrom(response) : null;
    if (!answer) throw new Error("Legal AI returned no final response.");
    const assistantMessage = { ...makeLegalAiMessage("assistant", answer), model, inputTokens: response?.usage?.input_tokens, outputTokens: response?.usage?.output_tokens };
    await appendLegalAiMessages(conversationId, user.userId, [assistantMessage]);
    send({ type: "done", message: assistantMessage });
      } catch (error) {
        send({ type: "error", error: error instanceof Error ? error.message : "Legal AI could not complete the request." });
      } finally { controller.close(); }
    },
    cancel() { /* The request signal aborts upstream fetches when the client disconnects. */ },
  }), { headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-cache, no-transform", "X-Content-Type-Options": "nosniff" } });
}
