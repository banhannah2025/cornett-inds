import { getLegalAiUser } from "@/lib/legal-ai/auth";
import { discardLegalAiChangeSet } from "@/lib/legal-ai/lifecycle";

export async function DELETE(request: Request) {
  if (!(await getLegalAiUser())) return Response.json({ error: "Forbidden" }, { status: 403 });
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return Response.json({ error: "Change set ID is required." }, { status: 400 });
  try {
    return Response.json(await discardLegalAiChangeSet(id));
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to discard change set." }, { status: 500 });
  }
}
