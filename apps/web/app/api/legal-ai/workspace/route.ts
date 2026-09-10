import { getLegalAiUser } from "@/lib/legal-ai/auth";
import {
  createLegalAiConversation,
  createLegalAiProject,
  deleteLegalAiDocument,
  listLegalAiWorkspace,
  updateLegalAiDocument,
} from "@/lib/legal-ai/store";
import {
  deleteLegalAiConversationCascade,
  deleteLegalAiProjectCascade,
  discardLegalAiChangeSet,
} from "@/lib/legal-ai/lifecycle";

export async function GET() {
  if (!(await getLegalAiUser())) return Response.json({ error: "Forbidden" }, { status: 403 });
  try {
    return Response.json(await listLegalAiWorkspace());
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to load workspace." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  if (!(await getLegalAiUser())) return Response.json({ error: "Forbidden" }, { status: 403 });
  const body = (await request.json().catch(() => null)) as { id?: string; name?: string; title?: string; archived?: boolean; projectId?: string; monthlyBudgetUsd?: number; defaultModel?: string } | null;
  if (!body?.id) return Response.json({ error: "Document ID is required." }, { status: 400 });
  if (body.monthlyBudgetUsd !== undefined && (!Number.isFinite(body.monthlyBudgetUsd) || body.monthlyBudgetUsd < 0 || body.monthlyBudgetUsd > 1000)) return Response.json({ error: "Budget must be between $0 and $1,000." }, { status: 400 });
  if (body.defaultModel && !["gpt-5.6-luna", "gpt-5.6-terra", "gpt-5.6-sol"].includes(body.defaultModel)) return Response.json({ error: "Invalid default model." }, { status: 400 });
  try {
    return Response.json(await updateLegalAiDocument(body.id, { name: body.name?.trim(), title: body.title?.trim(), archived: body.archived, projectId: body.projectId, monthlyBudgetUsd: body.monthlyBudgetUsd, defaultModel: body.defaultModel }));
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to update item." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (!(await getLegalAiUser())) return Response.json({ error: "Forbidden" }, { status: 403 });
  const id = new URL(request.url).searchParams.get("id");
  if (!id?.startsWith("legalAi")) return Response.json({ error: "Invalid document ID." }, { status: 400 });
  try {
    if (id.startsWith("legalAiProject-")) await deleteLegalAiProjectCascade(id);
    else if (id.startsWith("legalAiConversation-")) await deleteLegalAiConversationCascade(id);
    else if (id.startsWith("legalAiChangeSet-")) await discardLegalAiChangeSet(id);
    else await deleteLegalAiDocument(id);
    return Response.json({ deleted: true });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to delete item." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!(await getLegalAiUser())) return Response.json({ error: "Forbidden" }, { status: 403 });
  const body = (await request.json().catch(() => null)) as
    | { type?: "project" | "conversation"; name?: string; repository?: string; projectId?: string; title?: string }
    | null;
  try {
    if (body?.type === "project" && body.name?.trim() && body.repository?.trim()) {
      return Response.json(await createLegalAiProject(body.name.trim(), body.repository.trim()));
    }
    if (body?.type === "conversation" && body.projectId && body.title?.trim()) {
      return Response.json(await createLegalAiConversation(body.projectId, body.title.trim()));
    }
    return Response.json({ error: "Invalid workspace request." }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to update workspace." }, { status: 500 });
  }
}
