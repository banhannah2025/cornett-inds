import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getLegalAiOwner } from "@/lib/legal-ai/auth";
import { LegalAiWorkspace } from "./workspace";

export const metadata: Metadata = {
  title: "Legal AI | Blended Works",
  description: "Legal AI workspace from Blended Works.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function LegalAiPage() {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) redirect("/");
  const owner = await getLegalAiOwner();
  if (!owner) redirect("/sign-in?redirect_url=/apps/legal-ai");
  return <LegalAiWorkspace ownerEmail={owner.emailAddress} />;
}
