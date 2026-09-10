import "server-only";

import { getSanityWriteClient } from "@/sanity/lib/writeClient";
import { logLegalAiAudit } from "@/lib/legal-ai/store";

const PROJECT_ID = /^legalAiProject-[a-zA-Z0-9_-]+$/;
const CONVERSATION_ID = /^legalAiConversation-[a-zA-Z0-9_-]+$/;
const CHANGESET_ID = /^legalAiChangeSet-[a-zA-Z0-9_-]+$/;

export async function deleteLegalAiConversationCascade(conversationId: string) {
  if (!CONVERSATION_ID.test(conversationId)) throw new Error("Invalid conversation ID.");
  const client = getSanityWriteClient();
  const conversation = await client.fetch<{ _id: string; title: string } | null>(
    `*[_type == "legalAiConversation" && _id == $id][0]{_id,title}`,
    { id: conversationId },
  );
  if (!conversation) throw new Error("Conversation not found.");
  const changes = await client.fetch<string[]>(
    `*[_type == "legalAiChangeSet" && conversationId == $conversationId]._id`,
    { conversationId },
  );
  const tx = client.transaction();
  tx.delete(conversationId);
  for (const id of changes) tx.delete(id);
  await tx.commit();
  await logLegalAiAudit("conversationDelete", `Deleted conversation ${conversation.title} and ${changes.length} saved change set${changes.length === 1 ? "" : "s"}.`);
  return { deleted: true, changeSetsDeleted: changes.length };
}

export async function deleteLegalAiProjectCascade(projectId: string) {
  if (!PROJECT_ID.test(projectId)) throw new Error("Invalid project ID.");
  const client = getSanityWriteClient();
  const project = await client.fetch<{ _id: string; name: string } | null>(
    `*[_type == "legalAiProject" && _id == $id][0]{_id,name}`,
    { id: projectId },
  );
  if (!project) throw new Error("Project not found.");
  const [conversationIds, fileIds, changeSetIds] = await Promise.all([
    client.fetch<string[]>(`*[_type == "legalAiConversation" && projectId == $projectId]._id`, { projectId }),
    client.fetch<string[]>(`*[_type == "legalAiFile" && projectId == $projectId]._id`, { projectId }),
    client.fetch<string[]>(`*[_type == "legalAiChangeSet" && projectId == $projectId]._id`, { projectId }),
  ]);
  const assets = fileIds.length
    ? await client.fetch<string[]>(`*[_type == "legalAiFile" && _id in $ids].asset._ref`, { ids: fileIds })
    : [];
  const tx = client.transaction();
  tx.delete(projectId);
  for (const id of conversationIds) tx.delete(id);
  for (const id of fileIds) tx.delete(id);
  for (const id of changeSetIds) tx.delete(id);
  for (const asset of assets.filter(Boolean)) tx.delete(asset);
  await tx.commit();
  await logLegalAiAudit("projectDelete", `Deleted project ${project.name}, ${conversationIds.length} conversation${conversationIds.length === 1 ? "" : "s"}, ${fileIds.length} file${fileIds.length === 1 ? "" : "s"}, and ${changeSetIds.length} saved change set${changeSetIds.length === 1 ? "" : "s"}.`);
  return { deleted: true, conversationsDeleted: conversationIds.length, filesDeleted: fileIds.length, changeSetsDeleted: changeSetIds.length };
}

export async function discardLegalAiChangeSet(changeSetId: string) {
  if (!CHANGESET_ID.test(changeSetId)) throw new Error("Invalid change-set ID.");
  const client = getSanityWriteClient();
  const item = await client.fetch<{ _id: string; changes: unknown[] } | null>(
    `*[_type == "legalAiChangeSet" && _id == $id][0]{_id,changes}`,
    { id: changeSetId },
  );
  if (!item) throw new Error("Change set not found.");
  await client.delete(changeSetId);
  await logLegalAiAudit("changeSetDiscard", `Discarded saved change set ${changeSetId} containing ${item.changes?.length ?? 0} file changes.`);
  return { deleted: true };
}

export async function rewindLegalAiConversation(conversationId: string, messageKey: string) {
  if (!CONVERSATION_ID.test(conversationId) || !/^[a-zA-Z0-9-]+$/.test(messageKey)) throw new Error("Invalid conversation rewind reference.");
  const client = getSanityWriteClient();
  const conversation = await client.fetch<{ _id: string; messages: Array<{ _key: string; role: string; createdAt: string }> } | null>(
    `*[_type == "legalAiConversation" && _id == $id][0]{_id,messages[]{_key,role,createdAt}}`,
    { id: conversationId },
  );
  if (!conversation) throw new Error("Conversation not found.");
  const index = conversation.messages.findIndex((message) => message._key === messageKey && message.role === "user");
  if (index < 0) throw new Error("The selected user message was not found.");
  const target = conversation.messages[index];
  if (!target) throw new Error("The selected user message was not found.");
  const retained = conversation.messages.slice(0, index + 1);
  await client.patch(conversationId).set({ messages: retained, updatedAt: new Date().toISOString() }).commit();

  // Change sets are timestamped when they are created, while each user message
  // carries its own creation time. Anything created after the rewind target is
  // downstream of that target and must not remain as stale review state.
  const changes = await client.fetch<string[]>(
    `*[_type == "legalAiChangeSet" && conversationId == $conversationId && createdAt > $cutoff]._id`,
    { conversationId, cutoff: target.createdAt },
  );
  if (changes.length) {
    const tx = client.transaction();
    for (const id of changes) tx.delete(id);
    await tx.commit();
  }
  await logLegalAiAudit("conversationRewind", `Rewound conversation ${conversationId} to user message ${messageKey}; removed ${changes.length} downstream saved change set${changes.length === 1 ? "" : "s"}.`);
  return { rewound: true, retainedMessages: retained.length, changeSetsDeleted: changes.length };
}
