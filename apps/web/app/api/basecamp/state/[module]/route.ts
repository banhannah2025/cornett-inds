import { auth } from "@clerk/nextjs/server";
import { getSanityWriteClient } from "@/sanity/lib/writeClient";

export const dynamic = "force-dynamic";

const modules = new Set([
  "calendar", "connectivity", "weather", "power", "equipment", "finance",
  "journal", "checkins", "vehicles", "workspaces",
]);

function safe(value: string) {
  return value.replace(/[^A-Za-z0-9_-]/g, "-").slice(0, 120);
}

async function context(request: Request, params: Promise<{ module: string }>) {
  const userId = (await auth()).userId;
  const module = (await params).module;
  const workspace = new URL(request.url).searchParams.get("workspace") || "personal";
  if (!userId || !modules.has(module) || !/^[A-Za-z0-9_-]{1,120}$/.test(workspace)) return null;
  return { userId, module, workspace, id: `basecampState.${safe(userId)}.${safe(workspace)}.${module}` };
}

export async function GET(request: Request, { params }: { params: Promise<{ module: string }> }) {
  const value = await context(request, params);
  if (!value) return Response.json({ error: "Sign in or select a valid Basecamp module." }, { status: 401 });
  try {
    const document = await getSanityWriteClient().fetch<{ payload?: string; updatedAt?: string } | null>(
      `*[_id == $id][0]{payload, updatedAt}`,
      { id: value.id },
    );
    return Response.json({ data: document?.payload ? JSON.parse(document.payload) : null, updatedAt: document?.updatedAt ?? null });
  } catch (error) {
    console.error("[basecamp-state] load failed", { module: value.module, error });
    return Response.json({ error: "Basecamp data could not be loaded." }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ module: string }> }) {
  const value = await context(request, params);
  if (!value) return Response.json({ error: "Sign in or select a valid Basecamp module." }, { status: 401 });
  try {
    const body = (await request.json()) as { data?: unknown };
    const payload = JSON.stringify(body.data ?? null);
    if (payload.length > 1_000_000) return Response.json({ error: "Basecamp module data is too large." }, { status: 413 });
    const updatedAt = new Date().toISOString();
    await getSanityWriteClient().createOrReplace({
      _id: value.id,
      _type: "basecampState",
      ownerId: value.userId,
      workspaceId: value.workspace,
      module: value.module,
      payload,
      updatedAt,
    });
    return Response.json({ saved: true, updatedAt });
  } catch (error) {
    console.error("[basecamp-state] save failed", { module: value.module, error });
    return Response.json({ error: "Basecamp data could not be saved." }, { status: 500 });
  }
}
