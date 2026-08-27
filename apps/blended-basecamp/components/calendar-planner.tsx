"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Plus,
  Target,
} from "lucide-react";

type CalendarItem = {
  id: number;
  date: string;
  title: string;
  type: "work" | "travel" | "personal";
  time: string;
};
const types = {
  work: { label: "Work", color: "#527568" },
  travel: { label: "Travel", color: "#b66e38" },
  personal: { label: "Personal", color: "#806b9a" },
} as const;
const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function CalendarPlanner() {
  const now = new Date();
  const [view, setView] = useState(
    new Date(now.getFullYear(), now.getMonth(), 1),
  );
  const [selectedDay, setSelectedDay] = useState(now.getDate());
  const [items, setItems] = useState<CalendarItem[]>([]);
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("09:00");
  const [type, setType] = useState<CalendarItem["type"]>("work");
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    try {
      const saved = localStorage.getItem("blended-basecamp-calendar");
      if (saved) setItems(JSON.parse(saved));
    } catch {
      localStorage.removeItem("blended-basecamp-calendar");
    }
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (loaded)
      localStorage.setItem("blended-basecamp-calendar", JSON.stringify(items));
  }, [items, loaded]);
  const dateKey = (day: number) =>
    `${view.getFullYear()}-${String(view.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const cells = useMemo(() => {
    const blank = new Date(view.getFullYear(), view.getMonth(), 1).getDay(),
      count = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
    return [
      ...Array(blank).fill(null),
      ...Array.from({ length: count }, (_, i) => i + 1),
    ] as (number | null)[];
  }, [view]);
  const selectedKey = dateKey(selectedDay),
    selectedItems = items
      .filter((i) => i.date === selectedKey)
      .sort((a, b) => a.time.localeCompare(b.time));
  const addItem = () => {
    if (!title.trim()) return;
    setItems((v) => [
      ...v,
      { id: Date.now(), date: selectedKey, title: title.trim(), type, time },
    ]);
    setTitle("");
  };
  const moveMonth = (offset: number) => {
    setView(new Date(view.getFullYear(), view.getMonth() + offset, 1));
    setSelectedDay(1);
  };
  return (
    <section id="planner" className="mb-10">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Calendar & work planner</p>
          <h2 className="basecamp-serif text-3xl font-bold sm:text-4xl">
            Plan work around real life.
          </h2>
        </div>
        <CalendarDays className="text-[#a76536]" size={28} />
      </div>
      <div className="grid items-start gap-5 xl:grid-cols-[1.35fr_.65fr]">
        <div className="panel overflow-hidden">
          <div className="flex items-center justify-between border-b border-black/10 p-5">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-[#8e806c]">
                Monthly view
              </p>
              <h3 className="basecamp-serif text-2xl font-bold">
                {months[view.getMonth()]} {view.getFullYear()}
              </h3>
            </div>
            <div className="flex gap-2">
              <button
                aria-label="Previous month"
                onClick={() => moveMonth(-1)}
                className="grid size-10 place-items-center rounded-xl border border-black/10 bg-white"
              >
                <ChevronLeft />
              </button>
              <button
                aria-label="Next month"
                onClick={() => moveMonth(1)}
                className="grid size-10 place-items-center rounded-xl border border-black/10 bg-white"
              >
                <ChevronRight />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-7 bg-[#eee9df] text-center text-[9px] font-extrabold uppercase tracking-wider text-[#766c5e]">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div className="py-3" key={d}>
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {cells.map((day, index) => {
              const dayItems = day
                ? items.filter((i) => i.date === dateKey(day))
                : [];
              return (
                <button
                  key={index}
                  disabled={!day}
                  onClick={() => day && setSelectedDay(day)}
                  className={`min-h-20 border-b border-r border-black/10 p-1.5 text-left sm:min-h-28 sm:p-2 ${day === selectedDay ? "bg-[#e8efe8] ring-2 ring-inset ring-[#527568]" : "bg-[#fffdf8] hover:bg-[#f7f2e8]"}`}
                >
                  {day && (
                    <>
                      <span className="text-xs font-bold">{day}</span>
                      <div className="mt-1 space-y-1">
                        {dayItems.slice(0, 2).map((i) => (
                          <div
                            key={i.id}
                            className="truncate rounded px-1.5 py-1 text-[8px] font-bold text-white sm:text-[10px]"
                            style={{ background: types[i.type].color }}
                          >
                            {i.time} {i.title}
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </button>
              );
            })}
          </div>
        </div>
        <aside className="panel p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="eyebrow">Selected day</p>
              <h3 className="basecamp-serif text-2xl font-bold">
                {months[view.getMonth()]} {selectedDay}
              </h3>
            </div>
            <Target className="text-[#527568]" />
          </div>
          <div className="mt-5 space-y-2">
            {selectedItems.length === 0 && (
              <p className="rounded-xl bg-[#eee9df] p-4 text-sm text-[#68746f]">
                Nothing scheduled yet. Protect your work time or plan the next
                move.
              </p>
            )}
            {selectedItems.map((i) => (
              <div
                key={i.id}
                className="flex items-center gap-3 rounded-xl border border-black/10 bg-white p-3"
              >
                <span
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ background: types[i.type].color }}
                />
                <div className="min-w-0 flex-1">
                  <b className="block truncate text-sm">{i.title}</b>
                  <span className="flex items-center gap-1 text-[10px] text-[#78827e]">
                    <Clock3 size={11} />
                    {i.time} · {types[i.type].label}
                  </span>
                </div>
                <button
                  aria-label="Complete item"
                  onClick={() =>
                    setItems((v) => v.filter((e) => e.id !== i.id))
                  }
                  className="grid size-8 place-items-center rounded-lg text-[#527568] hover:bg-[#e8efe8]"
                >
                  <Check size={16} />
                </button>
              </div>
            ))}
          </div>
          <div className="mt-6 border-t border-black/10 pt-5">
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-[#766c5e]">
              Add work or calendar item
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addItem()}
              placeholder="Meeting, focus block, travel..."
              className="mt-2 h-11 w-full rounded-xl border border-black/10 bg-white px-3 text-sm outline-[#527568]"
            />
            <div className="mt-2 grid grid-cols-[1fr_1fr_auto] gap-2">
              <input
                aria-label="Time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="min-w-0 rounded-xl border border-black/10 bg-white px-2 text-xs"
              />
              <select
                aria-label="Item type"
                value={type}
                onChange={(e) =>
                  setType(e.target.value as CalendarItem["type"])
                }
                className="min-w-0 rounded-xl border border-black/10 bg-white px-2 text-xs"
              >
                {Object.entries(types).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.label}
                  </option>
                ))}
              </select>
              <button
                onClick={addItem}
                aria-label="Add calendar item"
                className="grid size-11 place-items-center rounded-xl bg-[#244a40] text-white"
              >
                <Plus />
              </button>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
