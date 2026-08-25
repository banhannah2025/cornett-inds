"use client";

import { UserButton } from "@clerk/nextjs";

export function ClerkControls({ name, role }: { name: string; role: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="hidden text-right lg:block">
        <span className="block text-sm font-semibold leading-4">{name}</span>
        <span className="text-xs capitalize text-[var(--muted)]">{role}</span>
      </span>
      <UserButton />
    </div>
  );
}
