import "server-only";

import { currentUser } from "@clerk/nextjs/server";
import {
  isPlatformAdministrator,
  parsePlatformAdministratorEmails,
} from "@repo/platform";

export type AdminContext = {
  isAdmin: boolean;
  userId?: string;
  displayName?: string;
  emailAddress?: string;
};

export async function getAdminContext(): Promise<AdminContext> {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) return { isAdmin: false };

  const user = await currentUser();
  if (!user) return { isAdmin: false };

  const primaryEmail = user.emailAddresses.find(
    (email) => email.id === user.primaryEmailAddressId,
  );
  const isAdmin = isPlatformAdministrator(
    {
      emailAddress: primaryEmail?.emailAddress,
      emailVerified: primaryEmail?.verification?.status === "verified",
    },
    parsePlatformAdministratorEmails(process.env.BLENDED_WORKS_ADMIN_EMAILS),
  );

  return {
    isAdmin,
    userId: user.id,
    displayName: user.fullName ?? user.firstName ?? "Administrator",
    emailAddress: primaryEmail?.emailAddress,
  };
}

export async function requireAdministrator() {
  const admin = await getAdminContext();
  if (!admin.isAdmin) throw new Error("Administrator access required.");
  return admin;
}
