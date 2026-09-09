import { createHash } from "node:crypto";
import { getCodeAiOwner } from "@/lib/code-ai/auth";
import {
  appendCodeAiMessages,
  getCodeAiConversation,
  makeCodeAiMessage,
} from "@/lib/code-ai/store";
import {
  listRepositoryFiles,
  readRepositoryFile,
  writeRepositoryFile,
} from "@/lib/code-ai/github";

type FunctionCall = { type: "function_call"; name: string; arguments: string; call_id: string };
type OutputItem = FunctionCall | { type: string; content?: Array<{ type: string; text?: string }> };
type OpenAiResponse = { id: string; output?: OutputItem[]; output_text?: string; error?: { message?: string } };

const instructions = `You are Code AI, Robin's private software-development agent for Blended Works.
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

export async function POST(request: Request) {
  const owner = await getCodeAiOwner();
  if (!owner) return Response.json({ error: "Forbidden" }, { status: 403 });
  const body = (await request.json().catch(() => null)) as
    | { conversationId?: string; message?: string; repository?: string; branch?: string; approveChanges?: boolean }
    | null;
  const message = body?.message?.trim();
  const repository = body?.repository?.trim();
  const conversationId = body?.conversationId;
  const branch = body?.branch?.trim() || "main";
  if (!message || message.length > 20000 || !repository || !conversationId) {
    return Response.json({ error: "A conversation, repository, and message are required." }, { status: 400 });
  }
  const apiKey = process.env.OPENAI_API_SECRET_KEY;
  if (!apiKey) return Response.json({ error: "OpenAI is not configured." }, { status: 503 });

  try {
    const conversation = await getCodeAiConversation(conversationId);
    if (!conversation) return Response.json({ error: "Conversation not found." }, { status: 404 });
    const userMessage = makeCodeAiMessage("user", message);
    await appendCodeAiMessages(conversationId, [userMessage]);

    const input: unknown[] = [
      { role: "system", content: instructions },
      ...conversation.messages.slice(-20).map(({ role, content }) => ({ role, content })),
      { role: "user", content: `Repository: ${repository}\nBranch: ${branch}\nFile changes approved for this message: ${body.approveChanges === true ? "yes" : "no"}\n\n${message}` },
    ];
    let response: OpenAiResponse | null = null;
    const proposedChanges: Array<{ path: string; previousContent: string; content: string; message: string }> = [];

    for (let turn = 0; turn < 8; turn += 1) {
      const apiResponse = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: process.env.CODE_AI_MODEL ?? "gpt-5.6-terra",
          store: false,
          safety_identifier: createHash("sha256").update(owner.userId).digest("hex"),
          reasoning: { effort: "medium" },
          max_output_tokens: 4000,
          tools: toolDefinitions,
          input,
        }),
      });
      response = (await apiResponse.json()) as OpenAiResponse;
      if (!apiResponse.ok) throw new Error(response.error?.message ?? "OpenAI request failed.");
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
    if (!answer) throw new Error("Code AI returned no final response.");
    const assistantMessage = makeCodeAiMessage("assistant", answer);
    await appendCodeAiMessages(conversationId, [assistantMessage]);
    return Response.json({ message: assistantMessage, proposedChanges });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Code AI could not complete the request." }, { status: 500 });
  }
}
