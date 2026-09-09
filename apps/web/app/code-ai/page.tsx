import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCodeAiOwner } from "@/lib/code-ai/auth";
import { CodeAiWorkspace } from "./workspace";

export const metadata: Metadata = {
  title: "Code AI | Blended Works",
  description: "Robin's private AI software-development workspace.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function CodeAiPage() {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) redirect("/");
  const owner = await getCodeAiOwner();
  if (!owner) redirect("/sign-in?redirect_url=/code-ai");
  return <CodeAiWorkspace ownerEmail={owner.emailAddress} />;
}
