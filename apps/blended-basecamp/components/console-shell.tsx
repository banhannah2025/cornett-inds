"use client";
import { useEffect, useState } from "react";
import {
  BatteryCharging,
  BookOpen,
  CalendarDays,
  CloudSun,
  Compass,
  Home,
  PackageCheck,
  ReceiptText,
  ShieldCheck,
  Signal,
  TentTree,
} from "lucide-react";
import { CalendarPlanner } from "../components/calendar-planner";
import { ConnectivityLog } from "../components/connectivity-log";
import { TravelStayPlanner } from "../components/travel-stay-planner";
import { WeatherHazardCenter } from "../components/weather-hazard-center";
import { SolarBatteryPlanner } from "../components/solar-battery-planner";
import { EquipmentChecklist } from "../components/equipment-checklist";
import { ExpenseMileageTracker } from "../components/expense-mileage-tracker";
import { LocationJournal } from "../components/location-journal";
import { EmergencyCheckins } from "../components/emergency-checkins";
import { WorkspaceSwitcher } from "../components/workspace-switcher";
const commands = [
  { id: "home", label: "Home", icon: Home, help: "Command deck" },
  {
    id: "planner",
    label: "Plan",
    icon: CalendarDays,
    help: "Calendar and work",
  },
  { id: "travel", label: "Travel", icon: Compass, help: "Stops and lodging" },
  { id: "signal", label: "Signal", icon: Signal, help: "Internet tests" },
  {
    id: "weather",
    label: "Weather",
    icon: CloudSun,
    help: "Forecast and alerts",
  },
  {
    id: "power",
    label: "Power",
    icon: BatteryCharging,
    help: "Solar and batteries",
  },
  { id: "gear", label: "Gear", icon: PackageCheck, help: "Equipment lists" },
  {
    id: "money",
    label: "Money",
    icon: ReceiptText,
    help: "Expenses and miles",
  },
  { id: "journal", label: "Journal", icon: BookOpen, help: "Location notes" },
  {
    id: "safety",
    label: "Safety",
    icon: ShieldCheck,
    help: "Emergency check-ins",
  },
] as const;
type Id = (typeof commands)[number]["id"];
export function ConsoleShell() {
  const [active, setActive] = useState<Id>("home");
  useEffect(() => {
    const s = localStorage.getItem(
      "blended-basecamp-console-module",
    ) as Id | null;
    if (s && commands.some((c) => c.id === s)) setActive(s);
  }, []);
  const go = (id: Id) => {
    setActive(id);
    localStorage.setItem("blended-basecamp-console-module", id);
  };
  const current = commands.find((c) => c.id === active) ?? commands[0],
    CurrentIcon = current.icon;
  return (
    <main className="flex h-dvh min-h-[620px] flex-col overflow-hidden bg-[#0d1714]">
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-[#668274]/25 bg-[#14231f] px-3 text-white sm:px-5">
        <button
          onClick={() => go("home")}
          className="flex items-center gap-3 text-left"
        >
          <span className="grid size-10 place-items-center rounded-lg bg-[#e7b65f] text-[#183029]">
            <TentTree size={21} />
          </span>
          <span className="hidden sm:block">
            <b className="basecamp-serif block text-lg leading-none">
              Blended Basecamp
            </b>
            <small className="mt-1 block text-[8px] font-bold uppercase tracking-[.22em] text-[#789488]">
              Command console
            </small>
          </span>
        </button>
        <WorkspaceSwitcher />
      </header>
      <div className="flex min-h-0 flex-1">
        <nav className="hidden w-[76px] shrink-0 flex-col items-center gap-1 overflow-y-auto border-r border-[#668274]/25 bg-[#101d19] py-3 md:flex">
          {commands.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              title={label}
              onClick={() => go(id)}
              className={`flex w-16 flex-col items-center gap-1 rounded-xl border py-2 text-[9px] font-bold transition ${active === id ? "border-[#e7b65f]/50 bg-[#e7b65f]/15 text-[#f2cf88]" : "border-transparent text-[#789488] hover:bg-white/5 hover:text-white"}`}
            >
              <Icon size={19} />
              {label}
            </button>
          ))}
        </nav>
        <section className="flex min-w-0 flex-1 flex-col bg-[#e8e3d8] text-[#1d352f]">
          <div className="flex h-14 shrink-0 items-center gap-3 border-b border-black/10 bg-[#f7f3ea] px-4">
            <button
              onClick={() => go("home")}
              className="grid size-9 place-items-center rounded-lg border border-black/10 bg-white md:hidden"
            >
              <Home size={17} />
            </button>
            <span className="grid size-9 place-items-center rounded-lg bg-[#dfe9e3] text-[#527568]">
              <CurrentIcon size={18} />
            </span>
            <div>
              <p className="text-[8px] font-extrabold uppercase tracking-[.18em] text-[#8b7d68]">
                Current command
              </p>
              <h1 className="basecamp-serif text-lg font-bold">
                {current.label}
              </h1>
            </div>
            <p className="ml-auto hidden text-xs text-[#68746f] sm:block">
              {current.help}
            </p>
          </div>
          <div className="console-module min-h-0 flex-1 overflow-y-auto p-3 sm:p-5">
            {active === "home" ? (
              <CommandDeck go={go} />
            ) : active === "planner" ? (
              <CalendarPlanner />
            ) : active === "travel" ? (
              <TravelStayPlanner />
            ) : active === "signal" ? (
              <ConnectivityLog />
            ) : active === "weather" ? (
              <WeatherHazardCenter />
            ) : active === "power" ? (
              <SolarBatteryPlanner />
            ) : active === "gear" ? (
              <EquipmentChecklist />
            ) : active === "money" ? (
              <ExpenseMileageTracker />
            ) : active === "journal" ? (
              <LocationJournal />
            ) : (
              <EmergencyCheckins />
            )}
          </div>
          <nav className="flex h-[68px] shrink-0 gap-1 overflow-x-auto border-t border-[#668274]/25 bg-[#14231f] px-2 py-1 md:hidden">
            {commands.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => go(id)}
                className={`flex min-w-[58px] flex-1 flex-col items-center justify-center gap-1 rounded-lg text-[8px] font-bold ${active === id ? "bg-[#e7b65f] text-[#183029]" : "text-[#91a89e]"}`}
              >
                <Icon size={18} />
                {label}
              </button>
            ))}
          </nav>
        </section>
      </div>
    </main>
  );
}
function CommandDeck({ go }: { go: (id: Id) => void }) {
  return (
    <div className="mx-auto flex min-h-full max-w-5xl flex-col justify-center">
      <div className="mb-5 text-center">
        <p className="text-[10px] font-extrabold uppercase tracking-[.22em] text-[#a76536]">
          Select a command
        </p>
        <h2 className="basecamp-serif mt-2 text-3xl font-bold sm:text-5xl">
          What do you need to do?
        </h2>
        <p className="mt-2 text-sm text-[#68746f]">
          Choose one system. Basecamp will keep the rest out of your way.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {commands.slice(1).map(({ id, label, icon: Icon, help }) => (
          <button
            key={id}
            onClick={() => go(id)}
            className="group min-h-32 rounded-2xl border border-[#bec8c1] bg-[#fffdf8] p-4 text-left shadow-sm transition hover:border-[#527568] hover:bg-[#f4f9f5] sm:min-h-40 sm:p-5"
          >
            <span className="grid size-11 place-items-center rounded-xl bg-[#203f37] text-[#e7b65f] transition group-hover:scale-105">
              <Icon size={22} />
            </span>
            <h3 className="basecamp-serif mt-4 text-xl font-bold sm:text-2xl">
              {label}
            </h3>
            <p className="mt-1 text-xs text-[#68746f]">{help}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
