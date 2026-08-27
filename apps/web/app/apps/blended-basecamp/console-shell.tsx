"use client";
import { useEffect, useState } from "react";
import {
  Activity,
  BatteryCharging,
  BookOpen,
  BriefcaseBusiness,
  CalendarDays,
  CloudSun,
  Compass,
  Gauge,
  MapPinned,
  PackageCheck,
  ReceiptText,
  ShieldCheck,
  Signal,
  TentTree,
} from "lucide-react";
import { CalendarPlanner } from "./calendar-planner";
import { ConnectivityLog } from "./connectivity-log";
import { TravelStayPlanner } from "./travel-stay-planner";
import { WeatherHazardCenter } from "./weather-hazard-center";
import { SolarBatteryPlanner } from "./solar-battery-planner";
import { EquipmentChecklist } from "./equipment-checklist";
import { ExpenseMileageTracker } from "./expense-mileage-tracker";
import { LocationJournal } from "./location-journal";
import { EmergencyCheckins } from "./emergency-checkins";
import { WorkspaceSwitcher } from "./workspace-switcher";
const modules = [
  {
    id: "overview",
    label: "Command",
    icon: Gauge,
    description: "System overview",
  },
  {
    id: "planner",
    label: "Planner",
    icon: CalendarDays,
    description: "Calendar & work",
  },
  {
    id: "travel",
    label: "Travel",
    icon: Compass,
    description: "Campsites & lodging",
  },
  {
    id: "connectivity",
    label: "Signal",
    icon: Signal,
    description: "Starlink & cellular",
  },
  {
    id: "weather",
    label: "Weather",
    icon: CloudSun,
    description: "Forecasts & hazards",
  },
  {
    id: "power",
    label: "Power",
    icon: BatteryCharging,
    description: "Solar & battery",
  },
  {
    id: "gear",
    label: "Gear",
    icon: PackageCheck,
    description: "Equipment & supplies",
  },
  {
    id: "expenses",
    label: "Ledger",
    icon: ReceiptText,
    description: "Expenses & mileage",
  },
  {
    id: "journal",
    label: "Journal",
    icon: BookOpen,
    description: "Location entries",
  },
  {
    id: "checkins",
    label: "Safety",
    icon: ShieldCheck,
    description: "Emergency check-ins",
  },
] as const;
type ModuleId = (typeof modules)[number]["id"];
export function ConsoleShell() {
  const [active, setActive] = useState<ModuleId>("overview");
  useEffect(() => {
    const saved = localStorage.getItem(
      "blended-basecamp-console-module",
    ) as ModuleId | null;
    if (saved && modules.some((m) => m.id === saved)) setActive(saved);
  }, []);
  const select = (id: ModuleId) => {
    setActive(id);
    localStorage.setItem("blended-basecamp-console-module", id);
  };
  const current = modules.find((m) => m.id === active) ?? modules[0];
  return (
    <main className="flex h-dvh min-h-[680px] flex-col overflow-hidden bg-[#101b18] text-[#dfe9e4]">
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-[#6d8e7f]/30 bg-[#152622] px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-lg border border-[#e7b65f]/40 bg-[#e7b65f]/10 text-[#e7b65f]">
            <TentTree size={22} />
          </span>
          <div>
            <b className="basecamp-serif block text-xl leading-none text-white">
              Blended Basecamp
            </b>
            <small className="mt-1 block text-[9px] font-bold uppercase tracking-[.24em] text-[#7fa393]">
              Operations console
            </small>
          </div>
        </div>
        <div className="hidden items-center gap-5 text-[10px] font-bold uppercase tracking-wider sm:flex">
          <span className="flex items-center gap-2 text-[#7ec69f]">
            <i className="size-2 animate-pulse rounded-full bg-[#62d394]" />
            System online
          </span>
          <span className="text-[#8da49a]">
            {new Date().toLocaleDateString()}
          </span>
        </div>
      </header>
      <div className="console-workspace shrink-0 text-[#1d352f]">
        <WorkspaceSwitcher />
      </div>
      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-52 shrink-0 overflow-y-auto border-r border-[#6d8e7f]/25 bg-[#12211d] p-3 md:block">
          <p className="mb-2 px-3 text-[9px] font-extrabold uppercase tracking-[.2em] text-[#68877a]">
            Modules
          </p>
          {modules.map(({ id, label, icon: Icon, description }) => (
            <button
              key={id}
              onClick={() => select(id)}
              className={`mb-1 flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition ${active === id ? "border-[#e7b65f]/40 bg-[#e7b65f]/10 text-[#f1d69e]" : "border-transparent text-[#a9beb5] hover:bg-white/5 hover:text-white"}`}
            >
              <Icon size={17} />
              <span>
                <b className="block text-xs">{label}</b>
                <small className="text-[9px] opacity-60">{description}</small>
              </span>
            </button>
          ))}
        </aside>
        <section className="flex min-w-0 flex-1 flex-col bg-[#e9e4d9] text-[#1d352f]">
          <div className="flex shrink-0 items-center gap-3 border-b border-black/10 bg-[#f5f1e8] px-4 py-3 sm:px-6">
            <select
              aria-label="Active Basecamp module"
              value={active}
              onChange={(e) => select(e.target.value as ModuleId)}
              className="min-w-0 flex-1 rounded-lg border border-black/10 bg-white px-3 py-2 text-sm font-bold md:hidden"
            >
              {modules.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label} — {m.description}
                </option>
              ))}
            </select>
            <div className="hidden items-center gap-3 md:flex">
              <current.icon className="text-[#a76536]" size={21} />
              <div>
                <p className="text-[9px] font-extrabold uppercase tracking-[.18em] text-[#8a7a63]">
                  Active module
                </p>
                <h1 className="basecamp-serif text-xl font-bold">
                  {current.label}
                </h1>
              </div>
            </div>
            <span className="ml-auto hidden rounded-full bg-[#dfe9e3] px-3 py-1 text-[9px] font-bold uppercase tracking-wider text-[#456557] sm:block">
              Workspace isolated
            </span>
          </div>
          <div className="console-module min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
            {active === "overview" ? (
              <Overview select={select} />
            ) : active === "planner" ? (
              <CalendarPlanner />
            ) : active === "travel" ? (
              <TravelStayPlanner />
            ) : active === "connectivity" ? (
              <ConnectivityLog />
            ) : active === "weather" ? (
              <WeatherHazardCenter />
            ) : active === "power" ? (
              <SolarBatteryPlanner />
            ) : active === "gear" ? (
              <EquipmentChecklist />
            ) : active === "expenses" ? (
              <ExpenseMileageTracker />
            ) : active === "journal" ? (
              <LocationJournal />
            ) : (
              <EmergencyCheckins />
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
function Overview({ select }: { select: (id: ModuleId) => void }) {
  const cards = [
    {
      id: "planner" as ModuleId,
      icon: CalendarDays,
      title: "Plan the work",
      body: "Set work blocks, meetings, and travel dates.",
    },
    {
      id: "connectivity" as ModuleId,
      icon: Activity,
      title: "Check the signal",
      body: "Log Starlink and cellular performance.",
    },
    {
      id: "weather" as ModuleId,
      icon: CloudSun,
      title: "Watch conditions",
      body: "Load forecasts and active hazards.",
    },
    {
      id: "power" as ModuleId,
      icon: BatteryCharging,
      title: "Balance power",
      body: "Compare solar production with daily loads.",
    },
    {
      id: "travel" as ModuleId,
      icon: MapPinned,
      title: "Plan the stay",
      body: "Organize campsites, lodging, and routes.",
    },
    {
      id: "expenses" as ModuleId,
      icon: BriefcaseBusiness,
      title: "Run the business",
      body: "Track mileage, costs, and records.",
    },
  ];
  return (
    <div className="mx-auto max-w-6xl">
      <div className="rounded-2xl border border-[#526e62]/30 bg-[#183029] p-6 text-white shadow-xl sm:p-8">
        <p className="text-[10px] font-extrabold uppercase tracking-[.22em] text-[#e7b65f]">
          Basecamp command
        </p>
        <h2 className="basecamp-serif mt-2 text-3xl font-bold sm:text-5xl">
          Everything you need. One module at a time.
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[#b8ccc3]">
          Choose a system from the console rail. Your current workspace keeps
          its own plans, logs, finances, gear, journal, and safety records.
        </p>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map(({ id, icon: Icon, title, body }) => (
          <button
            key={id}
            onClick={() => select(id)}
            className="panel group p-5 text-left transition hover:-translate-y-0.5 hover:border-[#527568]"
          >
            <div className="flex items-start justify-between">
              <span className="grid size-10 place-items-center rounded-xl bg-[#e2eee7] text-[#527568]">
                <Icon size={19} />
              </span>
              <span className="text-[#a76536]">→</span>
            </div>
            <h3 className="basecamp-serif mt-4 text-xl font-bold">{title}</h3>
            <p className="mt-2 text-xs leading-5 text-[#68746f]">{body}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
