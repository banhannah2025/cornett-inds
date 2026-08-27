"use client";
import { cloneElement, useEffect, useMemo, useState } from "react";
import {
  Bell,
  CheckCircle2,
  Clock3,
  Copy,
  MapPinned,
  Phone,
  Plus,
  ShieldAlert,
  Trash2,
  UserRoundPlus,
} from "lucide-react";
type Contact = { id: number; name: string; phone: string };
type Plan = {
  id: number;
  title: string;
  location: string;
  due: string;
  notes: string;
  safe: boolean;
  lastCheckin: string;
};
export function EmergencyCheckins() {
  const [contacts, setContacts] = useState<Contact[]>([]),
    [plans, setPlans] = useState<Plan[]>([]),
    [name, setName] = useState(""),
    [phone, setPhone] = useState(""),
    [title, setTitle] = useState(""),
    [location, setLocation] = useState(""),
    [due, setDue] = useState(""),
    [notes, setNotes] = useState(""),
    [now, setNow] = useState(Date.now()),
    [copied, setCopied] = useState(false),
    [loaded, setLoaded] = useState(false);
  useEffect(() => {
    try {
      const r = localStorage.getItem("blended-basecamp-checkins");
      if (r) {
        const d = JSON.parse(r);
        setContacts(d.contacts ?? []);
        setPlans(d.plans ?? []);
      }
    } catch {}
    setLoaded(true);
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    if (loaded)
      localStorage.setItem(
        "blended-basecamp-checkins",
        JSON.stringify({ contacts, plans }),
      );
  }, [contacts, plans, loaded]);
  const overdue = useMemo(
    () =>
      plans.filter((p) => !p.safe && p.due && new Date(p.due).getTime() < now)
        .length,
    [plans, now],
  );
  const addContact = () => {
    if (!name.trim() || !phone.trim()) return;
    setContacts((v) => [
      ...v,
      { id: Date.now(), name: name.trim(), phone: phone.trim() },
    ]);
    setName("");
    setPhone("");
  };
  const addPlan = () => {
    if (!title.trim() || !due) return;
    setPlans((v) => [
      {
        id: Date.now(),
        title: title.trim(),
        location: location.trim(),
        due,
        notes: notes.trim(),
        safe: false,
        lastCheckin: "",
      },
      ...v,
    ]);
    setTitle("");
    setLocation("");
    setDue("");
    setNotes("");
  };
  const message = (p: Plan, urgent = false) =>
    urgent
      ? `I may need assistance. My plan: ${p.title}. Last known location: ${p.location || "not provided"}. Check-in was due ${new Date(p.due).toLocaleString()}. Details: ${p.notes || "none"}`
      : `I am checking in safe for: ${p.title}. Location: ${p.location || "not provided"}. Time: ${new Date().toLocaleString()}.`;
  const share = async (text: string) => {
    if (navigator.share) await navigator.share({ text });
    else {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };
  const enable = async () => {
    "Notification" in window &&
      Notification.permission === "default" &&
      (await Notification.requestPermission());
  };
  return (
    <section id="emergency-checkins" className="mb-10">
      <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow">Emergency check-ins</p>
          <h2 className="basecamp-serif text-3xl font-bold sm:text-4xl">
            Make sure someone knows when you should be back.
          </h2>
        </div>
        <button
          onClick={enable}
          className="flex items-center justify-center gap-2 rounded-xl border border-black/10 bg-white px-4 py-3 text-xs font-bold"
        >
          <Bell size={16} />
          Enable reminders
        </button>
      </div>
      {overdue > 0 && (
        <div className="mb-5 flex gap-3 rounded-2xl bg-[#7f3f32] p-4 text-white">
          <ShieldAlert className="shrink-0 text-[#ffd18c]" />
          <div>
            <b>
              {overdue} overdue check-in{overdue === 1 ? "" : "s"}
            </b>
            <p className="mt-1 text-xs text-white/80">
              Basecamp has not contacted anyone automatically. Share the overdue
              message or contact help now.
            </p>
          </div>
        </div>
      )}
      <div className="grid items-start gap-5 xl:grid-cols-[.65fr_1.35fr]">
        <aside className="space-y-5">
          <div className="panel p-5">
            <p className="eyebrow">Trusted contacts</p>
            <h3 className="basecamp-serif text-2xl font-bold">
              Who should know?
            </h3>
            <div className="mt-3 grid grid-cols-[1fr_1fr_auto] gap-2">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Name"
                className="min-w-0 rounded-xl border border-black/10 px-3 text-sm"
              />
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Phone"
                className="min-w-0 rounded-xl border border-black/10 px-3 text-sm"
              />
              <button
                onClick={addContact}
                className="grid size-11 place-items-center rounded-xl bg-[#244a40] text-white"
              >
                <UserRoundPlus size={18} />
              </button>
            </div>
            <div className="mt-4 space-y-2">
              {contacts.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center gap-3 rounded-xl bg-[#eee9df] p-3"
                >
                  <Phone size={15} />
                  <div className="flex-1">
                    <b className="block text-xs">{c.name}</b>
                    <span className="text-[10px]">{c.phone}</span>
                  </div>
                  <button
                    onClick={() =>
                      setContacts((v) => v.filter((x) => x.id !== c.id))
                    }
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
          <div className="panel p-5">
            <p className="eyebrow">New plan</p>
            <h3 className="basecamp-serif text-2xl font-bold">
              Set a return time.
            </h3>
            <Field label="Plan or activity">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Trail, drive, remote job..."
              />
            </Field>
            <Field label="Location or route">
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Last-known location"
              />
            </Field>
            <Field label="Check-in due">
              <input
                type="datetime-local"
                value={due}
                onChange={(e) => setDue(e.target.value)}
              />
            </Field>
            <Field label="Safety details">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Vehicle, clothing, route, destination..."
              />
            </Field>
            <button
              onClick={addPlan}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#244a40] py-3 text-sm font-bold text-white"
            >
              <Plus size={17} />
              Start check-in plan
            </button>
          </div>
        </aside>
        <div className="panel overflow-hidden">
          <div className="border-b border-black/10 p-5">
            <p className="eyebrow">Active and recent plans</p>
            <h3 className="basecamp-serif text-2xl font-bold">
              Check-in board
            </h3>
          </div>
          {plans.length === 0 ? (
            <p className="p-8 text-center text-sm text-[#68746f]">
              No check-in plans yet.
            </p>
          ) : (
            plans.map((p) => {
              const late = !p.safe && new Date(p.due).getTime() < now;
              return (
                <article
                  key={p.id}
                  className={`border-b border-black/10 p-5 last:border-0 ${late ? "bg-[#fff2ec]" : ""}`}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`grid size-10 shrink-0 place-items-center rounded-xl ${p.safe ? "bg-[#e2eee7] text-[#315b4c]" : late ? "bg-[#f2d7cc] text-[#884936]" : "bg-[#eee9df]"}`}
                    >
                      {p.safe ? <CheckCircle2 /> : <Clock3 />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <span className="text-[9px] font-extrabold uppercase tracking-wider">
                        {p.safe
                          ? "Checked in safe"
                          : late
                            ? "Overdue"
                            : "Active plan"}
                      </span>
                      <h3 className="basecamp-serif mt-1 text-xl font-bold">
                        {p.title}
                      </h3>
                      <p className="mt-1 text-xs">
                        <MapPinned className="mr-1 inline" size={12} />
                        {p.location || "Location not set"} · due{" "}
                        {new Date(p.due).toLocaleString()}
                      </p>
                      {p.notes && (
                        <p className="mt-2 text-xs leading-5 text-[#68746f]">
                          {p.notes}
                        </p>
                      )}
                      <div className="mt-4 flex flex-wrap gap-2">
                        {!p.safe && (
                          <button
                            onClick={() =>
                              setPlans((v) =>
                                v.map((x) =>
                                  x.id === p.id
                                    ? {
                                        ...x,
                                        safe: true,
                                        lastCheckin: new Date().toISOString(),
                                      }
                                    : x,
                                ),
                              )
                            }
                            className="rounded-lg bg-[#527568] px-3 py-2 text-xs font-bold text-white"
                          >
                            I’m safe
                          </button>
                        )}
                        <button
                          onClick={() => share(message(p, false))}
                          className="rounded-lg border border-black/10 bg-white px-3 py-2 text-xs font-bold"
                        >
                          {copied ? "Copied" : "Share safe update"}
                        </button>
                        <button
                          onClick={() => share(message(p, true))}
                          className="rounded-lg bg-[#9a4937] px-3 py-2 text-xs font-bold text-white"
                        >
                          Share overdue/SOS details
                        </button>
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        setPlans((v) => v.filter((x) => x.id !== p.id))
                      }
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </div>
      <div className="mt-5 rounded-xl border border-[#d7c9aa] bg-[#fff7df] p-4 text-xs leading-5">
        <b>Safety limitation:</b> This version stores plans and reminds you only
        while Basecamp is open. It does not automatically contact trusted
        people, emergency services, or rescuers. Call or text 911 when immediate
        help is needed.
      </div>
    </section>
  );
}
const control =
  "mt-2 w-full rounded-xl border border-black/10 bg-[#fffdf8] px-3 py-3 text-sm outline-[#527568]";
function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  const child = children as React.ReactElement<{ className?: string }>;
  return (
    <label className="mt-3 block text-[10px] font-extrabold uppercase tracking-wider">
      {label}
      {cloneElement(child, { className: control })}
    </label>
  );
}
