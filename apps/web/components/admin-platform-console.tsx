import Link from "next/link";
import {
  AppWindow,
  ArrowUpRight,
  CalendarDays,
  Database,
  FilePenLine,
  Gauge,
  KeyRound,
  Settings2,
  TentTree,
  Users,
} from "lucide-react";

const managementAreas = [
  {
    title: "Users & access",
    description: "Invite people, review accounts, and manage authentication in Clerk.",
    href: "https://dashboard.clerk.com",
    label: "Manage users",
    icon: Users,
    external: true,
  },
  {
    title: "Content & media",
    description: "Create and edit news, field notes, devotionals, authors, categories, and images below.",
    href: "#content-library",
    label: "Manage content",
    icon: FilePenLine,
    external: false,
  },
  {
    title: "Website settings",
    description: "Update the homepage, story, services, calls to action, and contact information.",
    href: "#website-settings",
    label: "Edit website",
    icon: Settings2,
    external: false,
  },
  {
    title: "Data & integrations",
    description: "Manage Sanity content data and the services connected to Blended Works.",
    href: "https://www.sanity.io/manage",
    label: "Open Sanity",
    icon: Database,
    external: true,
  },
] as const;

export function AdminPlatformConsole({
  businessComposerUrl,
  plannerUrl,
}: {
  businessComposerUrl?: string;
  plannerUrl: string;
}) {
  return (
    <section className="py-8" id="platform-controls">
      <div className="rounded-[2rem] bg-[#1e2a24] p-5 text-white sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#f4b860]">
              Platform control center
            </p>
            <h2 className="mt-2 font-serif text-3xl sm:text-4xl">Run all of Blended Works.</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/65">
              Open available apps, manage people, and reach the systems that power the platform.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs font-bold">
            <a className="rounded-full bg-white/10 px-4 py-2.5 hover:bg-white/15" href="#apps">Apps</a>
            <a className="rounded-full bg-white/10 px-4 py-2.5 hover:bg-white/15" href="#management">Management</a>
            <a className="rounded-full bg-white/10 px-4 py-2.5 hover:bg-white/15" href="#content-library">Content</a>
          </div>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-2" id="apps">
          <AppCard
            description="Purpose-centered calendar and planning journal for Blended Works."
            href={plannerUrl}
            icon={CalendarDays}
            name="Blended Planner"
            status="Active"
          />
          <AppCard
            description="Business operations, client work, projects, documents, and financial planning."
            href={businessComposerUrl}
            icon={AppWindow}
            name="Business Composer"
            status={businessComposerUrl ? "Active" : "Setup required"}
          />
        </div>

      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" id="management">
        {managementAreas.map(({ description, external, href, icon: Icon, label, title }) => (
          <a
            className="group rounded-2xl border border-[#1e2a24]/10 bg-white p-5 transition hover:-translate-y-0.5 hover:border-[#a45d2d]/35 hover:shadow-lg"
            href={href}
            key={title}
            rel={external ? "noreferrer" : undefined}
            target={external ? "_blank" : undefined}
          >
            <Icon className="size-5 text-[#a45d2d]" />
            <h3 className="mt-5 font-serif text-xl">{title}</h3>
            <p className="mt-2 min-h-16 text-sm leading-6 text-[#657169]">{description}</p>
            <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-[#a45d2d]">
              {label} <ArrowUpRight className="size-3.5 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </span>
          </a>
        ))}
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <StatusCard icon={KeyRound} label="Authentication" value="Clerk connected" />
        <StatusCard icon={Database} label="Content database" value="Sanity connected" />
        <StatusCard icon={Gauge} label="App operations" value="2 apps visible" />
      </div>
    </section>
  );
}

function AppCard({ description, href, icon: Icon, name, status }: { description: string; href?: string; icon: typeof TentTree; name: string; status: string }) {
  const body = (
    <>
      <div className="flex items-center justify-between gap-4">
        <span className="grid size-11 place-items-center rounded-xl bg-[#f4b860] text-[#1e2a24]"><Icon className="size-5" /></span>
        <span className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white/70">{status}</span>
      </div>
      <h3 className="mt-5 font-serif text-2xl">{name}</h3>
      <p className="mt-2 text-sm leading-6 text-white/60">{description}</p>
      <span className="mt-5 inline-flex items-center gap-1.5 text-xs font-bold text-[#f4b860]">{href ? "Open app" : "Configure URL"} <ArrowUpRight className="size-3.5" /></span>
    </>
  );
  return href ? <Link className="rounded-2xl border border-white/10 bg-white/[0.05] p-5 transition hover:bg-white/[0.09]" href={href}>{body}</Link> : <div className="rounded-2xl border border-dashed border-white/20 bg-white/[0.03] p-5">{body}</div>;
}

function StatusCard({ icon: Icon, label, value }: { icon: typeof Gauge; label: string; value: string }) {
  return <div className="flex items-center gap-3 rounded-2xl bg-[#ebe7dc] px-4 py-4"><Icon className="size-5 text-[#a45d2d]" /><div><p className="text-[10px] font-bold uppercase tracking-wider text-[#7a857e]">{label}</p><p className="text-sm font-bold">{value}</p></div></div>;
}
