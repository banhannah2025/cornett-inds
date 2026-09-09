import { getCodeAiOwner } from "@/lib/code-ai/auth";
import { discardCodeAiChangeSet } from "@/lib/code-ai/lifecycle";

export async function DELETE(request: Request) {
  if (!(await getCodeAiOwner())) return Response.json({ error: "Forbidden" }, { status: 403 });
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return Response.json({ error: "Change set ID is required." }, { status: 400 });
  try {
    return Response.json(await discardCodeAiChangeSet(id));
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to discard change set." }, { status: 500 });
  }
}
