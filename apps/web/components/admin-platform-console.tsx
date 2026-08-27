import Link from "next/link";
import {
  AppWindow,
  ArrowUpRight,
  BatteryCharging,
  BookOpen,
  CalendarDays,
  CloudSun,
  Compass,
  Database,
  FilePenLine,
  Gauge,
  KeyRound,
  PackageCheck,
  ReceiptText,
  Settings2,
  ShieldCheck,
  Signal,
  TentTree,
  Users,
} from "lucide-react";

const basecampModules = [
  { label: "Calendar & work planner", icon: CalendarDays },
  { label: "Travel & lodging", icon: Compass },
  { label: "Connectivity log", icon: Signal },
  { label: "Weather & hazards", icon: CloudSun },
  { label: "Solar & batteries", icon: BatteryCharging },
  { label: "Equipment & supplies", icon: PackageCheck },
  { label: "Expenses & mileage", icon: ReceiptText },
  { label: "Location journal", icon: BookOpen },
  { label: "Emergency check-ins", icon: ShieldCheck },
] as const;

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
              Open every app, review Basecamp features, manage people, and reach the systems that power the platform.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs font-bold">
            <a className="rounded-full bg-white/10 px-4 py-2.5 hover:bg-white/15" href="#apps">Apps</a>
            <a className="rounded-full bg-white/10 px-4 py-2.5 hover:bg-white/15" href="#management">Management</a>
            <a className="rounded-full bg-white/10 px-4 py-2.5 hover:bg-white/15" href="#content-library">Content</a>
          </div>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-3" id="apps">
          <AppCard
            description="The command console for travel, remote work, power, safety, equipment, and field operations."
            href="/apps/blended-basecamp"
            icon={TentTree}
            name="Blended Basecamp"
            status="9 features active"
          />
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

        <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-serif text-xl">Basecamp feature inventory</h3>
              <p className="mt-1 text-xs text-white/55">All operational modules currently wired into the command console.</p>
            </div>
            <Link className="inline-flex items-center gap-2 rounded-full bg-[#f4b860] px-4 py-2.5 text-xs font-bold text-[#1e2a24]" href="/apps/blended-basecamp">
              Open Basecamp <ArrowUpRight className="size-3.5" />
            </Link>
          </div>
          <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {basecampModules.map(({ label, icon: Icon }) => (
              <div className="flex items-center gap-3 rounded-xl bg-black/15 px-3 py-3 text-sm" key={label}>
                <Icon className="size-4 shrink-0 text-[#f4b860]" />
                <span className="font-semibold">{label}</span>
                <span className="ml-auto size-2 rounded-full bg-emerald-400" title="Active" />
              </div>
            ))}
          </div>
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
        <StatusCard icon={Gauge} label="App operations" value="3 apps registered" />
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
