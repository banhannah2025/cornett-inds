"use client";
import { useState } from "react";

type Lesson = {
  id: string;
  courseId: string;
  title: string;
  paragraphs: string[];
  practice: string;
  question: string;
  options: string[];
  correct: number;
  explanation: string;
  reading: string;
  sourceUrl: string;
  sourceLabel: string;
  rights: string;
};
export function LessonReader({ lessons }: { lessons: Lesson[] }) {
  const [active, setActive] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [reflections, setReflections] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const lesson = lessons[active];
  if (!lesson) return null;
  async function save() {
    if (!lesson || saving) return;
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/school/workspace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "progress",
          courseId: lesson.courseId,
          lessonId: lesson.id,
          answer: answers[lesson.id],
          reflection: reflections[lesson.id] ?? "",
        }),
      });
      const data = await response.json();
      setMessage(
        response.ok
          ? `Saved to your student record. ${data.passed ? "Knowledge check passed." : "Review the explanation and try again."}`
          : (data.error ?? "Save failed."),
      );
    } catch {
      setMessage(
        "The save could not be confirmed. Check your student record before retrying.",
      );
    } finally {
      setSaving(false);
    }
  }
  function exportReflection() {
    const blob = new Blob(
      [
        `${lesson!.title}\n\nPractice: ${lesson!.practice}\n\n${reflections[lesson!.id] ?? ""}`,
      ],
      { type: "text/plain;charset=utf-8" },
    );
    const url = URL.createObjectURL(blob),
      a = document.createElement("a");
    a.href = url;
    a.download = `${lesson!.id}-reflection.txt`;
    a.click();
    URL.revokeObjectURL(url);
    setMessage("Reflection exported.");
  }
  return (
    <section className="school-lessons" aria-label="Draft course lessons">
      <div className="school-notice">
        <h2>Original lessons for founder review</h2>
        <p>
          Practice is available here. Account saves require adult orientation,
          pilot access, course release, and enrollment. Draft lessons are not an
          issued credential. Unsaved writing is lost when you leave or reload;
          export a copy to keep it.
        </p>
      </div>
      <nav className="school-unit-nav" aria-label="Select a lesson">
        {lessons.map((l, i) => (
          <button
            key={l.id}
            aria-pressed={active === i}
            onClick={() => {
              setActive(i);
              setMessage("");
            }}
          >
            {l.title}
          </button>
        ))}
      </nav>
      <article className="school-card">
        <span className="school-badge">{lesson.id} · Original draft</span>
        <h2>{lesson.title}</h2>
        {lesson.paragraphs.map((p) => (
          <p key={p}>{p}</p>
        ))}
        <h3>Read and investigate</h3>
        <p>{lesson.reading}</p>
        <a href={lesson.sourceUrl} target="_blank" rel="noreferrer">
          {lesson.sourceLabel}
        </a>
        <h3>Guided practice</h3>
        <p>{lesson.practice}</p>
        <label className="school-field">
          Your practice response
          <textarea
            maxLength={10000}
            rows={6}
            value={reflections[lesson.id] ?? ""}
            onChange={(e) =>
              setReflections((prev) => ({
                ...prev,
                [lesson.id]: e.target.value,
              }))
            }
          />
        </label>
        <fieldset>
          <legend>{lesson.question}</legend>
          {lesson.options.map((option, i) => (
            <label className="school-choice" key={option}>
              <input
                type="radio"
                name={lesson.id}
                checked={answers[lesson.id] === i}
                onChange={() => {
                  setAnswers((prev) => ({ ...prev, [lesson.id]: i }));
                  setChecked((prev) => ({ ...prev, [lesson.id]: false }));
                }}
              />
              {option}
            </label>
          ))}
        </fieldset>
        <div className="school-actions">
          <button
            disabled={answers[lesson.id] === undefined}
            onClick={() =>
              setChecked((prev) => ({ ...prev, [lesson.id]: true }))
            }
          >
            Check my understanding
          </button>
          <button
            disabled={
              saving ||
              answers[lesson.id] === undefined ||
              (reflections[lesson.id] ?? "").trim().length < 20
            }
            className="school-primary"
            onClick={save}
          >
            {saving ? "Saving…" : "Save to student record"}
          </button>
          <button onClick={exportReflection}>Export reflection</button>
        </div>
        {checked[lesson.id] && (
          <p role="status">
            <strong>
              {answers[lesson.id] === lesson.correct
                ? "Correct. "
                : "Review and try again. "}
            </strong>
            {lesson.explanation}
          </p>
        )}
        <p role="status">{message}</p>
        <p className="school-muted">{lesson.rights}</p>
      </article>
    </section>
  );
}
