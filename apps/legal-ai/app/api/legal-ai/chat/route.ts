import { createHash } from "node:crypto";
import { getLegalAiOwner } from "@/lib/legal-ai/auth";
import {
  appendLegalAiMessages,
  createLegalAiChangeSet,
  getLegalAiFiles,
  getLegalAiConversation,
  getLegalAiProjectUsage,
  makeLegalAiMessage,
} from "@/lib/legal-ai/store";
import {
  listRepositoryFiles,
  readRepositoryFile,
  writeRepositoryFile,
} from "@/lib/legal-ai/github";

type FunctionCall = { type: "function_call"; name: string; arguments: string; call_id: string };
type OutputItem = FunctionCall | { type: string; content?: Array<{ type: string; text?: string }> };
type OpenAiResponse = { id: string; output?: OutputItem[]; output_text?: string; usage?: { input_tokens?: number; output_tokens?: number }; error?: { message?: string } };

const instructions = `You are Legal AI, Robin's private software-development agent for Blended Works.
Work carefully inside the selected GitHub repository. Inspect the relevant files before proposing or making changes. Preserve existing architecture and user work. Explain intended changes briefly, use repository tools when needed, and report files changed and validation still needed.
Never reveal secrets, environment values, tokens, or credentials. Never weaken authentication. Use the write tool to propose complete file changes; the server will either hold them for review or commit them depending on the user's approval setting. Do not claim a file was committed unless the tool confirms it.`;

const toolDefinitions = [
  {
    type: "function",
    name: "list_repository_files",
    description: "List files in the selected GitHub repository.",
    parameters: { type: "object", properties: { branch: { type: "string" } }, additionalProperties: false },
  },
  {
    type: "function",
    name: "read_repository_file",
    description: "Read a UTF-8 text file from the selected GitHub repository.",
    parameters: {
      type: "object",
      properties: { path: { type: "string" }, branch: { type: "string" } },
      required: ["path"],
      additionalProperties: false,
    },
  },
  {
    type: "function",
    name: "write_repository_file",
    description: "Propose a complete UTF-8 file replacement. If the user enabled changes, it is committed; otherwise it is returned for visual review.",
    parameters: {
      type: "object",
      properties: {
        path: { type: "string" }, content: { type: "string" }, branch: { type: "string" }, message: { type: "string" },
      },
      required: ["path", "content", "message"],
      additionalProperties: false,
    },
  },
];

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
  const owner = await getLegalAiOwner();
  if (!owner) return Response.json({ error: "Forbidden" }, { status: 403 });
  const body = (await request.json().catch(() => null)) as
    | { conversationId?: string; projectId?: string; message?: string; repository?: string; branch?: string; model?: string; attachmentIds?: string[]; approveChanges?: boolean }
    | null;
  const message = body?.message?.trim();
  const repository = body?.repository?.trim();
  const conversationId = body?.conversationId;
  const branch = body?.branch?.trim() || "main";
  const allowedModels = ["gpt-5.6-luna", "gpt-5.6-terra", "gpt-5.6-sol"];
  const model = body?.model && allowedModels.includes(body.model) ? body.model : process.env.LEGAL_AI_MODEL ?? "gpt-5.6-terra";
  if (!message || message.length > 20000 || !repository || !conversationId) {
    return Response.json({ error: "A conversation, repository, and message are required." }, { status: 400 });
  }
  const apiKey = process.env.OPENAI_API_SECRET_KEY;
  if (!apiKey) return Response.json({ error: "OpenAI is not configured." }, { status: 503 });

  if (body.projectId) {
    const usage = await getLegalAiProjectUsage(body.projectId);
    const budget = usage.project?.monthlyBudgetUsd ?? 5;
    if (budget > 0 && usage.estimatedCostUsd >= budget) return Response.json({ error: `This project's $${budget.toFixed(2)} monthly budget has been reached. Increase it in project settings to continue.` }, { status: 429 });
  }

  const encoder = new TextEncoder();
  return new Response(new ReadableStream({
    async start(controller) {
      const send = (payload: unknown) => controller.enqueue(encoder.encode(`${JSON.stringify(payload)}\n`));
      try {
    const conversation = await getLegalAiConversation(conversationId);
    if (!conversation) throw new Error("Conversation not found.");
    const userMessage = makeLegalAiMessage("user", message);
    await appendLegalAiMessages(conversationId, [userMessage]);

    const attachments = body.projectId && Array.isArray(body.attachmentIds) ? await getLegalAiFiles(body.attachmentIds.slice(0, 5), body.projectId) : [];
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
      { role: "user", content: [{ type: "input_text", text: `Repository: ${repository}\nBranch: ${branch}\nFile changes approved for this message: ${body.approveChanges === true ? "yes" : "no"}\n\n${message}` }, ...attachmentContent] },
    ];
    let response: OpenAiResponse | null = null;
    const proposedChanges: Array<{ path: string; previousContent: string; content: string; message: string }> = [];

    for (let turn = 0; turn < 8; turn += 1) {
      const apiResponse = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        signal: request.signal,
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          store: false,
          safety_identifier: createHash("sha256").update(owner.userId).digest("hex"),
          reasoning: { effort: "medium" },
          max_output_tokens: 4000,
          stream: true,
          tools: toolDefinitions,
          input,
        }),
      });
      response = await readOpenAiStream(apiResponse, (delta) => send({ type: "delta", delta }));
      input.push(...(response.output ?? []));
      const calls = (response.output ?? []).filter((item): item is FunctionCall => item.type === "function_call");
      if (!calls.length) break;

      for (const call of calls) {
        let output: unknown;
        try {
          const args = JSON.parse(call.arguments || "{}") as Record<string, string>;
          if (call.name === "list_repository_files") output = await listRepositoryFiles(repository, args.branch || branch);
          else if (call.name === "read_repository_file") {
            if (!args.path) throw new Error("A file path is required.");
            output = await readRepositoryFile(repository, args.path, args.branch || branch);
          }
          else if (call.name === "write_repository_file") {
            if (!args.path || typeof args.content !== "string" || !args.message) throw new Error("Path, content, and commit message are required.");
            if (body.approveChanges === true) output = await writeRepositoryFile({ repository, path: args.path, content: args.content, branch: args.branch || branch, message: args.message });
            else {
              const previous = await readRepositoryFile(repository, args.path, args.branch || branch).catch(() => ({ content: "" }));
              proposedChanges.push({ path: args.path, previousContent: previous.content, content: args.content, message: args.message });
              output = { proposed: true, path: args.path, message: "Change saved for user review; it was not committed." };
            }
          } else throw new Error("Unknown repository tool.");
        } catch (error) {
          output = { error: error instanceof Error ? error.message : "Tool failed." };
        }
        input.push({ type: "function_call_output", call_id: call.call_id, output: JSON.stringify(output) });
      }
    }

    const answer = response ? answerFrom(response) : null;
    if (!answer) throw new Error("Legal AI returned no final response.");
    const assistantMessage = { ...makeLegalAiMessage("assistant", answer), model, inputTokens: response?.usage?.input_tokens, outputTokens: response?.usage?.output_tokens };
    await appendLegalAiMessages(conversationId, [assistantMessage]);
    const changeSet = proposedChanges.length && body.projectId ? await createLegalAiChangeSet({ projectId: body.projectId, conversationId, repository, branch, changes: proposedChanges }) : null;
    send({ type: "done", message: assistantMessage, proposedChanges, changeSet });
      } catch (error) {
        send({ type: "error", error: error instanceof Error ? error.message : "Legal AI could not complete the request." });
      } finally { controller.close(); }
    },
    cancel() { /* The request signal aborts upstream fetches when the client disconnects. */ },
  }), { headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-cache, no-transform", "X-Content-Type-Options": "nosniff" } });
}
