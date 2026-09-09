import "server-only";

import { randomUUID } from "node:crypto";
import { getSanityWriteClient } from "@/sanity/lib/writeClient";

export type CodeAiMessage = {
  _key: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
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
};

const cleanId = (value: string) => value.replace(/[^a-zA-Z0-9_-]/g, "-");

export async function listCodeAiWorkspace() {
  const client = getSanityWriteClient();
  const [projects, conversations] = await Promise.all([
    client.fetch<CodeAiProject[]>(
      `*[_type == "codeAiProject"] | order(updatedAt desc){_id,name,repository,createdAt,updatedAt}`,
    ),
    client.fetch<CodeAiConversation[]>(
      `*[_type == "codeAiConversation"] | order(updatedAt desc){_id,projectId,title,messages,createdAt,updatedAt}`,
    ),
  ]);
  return { projects, conversations };
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

export function makeCodeAiMessage(
  role: CodeAiMessage["role"],
  content: string,
): CodeAiMessage {
  return { _key: randomUUID(), role, content, createdAt: new Date().toISOString() };
}
