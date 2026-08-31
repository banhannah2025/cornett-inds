import type { Metadata } from "next";
import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AiBibleWorkspace } from "./workspace";

export const metadata: Metadata = {
  title: "My Bible Workspace | BlendedWorks AI Bible",
  description: "Your private space for Scripture conversation, faith guidance, writing, and ministry projects.",
};

export const dynamic = "force-dynamic";

export default async function WorkspacePage() {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return <main className="grid min-h-screen place-items-center bg-[#fbf8f1] p-6 text-center"><div><h1 className="font-serif text-3xl font-bold">Account setup is not available yet.</h1><p className="mt-3 text-[#465361]">The shared Clerk environment must be configured before the workspace can open.</p></div></main>;
  }

  const { userId } = await auth();
  if (!userId) redirect("/apps/blendedworks-ai-bible");

  const user = await currentUser();
  const plan = typeof user?.publicMetadata.aiBiblePlan === "string" ? user.publicMetadata.aiBiblePlan : "free";
  const month = new Date().toISOString().slice(0, 7);
  const usage = user?.privateMetadata.aiBibleUsage as { month?: string; used?: number } | undefined;
  const initialUsedCredits = usage?.month === month && typeof usage.used === "number" ? usage.used : 0;

  return <AiBibleWorkspace firstName={user?.firstName ?? "friend"} initialPlan={plan} initialUsedCredits={initialUsedCredits} />;
}
