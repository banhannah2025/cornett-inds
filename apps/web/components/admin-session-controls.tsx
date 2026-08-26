"use client";

import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { LayoutDashboard } from "lucide-react";

export function AdminSessionControls({ name }: { name: string }) {
  return (
    <div className="flex items-center gap-3 rounded-full border border-[#1e2a24]/10 bg-white px-3 py-1.5">
      <Link
        aria-label="Open admin dashboard"
        className="rounded-full p-1.5 text-[#a45d2d] transition hover:bg-[#ebe7dc]"
        href="/admin"
      >
        <LayoutDashboard className="size-4" />
      </Link>
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
