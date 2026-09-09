import "server-only";

import { randomUUID } from "node:crypto";
import { getSanityWriteClient } from "@/sanity/lib/writeClient";

export type CodeAiMessage = {
  _key: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  model?: string;
  inputTokens?: number;
  outputTokens?: number;
};

export type CodeAiProject = {
  _id: string;
  name: string;
  repository: string;
  createdAt: string;
  updatedAt: string;
};

export type CodeAiConversation = {
  _id: string;
  projectId: string;
  title: string;
  messages: CodeAiMessage[];
  createdAt: string;
  updatedAt: string;
  archived?: boolean;
};
export type CodeAiAttachment = { _id: string; projectId: string; name: string; mimeType: string; size: number; url: string; createdAt: string };
export type CodeAiAudit = { _id: string; action: string; summary: string; createdAt: string };
export type CodeAiChangeSet = { _id: string; projectId: string; conversationId: string; repository: string; branch: string; changes: Array<{ _key: string; path: string; previousContent: string; content: string; message: string }>; createdAt: string };

const cleanId = (value: string) => value.replace(/[^a-zA-Z0-9_-]/g, "-");

export async function listCodeAiWorkspace() {
  const client = getSanityWriteClient();
  const [projects, conversations, files, audit, changeSets] = await Promise.all([
    client.fetch<CodeAiProject[]>(
      `*[_type == "codeAiProject"] | order(updatedAt desc){_id,name,repository,createdAt,updatedAt}`,
    ),
    client.fetch<CodeAiConversation[]>(
      `*[_type == "codeAiConversation"] | order(updatedAt desc){_id,projectId,title,messages,createdAt,updatedAt,archived}`,
    ),
    client.fetch<CodeAiAttachment[]>(
      `*[_type == "codeAiFile"] | order(createdAt desc){_id,projectId,name,mimeType,size,"url":asset->url,createdAt}`,
    ),
    client.fetch<CodeAiAudit[]>(`*[_type == "codeAiAudit"] | order(createdAt desc)[0...100]{_id,action,summary,createdAt}`),
    client.fetch<CodeAiChangeSet[]>(`*[_type == "codeAiChangeSet"] | order(createdAt desc){_id,projectId,conversationId,repository,branch,changes,createdAt}`),
  ]);
  return { projects, conversations, files, audit, changeSets };
}

export async function logCodeAiAudit(action: string, summary: string) {
  return getSanityWriteClient().create({ _id: `codeAiAudit-${randomUUID()}`, _type: "codeAiAudit", action, summary: summary.slice(0, 500), createdAt: new Date().toISOString() });
}

export async function getCodeAiFiles(ids: string[], projectId: string) {
  return getSanityWriteClient().fetch<CodeAiAttachment[]>(
    `*[_type == "codeAiFile" && _id in $ids && projectId == $projectId]{_id,projectId,name,mimeType,size,"url":asset->url,createdAt}`,
    { ids, projectId },
  );
}

export async function createCodeAiChangeSet(args: Omit<CodeAiChangeSet, "_id" | "createdAt" | "changes"> & { changes: Array<Omit<CodeAiChangeSet["changes"][number], "_key">> }) {
  const totalSize = args.changes.reduce((sum, item) => sum + item.previousContent.length + item.content.length, 0);
  if (!args.changes.length || args.changes.length > 40 || totalSize > 700_000) throw new Error("The proposed change set is too large to save for review.");
  return getSanityWriteClient().create({
    _id: `codeAiChangeSet-${randomUUID()}`, _type: "codeAiChangeSet", ...args,
    changes: args.changes.map((item) => ({ ...item, _key: randomUUID() })), createdAt: new Date().toISOString(),
  }) as Promise<CodeAiChangeSet>;
}

export async function consumeCodeAiChange(changeSetId: string, key: string) {
  if (!/^codeAiChangeSet-[a-zA-Z0-9-]+$/.test(changeSetId) || !/^[a-zA-Z0-9-]+$/.test(key)) throw new Error("Invalid change-set reference.");
  const client = getSanityWriteClient();
  await client.patch(changeSetId).unset([`changes[_key == "${key}"]`]).commit();
  const remaining = await client.fetch<number>(`count(*[_id == $id][0].changes)`, { id: changeSetId });
  if (remaining === 0) await client.delete(changeSetId);
}

export async function createCodeAiProject(name: string, repository: string) {
  const now = new Date().toISOString();
  return getSanityWriteClient().create({
    _id: `codeAiProject-${cleanId(randomUUID())}`,
    _type: "codeAiProject",
    name,
    repository,
    createdAt: now,
    updatedAt: now,
  }) as Promise<CodeAiProject>;
}

export async function createCodeAiConversation(projectId: string, title: string) {
  const now = new Date().toISOString();
  return getSanityWriteClient().create({
    _id: `codeAiConversation-${cleanId(randomUUID())}`,
    _type: "codeAiConversation",
    projectId,
    title,
    messages: [],
    createdAt: now,
    updatedAt: now,
  }) as Promise<CodeAiConversation>;
}

export async function getCodeAiConversation(id: string) {
  return getSanityWriteClient().fetch<CodeAiConversation | null>(
    `*[_type == "codeAiConversation" && _id == $id][0]{_id,projectId,title,messages,createdAt,updatedAt}`,
    { id },
  );
}

export async function appendCodeAiMessages(id: string, messages: CodeAiMessage[]) {
  const client = getSanityWriteClient();
  await client
    .patch(id)
    .setIfMissing({ messages: [] })
    .append("messages", messages)
    .set({ updatedAt: new Date().toISOString() })
    .commit();
}

export async function updateCodeAiDocument(
  id: string,
  changes: { name?: string; title?: string; archived?: boolean },
) {
  const allowed = Object.fromEntries(
    Object.entries(changes).filter(([, value]) => value !== undefined),
  );
  return getSanityWriteClient()
    .patch(id)
    .set({ ...allowed, updatedAt: new Date().toISOString() })
    .commit();
}

export async function deleteCodeAiDocument(id: string) {
  return getSanityWriteClient().delete(id);
}

export function makeCodeAiMessage(
  role: CodeAiMessage["role"],
  content: string,
): CodeAiMessage {
  return { _key: randomUUID(), role, content, createdAt: new Date().toISOString() };
}
