"use client";
import { useSharedCalendar } from "./use-shared-calendar";
import {
  useSpiritualReports,
  type SpiritualReport,
} from "./use-spiritual-reports";
import { PhotoInput } from "./photo-input";
import { createUnidentifiedOffenderPdf } from "./unidentified-offender";
import { SpiritualOutcomesEditor } from "./spiritual-outcomes-editor";
import { createSpiritualOutcomesPdf } from "./spiritual-outcomes";
import { StaffShifts } from "./staff-shifts";
import { ShelterLogEditor } from "./shelter-log-editor";
import { createShelterLogPdf } from "./shelter-log";
import {
  MedicalInsideListEditor,
  initialMedicalInsideValues,
} from "./medical-inside-list-editor";
import { createMedicalInsideListPdf } from "./medical-inside-list";
import { BanLogEditor } from "./ban-log-editor";
import { createBanLogPdf } from "./ban-log";

import { useEffect, useRef, useState } from "react";
import { createIncidentReportPdf } from "./incident-report";
import { createShiftNotesPdf } from "./shift-notes";
import { ShiftNotesEditor } from "./shift-notes-editor";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Shield,
  BookHeart,
  Mic,
  Printer,
  Plus,
} from "lucide-react";
import { saveDevotional } from "../../web/app/admin-actions";
import {
  securityTemplates,
  calendarEntryOnDay,
  devotionalFields,
  type DevotionalDraft,
} from "./index";

const monthLabel = new Intl.DateTimeFormat("en-US", {
  month: "long",
  year: "numeric",
});
const dayLabel = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  month: "long",
  day: "numeric",
});
const scheduleTime = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
});

function localDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function displayTime(date: string, time: string) {
  const value = new Date(`${date}T${time}`);
  return Number.isNaN(value.getTime()) ? time : scheduleTime.format(value);
}

const emptyDraft: DevotionalDraft = {
  title: "",
  excerpt: "",
  scriptureReference: "",
  scriptureText: "",
  bodyText: "",
  prayer: "",
};
const labels: Record<keyof DevotionalDraft, string> = {
  title: "Title",
  excerpt: "Short description",
  scriptureReference: "Scripture references",
  scriptureText: "Scripture / labeled paraphrase",
  bodyText: "Reflection",
  prayer: "Closing prayer",
};

function Dictate({ onText }: { onText: (text: string) => void }) {
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const controller = useRef<AbortController | null>(null);
  const mounted = useRef(true);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [listening, setListening] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      controller.current?.abort();
      if (timer.current) clearTimeout(timer.current);
      if (recorder.current) {
        recorder.current.onstop = null;
        recorder.current.ondataavailable = null;
        if (recorder.current.state !== "inactive") recorder.current.stop();
      }
      stream.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);
  async function start() {
    if (recorder.current?.state === "recording") {
      recorder.current.stop();
      return;
    }
    setError("");
    if (
      !navigator.mediaDevices?.getUserMedia ||
      typeof MediaRecorder === "undefined"
    ) {
      setError("Microphone recording is unavailable in this browser.");
      return;
    }
    try {
      const audio = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!mounted.current) {
        audio.getTracks().forEach((t) => t.stop());
        return;
      }
      stream.current = audio;
      const mime = ["audio/webm;codecs=opus", "audio/mp4", "audio/webm"].find(
        (t) => MediaRecorder.isTypeSupported(t),
      );
      const recording = new MediaRecorder(
        audio,
        mime ? { mimeType: mime } : undefined,
      );
      recorder.current = recording;
      let chunks: Blob[] = [];
      recording.ondataavailable = (e) => {
        if (e.data.size) chunks.push(e.data);
      };
      recording.onstop = async () => {
        audio.getTracks().forEach((t) => t.stop());
        stream.current = null;
        recorder.current = null;
        if (timer.current) clearTimeout(timer.current);
        if (!mounted.current) {
          chunks = [];
          return;
        }
        setListening(false);
        setTranscribing(true);
        controller.current = new AbortController();
        try {
          const blob = new Blob(chunks, { type: recording.mimeType });
          chunks = [];
          const payload = new FormData();
          payload.append(
            "audio",
            blob,
            recording.mimeType.includes("mp4")
              ? "dictation.m4a"
              : "dictation.webm",
          );
          const response = await fetch("/api/ougm/transcribe", {
            method: "POST",
            body: payload,
            signal: controller.current.signal,
          });
          const data = await response.json();
          if (!response.ok)
            throw new Error(data.error || "Transcription failed.");
          if (mounted.current) onText(data.text);
        } catch (e) {
          if (mounted.current)
            setError(
              e instanceof Error
                ? e.message
                : "Transcription failed. Please try again.",
            );
        } finally {
          chunks = [];
          if (mounted.current) setTranscribing(false);
          controller.current = null;
        }
      };
      recording.start();
      setListening(true);
      timer.current = setTimeout(() => {
        if (recording.state === "recording") recording.stop();
      }, 60000);
    } catch {
      stream.current?.getTracks().forEach((t) => t.stop());
      setError(
        "Microphone access could not be started. Check your browser permission.",
      );
    }
  }
  return (
    <>
      <button
        type="button"
        className="quiet"
        disabled={transcribing}
        onClick={start}
        aria-pressed={listening}
      >
        <Mic size={16} />
        {transcribing
          ? "Transcribing…"
          : listening
            ? "Stop and transcribe"
            : "Dictate"}
      </button>
      <small>Optional: audio is sent to OpenAI for transcription.</small>
      {error && <small role="status">{error}</small>}
    </>
  );
}

function MultipleLocationPicker({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  const selected = value ? value.split("\n") : [];
  function toggle(option: string, checked: boolean) {
    const next = new Set(selected);
    if (checked) next.add(option);
    else next.delete(option);
    onChange(options.filter((option) => next.has(option)).join("\n"));
  }
  return (
    <fieldset className="location-picker">
      <legend>{label}</legend>
      <details>
        <summary>
          {selected.length
            ? `${selected.length} location${selected.length === 1 ? "" : "s"} selected`
            : "Choose locations"}
        </summary>
        <div className="location-options">
          {options.map((option) => (
            <label key={option}>
              <input
                type="checkbox"
                checked={selected.includes(option)}
                onChange={(e) => toggle(option, e.target.checked)}
              />
              <span>{option}</span>
            </label>
          ))}
        </div>
        <button
          type="button"
          className="quiet"
          disabled={!selected.length}
          onClick={() => onChange("")}
        >
          Clear locations
        </button>
      </details>
      {selected.length > 0 && <p>{selected.join(", ")}</p>}
    </fieldset>
  );
}

export function OugmWorkspace({
  userId,
  isAdmin,
}: {
  userId: string;
  isAdmin: boolean;
}) {
  const [tab, setTab] = useState("calendar");
  const [date, setDate] = useState("");
  const [today, setToday] = useState("");
  const [eventOpen, setEventOpen] = useState(false);
  const roster = useRef<HTMLDetailsElement>(null);
  const eventTitle = useRef<HTMLInputElement>(null);
  const addEvent = useRef<HTMLButtonElement>(null);
  const [month, setMonth] = useState("");
  const calendar = useSharedCalendar(userId);
  const { entries, setEntries, loaded } = calendar;
  const spiritual = useSpiritualReports(userId);
  const [savedReport, setSavedReport] = useState<{
    id: string;
    revision: string;
  } | null>(null);
  const [reportSaving, setReportSaving] = useState(false);
  const [reportStatus, setReportStatus] = useState("");
  const [reportError, setReportError] = useState("");
  const reportEpoch = useRef(0);
  const [shiftEditing, setShiftEditing] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [event, setEvent] = useState({
    title: "",
    date: "",
    time: "",
    category: "Office",
    notes: "",
  });
  const [form, setForm] = useState<string | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const dialog = useRef<HTMLDialogElement>(null);
  const printFrame = useRef<HTMLIFrameElement>(null);
  const printEpoch = useRef(0);
  const [printUrl, setPrintUrl] = useState("");
  const [printBusy, setPrintBusy] = useState(false);
  const [printError, setPrintError] = useState("");
  useEffect(
    () => () => {
      if (printUrl) URL.revokeObjectURL(printUrl);
    },
    [printUrl],
  );
  useEffect(() => {
    printEpoch.current++;
    setPrintUrl("");
    setPrintError("");
    setPrintBusy(false);
    setReportStatus("");
  }, [values]);
  useEffect(
    () => () => {
      printEpoch.current++;
    },
    [],
  );
  const [draft, setDraft] = useState<DevotionalDraft>(emptyDraft);
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<
    { role: "user" | "assistant"; content: string }[]
  >([]);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [published, setPublished] = useState("");
  const template = securityTemplates.find((t) => t.id === form);
  useEffect(() => {
    const today = localDateKey(new Date());
    setToday(today);
    setDate(today);
    setMonth(today.slice(0, 7));
    setEvent((e) => ({ ...e, date: today }));
  }, []);
  function openReport(report: SpiritualReport) {
    reportEpoch.current++;
    setValues(report.values);
    setSavedReport({ id: report.id, revision: report.revision });
    setReportStatus("");
    setReportError("");
    setForm("spiritual-outcomes");
  }
  async function saveReport() {
    if (reportSaving) return;
    const epoch = reportEpoch.current;
    setReportSaving(true);
    setReportError("");
    const snapshot = values;
    try {
      const report = await spiritual.save(snapshot, savedReport);
      if (epoch === reportEpoch.current) {
        setSavedReport({ id: report.id, revision: report.revision });
        setReportStatus("Report saved to Sanity.");
      }
    } catch (e) {
      if (epoch === reportEpoch.current)
        setReportError(
          e instanceof Error ? e.message : "The report could not be saved.",
        );
    } finally {
      if (epoch === reportEpoch.current) setReportSaving(false);
    }
  }
  useEffect(() => {
    if (form) dialog.current?.showModal();
  }, [form]);
  function closeForm() {
    reportEpoch.current++;
    setSavedReport(null);
    setReportSaving(false);
    setReportStatus("");
    setReportError("");
    printEpoch.current++;
    setPrintUrl("");
    setPrintBusy(false);
    setPrintError("");
    setValues({});
    setForm(null);
    dialog.current?.close();
  }
  async function printReport() {
    if (
      template?.id !== "incident-report" &&
      template?.id !== "shift-notes" &&
      template?.id !== "shelter-log" &&
      template?.id !== "spiritual-outcomes" &&
      template?.id !== "unidentified-offender" &&
      template?.id !== "medical-inside-list" &&
      template?.id !== "ban-log"
    ) {
      window.print();
      return;
    }
    const epoch = ++printEpoch.current;
    setPrintBusy(true);
    setPrintError("");
    setPrintUrl("");
    try {
      const bytes =
        template.id === "unidentified-offender"
          ? await createUnidentifiedOffenderPdf(values)
          : template.id === "medical-inside-list"
            ? await createMedicalInsideListPdf(values)
            : template.id === "ban-log"
              ? await createBanLogPdf(values)
              : template.id === "spiritual-outcomes"
                ? await createSpiritualOutcomesPdf(values)
                : template.id === "shelter-log"
                  ? await createShelterLogPdf(values)
                  : template.id === "shift-notes"
                    ? await createShiftNotesPdf(values)
                    : await createIncidentReportPdf(values);
      if (epoch !== printEpoch.current) return;
      setPrintUrl(
        URL.createObjectURL(
          new Blob([new Uint8Array(bytes)], { type: "application/pdf" }),
        ),
      );
    } catch (error) {
      if (epoch === printEpoch.current)
        setPrintError(
          error instanceof Error
            ? error.message
            : "The report could not be prepared.",
        );
    } finally {
      if (epoch === printEpoch.current) setPrintBusy(false);
    }
  }
  function selectDate(day: string) {
    setDate(day);
    setMonth(day.slice(0, 7));
  }
  function closeEvent() {
    setEditing(null);
    setEventOpen(false);
    addEvent.current?.focus();
  }
  function submitEvent(e: React.FormEvent) {
    e.preventDefault();
    setEntries((all) => [
      ...all.filter((v) => v.id !== editing),
      { ...event, id: editing || crypto.randomUUID() },
    ]);
    selectDate(event.date);
    closeEvent();
  }
  async function generate(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setStatus("");
    setPublished("");
    try {
      const response = await fetch("/api/ougm/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          history: [
            ...messages,
            { role: "assistant", content: JSON.stringify(draft) },
          ].slice(-8),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setDraft(data.draft);
      setMessages((old) => [
        ...old,
        { role: "user", content: prompt },
        { role: "assistant", content: JSON.stringify(data.draft) },
      ]);
      setPrompt("");
      setStatus("Draft ready. Review and edit before publishing.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to draft.");
    } finally {
      setBusy(false);
    }
  }
  async function publish() {
    setBusy(true);
    setStatus("");
    try {
      const data = new FormData();
      devotionalFields.forEach((k) => data.set(k, draft[k]));
      data.set("publishedAt", new Date().toISOString());
      const result = await saveDevotional(data);
      setStatus(result.message);
      if (result.ok) setPublished(result.href || "");
    } catch {
      setStatus("Publishing failed. Your draft remains available.");
    } finally {
      setBusy(false);
    }
  }
  const displayed = entries
    .filter((e) => calendarEntryOnDay(e, date))
    .sort((a, b) => a.time.localeCompare(b.time));
  const monthDate = month ? new Date(`${month}-01T12:00:00`) : null;
  function moveMonth(offset: number) {
    if (!monthDate) return;
    const next = new Date(monthDate);
    next.setMonth(next.getMonth() + offset);
    selectDate(localDateKey(next));
  }
  useEffect(() => {
    if (eventOpen && tab === "calendar") eventTitle.current?.focus();
  }, [eventOpen, tab]);
  const days = monthDate
    ? new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate()
    : 0;
  return (
    <main className={tab === "calendar" ? "ougm calendar-workspace" : "ougm"}>
      <header className="mission-header">
        <div>
          <p className="eyebrow">Blended Works · Mission Operations</p>
          <h1>Olympia Union Gospel Mission</h1>
        </div>
        <span className="access">
          {isAdmin ? "Administrator" : "Mission staff"}
        </span>
      </header>
      <nav aria-label="Mission workspace">
        {[
          { id: "calendar", label: "Calendar", icon: CalendarDays },
          { id: "security", label: "Security forms", icon: Shield },
          { id: "devotionals", label: "Devotionals", icon: BookHeart },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            aria-current={tab === t.id ? "page" : undefined}
          >
            <t.icon size={20} aria-hidden="true" />
            {t.label}
          </button>
        ))}
      </nav>
      {tab === "calendar" && (
        <section
          className="office-calendar"
          aria-labelledby="office-calendar-title"
        >
          <div className="section-heading">
            <div>
              <h2 id="office-calendar-title">Office calendar</h2>
            </div>
            <div className="actions">
              <button
                disabled={!loaded || calendar.busy || !calendar.dirty}
                onClick={() => void calendar.save()}
              >
                {calendar.busy ? "Saving…" : "Save schedule"}
              </button>
              <details className="schedule-tools">
                <summary>Schedule tools</summary>
                <div className="actions">
                  <button
                    className="quiet"
                    disabled={calendar.busy}
                    onClick={() => {
                      if (
                        !calendar.dirty ||
                        window.confirm(
                          "Reload the saved schedule and discard unsaved changes?",
                        )
                      )
                        void calendar.load();
                    }}
                  >
                    Reload saved schedule
                  </button>
                  <button
                    className="quiet"
                    disabled={!loaded || calendar.busy}
                    onClick={calendar.importDevice}
                  >
                    Import old device schedule
                  </button>
                </div>
              </details>
            </div>
          </div>
          <p className="schedule-status" role="status">
            {calendar.dirty ? "Unsaved schedule changes" : calendar.status}
          </p>
          {calendar.error && <p role="alert">{calendar.error}</p>}
          <div className="columns calendar-layout">
            <section className="panel month-panel" aria-label="Month view">
              <div className="month-heading">
                <button
                  className="quiet"
                  aria-label="Previous month"
                  disabled={!monthDate}
                  onClick={() => moveMonth(-1)}
                >
                  <ChevronLeft size={20} aria-hidden="true" />
                </button>
                <h3 aria-live="polite">
                  {monthDate ? monthLabel.format(monthDate) : "Calendar"}
                </h3>
                <button
                  className="quiet"
                  aria-label="Next month"
                  disabled={!monthDate}
                  onClick={() => moveMonth(1)}
                >
                  <ChevronRight size={20} aria-hidden="true" />
                </button>
              </div>
              <div className="calendar">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                  <strong key={d}>{d}</strong>
                ))}
                {Array.from({ length: monthDate?.getDay() || 0 }, (_, i) => (
                  <span key={`blank-${i}`} />
                ))}
                {Array.from({ length: days }, (_, i) => {
                  const key = `${month}-${String(i + 1).padStart(2, "0")}`;
                  const count = entries.filter((entry) =>
                    calendarEntryOnDay(entry, key),
                  ).length;
                  return (
                    <button
                      key={key}
                      className={date === key ? "selected" : ""}
                      onClick={() => selectDate(key)}
                      aria-label={`${dayLabel.format(new Date(`${key}T12:00:00`))}, ${count} scheduled`}
                      aria-current={key === today ? "date" : undefined}
                      aria-pressed={date === key}
                    >
                      {i + 1}
                      {count > 0 && <small aria-hidden="true">{count}</small>}
                    </button>
                  );
                })}
              </div>
              <div className="month-footer">
                <button
                  className="quiet"
                  disabled={!today || date === today}
                  onClick={() => selectDate(today)}
                >
                  Today
                </button>
                <label>
                  Jump to month
                  <input
                    type="month"
                    value={month}
                    onChange={(e) => {
                      if (/^\d{4}-\d{2}$/.test(e.target.value))
                        selectDate(`${e.target.value}-01`);
                    }}
                  />
                </label>
              </div>
            </section>
            <section
              className="panel day-agenda"
              aria-labelledby="day-agenda-title"
            >
              <div className="agenda-heading">
                <div>
                  <span className="calendar-kicker">Day schedule</span>
                  <h3 id="day-agenda-title">
                    {date
                      ? dayLabel.format(new Date(`${date}T12:00:00`))
                      : "Selected day"}
                  </h3>
                </div>
                <button
                  ref={addEvent}
                  disabled={!loaded || !date}
                  onClick={() => {
                    setEditing(null);
                    setEvent({
                      title: "",
                      date,
                      time: "",
                      category: "Office",
                      notes: "",
                    });
                    setEventOpen(true);
                  }}
                >
                  <Plus size={18} aria-hidden="true" /> Add event
                </button>
              </div>
              {!loaded && (
                <p>
                  {calendar.error
                    ? "Schedule unavailable."
                    : "Loading schedule…"}
                </p>
              )}
              {loaded && !displayed.length && (
                <p className="agenda-empty">Nothing scheduled for this day.</p>
              )}
              {eventOpen && (
                <form className="stack agenda-editor" onSubmit={submitEvent}>
                  <h4>{editing ? "Edit event" : "New event"}</h4>
                  <label>
                    Title
                    <input
                      ref={eventTitle}
                      required
                      maxLength={160}
                      value={event.title}
                      onChange={(e) =>
                        setEvent((v) => ({ ...v, title: e.target.value }))
                      }
                    />
                  </label>
                  <Dictate
                    onText={(t) =>
                      setEvent((v) => ({ ...v, title: v.title + t }))
                    }
                  />
                  <label>
                    Date
                    <input
                      required
                      type="date"
                      value={event.date}
                      onChange={(e) =>
                        setEvent((v) => ({ ...v, date: e.target.value }))
                      }
                    />
                  </label>
                  <label>
                    Time
                    <input
                      type="time"
                      value={event.time}
                      onChange={(e) =>
                        setEvent((v) => ({ ...v, time: e.target.value }))
                      }
                    />
                  </label>
                  <label>
                    Category
                    <select
                      value={event.category}
                      onChange={(e) =>
                        setEvent((v) => ({ ...v, category: e.target.value }))
                      }
                    >
                      {[
                        "Office",
                        "Security",
                        "Staff Meeting",
                        "Meal / Devotional",
                      ].map((v) => (
                        <option key={v}>{v}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Notes
                    <textarea
                      value={event.notes}
                      onChange={(e) =>
                        setEvent((v) => ({ ...v, notes: e.target.value }))
                      }
                    />
                  </label>
                  <Dictate
                    onText={(t) =>
                      setEvent((v) => ({
                        ...v,
                        notes: `${v.notes} ${t}`.trim(),
                      }))
                    }
                  />
                  <div className="actions">
                    <button disabled={!loaded}>
                      {editing ? "Apply changes" : "Add to schedule"}
                    </button>
                    <button
                      type="button"
                      className="quiet"
                      onClick={closeEvent}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
              {displayed.map((entry) => (
                <article className="agenda-entry" key={entry.id}>
                  <div className="agenda-meta">
                    <span>
                      {entry.time
                        ? displayTime(entry.date, entry.time)
                        : "All day"}
                      {entry.endTime &&
                        ` – ${displayTime(entry.endDate || entry.date, entry.endTime)}`}
                    </span>
                    <span>{entry.category}</span>
                  </div>
                  <h4>
                    {entry.staff
                      ? `${entry.staff} · ${entry.title}`
                      : entry.title}
                  </h4>
                  {entry.category === "Staff Shift" &&
                    entry.endDate &&
                    entry.endDate !== entry.date && (
                      <p>
                        {dayLabel.format(new Date(`${entry.date}T12:00:00`))} to{" "}
                        {dayLabel.format(new Date(`${entry.endDate}T12:00:00`))}
                      </p>
                    )}
                  {entry.notes && <p>{entry.notes}</p>}
                  <div className="actions">
                    <button
                      className="quiet"
                      onClick={() => {
                        if (entry.category === "Staff Shift") {
                          setShiftEditing(entry.id);
                          if (roster.current) roster.current.open = true;
                          roster.current?.scrollIntoView({
                            behavior: "smooth",
                          });
                        } else {
                          setEditing(entry.id);
                          setEvent(entry);
                          setEventOpen(true);
                          eventTitle.current?.focus();
                        }
                      }}
                    >
                      Edit
                    </button>
                    <button
                      className="quiet"
                      onClick={() => {
                        setEntries((all) =>
                          all.filter((item) => item.id !== entry.id),
                        );
                        if (editing === entry.id) closeEvent();
                        if (shiftEditing === entry.id) setShiftEditing(null);
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </section>
          </div>
          {loaded && (
            <details ref={roster} className="panel roster-disclosure">
              <summary>Staff shift roster</summary>
              <StaffShifts
                key={shiftEditing || "new-shift"}
                entries={entries}
                onChange={setEntries}
                month={month}
                date={date}
                loaded={loaded}
                editing={shiftEditing}
                onEdit={setShiftEditing}
              />
            </details>
          )}
        </section>
      )}
      {tab === "security" && (
        <section>
          <h2>Security forms</h2>
          <p>
            Fill, print, then close security forms to clear entries. Spiritual
            outcomes reports can also be saved and reopened.
          </p>
          <div className="form-library">
            {securityTemplates.map((t) => (
              <article className="panel form-card" key={t.id}>
                <h3>{t.title}</h3>
                <p>{t.description}</p>
                <div className="actions">
                  <button
                    onClick={() => {
                      reportEpoch.current++;
                      setSavedReport(null);
                      setReportStatus("");
                      setReportError("");
                      setValues(
                        t.id === "medical-inside-list"
                          ? { ...initialMedicalInsideValues }
                          : {},
                      );
                      setForm(t.id);
                    }}
                  >
                    Open form
                  </button>
                  {t.pdfUrl && (
                    <a
                      href={t.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {t.id === "medical-inside-list"
                        ? "Current printable PDF"
                        : "Blank fillable / printable PDF"}
                    </a>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
      {tab === "security" && (
        <section className="panel stack saved-reports">
          <h3>Saved Spiritual Outcomes</h3>
          <button className="quiet" onClick={() => void spiritual.load()}>
            Reload Saved Reports
          </button>
          {spiritual.error && <p role="alert">{spiritual.error}</p>}
          {!spiritual.reports.length && (
            <p>No saved spiritual outcomes reports.</p>
          )}
          {spiritual.reports.map((report) => (
            <article className="event" key={report.id}>
              <strong>
                {report.values.from} through {report.values.to}
              </strong>
              <div className="actions">
                <button onClick={() => openReport(report)}>
                  Open / Edit / Print
                </button>
                <button
                  className="quiet"
                  onClick={() => void spiritual.remove(report)}
                >
                  Delete Saved Report
                </button>
              </div>
            </article>
          ))}
        </section>
      )}
      {tab === "devotionals" && (
        <section>
          <h2>Daily devotional writer</h2>
          <div className="columns">
            <div className="panel stack">
              <h3>Write with the devotional assistant</h3>
              <p>
                Describe the theme, Scripture, meal, and reading length. Ask for
                revisions as needed.
              </p>
              <div className="conversation">
                {messages
                  .filter((m) => m.role === "user")
                  .map((m, i) => (
                    <p key={i}>
                      <strong>You:</strong> {m.content}
                    </p>
                  ))}
              </div>
              <form className="stack" onSubmit={generate}>
                <label>
                  Message
                  <textarea
                    required
                    maxLength={8000}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Write a dinner devotional about hope as winter approaches…"
                  />
                </label>
                <Dictate onText={(t) => setPrompt((v) => `${v} ${t}`.trim())} />
                <button disabled={busy}>
                  {busy ? "Working…" : "Generate / revise draft"}
                </button>
              </form>
              <p role="status">{status}</p>
              {published && <a href={published}>View published devotional</a>}
            </div>
            <div className="panel stack">
              <h3>Review your devotional</h3>
              {devotionalFields.map((k) => (
                <div className="stack" key={k}>
                  <label>
                    {labels[k]}
                    {k === "title" || k === "scriptureReference" ? (
                      <input
                        value={draft[k]}
                        onChange={(e) => {
                          setPublished("");
                          setDraft((v) => ({ ...v, [k]: e.target.value }));
                        }}
                      />
                    ) : (
                      <textarea
                        rows={k === "bodyText" ? 12 : 3}
                        value={draft[k]}
                        onChange={(e) => {
                          setPublished("");
                          setDraft((v) => ({ ...v, [k]: e.target.value }));
                        }}
                      />
                    )}
                  </label>
                  <Dictate
                    onText={(t) => {
                      setPublished("");
                      setDraft((v) => ({ ...v, [k]: `${v[k]} ${t}`.trim() }));
                    }}
                  />
                </div>
              ))}
              {isAdmin ? (
                <button
                  disabled={
                    busy || !!published || !draft.title || !draft.bodyText
                  }
                  onClick={publish}
                >
                  Publish to Blended Works Daily Devotionals
                </button>
              ) : (
                <p>
                  A Blended Works administrator can publish the reviewed
                  devotional.
                </p>
              )}
            </div>
          </div>
        </section>
      )}
      {template && (
        <dialog
          ref={dialog}
          onCancel={closeForm}
          onClose={closeForm}
          aria-labelledby="security-title"
        >
          <div className="dialog-heading">
            <h2 id="security-title">{template.title}</h2>
            <button className="quiet" onClick={closeForm}>
              {template.id === "spiritual-outcomes"
                ? "Close Report"
                : "Close and Clear"}
            </button>
          </div>
          <p className="screen-only">
            {template.id === "spiritual-outcomes"
              ? "Use Save Report to keep this report in Sanity. Closing clears any unsaved edits from this editor."
              : "Entries and photos stay in this form while it is open. Closing clears all fields."}
          </p>
          <form
            className="stack"
            autoComplete="off"
            onSubmit={(e) => e.preventDefault()}
          >
            {template.id === "unidentified-offender" && (
              <PhotoInput values={values} onChange={setValues} />
            )}
            {template.id === "spiritual-outcomes" ? (
              <SpiritualOutcomesEditor
                values={values}
                onChange={setValues}
                Dictation={Dictate}
              />
            ) : template.id === "medical-inside-list" ? (
              <MedicalInsideListEditor values={values} onChange={setValues} />
            ) : template.id === "ban-log" ? (
              <BanLogEditor
                values={values}
                onChange={setValues}
                Dictation={Dictate}
              />
            ) : template.id === "shelter-log" ? (
              <ShelterLogEditor
                values={values}
                onChange={setValues}
                Dictation={Dictate}
              />
            ) : template.id === "shift-notes" ? (
              <ShiftNotesEditor
                values={values}
                onChange={setValues}
                Dictation={Dictate}
              />
            ) : (
              template.fields.map((f) => (
                <div className="stack" key={f.key}>
                  {f.type === "multiselect" ? (
                    <MultipleLocationPicker
                      label={f.label}
                      options={f.options || []}
                      value={values[f.key] || ""}
                      onChange={(value) =>
                        setValues((v) => ({ ...v, [f.key]: value }))
                      }
                    />
                  ) : (
                    <label>
                      {f.label}
                      {f.type === "checkbox" ? (
                        <input
                          type="checkbox"
                          checked={values[f.key] === "true"}
                          onChange={(e) =>
                            setValues((v) => ({
                              ...v,
                              [f.key]: String(e.target.checked),
                            }))
                          }
                        />
                      ) : f.type === "select" ? (
                        <select
                          value={values[f.key] || ""}
                          onChange={(e) =>
                            setValues((v) => ({
                              ...v,
                              [f.key]: e.target.value,
                            }))
                          }
                        >
                          <option value="">Not Specified</option>
                          {f.options?.map((option) => (
                            <option key={option}>{option}</option>
                          ))}
                        </select>
                      ) : f.multiline ? (
                        <textarea
                          rows={f.key === "summary" ? 10 : 4}
                          maxLength={20000}
                          value={values[f.key] || ""}
                          onChange={(e) =>
                            setValues((v) => ({
                              ...v,
                              [f.key]: e.target.value,
                            }))
                          }
                        />
                      ) : (
                        <input
                          type={
                            f.type === "date" ||
                            f.type === "time" ||
                            f.type === "datetime-local"
                              ? f.type
                              : "text"
                          }
                          maxLength={20000}
                          value={values[f.key] || ""}
                          onChange={(e) =>
                            setValues((v) => ({
                              ...v,
                              [f.key]: e.target.value,
                            }))
                          }
                        />
                      )}
                    </label>
                  )}
                  {!f.type && (
                    <div className="screen-only">
                      <Dictate
                        onText={(t) =>
                          setValues((v) => ({
                            ...v,
                            [f.key]: `${v[f.key] || ""} ${t}`.trim(),
                          }))
                        }
                      />
                    </div>
                  )}
                </div>
              ))
            )}
            <div className="screen-only">
              {template.id === "spiritual-outcomes" && (
                <>
                  <button
                    type="button"
                    disabled={reportSaving}
                    onClick={() => void saveReport()}
                  >
                    {reportSaving ? "Saving Report…" : "Save Report to Sanity"}
                  </button>
                  {reportStatus && <p role="status">{reportStatus}</p>}
                  {reportError && <p role="alert">{reportError}</p>}
                </>
              )}
              <button type="button" disabled={printBusy} onClick={printReport}>
                <Printer size={18} />
                {printBusy ? "Preparing report…" : "Print form"}
              </button>
              {printError && <p role="alert">{printError}</p>}
              {printUrl && (
                <>
                  <p>
                    <a
                      href={printUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Open prepared report to print
                    </a>
                  </p>
                  <iframe
                    title="Printable security form"
                    ref={printFrame}
                    src={printUrl}
                    className="incident-preview"
                    onLoad={() => {
                      try {
                        printFrame.current?.contentWindow?.print();
                      } catch {
                        setPrintError(
                          "Use Open prepared report to print in your browser’s PDF viewer.",
                        );
                      }
                    }}
                  />
                </>
              )}
              <p>
                {template.id === "spiritual-outcomes"
                  ? "Save Report keeps this report in Sanity. Print does not save unsaved edits."
                  : "After printing, close this form to clear its entries and photo. If you cancel printing, you can keep editing."}
              </p>
            </div>
          </form>
        </dialog>
      )}
      {template &&
        template.id !== "incident-report" &&
        template.id !== "shift-notes" &&
        template.id !== "shelter-log" &&
        template.id !== "spiritual-outcomes" &&
        template.id !== "unidentified-offender" &&
        template.id !== "medical-inside-list" &&
        template.id !== "ban-log" && (
          <section className="print-copy">
            <h1>Olympia Union Gospel Mission</h1>
            <h2>{template.title}</h2>
            {template.fields.map((f) => (
              <div key={f.key}>
                <strong>{f.label}</strong>
                <p>{values[f.key] || " \u00a0"}</p>
              </div>
            ))}
          </section>
        )}
    </main>
  );
}
