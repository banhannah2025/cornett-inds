import "server-only";

import { currentUser } from "@clerk/nextjs/server";

export async function getLegalAiUser() {
  const user = await currentUser();
  if (!user) return null;

  const email = user.emailAddresses.find(
    (address) => address.id === user.primaryEmailAddressId,
  );
  if (!email || email.verification?.status !== "verified") return null;

  const normalizedEmail = email.emailAddress.trim().toLowerCase();
  const ownerEmail = (process.env.LEGAL_AI_OWNER_EMAIL ?? process.env.CODE_AI_OWNER_EMAIL)
    ?.trim()
    .toLowerCase();

  return {
    userId: user.id,
    emailAddress: email.emailAddress,
    isAdmin: Boolean(ownerEmail && normalizedEmail === ownerEmail),
  };
}

export async function requireLegalAiUser() {
  const user = await getLegalAiUser();
  if (!user) throw new Error("LEGAL_AI_UNAUTHORIZED");
  return user;
}

export async function getLegalAiOwner() {
  const user = await getLegalAiUser();
  return user?.isAdmin ? user : null;
}

export async function requireLegalAiOwner() {
  const owner = await getLegalAiOwner();
  if (!owner) throw new Error("LEGAL_AI_ADMIN_REQUIRED");
  return owner;
}
