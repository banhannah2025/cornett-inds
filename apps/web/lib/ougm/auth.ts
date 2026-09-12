import "server-only";
import { currentUser } from "@clerk/nextjs/server";
import { getAdminContext } from "@/lib/admin";
export async function getOugmAccess() {
  const admin = await getAdminContext();
  if (admin.isAdmin) return { userId: admin.userId!, isAdmin: true };
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) return null;
  const user = await currentUser();
  const email = user?.emailAddresses.find(
    (e) => e.id === user.primaryEmailAddressId,
  );
  const allowed = (process.env.OUGM_STAFF_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  if (
    !user ||
    email?.verification?.status !== "verified" ||
    !allowed.includes(email.emailAddress.toLowerCase())
  )
    return null;
  return { userId: user.id, isAdmin: false };
}
