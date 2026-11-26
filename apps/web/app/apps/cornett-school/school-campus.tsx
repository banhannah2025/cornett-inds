"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  BookOpen,
  GraduationCap,
  Library,
  CalendarDays,
  Church,
  Award,
  CheckCircle2,
} from "lucide-react";
import { pathways, resources } from "./catalog";
import { curriculum, assessmentPolicy, pathwayProjects } from "./curriculum";

const sections = [
  { id: "welcome", label: "Welcome", icon: BookOpen },
  { id: "programs", label: "Programs", icon: GraduationCap },
  { id: "classroom", label: "Sample classroom", icon: BookOpen },
  { id: "library", label: "Library", icon: Library },
  { id: "life", label: "Life & study", icon: CalendarDays },
  { id: "community", label: "Church community", icon: Church },
  { id: "certificates", label: "Certificates", icon: Award },
] as const;
type Section = (typeof sections)[number]["id"];

export function SchoolCampus() {
  const [section, setSection] = useState<Section>("welcome");
  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get(
      "section",
    );
    if (sections.some((item) => item.id === requested))
      setSection(requested as Section);
  }, []);
  const [query, setQuery] = useState("");
  const [level, setLevel] = useState("All levels");
  const [answer, setAnswer] = useState("");
  const [checked, setChecked] = useState(false);
  const [reflection, setReflection] = useState("");
  const [weeklyHours, setWeeklyHours] = useState(4);
  const [days, setDays] = useState(3);
  const [income, setIncome] = useState(0);
  const [expenses, setExpenses] = useState(0);
  const [task, setTask] = useState("");
  const [tasks, setTasks] = useState<
    Array<{ id: number; text: string; done: boolean }>
  >([]);
  const [message, setMessage] = useState("");
  function downloadPlan() {
    const content = `Cornett School of Christianity — Personal study plan\n\nAvailable study: ${weeklyHours} hours per week\nStudy sessions: ${days} per week, approximately ${Math.round((weeklyHours * 60) / days)} minutes each\nMonthly income: $${income.toFixed(2)}\nMonthly planned expenses: $${expenses.toFixed(2)}\nRemaining: $${(income - expenses).toFixed(2)}\n\nTasks\n${tasks.map((t) => `${t.done ? "[x]" : "[ ]"} ${t.text}`).join("\n")}\n\nSample lesson reflection\n${reflection}\n`;
    const url = URL.createObjectURL(
      new Blob([content], { type: "text/plain;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "cornett-personal-study-plan.txt";
    link.click();
    URL.revokeObjectURL(url);
    setMessage("Your personal study plan was exported.");
  }
  return (
    <div className="cornett-school">
      <a className="school-skip" href="#school-content">
        Skip to content
      </a>
      <header className="school-header">
        <Link href="/" className="school-parent">
          BLENDED WORKS
        </Link>
        <span>Faith. Understanding. Service.</span>
        <span className="school-badge">Founding preview</span>
      </header>
      <div className="school-shell">
        <aside className="school-sidebar">
          <a className="school-brand" href="/apps/cornett-school">
            <BookOpen size={32} aria-hidden="true" />
            <span>
              Cornett School<small>OF CHRISTIANITY</small>
            </span>
          </a>
          <p className="school-sidebar-note">
            Know Scripture.
            <br />
            Grow in faith. Learn to lead.
          </p>
          <nav aria-label="School campus">
            {sections.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                aria-current={section === id ? "page" : undefined}
                onClick={() => {
                  setSection(id);
                  setMessage("");
                }}
              >
                <Icon size={19} aria-hidden="true" />
                {label}
              </button>
            ))}
          </nav>
          <div className="school-sidebar-footer">
            Adult learning · Nondenominational
            <br />
            Certificate programs
            <br />
            <Link href="/apps/blendedworks-ai-bible">
              Explore the AI Bible companion
            </Link>
          </div>
        </aside>
        <main id="school-content" className="school-content" key={section}>
          {section === "welcome" && (
            <>
              <div className="school-eyebrow">
                A CHRISTIAN EDUCATION FOR THE WHOLE PERSON
              </div>
              <h1>
                Deepen your faith.
                <br />
                <em>Expand your understanding.</em>
              </h1>
              <p className="school-lead">
                A guided path from your first questions to thoughtful Christian
                leadership—bringing Scripture, history, psychology, and
                practical ministry into conversation.
              </p>
              <div className="school-actions">
                <Link
                  className="school-student-link"
                  href="/apps/cornett-school/student"
                >
                  Open student learning center
                </Link>
                <button
                  className="school-primary"
                  onClick={() => setSection("programs")}
                >
                  Explore the learning pathways
                </button>
                <button onClick={() => setSection("classroom")}>
                  Try a sample lesson
                </button>
              </div>
              <div className="school-feature">
                <div>
                  <span className="school-eyebrow">
                    YOUR EDUCATION, WITH ROOM FOR LIFE
                  </span>
                  <h2>
                    Learn with purpose.
                    <br />
                    Build a rhythm you can sustain.
                  </h2>
                  <p>
                    Bring your work, family, church, and personal
                    responsibilities into a realistic study plan. Begin where
                    you are and progress through clear learning milestones.
                  </p>
                  <button onClick={() => setSection("life")}>
                    Open life & study tools
                  </button>
                </div>
                <blockquote>
                  “But be doers of the word, and not only hearers, deluding your
                  own selves.”<cite>James 1:22 · World English Bible</cite>
                </blockquote>
              </div>
              <div className="school-grid">
                {[
                  {
                    title: "Rooted in Scripture",
                    text: "Learn to read passages in their literary, cultural, and historical setting.",
                  },
                  {
                    title: "Attentive to people",
                    text: "Study human experience, relationships, and the responsibilities of pastoral care.",
                  },
                  {
                    title: "Built for growth",
                    text: "Move from understanding to practice through reflection, assessment, and service.",
                  },
                ].map((item) => (
                  <article className="school-card" key={item.title}>
                    <h3>{item.title}</h3>
                    <p>{item.text}</p>
                  </article>
                ))}
              </div>
              <section className="school-notice">
                <h2>Before enrollment opens</h2>
                <p>
                  This is the founding campus preview. Program outlines are
                  proposed; the sample lesson and planning tools are available
                  to explore. Paid enrollment, student records, graded
                  coursework, and certificate issuance are not active. No
                  payment is collected.
                </p>
              </section>
            </>
          )}
          {section === "programs" && (
            <>
              <div className="school-eyebrow">BEGINNER THROUGH ADVANCED</div>
              <h1>
                A clear path.
                <br />
                <em>A deeper understanding.</em>
              </h1>
              <p className="school-lead">
                Four connected certificate pathways with 24 draft course syllabi
                and 96 planned learning units. History and psychology develop
                alongside Scripture and ministry throughout the sequence.
              </p>
              <label className="school-field">
                Choose a level
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                >
                  {["All levels", ...pathways.map((p) => p.level)].map((l) => (
                    <option key={l}>{l}</option>
                  ))}
                </select>
              </label>
              <div className="school-programs">
                {pathways
                  .filter((p) => level === "All levels" || p.level === level)
                  .map((p) => (
                    <article className="school-card" key={p.title}>
                      <span className="school-badge">
                        {p.level} · Proposed pathway
                      </span>
                      <h2>{p.title}</h2>
                      <p>{p.description}</p>
                      <p>
                        <strong>Planned workload:</strong>{" "}
                        {curriculum
                          .filter((c) => c.pathway === pathways.indexOf(p))
                          .reduce((sum, c) => sum + c.hours, 0)}{" "}
                        hours, including study and assignments.
                      </p>
                      <ul>
                        {curriculum
                          .filter((c) => c.pathway === pathways.indexOf(p))
                          .map((c) => (
                            <li key={c.id}>
                              <Link
                                href={`/apps/cornett-school/courses/${c.slug}`}
                              >
                                {c.title}
                              </Link>
                              <span className="school-course-meta">
                                {c.id} · {c.hours} hours · Syllabus draft
                              </span>
                            </li>
                          ))}
                      </ul>
                      <p>
                        <strong>Pathway project:</strong>{" "}
                        {pathwayProjects[pathways.indexOf(p)]}
                      </p>
                      <p className="school-muted">
                        {pathways.indexOf(p) === 0
                          ? "No prior Bible knowledge required."
                          : `Recommended preparation: ${pathways[pathways.indexOf(p) - 1]?.title}, or founder review of equivalent learning.`}
                      </p>
                    </article>
                  ))}
              </div>
            </>
          )}
          {section === "classroom" && (
            <>
              <div className="school-eyebrow">
                ORIENTATION · ORIGINAL SAMPLE LESSON
              </div>
              <h1>
                Read carefully.
                <br />
                <em>Learn to ask better questions.</em>
              </h1>
              <p className="school-lead">
                Objective: distinguish observation, interpretation, and
                application when studying a biblical passage.
              </p>
              <article className="school-lesson school-card">
                <h2>Start with what the passage says</h2>
                <p>
                  Observation asks what is present in a text: who speaks, who
                  listens, what happens, and which words or contrasts matter.
                  Interpretation asks what those details communicate in context.
                  Application considers a faithful response in our own
                  circumstances. These steps inform one another, but separating
                  them helps us notice when we have brought an assumption to the
                  passage.
                </p>
                <blockquote>
                  “But be doers of the word, and not only hearers, deluding your
                  own selves.”
                  <cite>
                    James 1:22 · World English Bible, public-domain text
                  </cite>
                </blockquote>
                <h3>Bring history and psychology into the study</h3>
                <p>
                  Historical inquiry asks about the audience, setting, genre,
                  and surrounding argument. A careful student distinguishes what
                  a source establishes from what remains uncertain. Psychology
                  adds questions about our own attention and habits: are we
                  looking for evidence that supports our first impression, or
                  are we willing to revise it? These questions support careful
                  study; they do not settle the passage’s meaning by themselves.
                </p>
                <h3>Put understanding into practice</h3>
                <p>
                  The verse contrasts hearing with doing. Read James 1:19–27
                  before drawing a conclusion from verse 22 alone. Write one
                  observation from that larger passage, explain your
                  interpretation, and identify one concrete action you could
                  take this week. Explain how your action follows from the
                  passage.
                </p>
                <a
                  href="https://ebible.org/engwebp/JAS01.htm"
                  target="_blank"
                  rel="noreferrer"
                >
                  Read James 1 in the World English Bible
                </a>
              </article>
              <section className="school-card">
                <h2>Check your understanding</h2>
                <fieldset>
                  <legend>
                    Which statement is an observation about James 1:22?
                  </legend>
                  {[
                    "The verse contrasts hearing with doing.",
                    "Everyone who hears a sermon immediately changes their behavior.",
                    "I should volunteer this weekend.",
                  ].map((option) => (
                    <label className="school-choice" key={option}>
                      <input
                        type="radio"
                        name="observation"
                        value={option}
                        checked={answer === option}
                        onChange={(e) => {
                          setAnswer(e.target.value);
                          setChecked(false);
                        }}
                      />
                      {option}
                    </label>
                  ))}
                </fieldset>
                <button
                  className="school-primary"
                  disabled={!answer}
                  onClick={() => setChecked(true)}
                >
                  Check answer
                </button>
                {checked && (
                  <p role="status">
                    {answer === "The verse contrasts hearing with doing."
                      ? "Correct. That contrast is directly present in the wording. Next, use the surrounding passage to develop your interpretation."
                      : "Try again. An observation describes what is directly present in the text; a proposed action belongs to application."}
                  </p>
                )}
                <label className="school-field">
                  Your observation, interpretation, and application
                  <textarea
                    rows={5}
                    maxLength={10000}
                    value={reflection}
                    onChange={(e) => setReflection(e.target.value)}
                    placeholder="Write in your own words. Do not include private information about another person."
                  />
                </label>
                <p className="school-muted">
                  Practice only. This response is not graded, submitted, or
                  saved to a student record. It stays in this open page until
                  you leave or reload. Export a copy to keep it.
                </p>
                <button onClick={downloadPlan}>
                  Export reflection and study plan
                </button>
              </section>
            </>
          )}
          {section === "library" && (
            <>
              <div className="school-eyebrow">READ · LISTEN · EXPLORE</div>
              <h1>
                A library for
                <br />
                <em>thoughtful discovery.</em>
              </h1>
              <p className="school-lead">
                An initial directory of external sources. Inclusion is not an
                endorsement of every perspective or permission to reproduce the
                collection.
              </p>
              <label className="school-field">
                Search resources
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Try psychology, books, or video"
                />
              </label>
              <div className="school-grid">
                {resources
                  .filter((r) =>
                    `${r.title} ${r.kind} ${r.rights}`
                      .toLowerCase()
                      .includes(query.toLowerCase()),
                  )
                  .map((r) => (
                    <article key={r.title} className="school-card">
                      <span className="school-badge">{r.kind}</span>
                      <h2>{r.title}</h2>
                      <p>{r.use}</p>
                      <p>
                        <strong>Rights:</strong> {r.rights}
                      </p>
                      <p className="school-muted">{r.status}</p>
                      <a href={r.url} target="_blank" rel="noreferrer">
                        Visit the source
                      </a>
                    </article>
                  ))}
              </div>
              {!resources.some((r) =>
                `${r.title} ${r.kind} ${r.rights}`
                  .toLowerCase()
                  .includes(query.toLowerCase()),
              ) && <p>No matching resources. Try a broader term.</p>}
            </>
          )}
          {section === "life" && (
            <>
              <div className="school-eyebrow">
                SPACE FOR STUDY AND EVERYDAY LIFE
              </div>
              <h1>
                Make a little room
                <br />
                <em>for what matters.</em>
              </h1>
              <p className="school-lead">
                Plan a manageable week. These optional tools work in this open
                page; export your plan before leaving. They are not connected to
                your account or calendar.
              </p>
              <div className="school-grid">
                <section className="school-card">
                  <CalendarDays aria-hidden="true" />
                  <h2>Your study rhythm</h2>
                  <label className="school-field">
                    Hours available each week
                    <input
                      type="number"
                      min={1}
                      max={40}
                      value={weeklyHours}
                      onChange={(e) =>
                        setWeeklyHours(
                          Math.max(
                            1,
                            Math.min(40, Number(e.target.value) || 1),
                          ),
                        )
                      }
                    />
                  </label>
                  <label className="school-field">
                    Study days each week
                    <select
                      value={days}
                      onChange={(e) => setDays(Number(e.target.value))}
                    >
                      {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </label>
                  <p className="school-result">
                    {days} sessions of about{" "}
                    {Math.round((weeklyHours * 60) / days)} minutes
                  </p>
                  <p>
                    Include reading, practice, and review in this time. Split
                    longer sessions into shorter blocks and leave room for
                    breaks.
                  </p>
                </section>
                <section className="school-card">
                  <h2>A simple monthly budget</h2>
                  <label className="school-field">
                    Expected income ($)
                    <input
                      type="number"
                      min={0}
                      max={10000000}
                      step="0.01"
                      value={income}
                      onChange={(e) =>
                        setIncome(
                          Math.max(
                            0,
                            Math.min(10000000, Number(e.target.value) || 0),
                          ),
                        )
                      }
                    />
                  </label>
                  <label className="school-field">
                    Planned expenses ($)
                    <input
                      type="number"
                      min={0}
                      max={10000000}
                      step="0.01"
                      value={expenses}
                      onChange={(e) =>
                        setExpenses(
                          Math.max(
                            0,
                            Math.min(10000000, Number(e.target.value) || 0),
                          ),
                        )
                      }
                    />
                  </label>
                  <p className="school-result">
                    ${(income - expenses).toFixed(2)}{" "}
                    {income >= expenses ? "remaining" : "shortfall"}
                  </p>
                  <p>
                    Include housing, food, transportation, and education. School
                    subscription pricing has not been set; this is a personal
                    planning calculation.
                  </p>
                </section>
              </div>
              <section className="school-card">
                <h2>This week’s priorities</h2>
                <form
                  className="school-task-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (task.trim()) {
                      setTasks((prev) => [
                        ...prev,
                        { id: Date.now(), text: task.trim(), done: false },
                      ]);
                      setTask("");
                    }
                  }}
                >
                  <label className="school-field">
                    Add a task
                    <input
                      value={task}
                      maxLength={200}
                      onChange={(e) => setTask(e.target.value)}
                      placeholder="Read James 1 on Tuesday"
                    />
                  </label>
                  <button type="submit" disabled={!task.trim()}>
                    Add task
                  </button>
                </form>
                {tasks.length === 0 && (
                  <p>Your list is empty. Start with one realistic next step.</p>
                )}
                {tasks.map((t) => (
                  <div className="school-task" key={t.id}>
                    <label>
                      <input
                        type="checkbox"
                        checked={t.done}
                        onChange={() =>
                          setTasks((prev) =>
                            prev.map((item) =>
                              item.id === t.id
                                ? { ...item, done: !item.done }
                                : item,
                            ),
                          )
                        }
                      />
                      <span
                        style={{
                          textDecoration: t.done ? "line-through" : undefined,
                        }}
                      >
                        {t.text}
                      </span>
                    </label>
                    <button
                      aria-label={`Remove ${t.text}`}
                      onClick={() =>
                        setTasks((prev) =>
                          prev.filter((item) => item.id !== t.id),
                        )
                      }
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <div className="school-actions">
                  <button className="school-primary" onClick={downloadPlan}>
                    Export my plan
                  </button>
                  <button onClick={() => window.print()}>
                    Print this page
                  </button>
                </div>
                <p role="status">{message}</p>
              </section>
              <section className="school-card">
                <h2>When life interrupts your studies</h2>
                <p>
                  Identify the most important unfinished work, choose a smaller
                  next step, and rebuild your plan around the time you actually
                  have. Protect sleep, meals, relationships, and rest. Once
                  enrollment opens, published support and extension policies
                  will explain how to request help.
                </p>
              </section>
            </>
          )}
          {section === "community" && (
            <>
              <div className="school-eyebrow">FAITH PRACTICED TOGETHER</div>
              <h1>
                A place to learn.
                <br />
                <em>A community to grow with.</em>
              </h1>
              <p className="school-lead">
                The school’s proposed church community will make room for
                worship, prayer, Bible study, and fellowship. People exploring
                Christianity are welcome.
              </p>
              <div className="school-grid">
                {[
                  {
                    title: "Worship and prayer",
                    text: "Gatherings and prayer opportunities will be announced here when a schedule and participation arrangements are established.",
                  },
                  {
                    title: "Respectful conversation",
                    text: "Ask honest questions. Explain beliefs with care. Disagreement must never become harassment, coercion, or personal attacks.",
                  },
                  {
                    title: "Care and accountability",
                    text: "Robin Cornett will lead the school. AI assistance will be identified clearly and will support learning without presenting itself as a pastor or professional clinician.",
                  },
                ].map((c) => (
                  <article className="school-card" key={c.title}>
                    <h2>{c.title}</h2>
                    <p>{c.text}</p>
                  </article>
                ))}
              </div>
              <section className="school-notice">
                <h2>Community services are being prepared</h2>
                <p>
                  There are no live gatherings, public prayer submissions,
                  private pastoral messages, or ordination applications on this
                  preview. A statement of faith, privacy expectations,
                  moderation process, and support arrangements must be published
                  before those services open.
                </p>
              </section>
            </>
          )}
          {section === "certificates" && (
            <>
              <div className="school-eyebrow">
                MEANINGFUL LEARNING MILESTONES
              </div>
              <h1>
                Show what you’ve learned.
                <br />
                <em>Keep growing.</em>
              </h1>
              <p className="school-lead">
                Certificates will document completion of defined school
                requirements. They are not academic degrees, professional
                licenses, ordination, or a guarantee of acceptance by a church.
              </p>
              <section className="school-card">
                <h2>Proposed completion requirements</h2>
                <p>{assessmentPolicy.status}</p>
                <p>{assessmentPolicy.knowledge}</p>
                <p>{assessmentPolicy.assignments}</p>
                <p>{assessmentPolicy.review}</p>
                <p>
                  Complete all six courses in a pathway and its integration
                  project. Certificate eligibility will be determined from
                  verified records; preview activities do not earn a
                  certificate.
                </p>
                <div className="school-rubric">
                  {assessmentPolicy.rubric.map((item) => (
                    <div key={item.title}>
                      <h3>{item.title}</h3>
                      <p>{item.standard}</p>
                    </div>
                  ))}
                </div>
              </section>
              <div className="school-grid">
                {[
                  "Complete the required lessons and practice",
                  "Demonstrate understanding through assessments",
                  "Submit substantial work for founder review",
                  "Receive a certificate with verification details",
                ].map((t) => (
                  <article className="school-card" key={t}>
                    <CheckCircle2 aria-hidden="true" />
                    <h2>{t}</h2>
                  </article>
                ))}
              </div>
              <section className="school-notice">
                <h2>No certificates have been issued through this preview</h2>
                <p>
                  Assessment standards, review procedures, certificate wording,
                  and verification will be finalized before enrollment.
                  Ordination, if offered later, will require a separate process
                  and verified authority.
                </p>
              </section>
            </>
          )}
          <footer className="school-footer">
            <p>Cornett School of Christianity · A Blended Works project</p>
            <p>Adults 18+ · Nondenominational · Certificate education</p>
          </footer>
        </main>
      </div>
    </div>
  );
}
