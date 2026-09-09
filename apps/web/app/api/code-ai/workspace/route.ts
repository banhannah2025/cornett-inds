import { getCodeAiOwner } from "@/lib/code-ai/auth";
import {
  createCodeAiConversation,
  createCodeAiProject,
  deleteCodeAiDocument,
  listCodeAiWorkspace,
  updateCodeAiDocument,
} from "@/lib/code-ai/store";

export async function GET() {
  if (!(await getCodeAiOwner())) return Response.json({ error: "Forbidden" }, { status: 403 });
  try {
    return Response.json(await listCodeAiWorkspace());
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to load workspace." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  if (!(await getCodeAiOwner())) return Response.json({ error: "Forbidden" }, { status: 403 });
  const body = (await request.json().catch(() => null)) as { id?: string; name?: string; title?: string; archived?: boolean } | null;
  if (!body?.id) return Response.json({ error: "Document ID is required." }, { status: 400 });
  try {
    return Response.json(await updateCodeAiDocument(body.id, { name: body.name?.trim(), title: body.title?.trim(), archived: body.archived }));
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to update item." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (!(await getCodeAiOwner())) return Response.json({ error: "Forbidden" }, { status: 403 });
  const id = new URL(request.url).searchParams.get("id");
  if (!id?.startsWith("codeAi")) return Response.json({ error: "Invalid document ID." }, { status: 400 });
  try {
    await deleteCodeAiDocument(id);
    return Response.json({ deleted: true });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to delete item." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!(await getCodeAiOwner())) return Response.json({ error: "Forbidden" }, { status: 403 });
  const body = (await request.json().catch(() => null)) as
    | { type?: "project" | "conversation"; name?: string; repository?: string; projectId?: string; title?: string }
    | null;
  try {
    if (body?.type === "project" && body.name?.trim() && body.repository?.trim()) {
      return Response.json(await createCodeAiProject(body.name.trim(), body.repository.trim()));
    }
    if (body?.type === "conversation" && body.projectId && body.title?.trim()) {
      return Response.json(await createCodeAiConversation(body.projectId, body.title.trim()));
    }
    return Response.json({ error: "Invalid workspace request." }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to update workspace." }, { status: 500 });
  }
}
