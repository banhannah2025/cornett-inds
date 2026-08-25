import Link from "next/link";
import { NewsMenu } from "./news-menu";
import { AdminSessionControls } from "./admin-session-controls";
import { getAdminContext } from "@/lib/admin";
import { FieldNotesMenu } from "./field-notes-menu";
import { NavbarAuth } from "./navbar-auth";

export async function NewsHeader() {
  const admin = await getAdminContext();
  return (
    <header className="border-b border-[#1e2a24]/10 bg-[#f6f3eb]/95 backdrop-blur">
      <div className="mx-auto flex min-h-20 max-w-7xl items-center justify-between gap-6 px-5 sm:px-8 lg:px-10">
        <Link href="/" className="shrink-0 text-[#1e2a24]">
          <span className="block font-serif text-2xl font-semibold tracking-tight">
            Blended Works
          </span>
          <span className="block text-[10px] font-bold uppercase tracking-[0.24em] text-[#6b786e]">
            Field notes from anywhere
          </span>
        </Link>
        <nav
          aria-label="News navigation"
          className="flex items-center gap-6 sm:gap-8"
        >
          <FieldNotesMenu dark />
          <NewsMenu dark />
          <Link
            className="hidden text-sm font-bold uppercase tracking-[0.14em] text-[#1e2a24] transition hover:text-[#a45d2d] sm:block"
            href="/#about"
          >
            Our story
          </Link>
          {admin.isAdmin ? (
            <AdminSessionControls name={admin.displayName ?? "Administrator"} />
          ) : (
            <NavbarAuth
              enabled={Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY)}
            />
          )}
        </nav>
      </div>
    </header>
  );
}
