"use client";

import { UserButton } from "@clerk/nextjs";

export function AdminSessionControls({ name }: { name: string }) {
  return (
    <div className="flex items-center gap-3 rounded-full border border-[#1e2a24]/10 bg-white px-3 py-1.5">
      <span className="hidden text-right sm:block">
        <span className="block text-xs font-bold leading-tight">{name}</span>
        <span className="block text-[10px] uppercase tracking-[0.14em] text-[#a45d2d]">
          Admin mode
        </span>
      </span>
      <UserButton />
    </div>
  );
}
