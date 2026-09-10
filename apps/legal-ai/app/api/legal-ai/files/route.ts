import { randomUUID } from "node:crypto";
import { getLegalAiUser } from "@/lib/legal-ai/auth";
import { getSanityWriteClient } from "@/sanity/lib/writeClient";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

export async function POST(request: Request) {
  const user = await getLegalAiUser();
  if (!user) return Response.json({ error: "Forbidden" }, { status: 403 });
  try {
    const form = await request.formData();
    const file = form.get("file");
    const projectId = form.get("projectId");
    if (!(file instanceof File) || typeof projectId !== "string") {
      return Response.json({ error: "A file and matter are required." }, { status: 400 });
    }
    if (file.size > MAX_FILE_SIZE) {
      return Response.json({ error: "Files are limited to 10 MB." }, { status: 413 });
    }

    const client = getSanityWriteClient();
    const ownedMatter = await client.fetch<string | null>(
      `*[_type == "legalAiProject" && _id == $projectId && userId == $userId][0]._id`,
      { projectId, userId: user.userId },
    );
    if (!ownedMatter) return Response.json({ error: "Matter not found." }, { status: 404 });

    const asset = await client.assets.upload(
      "file",
      Buffer.from(await file.arrayBuffer()),
      { filename: file.name, contentType: file.type || "application/octet-stream" },
    );
    const createdAt = new Date().toISOString();
    const document = await client.create({
      _id: `legalAiFile-${randomUUID()}`,
      _type: "legalAiFile",
      userId: user.userId,
      projectId,
      name: file.name,
      mimeType: file.type || "application/octet-stream",
      size: file.size,
      asset: { _type: "reference", _ref: asset._id },
      createdAt,
    });

    return Response.json({
      _id: document._id,
      userId: user.userId,
      projectId,
      name: file.name,
      mimeType: file.type || "application/octet-stream",
      size: file.size,
      url: asset.url,
      createdAt,
    });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to upload file." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const user = await getLegalAiUser();
  if (!user) return Response.json({ error: "Forbidden" }, { status: 403 });
  const id = new URL(request.url).searchParams.get("id");
  if (!id?.startsWith("legalAiFile-")) {
    return Response.json({ error: "Invalid file ID." }, { status: 400 });
  }
  try {
    const client = getSanityWriteClient();
    const file = await client.fetch<{ name: string; assetId?: string } | null>(
      `*[_type == "legalAiFile" && _id == $id && userId == $userId][0]{name,"assetId":asset._ref}`,
      { id, userId: user.userId },
    );
    if (!file) return Response.json({ error: "File not found." }, { status: 404 });
    await client.delete(id);
    if (file.assetId) await client.delete(file.assetId).catch(() => undefined);
    return Response.json({ deleted: true });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to delete file." }, { status: 500 });
  }
}
