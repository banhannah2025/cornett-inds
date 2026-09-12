"use client";

import { useEffect, useRef, useState } from "react";
import { createIncidentReportPdf } from "./incident-report";
import {
  CalendarDays,
  Shield,
  BookHeart,
  Mic,
  Printer,
  Plus,
} from "lucide-react";
import { saveDevotional } from "../../web/app/admin-actions";
import {
  securityTemplates,
  devotionalFields,
  type CalendarEntry,
  type DevotionalDraft,
} from "./index";

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
  const [month, setMonth] = useState("");
  const [entries, setEntries] = useState<CalendarEntry[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [calendarError, setCalendarError] = useState("");
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
  const storageKey = `ougm-calendar:${userId}`;
  useEffect(() => {
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    setDate(today);
    setMonth(today.slice(0, 7));
    setEvent((e) => ({ ...e, date: today }));
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || "[]");
      if (Array.isArray(saved))
        setEntries(
          saved.filter(
            (v) =>
              v &&
              ["id", "title", "date", "time", "category", "notes"].every(
                (k) => typeof v[k] === "string",
              ),
          ),
        );
    } catch {
      setCalendarError("Saved schedules could not be loaded on this device.");
    }
    setLoaded(true);
  }, [storageKey]);
  useEffect(() => {
    if (loaded)
      try {
        localStorage.setItem(storageKey, JSON.stringify(entries));
      } catch {
        setCalendarError(
          "Device storage is unavailable. Calendar changes will last only until this page closes.",
        );
      }
  }, [entries, loaded, storageKey]);
  useEffect(() => {
    if (form) dialog.current?.showModal();
  }, [form]);
  function closeForm() {
    printEpoch.current++;
    setPrintUrl("");
    setPrintBusy(false);
    setPrintError("");
    setValues({});
    setForm(null);
    dialog.current?.close();
  }
  async function printReport() {
    if (template?.id !== "incident-report") {
      window.print();
      return;
    }
    const epoch = ++printEpoch.current;
    setPrintBusy(true);
    setPrintError("");
    setPrintUrl("");
    try {
      const bytes = await createIncidentReportPdf(values);
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
  function submitEvent(e: React.FormEvent) {
    e.preventDefault();
    setEntries((all) => [
      ...all.filter((v) => v.id !== editing),
      { ...event, id: editing || crypto.randomUUID() },
    ]);
    setEditing(null);
    setEvent({ title: "", date, time: "", category: "Office", notes: "" });
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
    .filter((e) => e.date === date)
    .sort((a, b) => a.time.localeCompare(b.time));
  const monthDate = month ? new Date(`${month}-01T12:00:00`) : null;
  const days = monthDate
    ? new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate()
    : 0;
  return (
    <main className="ougm">
      <header>
        <div>
          <p className="eyebrow">BLENDED WORKS / MISSION OPERATIONS</p>
          <h1>Olympia Union Gospel Mission</h1>
        </div>
        <span className="access">
          {isAdmin ? "Administrator" : "Mission staff"}
        </span>
      </header>
      <nav aria-label="Mission workspace">
        {[
          { id: "calendar", label: "Office calendar", icon: CalendarDays },
          { id: "security", label: "Security logs", icon: Shield },
          { id: "devotionals", label: "Devotional writer", icon: BookHeart },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            aria-current={tab === t.id ? "page" : undefined}
          >
            <t.icon size={20} />
            {t.label}
          </button>
        ))}
      </nav>
      {tab === "calendar" && (
        <section>
          <div className="section-heading">
            <div>
              <h2>Office calendar</h2>
              <p>Schedules saved on this device for your account.</p>
            </div>
            <label>
              Month
              <input
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
              />
            </label>
          </div>
          {calendarError && <p role="alert">{calendarError}</p>}
          <div className="columns">
            <div className="panel">
              <div className="calendar">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                  <strong key={d}>{d}</strong>
                ))}
                {Array.from({ length: monthDate?.getDay() || 0 }, (_, i) => (
                  <span key={`blank-${i}`} />
                ))}
                {Array.from({ length: days }, (_, i) => {
                  const key = `${month}-${String(i + 1).padStart(2, "0")}`;
                  const count = entries.filter((e) => e.date === key).length;
                  return (
                    <button
                      key={key}
                      className={date === key ? "selected" : ""}
                      onClick={() => {
                        setDate(key);
                        setEvent((v) => ({ ...v, date: key }));
                      }}
                      aria-label={`${key}${count ? `, ${count} events` : ""}`}
                      aria-pressed={date === key}
                    >
                      {i + 1}
                      {count > 0 && <small>{count}</small>}
                    </button>
                  );
                })}
              </div>
              <h3>Schedule for {date}</h3>
              {!displayed.length && <p>No events scheduled.</p>}
              {displayed.map((e) => (
                <article className="event" key={e.id}>
                  <strong>
                    {e.time || "All day"} · {e.title}
                  </strong>
                  <p>
                    {e.category}
                    {e.notes && ` — ${e.notes}`}
                  </p>
                  <button
                    className="quiet"
                    onClick={() => {
                      setEditing(e.id);
                      setEvent(e);
                    }}
                  >
                    Edit
                  </button>
                  <button
                    className="quiet"
                    onClick={() =>
                      setEntries((all) => all.filter((v) => v.id !== e.id))
                    }
                  >
                    Delete
                  </button>
                </article>
              ))}
            </div>
            <form className="panel stack" onSubmit={submitEvent}>
              <h3>{editing ? "Edit event" : "Add an event"}</h3>
              <label>
                Title
                <input
                  required
                  maxLength={160}
                  value={event.title}
                  onChange={(e) =>
                    setEvent((v) => ({ ...v, title: e.target.value }))
                  }
                />
              </label>
              <Dictate
                onText={(t) => setEvent((v) => ({ ...v, title: v.title + t }))}
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
                    "Staff meeting",
                    "Meal / devotional",
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
                  setEvent((v) => ({ ...v, notes: `${v.notes} ${t}`.trim() }))
                }
              />
              <button disabled={!loaded}>
                <Plus size={18} />
                {editing ? "Save changes" : "Add event"}
              </button>
              {editing && (
                <button
                  type="button"
                  className="quiet"
                  onClick={() => {
                    setEditing(null);
                    setEvent({
                      title: "",
                      date,
                      time: "",
                      category: "Office",
                      notes: "",
                    });
                  }}
                >
                  Cancel edit
                </button>
              )}
            </form>
          </div>
        </section>
      )}
      {tab === "security" && (
        <section>
          <h2>Security forms</h2>
          <p>
            Fill, print, then close. Entries are cleared when you close a form.
          </p>
          <div className="panel">
            <h3>Mission form library</h3>
            <p>Choose a form to fill and print, or open a blank PDF.</p>
            {securityTemplates.map((t) => (
              <article className="event" key={t.id}>
                <h3>{t.title}</h3>
                <p>{t.description}</p>
                <button
                  onClick={() => {
                    setValues({});
                    setForm(t.id);
                  }}
                >
                  Open form
                </button>
                {t.pdfUrl && (
                  <a href={t.pdfUrl} target="_blank" rel="noopener noreferrer">
                    Blank fillable / printable PDF
                  </a>
                )}
              </article>
            ))}
          </div>
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
              Close and clear
            </button>
          </div>
          <p className="screen-only">
            Entries stay in this browser while the form is open. Closing clears
            all fields.
          </p>
          <form
            className="stack"
            autoComplete="off"
            onSubmit={(e) => e.preventDefault()}
          >
            {template.fields.map((f) => (
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
                          setValues((v) => ({ ...v, [f.key]: e.target.value }))
                        }
                      >
                        <option value="">Not specified</option>
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
                          setValues((v) => ({ ...v, [f.key]: e.target.value }))
                        }
                      />
                    ) : (
                      <input
                        type={
                          f.type === "date" || f.type === "time"
                            ? f.type
                            : "text"
                        }
                        maxLength={20000}
                        value={values[f.key] || ""}
                        onChange={(e) =>
                          setValues((v) => ({ ...v, [f.key]: e.target.value }))
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
            ))}
            <div className="screen-only">
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
                    title="Printable incident report"
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
                After printing, close this form to clear its contents. If you
                cancel printing, you can keep editing.
              </p>
            </div>
          </form>
        </dialog>
      )}
      {template && template.id !== "incident-report" && (
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
