import { getCodeAiOwner } from "@/lib/code-ai/auth";
import { dispatchValidation, listValidationRuns } from "@/lib/code-ai/github";

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
  const body = (await request.json().catch(() => null)) as { repository?: string; branch?: string; scope?: "web" | "all"; approved?: boolean } | null;
  if (!body?.repository || !body.branch || !["web", "all"].includes(body.scope ?? "") || body.approved !== true) {
    return Response.json({ error: "An explicitly approved validation request is required." }, { status: 400 });
  }
  try { return Response.json(await dispatchValidation(body.repository, body.branch, body.scope!)); }
  catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Unable to start validation." }, { status: 502 }); }
}
