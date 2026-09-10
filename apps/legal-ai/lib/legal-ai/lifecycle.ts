import "server-only";

import { getSanityWriteClient } from "@/sanity/lib/writeClient";

const PROJECT_ID = /^legalAiProject-[a-zA-Z0-9_-]+$/;
const CONVERSATION_ID = /^legalAiConversation-[a-zA-Z0-9_-]+$/;

export async function deleteLegalAiConversationCascade(userId: string, conversationId: string) {
  if (!CONVERSATION_ID.test(conversationId)) throw new Error("Invalid conversation ID.");
  const client = getSanityWriteClient();
  const conversation = await client.fetch<{ _id: string } | null>(
    `*[_type == "legalAiConversation" && _id == $id && userId == $userId][0]{_id}`,
    { id: conversationId, userId },
  );
  if (!conversation) throw new Error("Conversation not found.");
  await client.delete(conversationId);
  return { deleted: true };
}

export async function deleteLegalAiProjectCascade(userId: string, projectId: string) {
  if (!PROJECT_ID.test(projectId)) throw new Error("Invalid matter ID.");
  const client = getSanityWriteClient();
  const project = await client.fetch<{ _id: string } | null>(
    `*[_type == "legalAiProject" && _id == $id && userId == $userId][0]{_id}`,
    { id: projectId, userId },
  );
  if (!project) throw new Error("Matter not found.");

  const [conversationIds, fileIds] = await Promise.all([
    client.fetch<string[]>(
      `*[_type == "legalAiConversation" && projectId == $projectId && userId == $userId]._id`,
      { projectId, userId },
    ),
    client.fetch<string[]>(
      `*[_type == "legalAiFile" && projectId == $projectId && userId == $userId]._id`,
      { projectId, userId },
    ),
  ]);
  const assets = fileIds.length
    ? await client.fetch<string[]>(
        `*[_type == "legalAiFile" && _id in $ids && userId == $userId].asset._ref`,
        { ids: fileIds, userId },
      )
    : [];

  const tx = client.transaction();
  tx.delete(projectId);
  for (const id of conversationIds) tx.delete(id);
  for (const id of fileIds) tx.delete(id);
  await tx.commit();

  for (const asset of assets.filter(Boolean)) {
    await client.delete(asset).catch(() => undefined);
  }

  return {
    deleted: true,
    conversationsDeleted: conversationIds.length,
    filesDeleted: fileIds.length,
  };
}

export async function rewindLegalAiConversation(userId: string, conversationId: string, messageKey: string) {
  if (!CONVERSATION_ID.test(conversationId) || !/^[a-zA-Z0-9-]+$/.test(messageKey)) {
    throw new Error("Invalid conversation rewind reference.");
  }
  const client = getSanityWriteClient();
  const conversation = await client.fetch<{
    _id: string;
    messages: Array<{ _key: string; role: string; createdAt: string }>;
  } | null>(
    `*[_type == "legalAiConversation" && _id == $id && userId == $userId][0]{_id,messages[]{_key,role,createdAt}}`,
    { id: conversationId, userId },
  );
  if (!conversation) throw new Error("Conversation not found.");
  const index = conversation.messages.findIndex(
    (message) => message._key === messageKey && message.role === "user",
  );
  if (index < 0) throw new Error("The selected user message was not found.");
  const retained = conversation.messages.slice(0, index + 1);
  await client
    .patch(conversationId)
    .set({ messages: retained, updatedAt: new Date().toISOString() })
    .commit();
  return { rewound: true, retainedMessages: retained.length };
}
