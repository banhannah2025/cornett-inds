import Link from "next/link";
import { LayoutDashboard } from "lucide-react";
import { getAdminContext } from "@/lib/admin";

export async function AdminDock() {
  const admin = await getAdminContext();
  if (!admin.isAdmin) return null;

  return (
    <Link
      className="fixed bottom-5 left-5 z-[70] inline-flex min-h-12 items-center gap-2 rounded-full bg-[#f4b860] px-5 py-3 text-sm font-bold text-[#1e2a24] shadow-xl ring-1 ring-black/10 transition hover:bg-[#ffd08a]"
      href="/admin"
    >
      <LayoutDashboard className="size-4" />
      Admin dashboard
    </Link>
  );
}
