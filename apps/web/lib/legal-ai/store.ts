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
  userId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  archived?: boolean;
  monthlyBudgetUsd?: number;
  defaultModel?: string;
};

export type LegalAiConversation = {
  _id: string;
  userId: string;
  projectId: string;
  title: string;
  messages: LegalAiMessage[];
  createdAt: string;
  updatedAt: string;
  archived?: boolean;
};

export type LegalAiAttachment = {
  _id: string;
  userId: string;
  projectId: string;
  name: string;
  mimeType: string;
  size: number;
  url: string;
  createdAt: string;
};

const cleanId = (value: string) => value.replace(/[^a-zA-Z0-9_-]/g, "-");

export async function listLegalAiWorkspace(userId: string) {
  const client = getSanityWriteClient();
  const [projects, conversations, files] = await Promise.all([
    client.fetch<LegalAiProject[]>(
      `*[_type == "legalAiProject" && userId == $userId] | order(updatedAt desc){_id,userId,name,createdAt,updatedAt,archived,monthlyBudgetUsd,defaultModel}`,
      { userId },
    ),
    client.fetch<LegalAiConversation[]>(
      `*[_type == "legalAiConversation" && userId == $userId] | order(updatedAt desc){_id,userId,projectId,title,messages,createdAt,updatedAt,archived}`,
      { userId },
    ),
    client.fetch<LegalAiAttachment[]>(
      `*[_type == "legalAiFile" && userId == $userId] | order(createdAt desc){_id,userId,projectId,name,mimeType,size,"url":asset->url,createdAt}`,
      { userId },
    ),
  ]);
  return { projects, conversations, files };
}

export async function getLegalAiFiles(ids: string[], projectId: string, userId: string) {
  return getSanityWriteClient().fetch<LegalAiAttachment[]>(
    `*[_type == "legalAiFile" && userId == $userId && _id in $ids && projectId == $projectId]{_id,userId,projectId,name,mimeType,size,"url":asset->url,createdAt}`,
    { ids, projectId, userId },
  );
}

export async function createLegalAiProject(userId: string, name: string) {
  const now = new Date().toISOString();
  return getSanityWriteClient().create({
    _id: `legalAiProject-${cleanId(randomUUID())}`,
    _type: "legalAiProject",
    userId,
    name,
    monthlyBudgetUsd: 5,
    defaultModel: "gpt-5.6-luna",
    createdAt: now,
    updatedAt: now,
  }) as Promise<LegalAiProject>;
}

export async function createLegalAiConversation(userId: string, projectId: string, title: string) {
  const client = getSanityWriteClient();
  const ownedProject = await client.fetch<string | null>(
    `*[_type == "legalAiProject" && _id == $projectId && userId == $userId][0]._id`,
    { projectId, userId },
  );
  if (!ownedProject) throw new Error("Matter not found.");
  const now = new Date().toISOString();
  return client.create({
    _id: `legalAiConversation-${cleanId(randomUUID())}`,
    _type: "legalAiConversation",
    userId,
    projectId,
    title,
    messages: [],
    createdAt: now,
    updatedAt: now,
  }) as Promise<LegalAiConversation>;
}

export async function getLegalAiConversation(id: string, userId: string) {
  return getSanityWriteClient().fetch<LegalAiConversation | null>(
    `*[_type == "legalAiConversation" && _id == $id && userId == $userId][0]{_id,userId,projectId,title,messages,createdAt,updatedAt}`,
    { id, userId },
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
    return price
      ? total + ((message.inputTokens ?? 0) * price.input + (message.outputTokens ?? 0) * price.output) / 1_000_000
      : total;
  }, 0);
}

export async function getLegalAiProjectUsage(projectId: string, userId: string) {
  const client = getSanityWriteClient();
  const [project, conversations] = await Promise.all([
    client.fetch<LegalAiProject | null>(
      `*[_type == "legalAiProject" && _id == $projectId && userId == $userId][0]{_id,userId,name,monthlyBudgetUsd,defaultModel}`,
      { projectId, userId },
    ),
    client.fetch<Array<{ messages: LegalAiMessage[] }>>(
      `*[_type == "legalAiConversation" && projectId == $projectId && userId == $userId]{messages}`,
      { projectId, userId },
    ),
  ]);
  const start = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1)).toISOString();
  const messages = conversations
    .flatMap((item) => item.messages ?? [])
    .filter((message) => message.createdAt >= start);
  return {
    project,
    estimatedCostUsd: estimateLegalAiCost(messages),
    inputTokens: messages.reduce((sum, item) => sum + (item.inputTokens ?? 0), 0),
    outputTokens: messages.reduce((sum, item) => sum + (item.outputTokens ?? 0), 0),
  };
}

export async function appendLegalAiMessages(id: string, userId: string, messages: LegalAiMessage[]) {
  const client = getSanityWriteClient();
  const owned = await client.fetch<string | null>(
    `*[_type == "legalAiConversation" && _id == $id && userId == $userId][0]._id`,
    { id, userId },
  );
  if (!owned) throw new Error("Conversation not found.");
  await client
    .patch(id)
    .setIfMissing({ messages: [] })
    .append("messages", messages)
    .set({ updatedAt: new Date().toISOString() })
    .commit();
}

export async function updateLegalAiDocument(
  id: string,
  userId: string,
  changes: {
    name?: string;
    title?: string;
    archived?: boolean;
    projectId?: string;
    monthlyBudgetUsd?: number;
    defaultModel?: string;
  },
) {
  const client = getSanityWriteClient();
  const owned = await client.fetch<{ _id: string; _type: string } | null>(
    `*[_id == $id && userId == $userId && _type in ["legalAiProject","legalAiConversation"]][0]{_id,_type}`,
    { id, userId },
  );
  if (!owned) throw new Error("Item not found.");
  if (changes.projectId && owned._type === "legalAiConversation") {
    const target = await client.fetch<string | null>(
      `*[_type == "legalAiProject" && _id == $projectId && userId == $userId][0]._id`,
      { projectId: changes.projectId, userId },
    );
    if (!target) throw new Error("Destination matter not found.");
  }
  const allowed = Object.fromEntries(
    Object.entries(changes).filter(([, value]) => value !== undefined),
  );
  return client.patch(id).set({ ...allowed, updatedAt: new Date().toISOString() }).commit();
}

export function makeLegalAiMessage(
  role: LegalAiMessage["role"],
  content: string,
): LegalAiMessage {
  return { _key: randomUUID(), role, content, createdAt: new Date().toISOString() };
}
