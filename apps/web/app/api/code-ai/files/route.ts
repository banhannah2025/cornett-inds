import { randomUUID } from "node:crypto";
import { getCodeAiOwner } from "@/lib/code-ai/auth";
import { getSanityWriteClient } from "@/sanity/lib/writeClient";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

export async function POST(request: Request) {
  if (!(await getCodeAiOwner())) return Response.json({ error: "Forbidden" }, { status: 403 });
  try {
    const form = await request.formData();
    const file = form.get("file");
    const projectId = form.get("projectId");
    if (!(file instanceof File) || typeof projectId !== "string") return Response.json({ error: "A file and project are required." }, { status: 400 });
    if (file.size > MAX_FILE_SIZE) return Response.json({ error: "Files are limited to 10 MB." }, { status: 413 });
    const client = getSanityWriteClient();
    const asset = await client.assets.upload("file", Buffer.from(await file.arrayBuffer()), { filename: file.name, contentType: file.type || "application/octet-stream" });
    const createdAt = new Date().toISOString();
    const document = await client.create({
      _id: `codeAiFile-${randomUUID()}`,
      _type: "codeAiFile",
      projectId,
      name: file.name,
      mimeType: file.type || "application/octet-stream",
      size: file.size,
      asset: { _type: "reference", _ref: asset._id },
      createdAt,
    });
    return Response.json({ _id: document._id, projectId, name: file.name, mimeType: file.type || "application/octet-stream", size: file.size, url: asset.url, createdAt });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to upload file." }, { status: 500 });
  }
}
