import "server-only";

const API_ROOT = "https://api.github.com";
const DEFAULT_REPOSITORY = "banhannah2025/cornett-inds";

function allowedRepository(repository: string) {
  const allowed = (process.env.CODE_AI_GITHUB_REPOSITORIES ?? DEFAULT_REPOSITORY)
    .split(",")
    .map((item) => item.trim().toLowerCase());
  return allowed.includes(repository.toLowerCase());
}

async function githubRequest<T>(path: string, init?: RequestInit): Promise<T> {
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

function assertRepository(repository: string) {
  if (!allowedRepository(repository)) throw new Error("That repository is not allowed.");
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
