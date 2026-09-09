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

export async function listRepositoryActivity(repository: string, branch = "main") {
  assertRepository(repository);
  const [commits, pulls] = await Promise.all([
    githubRequest<Array<{ sha: string; html_url: string; commit: { message: string; author: { name: string; date: string } } }>>(
      `/repos/${repository}/commits?sha=${encodeURIComponent(branch)}&per_page=20`,
    ),
    githubRequest<Array<{ number: number; title: string; state: string; html_url: string; created_at: string; head: { ref: string }; base: { ref: string } }>>(
      `/repos/${repository}/pulls?state=all&per_page=15`,
    ),
  ]);
  const deployment = commits[0] ? await getCommitStatus(repository, commits[0].sha).catch(() => null) : null;
  return {
    commits: commits.map((item) => ({ sha: item.sha, url: item.html_url, message: item.commit.message, author: item.commit.author.name, createdAt: item.commit.author.date })),
    pullRequests: pulls.map((item) => ({ number: item.number, title: item.title, state: item.state, url: item.html_url, createdAt: item.created_at, head: item.head.ref, base: item.base.ref })),
    deployment,
  };
}

export async function getCommitStatus(repository: string, sha: string) {
  assertRepository(repository);
  return githubRequest<{ state: string; statuses: Array<{ context: string; state: string; target_url?: string; description?: string }> }>(
    `/repos/${repository}/commits/${encodeURIComponent(sha)}/status`,
  );
}

export async function dispatchValidation(repository: string, ref: string, scope: "web" | "visual" | "all") {
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

export async function getValidationRunDetails(repository: string, runId: number) {
  assertRepository(repository);
  const [jobs, artifacts] = await Promise.all([
    githubRequest<{ jobs: Array<{ id: number; name: string; status: string; conclusion: string | null; html_url: string; steps?: Array<{ name: string; status: string; conclusion: string | null; number: number }> }> }>(`/repos/${repository}/actions/runs/${runId}/jobs?per_page=100`),
    githubRequest<{ artifacts: Array<{ id: number; name: string; size_in_bytes: number; expired: boolean; archive_download_url: string }> }>(`/repos/${repository}/actions/runs/${runId}/artifacts?per_page=100`),
  ]);
  return {
    jobs: jobs.jobs.map((job) => ({ id: job.id, name: job.name, status: job.status, conclusion: job.conclusion, url: job.html_url, steps: job.steps ?? [] })),
    artifacts: artifacts.artifacts.map((artifact) => ({ id: artifact.id, name: artifact.name, size: artifact.size_in_bytes, expired: artifact.expired, url: artifact.archive_download_url })),
  };
}

export async function getGitHubRateLimit(repository: string) {
  assertRepository(repository);
  const data = await githubRequest<{ resources: { core: { limit: number; remaining: number; reset: number } } }>("/rate_limit");
  return data.resources.core;
}

export async function controlValidationRun(repository: string, runId: number, action: "cancel" | "rerun") {
  assertRepository(repository);
  await githubRequest(`/repos/${repository}/actions/runs/${runId}/${action === "cancel" ? "cancel" : "rerun"}`, { method: "POST" });
  return { accepted: true, runId, action };
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

export type AtomicFileChange = { path: string; content: string };

export async function commitRepositoryFiles(args: {
  repository: string;
  branch: string;
  message: string;
  changes: AtomicFileChange[];
}) {
  assertRepository(args.repository);
  if (!args.changes.length || args.changes.length > 40) throw new Error("An atomic commit must contain 1–40 files.");
  const ref = await githubRequest<{ object: { sha: string } }>(`/repos/${args.repository}/git/ref/heads/${args.branch.split("/").map(encodeURIComponent).join("/")}`);
  const baseCommit = await githubRequest<{ tree: { sha: string } }>(`/repos/${args.repository}/git/commits/${ref.object.sha}`);
  const tree = await githubRequest<{ sha: string }>(`/repos/${args.repository}/git/trees`, {
    method: "POST",
    body: JSON.stringify({
      base_tree: baseCommit.tree.sha,
      tree: args.changes.map((change) => ({ path: change.path, mode: "100644", type: "blob", content: change.content })),
    }),
  });
  const commit = await githubRequest<{ sha: string; html_url: string }>(`/repos/${args.repository}/git/commits`, {
    method: "POST",
    body: JSON.stringify({ message: args.message, tree: tree.sha, parents: [ref.object.sha] }),
  });
  await githubRequest(`/repos/${args.repository}/git/refs/heads/${args.branch.split("/").map(encodeURIComponent).join("/")}`, {
    method: "PATCH",
    body: JSON.stringify({ sha: commit.sha, force: false }),
  });
  return { sha: commit.sha, url: commit.html_url, filesChanged: args.changes.length };
}

export async function createRepositoryBranch(repository: string, name: string, from = "main") {
  assertRepository(repository);
  if (!/^[a-zA-Z0-9._/-]{1,100}$/.test(name) || name.startsWith("/") || name.endsWith("/")) throw new Error("Enter a valid branch name.");
  const base = await githubRequest<{ commit: { sha: string } }>(`/repos/${repository}/branches/${from.split("/").map(encodeURIComponent).join("/")}`);
  await githubRequest(`/repos/${repository}/git/refs`, { method: "POST", body: JSON.stringify({ ref: `refs/heads/${name}`, sha: base.commit.sha }) });
  return { name, sha: base.commit.sha };
}

export async function createRepositoryPullRequest(args: { repository: string; title: string; body?: string; head: string; base: string }) {
  assertRepository(args.repository);
  return githubRequest<{ number: number; html_url: string; state: string }>(`/repos/${args.repository}/pulls`, {
    method: "POST",
    body: JSON.stringify({ title: args.title, body: args.body ?? "", head: args.head, base: args.base }),
  });
}

export async function revertLatestCommit(repository: string, branch: string, expectedSha: string) {
  assertRepository(repository);
  const current = await githubRequest<{ commit: { sha: string } }>(`/repos/${repository}/branches/${branch.split("/").map(encodeURIComponent).join("/")}`);
  if (current.commit.sha !== expectedSha) throw new Error("The branch has moved. Refresh before attempting an undo.");
  const commit = await githubRequest<{ message: string; tree: { sha: string }; parents: Array<{ sha: string }> }>(`/repos/${repository}/git/commits/${expectedSha}`);
  const parent = commit.parents[0];
  if (!parent) throw new Error("The initial repository commit cannot be undone.");
  const parentCommit = await githubRequest<{ tree: { sha: string } }>(`/repos/${repository}/git/commits/${parent.sha}`);
  const revert = await githubRequest<{ sha: string }>(`/repos/${repository}/git/commits`, {
    method: "POST",
    body: JSON.stringify({ message: `Revert: ${commit.message.split("\n")[0]}`, tree: parentCommit.tree.sha, parents: [expectedSha] }),
  });
  await githubRequest(`/repos/${repository}/git/refs/heads/${branch.split("/").map(encodeURIComponent).join("/")}`, { method: "PATCH", body: JSON.stringify({ sha: revert.sha, force: false }) });
  return { sha: revert.sha, reverted: expectedSha };
}
