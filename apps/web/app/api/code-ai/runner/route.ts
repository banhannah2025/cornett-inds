import { getCodeAiOwner } from "@/lib/code-ai/auth";
import { logCodeAiAudit } from "@/lib/code-ai/store";
import { controlValidationRun, dispatchValidation, listValidationRuns } from "@/lib/code-ai/github";

export async function GET(request: Request) {
  if (!(await getCodeAiOwner())) return Response.json({ error: "Forbidden" }, { status: 403 });
  const url = new URL(request.url);
  const repository = url.searchParams.get("repository");
  if (!repository) return Response.json({ error: "Repository is required." }, { status: 400 });
  try { return Response.json(await listValidationRuns(repository, url.searchParams.get("branch") || undefined)); }
  catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Unable to load validation runs." }, { status: 502 }); }
}

export async function POST(request: Request) {
  if (!(await getCodeAiOwner())) return Response.json({ error: "Forbidden" }, { status: 403 });
  const body = (await request.json().catch(() => null)) as { action?: "start" | "cancel" | "rerun"; repository?: string; branch?: string; scope?: "web" | "visual" | "all"; runId?: number; approved?: boolean } | null;
  if (!body?.repository || body.approved !== true) return Response.json({ error: "An explicitly approved validation request is required." }, { status: 400 });
  try {
    if ((body.action === "cancel" || body.action === "rerun") && body.runId) { const result = await controlValidationRun(body.repository, body.runId, body.action); await logCodeAiAudit(`validation-${body.action}`, `${body.action} run ${body.runId}`); return Response.json(result); }
    if (!body.branch || !["web", "visual", "all"].includes(body.scope ?? "")) return Response.json({ error: "Branch and validation scope are required." }, { status: 400 });
    const result = await dispatchValidation(body.repository, body.branch, body.scope!); await logCodeAiAudit("validation", `Started ${body.scope} validation on ${body.branch}`); return Response.json(result);
  }
  catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Unable to start validation." }, { status: 502 }); }
}
