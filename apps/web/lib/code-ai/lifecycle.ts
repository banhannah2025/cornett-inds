import "server-only";

import { getSanityWriteClient } from "@/sanity/lib/writeClient";
import { logCodeAiAudit } from "@/lib/code-ai/store";

const PROJECT_ID = /^codeAiProject-[a-zA-Z0-9_-]+$/;
const CONVERSATION_ID = /^codeAiConversation-[a-zA-Z0-9_-]+$/;
const CHANGESET_ID = /^codeAiChangeSet-[a-zA-Z0-9_-]+$/;

export async function deleteCodeAiConversationCascade(conversationId: string) {
  if (!CONVERSATION_ID.test(conversationId)) throw new Error("Invalid conversation ID.");
  const client = getSanityWriteClient();
  const conversation = await client.fetch<{ _id: string; title: string } | null>(
    `*[_type == "codeAiConversation" && _id == $id][0]{_id,title}`,
    { id: conversationId },
  );
  if (!conversation) throw new Error("Conversation not found.");
  const changes = await client.fetch<string[]>(
    `*[_type == "codeAiChangeSet" && conversationId == $conversationId]._id`,
    { conversationId },
  );
  const tx = client.transaction();
  tx.delete(conversationId);
  for (const id of changes) tx.delete(id);
  await tx.commit();
  await logCodeAiAudit("conversationDelete", `Deleted conversation ${conversation.title} and ${changes.length} saved change set${changes.length === 1 ? "" : "s"}.`);
  return { deleted: true, changeSetsDeleted: changes.length };
}

export async function deleteCodeAiProjectCascade(projectId: string) {
  if (!PROJECT_ID.test(projectId)) throw new Error("Invalid project ID.");
  const client = getSanityWriteClient();
  const project = await client.fetch<{ _id: string; name: string } | null>(
    `*[_type == "codeAiProject" && _id == $id][0]{_id,name}`,
    { id: projectId },
  );
  if (!project) throw new Error("Project not found.");
  const [conversationIds, fileIds, changeSetIds] = await Promise.all([
    client.fetch<string[]>(`*[_type == "codeAiConversation" && projectId == $projectId]._id`, { projectId }),
    client.fetch<string[]>(`*[_type == "codeAiFile" && projectId == $projectId]._id`, { projectId }),
    client.fetch<string[]>(`*[_type == "codeAiChangeSet" && projectId == $projectId]._id`, { projectId }),
  ]);
  const assets = fileIds.length
    ? await client.fetch<string[]>(`*[_type == "codeAiFile" && _id in $ids].asset._ref`, { ids: fileIds })
    : [];
  const tx = client.transaction();
  tx.delete(projectId);
  for (const id of conversationIds) tx.delete(id);
  for (const id of fileIds) tx.delete(id);
  for (const id of changeSetIds) tx.delete(id);
  for (const asset of assets.filter(Boolean)) tx.delete(asset);
  await tx.commit();
  await logCodeAiAudit("projectDelete", `Deleted project ${project.name}, ${conversationIds.length} conversation${conversationIds.length === 1 ? "" : "s"}, ${fileIds.length} file${fileIds.length === 1 ? "" : "s"}, and ${changeSetIds.length} saved change set${changeSetIds.length === 1 ? "" : "s"}.`);
  return { deleted: true, conversationsDeleted: conversationIds.length, filesDeleted: fileIds.length, changeSetsDeleted: changeSetIds.length };
}

export async function discardCodeAiChangeSet(changeSetId: string) {
  if (!CHANGESET_ID.test(changeSetId)) throw new Error("Invalid change-set ID.");
  const client = getSanityWriteClient();
  const item = await client.fetch<{ _id: string; changes: unknown[] } | null>(
    `*[_type == "codeAiChangeSet" && _id == $id][0]{_id,changes}`,
    { id: changeSetId },
  );
  if (!item) throw new Error("Change set not found.");
  await client.delete(changeSetId);
  await logCodeAiAudit("changeSetDiscard", `Discarded saved change set ${changeSetId} containing ${item.changes?.length ?? 0} file changes.`);
  return { deleted: true };
}

export async function rewindCodeAiConversation(conversationId: string, messageKey: string) {
  if (!CONVERSATION_ID.test(conversationId) || !/^[a-zA-Z0-9-]+$/.test(messageKey)) throw new Error("Invalid conversation rewind reference.");
  const client = getSanityWriteClient();
  const conversation = await client.fetch<{ _id: string; messages: Array<{ _key: string; role: string }> } | null>(
    `*[_type == "codeAiConversation" && _id == $id][0]{_id,messages[]{_key,role}}`,
    { id: conversationId },
  );
  if (!conversation) throw new Error("Conversation not found.");
  const index = conversation.messages.findIndex((message) => message._key === messageKey && message.role === "user");
  if (index < 0) throw new Error("The selected user message was not found.");
  const retained = conversation.messages.slice(0, index + 1);
  await client.patch(conversationId).set({ messages: retained, updatedAt: new Date().toISOString() }).commit();
  const changes = await client.fetch<string[]>(
    `*[_type == "codeAiChangeSet" && conversationId == $conversationId && createdAt >= $cutoff]._id`,
    { conversationId, cutoff: new Date().toISOString() },
  );
  if (changes.length) await client.delete(changes);
  await logCodeAiAudit("conversationRewind", `Rewound conversation ${conversationId} to user message ${messageKey}.`);
  return { rewound: true, retainedMessages: retained.length };
}
