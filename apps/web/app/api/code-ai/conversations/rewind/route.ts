import { getCodeAiOwner } from "@/lib/code-ai/auth";
import { rewindCodeAiConversation } from "@/lib/code-ai/lifecycle";

export async function POST(request: Request) {
  if (!(await getCodeAiOwner())) return Response.json({ error: "Forbidden" }, { status: 403 });
  const body = (await request.json().catch(() => null)) as { conversationId?: string; messageKey?: string } | null;
  if (!body?.conversationId || !body.messageKey) {
    return Response.json({ error: "A conversation ID and user message key are required." }, { status: 400 });
  }
  try {
    return Response.json(await rewindCodeAiConversation(body.conversationId, body.messageKey));
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to rewind conversation." }, { status: 500 });
  }
}
