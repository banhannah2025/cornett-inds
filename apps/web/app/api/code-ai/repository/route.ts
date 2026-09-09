import { getCodeAiOwner } from "@/lib/code-ai/auth";
import { logCodeAiAudit } from "@/lib/code-ai/store";
import {
  commitRepositoryFiles,
  createRepositoryBranch,
  createRepositoryPullRequest,
  getCommitStatus,
  listRepositoryActivity,
  listRepositoryBranches,
  listRepositoryFiles,
  readRepositoryFile,
  revertLatestCommit,
  writeRepositoryFile,
} from "@/lib/code-ai/github";

export async function GET(request: Request) {
  if (!(await getCodeAiOwner())) return Response.json({ error: "Forbidden" }, { status: 403 });
  const url = new URL(request.url);
  const repository = url.searchParams.get("repository")?.trim();
  const action = url.searchParams.get("action");
  const branch = url.searchParams.get("branch")?.trim() || "main";
  if (!repository) return Response.json({ error: "Repository is required." }, { status: 400 });
  try {
    if (action === "branches") return Response.json(await listRepositoryBranches(repository));
    if (action === "file") {
      const path = url.searchParams.get("path");
      if (!path) return Response.json({ error: "File path is required." }, { status: 400 });
      return Response.json(await readRepositoryFile(repository, path, branch));
    }
    if (action === "activity") return Response.json(await listRepositoryActivity(repository, branch));
    if (action === "status") {
      const sha = url.searchParams.get("sha");
      if (!sha) return Response.json({ error: "Commit SHA is required." }, { status: 400 });
      return Response.json(await getCommitStatus(repository, sha));
    }
    return Response.json(await listRepositoryFiles(repository, branch));
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "GitHub request failed." }, { status: 502 });
  }
}

export async function POST(request: Request) {
  if (!(await getCodeAiOwner())) return Response.json({ error: "Forbidden" }, { status: 403 });
  const body = (await request.json().catch(() => null)) as { action?: "file" | "commit" | "branch" | "pullRequest" | "revert"; repository?: string; path?: string; content?: string; branch?: string; from?: string; message?: string; title?: string; description?: string; base?: string; head?: string; expectedSha?: string; changes?: Array<{ path: string; content: string }>; approved?: boolean } | null;
  if (!body?.repository || body.approved !== true) return Response.json({ error: "Explicit approval is required." }, { status: 400 });
  try {
    if (body.action === "commit" && body.branch && body.message && body.changes) { const result = await commitRepositoryFiles({ repository: body.repository, branch: body.branch, message: body.message, changes: body.changes }); await logCodeAiAudit("commit", `${body.message} · ${body.changes.length} files · ${body.branch}`); return Response.json(result); }
    if (body.action === "branch" && body.branch) { const result = await createRepositoryBranch(body.repository, body.branch, body.from || "main"); await logCodeAiAudit("branch", `Created ${body.branch} from ${body.from || "main"}`); return Response.json(result); }
    if (body.action === "pullRequest" && body.title && body.head && body.base) { const result = await createRepositoryPullRequest({ repository: body.repository, title: body.title, body: body.description, head: body.head, base: body.base }); await logCodeAiAudit("pullRequest", `${body.title} · ${body.head} → ${body.base}`); return Response.json(result); }
    if (body.action === "revert" && body.branch && body.expectedSha) { const result = await revertLatestCommit(body.repository, body.branch, body.expectedSha); await logCodeAiAudit("revert", `Reverted ${body.expectedSha.slice(0, 7)} on ${body.branch}`); return Response.json(result); }
    if (!body.path || typeof body.content !== "string" || !body.message) return Response.json({ error: "A valid repository operation is required." }, { status: 400 });
    const result = await writeRepositoryFile({ repository: body.repository, path: body.path, content: body.content, branch: body.branch || "main", message: body.message }); await logCodeAiAudit("fileCommit", `${body.message} · ${body.path}`); return Response.json(result);
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to commit file." }, { status: 502 });
  }
}
