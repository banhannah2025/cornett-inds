import "server-only";

const API_ROOT = "https://api.github.com";
const DEFAULT_REPOSITORY = "banhannah2025/cornett-inds";

function allowedRepository(repository: string) {
  const allowed = (process.env.CODE_AI_GITHUB_REPOSITORIES ?? DEFAULT_REPOSITORY)
    .split(",")
    .map((item) => item.trim().toLowerCase());
  return allowed.includes(repository.toLowerCase());
}

export async function githubRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const token = process.env.GITHUB_ACCESS_TOKEN;
  if (!token) throw new Error("GitHub access is not configured for Code AI.");
  const response = await fetch(`${API_ROOT}${path}`, {
    ...init,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  const data = (await response.json().catch(() => ({}))) as T & { message?: string };
  if (!response.ok) throw new Error(data.message ?? `GitHub request failed (${response.status}).`);
  return data;
}

export function assertRepository(repository: string) {
  if (!allowedRepository(repository)) throw new Error("That repository is not allowed.");
}

export async function listRepositoryBranches(repository: string) {
  assertRepository(repository);
  return githubRequest<Array<{ name: string; commit: { sha: string } }>>(
    `/repos/${repository}/branches?per_page=100`,
  );
}

export async function listRepositoryActivity(repository: string) {
  assertRepository(repository);
  const [commits, pulls] = await Promise.all([
    githubRequest<Array<{ sha: string; html_url: string; commit: { message: string; author: { name: string; date: string } } }>>(
      `/repos/${repository}/commits?per_page=20`,
    ),
    githubRequest<Array<{ number: number; title: string; state: string; html_url: string; created_at: string; head: { ref: string }; base: { ref: string } }>>(
      `/repos/${repository}/pulls?state=all&per_page=15`,
    ),
  ]);
  return {
    commits: commits.map((item) => ({ sha: item.sha, url: item.html_url, message: item.commit.message, author: item.commit.author.name, createdAt: item.commit.author.date })),
    pullRequests: pulls.map((item) => ({ number: item.number, title: item.title, state: item.state, url: item.html_url, createdAt: item.created_at, head: item.head.ref, base: item.base.ref })),
  };
}

export async function getCommitStatus(repository: string, sha: string) {
  assertRepository(repository);
  return githubRequest<{ state: string; statuses: Array<{ context: string; state: string; target_url?: string; description?: string }> }>(
    `/repos/${repository}/commits/${encodeURIComponent(sha)}/status`,
  );
}

export async function dispatchValidation(repository: string, ref: string, scope: "web" | "all") {
  assertRepository(repository);
  await githubRequest(
    `/repos/${repository}/actions/workflows/code-ai-runner.yml/dispatches`,
    { method: "POST", body: JSON.stringify({ ref, inputs: { scope } }) },
  );
  return { queued: true, ref, scope };
}

export async function listValidationRuns(repository: string, branch?: string) {
  assertRepository(repository);
  const query = branch ? `?branch=${encodeURIComponent(branch)}&per_page=10` : "?per_page=10";
  const data = await githubRequest<{ workflow_runs: Array<{ id: number; name: string; status: string; conclusion: string | null; html_url: string; created_at: string; head_branch: string; head_sha: string }> }>(
    `/repos/${repository}/actions/workflows/code-ai-runner.yml/runs${query}`,
  );
  return data.workflow_runs.map((run) => ({ id: run.id, name: run.name, status: run.status, conclusion: run.conclusion, url: run.html_url, createdAt: run.created_at, branch: run.head_branch, sha: run.head_sha }));
}

export async function listRepositoryFiles(repository: string, branch = "main") {
  assertRepository(repository);
  const tree = await githubRequest<{ tree: Array<{ path: string; type: string; size?: number }> }>(
    `/repos/${repository}/git/trees/${encodeURIComponent(branch)}?recursive=1`,
  );
  return tree.tree
    .filter((item) => item.type === "blob")
    .slice(0, 2500)
    .map(({ path, size }) => ({ path, size }));
}

export async function readRepositoryFile(repository: string, path: string, branch = "main") {
  assertRepository(repository);
  const file = await githubRequest<{ content: string; encoding: string; sha: string }>(
    `/repos/${repository}/contents/${path.split("/").map(encodeURIComponent).join("/")}?ref=${encodeURIComponent(branch)}`,
  );
  if (file.encoding !== "base64") throw new Error("Unsupported GitHub file encoding.");
  return { content: Buffer.from(file.content, "base64").toString("utf8"), sha: file.sha };
}

export async function writeRepositoryFile(args: {
  repository: string;
  path: string;
  content: string;
  branch?: string;
  message: string;
}) {
  assertRepository(args.repository);
  const branch = args.branch ?? "main";
  const existing = await readRepositoryFile(args.repository, args.path, branch).catch(() => null);
  return githubRequest<{ commit: { sha: string }; content: { sha: string } }>(
    `/repos/${args.repository}/contents/${args.path.split("/").map(encodeURIComponent).join("/")}`,
    {
      method: "PUT",
      body: JSON.stringify({
        message: args.message,
        content: Buffer.from(args.content, "utf8").toString("base64"),
        branch,
        ...(existing?.sha ? { sha: existing.sha } : {}),
      }),
    },
  );
}
