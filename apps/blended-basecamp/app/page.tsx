"use client";
import { useEffect, useMemo, useState } from "react";
import {
  BatteryCharging,
  BriefcaseBusiness,
  Check,
  CloudSun,
  Compass,
  Gauge,
  MapPinned,
  Menu,
  NotebookPen,
  Plus,
  Radio,
  ShieldCheck,
  Signal,
  Sun,
  TentTree,
  Wifi,
  X,
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
type Task = {
  id: number;
  text: string;
  done: boolean;
  group: "work" | "camp" | "travel";
};
type Note = { id: number; text: string; created: string };
const starterTasks: Task[] = [
  {
    id: 1,
    text: "Confirm today’s calls and focus block",
    done: false,
    group: "work",
  },
  { id: 2, text: "Check Starlink view of the sky", done: true, group: "camp" },
  {
    id: 3,
    text: "Review weather before tomorrow’s move",
    done: false,
    group: "travel",
  },
];
const groups = { work: "Work", camp: "Basecamp", travel: "Travel" } as const;
export default function BasecampPage() {
  const [menuOpen, setMenuOpen] = useState(false),
    [tasks, setTasks] = useState<Task[]>(starterTasks),
    [notes, setNotes] = useState<Note[]>([]),
    [taskText, setTaskText] = useState(""),
    [noteText, setNoteText] = useState(""),
    [location, setLocation] = useState("Olympia, Washington"),
    [battery, setBattery] = useState(78),
    [watts, setWatts] = useState(310),
    [ready, setReady] = useState(false);
  useEffect(() => {
    try {
      const raw = localStorage.getItem("blended-basecamp");
      if (raw) {
        const s = JSON.parse(raw);
        if (s.tasks) setTasks(s.tasks);
        if (s.notes) setNotes(s.notes);
        if (s.location) setLocation(s.location);
        if (typeof s.battery === "number") setBattery(s.battery);
        if (typeof s.watts === "number") setWatts(s.watts);
      }
    } catch {
      localStorage.removeItem("blended-basecamp");
    }
    setReady(true);
  }, []);
  useEffect(() => {
    if (ready)
      localStorage.setItem(
        "blended-basecamp",
        JSON.stringify({ tasks, notes, location, battery, watts }),
      );
  }, [tasks, notes, location, battery, watts, ready]);
  const completed = useMemo(() => tasks.filter((t) => t.done).length, [tasks]);
  const addTask = () => {
    if (taskText.trim()) {
      setTasks((v) => [
        ...v,
        { id: Date.now(), text: taskText.trim(), done: false, group: "work" },
      ]);
      setTaskText("");
    }
  };
  const saveNote = () => {
    if (noteText.trim()) {
      setNotes((v) => [
        {
          id: Date.now(),
          text: noteText.trim(),
          created: new Date().toLocaleDateString(),
        },
        ...v,
      ]);
      setNoteText("");
    }
  };
  return (
    <main className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#172b27]/95 text-white backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1500px] items-center justify-between px-4 sm:px-7">
          <a href="#top" className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-[#e7b65f] text-[#17302a]">
              <TentTree size={22} />
            </span>
            <span>
              <b className="basecamp-serif block text-xl leading-none">
                Blended Basecamp
              </b>
              <small className="mt-1 block text-[9px] font-bold uppercase tracking-[.25em] text-[#b9cbc5]">
                Work well. Roam farther.
              </small>
            </span>
          </a>
          <nav className="hidden items-center gap-7 text-xs font-bold uppercase tracking-[.16em] md:flex">
            <a href="#today">Today</a>
            <a href="#planner">Planner</a>
            <a href="#connectivity-log">Connectivity</a>
            <a href="#weather-hazards">Weather</a>
            <a href="#power-planner">Power</a>
            <a href="#equipment-checklist">Gear</a>
            <a href="#expense-mileage">Expenses</a>
            <a href="#location-journal">Journal</a>
            <a href="#emergency-checkins">Check-ins</a>
            <a href="#travel-planner">Travel</a>
            <a href="#systems">Systems</a>
            <a href="#journal">Journal</a>
            <a href="#road">Road ahead</a>
          </nav>
          <button
            aria-label="Open navigation"
            onClick={() => setMenuOpen(!menuOpen)}
            className="grid size-10 place-items-center rounded-xl border border-white/15 md:hidden"
          >
            {menuOpen ? <X /> : <Menu />}
          </button>
        </div>
        {menuOpen && (
          <nav className="grid gap-1 border-t border-white/10 px-4 py-3 text-sm font-semibold md:hidden">
            {[
              ["Today", "#today"],
              ["Planner", "#planner"],
              ["Connectivity", "#connectivity-log"],
              ["Weather", "#weather-hazards"],
              ["Power", "#power-planner"],
              ["Gear", "#equipment-checklist"],
              ["Expenses", "#expense-mileage"],
              ["Location journal", "#location-journal"],
              ["Emergency check-ins", "#emergency-checkins"],
              ["Travel", "#travel-planner"],
              ["Systems", "#systems"],
              ["Journal", "#journal"],
              ["Road ahead", "#road"],
            ].map(([l, h]) => (
              <a
                onClick={() => setMenuOpen(false)}
                className="rounded-lg px-3 py-2"
                href={h}
                key={h}
              >
                {l}
              </a>
            ))}
          </nav>
        )}
      </header>
      <WorkspaceSwitcher />
      <section
        id="top"
        className="hero-grid border-b border-[#d7d0c0] px-4 py-8 sm:px-7 sm:py-12"
      >
        <div className="mx-auto grid max-w-[1500px] gap-8 lg:grid-cols-[1.25fr_.75fr] lg:items-end">
          <div>
            <p className="mb-4 flex items-center gap-2 text-xs font-extrabold uppercase tracking-[.2em] text-[#a66130]">
              <Compass size={16} />
              Your workday, wherever you park it
            </p>
            <h1 className="basecamp-serif max-w-4xl text-5xl font-bold leading-[.98] tracking-tight text-[#17332d] sm:text-7xl">
              Keep business moving without losing the wild.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-[#596963] sm:text-lg">
              One practical home for remote work, camp readiness, power,
              connectivity, travel, and the moments worth remembering.
            </p>
          </div>
          <div className="rounded-[28px] border border-[#c7bfae] bg-[#fffdf7]/80 p-5 shadow-xl">
            <label className="text-[10px] font-extrabold uppercase tracking-[.18em] text-[#806f55]">
              Current basecamp
            </label>
            <div className="mt-2 flex items-center gap-3">
              <MapPinned className="shrink-0 text-[#b46c36]" />
              <input
                aria-label="Current basecamp location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="min-w-0 flex-1 bg-transparent text-lg font-bold outline-none"
              />
            </div>
            <div className="mt-5 grid grid-cols-3 gap-2 text-center">
              <Status icon={Wifi} value="Online" label="Connection" />
              <Status icon={CloudSun} value="Mild" label="Weather" />
              <Status icon={ShieldCheck} value="Ready" label="Safety" />
            </div>
          </div>
        </div>
      </section>
      <div className="mx-auto max-w-[1500px] px-4 py-7 sm:px-7 sm:py-10">
        <section id="today" className="mb-10">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Today at basecamp</p>
              <h2 className="basecamp-serif text-3xl font-bold sm:text-4xl">
                Make the day count.
              </h2>
            </div>
            <span className="rounded-full bg-[#e8efe8] px-3 py-1.5 text-xs font-bold text-[#426052]">
              {completed} of {tasks.length} complete
            </span>
          </div>
          <div className="grid gap-5 xl:grid-cols-[1.25fr_.75fr]">
            <div className="panel overflow-hidden">
              <div className="border-b border-[var(--line)] p-5">
                <div className="flex gap-2">
                  <input
                    aria-label="New task"
                    value={taskText}
                    onChange={(e) => setTaskText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addTask()}
                    placeholder="Add what needs doing..."
                    className="h-11 min-w-0 flex-1 rounded-xl border border-[#d9d2c5] bg-white px-4 outline-[#527568]"
                  />
                  <button
                    onClick={addTask}
                    className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#244a40] text-white"
                    aria-label="Add task"
                  >
                    <Plus />
                  </button>
                </div>
              </div>
              {tasks.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center gap-3 border-b border-[var(--line)] px-5 py-4 last:border-0"
                >
                  <button
                    aria-label="Toggle task"
                    onClick={() =>
                      setTasks((v) =>
                        v.map((i) =>
                          i.id === t.id ? { ...i, done: !i.done } : i,
                        ),
                      )
                    }
                    className={`grid size-6 shrink-0 place-items-center rounded-full border ${t.done ? "border-[#527568] bg-[#527568] text-white" : "border-[#b8b1a4]"}`}
                  >
                    {t.done && <Check size={14} />}
                  </button>
                  <span
                    className={`min-w-0 flex-1 text-sm font-semibold ${t.done ? "text-[#8a918d] line-through" : ""}`}
                  >
                    {t.text}
                  </span>
                  <span className="rounded-full bg-[#eee9df] px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-wider">
                    {groups[t.group]}
                  </span>
                </div>
              ))}
            </div>
            <aside className="rounded-[26px] bg-[#203f37] p-6 text-white">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-[.2em] text-[#e6c57d]">
                    Daily briefing
                  </p>
                  <h3 className="basecamp-serif mt-2 text-3xl font-bold">
                    Clear skies ahead.
                  </h3>
                </div>
                <Sun className="text-[#efc66c]" size={30} />
              </div>
              <p className="mt-5 leading-7 text-[#d3dfda]">
                Your connection is marked online and your power reserve is
                healthy. Protect one focused work block, then leave room to
                explore.
              </p>
              <div className="mt-7 grid grid-cols-2 gap-3">
                <Brief
                  icon={BriefcaseBusiness}
                  value="3 hours"
                  label="Focus capacity"
                />
                <Brief icon={CloudSun} value="6:42 PM" label="Last light" />
              </div>
            </aside>
          </div>
        </section>
        <CalendarPlanner />
        <ConnectivityLog />
        <WeatherHazardCenter />
        <SolarBatteryPlanner />
        <EquipmentChecklist />
        <ExpenseMileageTracker />
        <LocationJournal />
        <EmergencyCheckins />
        <TravelStayPlanner />
        <section id="systems" className="mb-10">
          <p className="eyebrow">Essential systems</p>
          <h2 className="basecamp-serif mb-5 text-3xl font-bold sm:text-4xl">
            Know what keeps you moving.
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            <System
              icon={Signal}
              title="Connection"
              kicker="Work ready"
              value="86"
              unit="Mbps"
              body="Starlink primary · cellular backup"
            >
              <div className="meter">
                <i style={{ width: "86%" }} />
              </div>
            </System>
            <System
              icon={BatteryCharging}
              title="Power"
              kicker="Healthy reserve"
              value={`${battery}`}
              unit="%"
              body={`${watts}W solar input`}
            >
              <div className="mt-5 grid grid-cols-2 gap-3">
                <label className="range-label">
                  Battery
                  <input
                    aria-label="Battery percent"
                    type="range"
                    min="0"
                    max="100"
                    value={battery}
                    onChange={(e) => setBattery(Number(e.target.value))}
                  />
                </label>
                <label className="range-label">
                  Solar watts
                  <input
                    aria-label="Solar watts"
                    type="range"
                    min="0"
                    max="800"
                    value={watts}
                    onChange={(e) => setWatts(Number(e.target.value))}
                  />
                </label>
              </div>
            </System>
            <System
              icon={Radio}
              title="Safety"
              kicker="Plan active"
              value="4"
              unit="contacts"
              body="Next check-in · 7:00 PM"
            >
              <div className="meter">
                <i style={{ width: "75%" }} />
              </div>
            </System>
          </div>
        </section>
        <section className="grid gap-5 lg:grid-cols-[.8fr_1.2fr]">
          <div id="journal" className="panel p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="eyebrow">Field journal</p>
                <h2 className="basecamp-serif text-3xl font-bold">
                  Save the story.
                </h2>
              </div>
              <NotebookPen className="text-[#b46c36]" />
            </div>
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="What did you notice, learn, or decide today?"
              className="mt-5 min-h-32 w-full rounded-2xl border border-[#d8d1c3] bg-[#fffdf8] p-4 text-sm outline-[#527568]"
            />
            <button
              onClick={saveNote}
              className="mt-3 w-full rounded-xl bg-[#b66e38] px-4 py-3 text-sm font-bold text-white"
            >
              Save field note
            </button>
            {notes.slice(0, 2).map((n) => (
              <article
                key={n.id}
                className="mt-4 border-t border-[var(--line)] pt-4"
              >
                <p className="text-xs leading-5">{n.text}</p>
                <small>{n.created}</small>
              </article>
            ))}
          </div>
          <div
            id="road"
            className="rounded-[26px] border border-[#d3c6aa] bg-[#eee5d2] p-5 sm:p-7"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="eyebrow">Road ahead</p>
                <h2 className="basecamp-serif text-3xl font-bold">
                  Tomorrow’s move
                </h2>
                <p className="mt-2 text-sm text-[#65726d]">
                  Plan the next work-and-travel day.
                </p>
              </div>
              <div className="grid size-16 place-items-center rounded-full bg-[#244a40] text-white">
                <Compass size={30} />
              </div>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <Road icon={MapPinned} title="Destination" value="Not selected" />
              <Road icon={CloudSun} title="Conditions" value="Check forecast" />
              <Road icon={Gauge} title="Drive window" value="Set departure" />
            </div>
          </div>
        </section>
        <footer className="mt-10 flex flex-col justify-between gap-2 border-t border-[var(--line)] py-6 text-xs text-[#77827d] sm:flex-row">
          <p>Blended Basecamp · A Blended Works app</p>
          <p>Your first-edition data stays on this device.</p>
        </footer>
      </div>
    </main>
  );
}
function Status({
  icon: Icon,
  value,
  label,
}: {
  icon: typeof Wifi;
  value: string;
  label: string;
}) {
  return (
    <div className="rounded-xl bg-[#eee9df] px-2 py-3">
      <Icon className="mx-auto text-[#527568]" size={17} />
      <b className="mt-1 block text-xs">{value}</b>
      <span className="text-[9px] uppercase tracking-wider">{label}</span>
    </div>
  );
}
function Brief({
  icon: Icon,
  value,
  label,
}: {
  icon: typeof Wifi;
  value: string;
  label: string;
}) {
  return (
    <div className="brief">
      <Icon />
      <b>{value}</b>
      <span>{label}</span>
    </div>
  );
}
function System({
  icon: Icon,
  title,
  kicker,
  value,
  unit,
  body,
  children,
}: {
  icon: typeof Wifi;
  title: string;
  kicker: string;
  value: string;
  unit: string;
  body: string;
  children: React.ReactNode;
}) {
  return (
    <article className="panel p-5 sm:p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="eyebrow">{kicker}</p>
          <h3 className="basecamp-serif text-2xl font-bold">{title}</h3>
        </div>
        <span className="grid size-10 place-items-center rounded-xl bg-[#527568] text-white">
          <Icon size={20} />
        </span>
      </div>
      <div className="mt-6 flex items-end gap-1">
        <strong className="basecamp-serif text-5xl leading-none">
          {value}
        </strong>
        <span className="mb-1 text-sm font-bold">{unit}</span>
      </div>
      <p className="mt-2 text-xs text-[#6d7772]">{body}</p>
      {children}
    </article>
  );
}
function Road({
  icon: Icon,
  title,
  value,
}: {
  icon: typeof Wifi;
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-[#fffdf8]/80 p-4">
      <Icon className="mb-4 text-[#a76536]" />
      <span className="block text-[9px] font-extrabold uppercase tracking-[.16em]">
        {title}
      </span>
      <b className="mt-1 block text-sm">{value}</b>
    </div>
  );
}
