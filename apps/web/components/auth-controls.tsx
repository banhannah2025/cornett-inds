"use client";

import { Show, SignInButton, UserButton } from "@clerk/nextjs";

export function AuthControls({ dashboardUrl }: { dashboardUrl: string }) {
  return (
    <div className="flex items-center gap-3">
      <Show when="signed-out">
        <SignInButton forceRedirectUrl={dashboardUrl} mode="modal">
          <button className="rounded-xl border border-white/15 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10">
            Sign in
          </button>
        </SignInButton>
      </Show>
      <Show when="signed-in">
        <a
          className="rounded-xl border border-white/15 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
          href={dashboardUrl}
        >
          My dashboard
        </a>
        <UserButton />
      </Show>
    </div>
  );
}
