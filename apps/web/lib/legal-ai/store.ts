import "server-only";

import { randomUUID } from "node:crypto";
import { getSanityWriteClient } from "@/sanity/lib/writeClient";

export type LegalAiMessage = {
  _key: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  model?: string;
  inputTokens?: number;
  outputTokens?: number;
};

export type LegalAiProject = {
  _id: string;
  name: string;
  repository: string;
  createdAt: string;
  updatedAt: string;
  archived?: boolean;
  monthlyBudgetUsd?: number;
  defaultModel?: string;
};

export type LegalAiConversation = {
  _id: string;
  projectId: string;
  title: string;
  messages: LegalAiMessage[];
  createdAt: string;
  updatedAt: string;
  archived?: boolean;
};
export type LegalAiAttachment = { _id: string; projectId: string; name: string; mimeType: string; size: number; url: string; createdAt: string };
export type LegalAiAudit = { _id: string; action: string; summary: string; createdAt: string };
export type LegalAiChangeSet = { _id: string; projectId: string; conversationId: string; repository: string; branch: string; changes: Array<{ _key: string; path: string; previousContent: string; content: string; message: string }>; createdAt: string };

const cleanId = (value: string) => value.replace(/[^a-zA-Z0-9_-]/g, "-");

export async function listLegalAiWorkspace() {
  const client = getSanityWriteClient();
  const [projects, conversations, files, audit, changeSets] = await Promise.all([
    client.fetch<LegalAiProject[]>(
      `*[_type == "legalAiProject"] | order(updatedAt desc){_id,name,repository,createdAt,updatedAt,archived,monthlyBudgetUsd,defaultModel}`,
    ),
    client.fetch<LegalAiConversation[]>(
      `*[_type == "legalAiConversation"] | order(updatedAt desc){_id,projectId,title,messages,createdAt,updatedAt,archived}`,
    ),
    client.fetch<LegalAiAttachment[]>(
      `*[_type == "legalAiFile"] | order(createdAt desc){_id,projectId,name,mimeType,size,"url":asset->url,createdAt}`,
    ),
    client.fetch<LegalAiAudit[]>(`*[_type == "legalAiAudit"] | order(createdAt desc)[0...100]{_id,action,summary,createdAt}`),
    client.fetch<LegalAiChangeSet[]>(`*[_type == "legalAiChangeSet"] | order(createdAt desc){_id,projectId,conversationId,repository,branch,changes,createdAt}`),
  ]);
  return { projects, conversations, files, audit, changeSets };
}

export async function logLegalAiAudit(action: string, summary: string) {
  return getSanityWriteClient().create({ _id: `legalAiAudit-${randomUUID()}`, _type: "legalAiAudit", action, summary: summary.slice(0, 500), createdAt: new Date().toISOString() });
}

export async function getLegalAiFiles(ids: string[], projectId: string) {
  return getSanityWriteClient().fetch<LegalAiAttachment[]>(
    `*[_type == "legalAiFile" && _id in $ids && projectId == $projectId]{_id,projectId,name,mimeType,size,"url":asset->url,createdAt}`,
    { ids, projectId },
  );
}

export async function createLegalAiChangeSet(args: Omit<LegalAiChangeSet, "_id" | "createdAt" | "changes"> & { changes: Array<Omit<LegalAiChangeSet["changes"][number], "_key">> }) {
  const totalSize = args.changes.reduce((sum, item) => sum + item.previousContent.length + item.content.length, 0);
  if (!args.changes.length || args.changes.length > 40 || totalSize > 700_000) throw new Error("The proposed change set is too large to save for review.");
  return getSanityWriteClient().create({
    _id: `legalAiChangeSet-${randomUUID()}`, _type: "legalAiChangeSet", ...args,
    changes: args.changes.map((item) => ({ ...item, _key: randomUUID() })), createdAt: new Date().toISOString(),
  }) as Promise<LegalAiChangeSet>;
}

export async function consumeLegalAiChange(changeSetId: string, key: string) {
  if (!/^legalAiChangeSet-[a-zA-Z0-9-]+$/.test(changeSetId) || !/^[a-zA-Z0-9-]+$/.test(key)) throw new Error("Invalid change-set reference.");
  const client = getSanityWriteClient();
  await client.patch(changeSetId).unset([`changes[_key == "${key}"]`]).commit();
  const remaining = await client.fetch<number>(`count(*[_id == $id][0].changes)`, { id: changeSetId });
  if (remaining === 0) await client.delete(changeSetId);
}

export async function createLegalAiProject(name: string, repository: string) {
  const now = new Date().toISOString();
  return getSanityWriteClient().create({
    _id: `legalAiProject-${cleanId(randomUUID())}`,
    _type: "legalAiProject",
    name,
    repository,
    monthlyBudgetUsd: 5,
    defaultModel: "gpt-5.6-luna",
    createdAt: now,
    updatedAt: now,
  }) as Promise<LegalAiProject>;
}

export async function createLegalAiConversation(projectId: string, title: string) {
  const now = new Date().toISOString();
  return getSanityWriteClient().create({
    _id: `legalAiConversation-${cleanId(randomUUID())}`,
    _type: "legalAiConversation",
    projectId,
    title,
    messages: [],
    createdAt: now,
    updatedAt: now,
  }) as Promise<LegalAiConversation>;
}

export async function getLegalAiConversation(id: string) {
  return getSanityWriteClient().fetch<LegalAiConversation | null>(
    `*[_type == "legalAiConversation" && _id == $id][0]{_id,projectId,title,messages,createdAt,updatedAt}`,
    { id },
  );
}

const MODEL_PRICES: Record<string, { input: number; output: number }> = {
  "gpt-5.6-luna": { input: 0.2, output: 1.2 },
  "gpt-5.6-terra": { input: 2, output: 12 },
  "gpt-5.6-sol": { input: 4, output: 20 },
};

export function estimateLegalAiCost(messages: LegalAiMessage[]) {
  return messages.reduce((total, message) => {
    if (message.role !== "assistant" || !message.model) return total;
    const price = MODEL_PRICES[message.model];
    return price ? total + ((message.inputTokens ?? 0) * price.input + (message.outputTokens ?? 0) * price.output) / 1_000_000 : total;
  }, 0);
}

export async function getLegalAiProjectUsage(projectId: string) {
  const client = getSanityWriteClient();
  const [project, conversations] = await Promise.all([
    client.fetch<LegalAiProject | null>(`*[_type == "legalAiProject" && _id == $projectId][0]{_id,name,repository,monthlyBudgetUsd,defaultModel}`, { projectId }),
    client.fetch<Array<{ messages: LegalAiMessage[] }>>(`*[_type == "legalAiConversation" && projectId == $projectId]{messages}`, { projectId }),
  ]);
  const start = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1)).toISOString();
  const messages = conversations.flatMap((item) => item.messages ?? []).filter((message) => message.createdAt >= start);
  return { project, estimatedCostUsd: estimateLegalAiCost(messages), inputTokens: messages.reduce((sum, item) => sum + (item.inputTokens ?? 0), 0), outputTokens: messages.reduce((sum, item) => sum + (item.outputTokens ?? 0), 0) };
}

export async function appendLegalAiMessages(id: string, messages: LegalAiMessage[]) {
  const client = getSanityWriteClient();
  await client
    .patch(id)
    .setIfMissing({ messages: [] })
    .append("messages", messages)
    .set({ updatedAt: new Date().toISOString() })
    .commit();
}

export async function updateLegalAiDocument(
  id: string,
  changes: { name?: string; title?: string; archived?: boolean; projectId?: string; monthlyBudgetUsd?: number; defaultModel?: string },
) {
  const allowed = Object.fromEntries(
    Object.entries(changes).filter(([, value]) => value !== undefined),
  );
  return getSanityWriteClient()
    .patch(id)
    .set({ ...allowed, updatedAt: new Date().toISOString() })
    .commit();
}

export async function deleteLegalAiDocument(id: string) {
  return getSanityWriteClient().delete(id);
}

export function makeLegalAiMessage(
  role: LegalAiMessage["role"],
  content: string,
): LegalAiMessage {
  return { _key: randomUUID(), role, content, createdAt: new Date().toISOString() };
}
