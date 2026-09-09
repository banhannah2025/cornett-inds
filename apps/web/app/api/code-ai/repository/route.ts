import { getCodeAiOwner } from "@/lib/code-ai/auth";
import {
  getCommitStatus,
  listRepositoryActivity,
  listRepositoryBranches,
  listRepositoryFiles,
  readRepositoryFile,
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
    if (action === "activity") return Response.json(await listRepositoryActivity(repository));
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
  const body = (await request.json().catch(() => null)) as { repository?: string; path?: string; content?: string; branch?: string; message?: string; approved?: boolean } | null;
  if (!body?.repository || !body.path || typeof body.content !== "string" || !body.message || body.approved !== true) {
    return Response.json({ error: "An explicitly approved file change is required." }, { status: 400 });
  }
  try {
    return Response.json(await writeRepositoryFile({ repository: body.repository, path: body.path, content: body.content, branch: body.branch || "main", message: body.message }));
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to commit file." }, { status: 502 });
  }
}
