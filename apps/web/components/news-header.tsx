import Link from "next/link";
import { NewsMenu } from "./news-menu";
import { AdminSessionControls } from "./admin-session-controls";
import { getAdminContext } from "@/lib/admin";
import { FieldNotesMenu } from "./field-notes-menu";
import { NavbarAuth } from "./navbar-auth";
import { AppsMenu } from "./apps-menu";

export async function NewsHeader() {
  const admin = await getAdminContext();
  return (
    <header className="border-b border-[#1e2a24]/10 bg-[#f6f3eb]/95 backdrop-blur">
      <div className="mx-auto flex min-h-20 max-w-7xl flex-wrap items-center justify-between gap-x-5 gap-y-4 px-6 py-4 sm:flex-nowrap sm:px-8 sm:py-0 lg:px-10">
        <Link href="/" className="shrink-0 text-[#1e2a24]">
          <span className="block font-serif text-2xl font-semibold tracking-tight">
            Blended Works
          </span>
          <span className="block text-[10px] font-bold uppercase tracking-[0.24em] text-[#6b786e]">
            Life, work &amp; possibility—blended
          </span>
        </Link>
        <nav
          aria-label="News navigation"
          className="order-3 flex w-full items-center gap-6 border-t border-[#1e2a24]/10 pt-4 sm:order-none sm:w-auto sm:border-0 sm:pt-0 sm:gap-8"
        >
          <AppsMenu dark />
          <FieldNotesMenu dark />
          <NewsMenu dark />
          <Link
            className="hidden text-sm font-bold uppercase tracking-[0.14em] text-[#1e2a24] transition hover:text-[#a45d2d] sm:block"
            href="/services"
          >
            What we do
          </Link>
          <Link
            className="hidden text-sm font-bold uppercase tracking-[0.14em] text-[#1e2a24] transition hover:text-[#a45d2d] lg:block"
            href="/about"
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
