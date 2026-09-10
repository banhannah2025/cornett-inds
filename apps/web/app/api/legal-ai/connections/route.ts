import { getLegalAiUser } from "@/lib/legal-ai/auth";

export async function GET() {
  if (!(await getLegalAiUser())) return Response.json({ error: "Forbidden" }, { status: 403 });
  return Response.json([
    { id: "openai", name: "OpenAI", description: "Conversations, reasoning, and coding tools", connected: Boolean(process.env.OPENAI_API_SECRET_KEY) },
    { id: "github", name: "GitHub", description: "Repositories, branches, files, commits, and pull requests", connected: Boolean(process.env.GITHUB_ACCESS_TOKEN) },
    { id: "sanity", name: "Sanity", description: "Projects, chats, messages, and uploaded files", connected: Boolean(process.env.SANITY_API_WRITE_TOKEN || process.env.SANITY_READ_WRITE_DEVELOPER_API) },
    { id: "actions", name: "GitHub Actions", description: "Isolated type checks and production builds", connected: Boolean(process.env.GITHUB_ACCESS_TOKEN), note: "Requires Actions: read and write on the fine-grained GitHub token." },
    { id: "vercel", name: "Vercel", description: "Deployment state reported through GitHub commit statuses", connected: Boolean(process.env.GITHUB_ACCESS_TOKEN) },
  ]);
}
