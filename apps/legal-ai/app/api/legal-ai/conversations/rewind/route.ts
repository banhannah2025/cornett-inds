import { getLegalAiUser } from "@/lib/legal-ai/auth";
import { rewindLegalAiConversation } from "@/lib/legal-ai/lifecycle";

export async function POST(request: Request) {
  const user = await getLegalAiUser();
  if (!user) return Response.json({ error: "Forbidden" }, { status: 403 });
  const body = (await request.json().catch(() => null)) as { conversationId?: string; messageKey?: string } | null;
  if (!body?.conversationId || !body.messageKey) {
    return Response.json({ error: "A conversation ID and user message key are required." }, { status: 400 });
  }
  try {
    return Response.json(await rewindLegalAiConversation(user.userId, body.conversationId, body.messageKey));
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to rewind conversation." }, { status: 500 });
  }
}
