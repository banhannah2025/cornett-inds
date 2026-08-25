import {
  Activity,
  ArrowUpRight,
  Bell,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  ChevronDown,
  CircleDollarSign,
  FolderKanban,
  Gauge,
  Grid2X2,
  Globe2,
  LifeBuoy,
  ListTodo,
  MessageSquareText,
  MoreHorizontal,
  Plug,
  Plus,
  Search,
  Settings,
  Sparkles,
  Users,
} from "lucide-react";
import {
  isPlatformAdministrator,
  parsePlatformAdministratorEmails,
  resolveTenantContext,
  workspaces,
} from "@repo/platform";
import { ClerkControls } from "@/components/clerk-controls";
import type { CSSProperties } from "react";
import { auth, currentUser } from "@clerk/nextjs/server";
import { WebsiteContentManager } from "@/components/website-content-manager";
import { getSiteContent } from "@/lib/site-content";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

const navigation = [
  { label: "Overview", icon: Grid2X2, active: true },
  { label: "Website", icon: Globe2, href: "#website-content" },
  { label: "Businesses", icon: Building2 },
  { label: "Clients", icon: Users },
  { label: "Projects", icon: FolderKanban },
  { label: "Tasks", icon: ListTodo, badge: "8" },
  { label: "Financials", icon: CircleDollarSign },
];

const metrics = [
  {
    label: "Active businesses",
    value: "3",
    note: "2 client workspaces",
    icon: Building2,
  },
  {
    label: "Open projects",
    value: "12",
    note: "4 need attention",
    icon: FolderKanban,
  },
  {
    label: "Tasks this week",
    value: "28",
    note: "71% completed",
    icon: ListTodo,
  },
  {
    label: "Monthly revenue",
    value: "$24.8k",
    note: "+12.4% from July",
    icon: Gauge,
  },
];

const tasks = [
  {
    title: "Review Q3 operating plan",
    business: "Blended Works",
    due: "Today",
    tone: "amber",
  },
  {
    title: "Approve website discovery brief",
    business: "Northstar Dental",
    due: "Tomorrow",
    tone: "green",
  },
  {
    title: "Connect accounting workspace",
    business: "Hearth & Pine",
    due: "Aug 12",
    tone: "slate",
  },
];

const activity = [
  {
    text: "Robin added a new project",
    detail: "Client portal redesign · 18 min ago",
  },
  { text: "Proposal moved to approved", detail: "Northstar Dental · 2 hr ago" },
  { text: "Monthly report is ready", detail: "Blended Works · Yesterday" },
];

const integrations = [
  { name: "Google Workspace", status: "Connected", initials: "G" },
  { name: "Stripe", status: "Connected", initials: "S" },
  { name: "QuickBooks", status: "Set up", initials: "Q" },
  { name: "Add a tool", status: "Browse integrations", initials: "+" },
];

function AccessRequired({
  name,
  role,
  message,
}: {
  name: string;
  role: string;
  message: string;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--canvas)] p-6">
      <section className="w-full max-w-lg rounded-2xl border border-[var(--line)] bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-5 flex size-12 items-center justify-center rounded-xl bg-[var(--brand-soft)] text-[var(--brand)]">
          <Building2 className="size-6" />
        </div>
        <h1 className="text-2xl font-semibold">Dashboard access required</h1>
        <p className="mx-auto mb-6 mt-2 max-w-md text-sm leading-6 text-[var(--muted)]">
          {message}
        </p>
        <div className="flex justify-center">
          <ClerkControls name={name} role={role} />
        </div>
      </section>
    </main>
  );
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ workspace?: string; guest?: string }>;
}) {
  const query = await searchParams;
  const siteUrl =
    process.env.NEXT_PUBLIC_BLENDED_WORKS_URL ?? "http://localhost:3000";
  const clerkConfigured = Boolean(
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
    process.env.CLERK_SECRET_KEY,
  );
  const guestMode = query.guest === "true" || !clerkConfigured;
  let displayName = "Guest Visitor";
  let displayRole = "demo guest";
  let authenticatedWorkspaceSlug: string | undefined;
  let canManageWebsite = false;

  if (!guestMode) {
    const session = await auth();
    if (!session.isAuthenticated) {
      const requestHeaders = await headers();
      const currentHost =
        requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
      const publicSiteHost = new URL(siteUrl).host;

      redirect(currentHost === publicSiteHost ? "/sign-in" : siteUrl);
    }

    const user = await currentUser();
    displayName = user?.firstName ?? user?.username ?? "Blended Works User";
    displayRole = session.orgRole?.replace("org:", "") ?? "member";

    const primaryEmail = user?.emailAddresses.find(
      (email) => email.id === user.primaryEmailAddressId,
    );
    const platformAdminEmails = parsePlatformAdministratorEmails(
      process.env.BLENDED_WORKS_ADMIN_EMAILS,
    );
    const isPlatformAdmin = isPlatformAdministrator(
      {
        emailAddress: primaryEmail?.emailAddress,
        emailVerified: primaryEmail?.verification?.status === "verified",
      },
      platformAdminEmails,
    );

    if (isPlatformAdmin) {
      displayRole = "platform owner";
      authenticatedWorkspaceSlug = "blended-works";
      canManageWebsite = true;
    } else {
      return (
        <AccessRequired
          message="Your account is authenticated, but it has not been assigned dashboard access. Ask a Blended Works administrator to add your verified email to an approved workspace."
          name={displayName}
          role={displayRole}
        />
      );
    }
  }

  const requestedWorkspace = guestMode
    ? "demo-company"
    : authenticatedWorkspaceSlug!;
  const tenant =
    resolveTenantContext(requestedWorkspace, "business-composer") ??
    resolveTenantContext("blended-works", "business-composer")!;
  const displayInitials = displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const siteContent = canManageWebsite ? await getSiteContent() : null;
  return (
    <main
      className="min-h-screen lg:grid lg:grid-cols-[260px_1fr]"
      style={
        { "--brand": tenant.workspace.branding.accentColor } as CSSProperties
      }
    >
      <aside className="hidden border-r border-[var(--line)] bg-[#f8f8f4] p-5 lg:flex lg:flex-col">
        <div className="mb-8 flex items-center gap-3 px-2">
          <div className="flex size-10 items-center justify-center rounded-xl bg-[var(--brand)] text-white shadow-sm">
            <BriefcaseBusiness className="size-5" />
          </div>
          <div>
            <p className="font-semibold tracking-tight">Business Composer</p>
            <p className="text-xs text-[var(--muted)]">by Blended Works</p>
          </div>
        </div>

        <details className="group relative mb-7">
          <summary className="flex w-full cursor-pointer list-none items-center gap-3 rounded-xl border border-[var(--line)] bg-white p-3 text-left shadow-sm">
            <span className="flex size-9 items-center justify-center rounded-lg bg-[var(--brand-soft)] text-sm font-bold text-[var(--brand)]">
              {tenant.workspace.branding.initials}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold">
                {tenant.workspace.name}
              </span>
              <span className="block capitalize text-xs text-[var(--muted)]">
                {tenant.workspace.kind} workspace
              </span>
            </span>
            <ChevronDown className="size-4 text-[var(--muted)]" />
          </summary>
          <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-20 rounded-xl border border-[var(--line)] bg-white p-1.5 shadow-xl">
            {(guestMode
              ? workspaces.filter((workspace) => workspace.kind === "demo")
              : workspaces
            ).map((workspace) => (
              <a
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm hover:bg-[#f2f4ef]"
                href={`/?workspace=${workspace.slug}${guestMode ? "&guest=true" : ""}`}
                key={workspace.id}
              >
                <span
                  className="flex size-8 items-center justify-center rounded-lg text-xs font-bold text-white"
                  style={{ backgroundColor: workspace.branding.accentColor }}
                >
                  {workspace.branding.initials}
                </span>
                <span>
                  <span className="block font-semibold">{workspace.name}</span>
                  <span className="block capitalize text-xs text-[var(--muted)]">
                    {workspace.kind}
                  </span>
                </span>
              </a>
            ))}
          </div>
        </details>

        <nav className="space-y-1">
          {navigation.map(({ label, icon: Icon, active, badge, href }) => (
            <a
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${active ? "bg-[var(--brand)] text-white shadow-sm" : "text-[#536058] hover:bg-white hover:text-[var(--ink)]"}`}
              href={href ?? "#"}
              key={label}
            >
              <Icon className="size-[18px]" />
              <span className="flex-1">{label}</span>
              {badge && (
                <span className="rounded-full bg-white/15 px-2 py-0.5 text-xs">
                  {badge}
                </span>
              )}
            </a>
          ))}
        </nav>

        <div className="mt-auto space-y-1 border-t border-[var(--line)] pt-5">
          <a
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-[var(--muted)] hover:bg-white"
            href="#"
          >
            <LifeBuoy className="size-[18px]" /> Support
          </a>
          <a
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-[var(--muted)] hover:bg-white"
            href="#"
          >
            <Settings className="size-[18px]" /> Settings
          </a>
        </div>
      </aside>

      <section className="min-w-0">
        {tenant.isDemo && (
          <div className="bg-[#fff0dc] px-5 py-2 text-center text-xs font-semibold text-[#7b4a14]">
            Demo workspace &bull; Synthetic data &bull; Safe to explore
          </div>
        )}
        <header className="flex h-[76px] items-center gap-3 border-b border-[var(--line)] bg-white/80 px-5 backdrop-blur md:px-8">
          <div className="flex items-center gap-2 lg:hidden">
            <div className="flex size-9 items-center justify-center rounded-lg bg-[var(--brand)] text-white">
              <BriefcaseBusiness className="size-4" />
            </div>
            <span className="hidden font-semibold sm:inline">
              Business Composer
            </span>
          </div>
          <label className="ml-auto flex h-10 w-full max-w-sm items-center gap-2 rounded-xl border border-[var(--line)] bg-white px-3 text-sm text-[var(--muted)] lg:ml-0">
            <Search className="size-4" />
            <input
              className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-[#8a938d]"
              placeholder="Search everything..."
            />
            <kbd className="hidden rounded border border-[var(--line)] bg-[#f6f7f4] px-1.5 py-0.5 text-[10px] sm:block">
              ⌘ K
            </kbd>
          </label>
          <button
            aria-label="Notifications"
            className="relative ml-auto rounded-lg border border-[var(--line)] bg-white p-2.5 text-[var(--muted)]"
          >
            <Bell className="size-4" />
            <span className="absolute right-2 top-2 size-1.5 rounded-full bg-[var(--accent)]" />
          </button>
          {clerkConfigured && !guestMode ? (
            <ClerkControls name={displayName} role={displayRole} />
          ) : (
            <button className="flex items-center gap-2 rounded-xl p-1.5 hover:bg-[#f2f3ef]">
              <span className="flex size-8 items-center justify-center rounded-lg bg-[#dce6f5] text-xs font-bold text-[#34517b]">
                {displayInitials}
              </span>
              <span className="hidden text-left md:block">
                <span className="block text-sm font-semibold leading-4">
                  {displayName}
                </span>
                <span className="text-xs capitalize text-[var(--muted)]">
                  {displayRole}
                </span>
              </span>
              <ChevronDown className="hidden size-4 text-[var(--muted)] md:block" />
            </button>
          )}
        </header>

        <div className="mx-auto max-w-[1500px] p-5 md:p-8">
          <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="mb-1 text-sm font-medium text-[var(--brand)]">
                Friday, August 7
              </p>
              <h1 className="text-3xl font-semibold tracking-[-0.03em] md:text-4xl">
                Good afternoon, {displayName.split(" ")[0]}.
              </h1>
              <p className="mt-2 text-[var(--muted)]">
                Here&rsquo;s what&rsquo;s happening in {tenant.workspace.name}.
              </p>
            </div>
            <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--brand)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#193e2f]">
              <Plus className="size-4" /> Create new
            </button>
          </div>

          {siteContent && (
            <WebsiteContentManager content={siteContent} siteUrl={siteUrl} />
          )}

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {metrics.map(({ label, value, note, icon: Icon }) => (
              <article
                className="rounded-2xl border border-[var(--line)] bg-white p-5 shadow-[0_1px_2px_rgb(18_35_25/4%)]"
                key={label}
              >
                <div className="mb-5 flex items-center justify-between">
                  <p className="text-sm font-medium text-[var(--muted)]">
                    {label}
                  </p>
                  <span className="rounded-lg bg-[var(--brand-soft)] p-2 text-[var(--brand)]">
                    <Icon className="size-4" />
                  </span>
                </div>
                <p className="text-3xl font-semibold tracking-tight">{value}</p>
                <p className="mt-1 text-xs text-[var(--muted)]">{note}</p>
              </article>
            ))}
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
            <div className="space-y-6">
              <section className="overflow-hidden rounded-2xl border border-[var(--line)] bg-white shadow-[0_1px_2px_rgb(18_35_25/4%)]">
                <div className="flex items-center justify-between border-b border-[var(--line)] p-5">
                  <div>
                    <h2 className="font-semibold">Priority tasks</h2>
                    <p className="text-sm text-[var(--muted)]">
                      Keep the most important work moving.
                    </p>
                  </div>
                  <button className="text-sm font-semibold text-[var(--brand)]">
                    View all
                  </button>
                </div>
                <div className="divide-y divide-[var(--line)]">
                  {tasks.map((task) => (
                    <div
                      className="flex items-center gap-4 p-4 sm:p-5"
                      key={task.title}
                    >
                      <button
                        aria-label={`Complete ${task.title}`}
                        className="size-5 shrink-0 rounded-full border-2 border-[#cbd2cc]"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">
                          {task.title}
                        </p>
                        <p className="mt-1 text-xs text-[var(--muted)]">
                          {task.business}
                        </p>
                      </div>
                      <span
                        className={`hidden rounded-full px-2.5 py-1 text-xs font-medium sm:block ${task.tone === "amber" ? "bg-[#fff0dc] text-[#995b17]" : task.tone === "green" ? "bg-[var(--brand-soft)] text-[var(--brand)]" : "bg-[#eef0ed] text-[#68716b]"}`}
                      >
                        {task.due}
                      </span>
                      <MoreHorizontal className="size-4 text-[var(--muted)]" />
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-2xl border border-[var(--line)] bg-white p-5 shadow-[0_1px_2px_rgb(18_35_25/4%)]">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <h2 className="font-semibold">Connected tools</h2>
                    <p className="text-sm text-[var(--muted)]">
                      Your business systems in one place.
                    </p>
                  </div>
                  <Plug className="size-5 text-[var(--muted)]" />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {integrations.map((item) => (
                    <button
                      className="flex items-center gap-3 rounded-xl border border-[var(--line)] p-3 text-left transition hover:border-[#b9c2bb] hover:bg-[#fafbf8]"
                      key={item.name}
                    >
                      <span className="flex size-10 items-center justify-center rounded-lg bg-[#f0f2ee] font-bold text-[var(--brand)]">
                        {item.initials}
                      </span>
                      <span className="flex-1">
                        <span className="block text-sm font-semibold">
                          {item.name}
                        </span>
                        <span className="text-xs text-[var(--muted)]">
                          {item.status}
                        </span>
                      </span>
                      <ArrowUpRight className="size-4 text-[var(--muted)]" />
                    </button>
                  ))}
                </div>
              </section>
            </div>

            <div className="space-y-6">
              <section className="rounded-2xl bg-[var(--brand)] p-5 text-white shadow-sm">
                <div className="mb-8 flex items-start justify-between">
                  <span className="rounded-lg bg-white/10 p-2">
                    <Sparkles className="size-5" />
                  </span>
                  <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs">
                    Workspace insight
                  </span>
                </div>
                <h2 className="text-xl font-semibold">
                  Your week is 71% on track.
                </h2>
                <p className="mt-2 text-sm leading-6 text-white/70">
                  Four tasks need attention before Monday. Start with the Q3
                  operating plan.
                </p>
                <button className="mt-5 flex items-center gap-2 text-sm font-semibold">
                  View recommendations <ArrowUpRight className="size-4" />
                </button>
              </section>

              <section className="rounded-2xl border border-[var(--line)] bg-white p-5 shadow-[0_1px_2px_rgb(18_35_25/4%)]">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <h2 className="font-semibold">Recent activity</h2>
                    <p className="text-sm text-[var(--muted)]">
                      Across all workspaces
                    </p>
                  </div>
                  <Activity className="size-5 text-[var(--muted)]" />
                </div>
                <div className="space-y-5">
                  {activity.map((item) => (
                    <div className="flex gap-3" key={item.text}>
                      <span className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-[var(--brand-soft)] text-[var(--brand)]">
                        <MessageSquareText className="size-3.5" />
                      </span>
                      <div>
                        <p className="text-sm font-medium">
                          {item.text.replace(
                            "Robin",
                            guestMode ? "Alex Morgan" : displayName,
                          )}
                        </p>
                        <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
                          {item.detail}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="flex items-center gap-4 rounded-2xl border border-[var(--line)] bg-white p-5">
                <span className="rounded-xl bg-[#fff0dc] p-3 text-[#995b17]">
                  <CalendarDays className="size-5" />
                </span>
                <div className="flex-1">
                  <p className="text-sm font-semibold">Next meeting</p>
                  <p className="text-xs text-[var(--muted)]">
                    Client kickoff · Monday, 10:00 AM
                  </p>
                </div>
                <ArrowUpRight className="size-4 text-[var(--muted)]" />
              </section>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
