"use client";

import { SignInButton, UserButton, useAuth } from "@clerk/nextjs";
import { LogIn } from "lucide-react";

export function NavbarAuth({
  enabled,
  onHero = false,
}: {
  enabled: boolean;
  onHero?: boolean;
}) {
  const { isLoaded, isSignedIn } = useAuth();

  if (!enabled) return null;

  if (!isLoaded) {
    return <div aria-hidden="true" className="h-10 w-24 shrink-0" />;
  }

  return (
    <div className="flex shrink-0 items-center">
      {!isSignedIn ? (
        <SignInButton mode="modal">
          <button
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${
              onHero
                ? "border-white/35 bg-white/10 text-white backdrop-blur hover:bg-white hover:text-[#1e2a24]"
                : "border-[#1e2a24]/15 bg-white text-[#1e2a24] hover:border-[#a45d2d]/40 hover:text-[#a45d2d]"
            }`}
            type="button"
          >
            <LogIn aria-hidden="true" className="size-4" />
            <span className="hidden sm:inline">Sign in</span>
          </button>
        </SignInButton>
      ) : (
        <div
          className={`rounded-full border p-1 ${
            onHero
              ? "border-white/35 bg-white/10 backdrop-blur"
              : "border-[#1e2a24]/10 bg-white"
          }`}
        >
          <UserButton />
        </div>
      )}
    </div>
  );
}
