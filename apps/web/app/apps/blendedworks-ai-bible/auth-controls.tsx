"use client";

import { SignInButton, SignUpButton, UserButton, useAuth } from "@clerk/nextjs";
import { ArrowRight, LogIn, UserPlus } from "lucide-react";
import Link from "next/link";

const workspaceUrl = "/apps/blendedworks-ai-bible/workspace";

export function AiBibleNavbarAuth({ enabled }: { enabled: boolean }) {
  if (!enabled) {
    return <span className="rounded-xl border border-[#24364b]/20 bg-white px-4 py-2 text-xs font-bold text-[#465361]">Account setup pending</span>;
  }

  return <EnabledNavbarAuth />;
}

function EnabledNavbarAuth() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) return <div aria-hidden className="h-10 w-40" />;

  if (isSignedIn) {
    return (
      <div className="flex items-center gap-2">
        <Link className="rounded-xl bg-[#24364b] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#172536]" href={workspaceUrl}>
          Open app
        </Link>
        <span className="rounded-full border border-[#24364b]/15 bg-white p-1"><UserButton /></span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <SignInButton forceRedirectUrl={workspaceUrl} mode="modal">
        <button className="inline-flex items-center gap-2 rounded-xl border border-[#24364b]/20 bg-white px-4 py-2.5 text-sm font-bold text-[#24364b] transition hover:border-[#a45d2d]/50" type="button">
          <LogIn size={16} /> Log in
        </button>
      </SignInButton>
      <SignUpButton forceRedirectUrl={workspaceUrl} mode="modal">
        <button className="hidden items-center gap-2 rounded-xl bg-[#24364b] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#172536] sm:inline-flex" type="button">
          <UserPlus size={16} /> Sign up
        </button>
      </SignUpButton>
    </div>
  );
}

export function AiBibleLandingAction({ enabled }: { enabled: boolean }) {
  if (!enabled) return <a className="flex items-center justify-center gap-2 rounded-xl bg-[#24364b] px-6 py-3.5 font-bold text-white" href="#pricing">Explore plans <ArrowRight size={18} /></a>;
  return <EnabledLandingAction />;
}

function EnabledLandingAction() {
  const { isLoaded, isSignedIn } = useAuth();
  const className = "flex items-center justify-center gap-2 rounded-xl bg-[#24364b] px-6 py-3.5 font-bold text-white shadow-[0_14px_35px_rgba(36,54,75,.20)] transition hover:-translate-y-0.5 hover:bg-[#172536]";

  if (!isLoaded) return <div aria-hidden className="h-[52px] w-44 rounded-xl bg-[#24364b]/15" />;
  if (isSignedIn) return <Link className={className} href={workspaceUrl}>Open your Bible workspace <ArrowRight size={18} /></Link>;

  return (
    <SignInButton forceRedirectUrl={workspaceUrl} mode="modal">
      <button className={className} type="button">Log in to begin <ArrowRight size={18} /></button>
    </SignInButton>
  );
}
