import "server-only";

import { currentUser } from "@clerk/nextjs/server";

export async function getCodeAiOwner() {
  const user = await currentUser();
  if (!user) return null;

  const email = user.emailAddresses.find(
    (address) => address.id === user.primaryEmailAddressId,
  );
  if (
    email?.verification?.status !== "verified" ||
    email.emailAddress.trim().toLowerCase() !==
      process.env.CODE_AI_OWNER_EMAIL?.trim().toLowerCase()
  ) {
    return null;
  }

  return { userId: user.id, emailAddress: email.emailAddress };
}

export async function requireCodeAiOwner() {
  const owner = await getCodeAiOwner();
  if (!owner) throw new Error("CODE_AI_UNAUTHORIZED");
  return owner;
}
