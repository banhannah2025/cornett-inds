import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Check, Scale } from "lucide-react";

export const metadata: Metadata = {
  title: "Register for Legal AI | Blended Works",
  description: "Create your Legal AI account and prepare for upcoming plans and account tiers.",
};

export default function LegalAiRegisterPage() {
  return (
    <main className="min-h-screen bg-[#f6f3eb] text-[#1e2a24]">
      <header className="border-b border-[#1e2a24]/10 bg-[#1e2a24] text-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-5 sm:px-8">
          <Link className="flex items-center gap-3" href="/">
            <Scale className="size-7 text-[#f4b860]" />
            <div>
              <span className="block font-serif text-xl font-semibold">Legal AI</span>
              <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">by Blended Works</span>
            </div>
          </Link>
          <Link className="inline-flex items-center gap-2 text-xs font-semibold text-white/80 hover:text-white sm:text-sm" href="/apps/legal-ai">
            <ArrowLeft className="size-4" /> Back to Legal AI
          </Link>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl gap-10 px-5 py-12 sm:px-8 lg:grid-cols-[1.05fr_.95fr] lg:items-start lg:py-20">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#a45d2d]">Legal AI accounts</p>
          <h1 className="mt-4 max-w-2xl font-serif text-4xl leading-tight tracking-tight sm:text-6xl">
            Build your legal workspace now. <span className="italic text-[#6b786e]">Choose a plan later.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-[#59665f]">
            Registration is open while we finish pricing, subscriptions, and account tiers. Your account will be the foundation for private matters, conversations, and documents.
          </p>
          <div className="mt-8 space-y-4">
            {["Private matter workspaces tied to your account","Legal AI conversations and matter documents","Future plan, billing, and usage controls from one account"].map((item) => (
              <p className="flex items-start gap-3 text-sm font-semibold" key={item}>
                <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-[#1e2a24] text-[#f4b860]"><Check className="size-3.5" /></span>
                {item}
              </p>
            ))}
          </div>
          <div className="mt-10 rounded-2xl border border-[#a45d2d]/20 bg-[#efe8dc] p-5 text-sm leading-6 text-[#59665f]">
            <strong className="text-[#1e2a24]">Coming next:</strong> pricing, paid subscriptions, account tiers, included usage, and upgrade options. No paid plan is required on this registration page yet.
          </div>
        </div>

        <div className="rounded-[2rem] border border-[#1e2a24]/10 bg-white p-6 shadow-xl shadow-[#1e2a24]/5 sm:p-9">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#a45d2d]">Create your account</p>
          <h2 className="mt-3 font-serif text-3xl">Get started with Legal AI</h2>
          <p className="mt-3 text-sm leading-6 text-[#657169]">Create your Blended Works account, then continue into your Legal AI workspace.</p>
          <Link
            className="mt-8 flex min-h-12 w-full items-center justify-center rounded-full bg-[#1e2a24] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#30443a]"
            href="/sign-up?redirect_url=/apps/legal-ai"
          >
            Create account
          </Link>
          <Link
            className="mt-3 flex min-h-12 w-full items-center justify-center rounded-full border border-[#1e2a24]/15 px-6 py-3 text-sm font-bold transition hover:bg-[#ebe7dc]"
            href="/sign-in?redirect_url=/apps/legal-ai"
          >
            Already registered? Sign in
          </Link>
          <p className="mt-6 text-center text-xs leading-5 text-[#7b857e]">
            Pricing and payment options will be added here when Legal AI plans are introduced.
          </p>
        </div>
      </section>
    </main>
  );
}
