"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { curriculum, assessmentPolicy } from "../curriculum";
import {
  FOUNDATIONS_VERSION,
  SCHOOL_POLICY_VERSION,
  type Certificate,
  type StudentProfile,
  type Progress,
  type Release,
  type Submission,
} from "@/lib/school/model";
type Workspace = {
  profile: StudentProfile | null;
  enrollments: Array<{ course_id: string; content_version: string }>;
  progress: Progress[];
  submissions: Submission[];
  releases: Release[];
  certificates: Certificate[];
  certificatesEnabled: boolean;
  access: boolean;
  isAdmin: boolean;
};
export function StudentWorkspace() {
  const [data, setData] = useState<Workspace | null>(null),
    [message, setMessage] = useState("Loading student records…"),
    [busy, setBusy] = useState(false);
  const [name, setName] = useState(""),
    [adult, setAdult] = useState(false),
    [consent, setConsent] = useState(false);
  const [courseId, setCourseId] = useState("CSC-101"),
    [assignment, setAssignment] = useState("");
  const [pending, setPending] = useState<Submission[]>([]),
    [feedback, setFeedback] = useState<Record<string, string>>({}),
    [confirmed, setConfirmed] = useState<Record<string, boolean>>({}),
    [pilotUser, setPilotUser] = useState("");
  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/school/workspace", {
        cache: "no-store",
      });
      const result = await response.json();
      if (!response.ok) {
        setMessage(result.error ?? "Records are unavailable.");
        return;
      }
      setData(result);
      setMessage("");
    } catch {
      setMessage(
        "Student records could not be loaded. Your unsent writing remains in this page.",
      );
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  async function action(body: unknown, admin: boolean | "certificate" = false) {
    if (busy) return false;
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(
        admin === "certificate"
          ? "/api/school/certificates"
          : admin
            ? "/api/school/review"
            : "/api/school/workspace",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      const result = await response.json();
      if (!response.ok) {
        setMessage(result.error ?? "Action failed.");
        return false;
      }
      await load();
      setMessage("Saved successfully.");
      return true;
    } catch {
      setMessage(
        "The action could not be confirmed. Reload your records before retrying.",
      );
      return false;
    } finally {
      setBusy(false);
    }
  }
  async function loadReview() {
    try {
      const response = await fetch("/api/school/review", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) setMessage(result.error);
      else setPending(result.submissions);
    } catch {
      setMessage("The review queue could not be loaded.");
    }
  }
  const [rubrics, setRubrics] = useState<Record<string, boolean[]>>({});
  const [project, setProject] = useState("");
  const [deletion, setDeletion] = useState("");
  const [certificateStudent, setCertificateStudent] = useState("");
  const [certificateReviewed, setCertificateReviewed] = useState(false);
  const [revokeId, setRevokeId] = useState("");
  async function deleteRecords() {
    if (busy || deletion !== "DELETE MY SCHOOL RECORDS") return;
    setBusy(true);
    try {
      const response = await fetch("/api/school/workspace", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmation: deletion }),
      });
      const result = await response.json();
      if (!response.ok) setMessage(result.error ?? "Deletion failed.");
      else {
        setData(null);
        setDeletion("");
        await load();
        setMessage(
          "Your school records were deleted. Your Blended Works account remains available.",
        );
      }
    } catch {
      setMessage(
        "Deletion could not be confirmed. Reload records before retrying.",
      );
    } finally {
      setBusy(false);
    }
  }
  function exportRecords() {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "cornett-student-records.json";
    a.click();
    URL.revokeObjectURL(url);
  }
  return (
    <>
      <p role="status">{message}</p>
      <button disabled={busy} onClick={load}>
        Reload records
      </button>
      {data && (
        <>
          <section className="school-card">
            <h2>Adult student orientation</h2>
            <p>
              This pilot uses original draft instruction, objective practice
              checks, and founder-reviewed assignments. AI may assist content
              development; it does not issue certificates or make final
              substantial-work decisions. Do not submit confidential information
              about another person. Pilot access is temporary; no subscription
              is charged here.
            </p>
            <p>
              Saved records include your chosen display name, adult/policy
              confirmation, enrollments, lesson responses, check results,
              assignments, and founder feedback. You can view and export them
              below. The founder can review submitted work and lesson responses.
              You can export and delete school records here. A full
              retention/support policy remains a launch requirement.
            </p>
            <p>
              Policy version: {SCHOOL_POLICY_VERSION}. Participation in this
              limited pilot is optional. Do not use it for confidential
              counseling or clinical services.
            </p>
            {data.profile?.policy_version === SCHOOL_POLICY_VERSION ? (
              <p>
                Orientation complete for {data.profile.display_name}.{" "}
                <strong>Access:</strong>{" "}
                {data.access
                  ? "Founder-approved learning pilot"
                  : "Awaiting pilot approval"}
                .
              </p>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void action({
                    action: "profile",
                    displayName: name,
                    adultConfirmed: adult,
                    policyAccepted: consent,
                    policyVersion: SCHOOL_POLICY_VERSION,
                  });
                }}
              >
                <label className="school-field">
                  Display name
                  <input
                    required
                    maxLength={80}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </label>
                <label className="school-choice">
                  <input
                    type="checkbox"
                    checked={adult}
                    onChange={(e) => setAdult(e.target.checked)}
                  />
                  I am at least 18 years old.
                </label>
                <label className="school-choice">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                  />
                  I understand and accept this limited pilot’s recordkeeping and
                  learning terms.
                </label>
                <button
                  disabled={busy || !adult || !consent || !name.trim()}
                  type="submit"
                >
                  Save orientation
                </button>
              </form>
            )}
          </section>
          <h2>Foundations learning record</h2>
          <div className="school-grid">
            {curriculum
              .filter((c) => c.pathway === 0)
              .map((c) => {
                const released = data.releases.some(
                    (r) =>
                      r.course_id === c.id &&
                      r.content_version === FOUNDATIONS_VERSION,
                  ),
                  enrolled = data.enrollments.some(
                    (e) =>
                      e.course_id === c.id &&
                      e.content_version === FOUNDATIONS_VERSION,
                  ),
                  passed = data.progress.filter(
                    (p) => p.lesson_id.startsWith(`${c.id}-`) && p.passed,
                  ).length;
                return (
                  <article className="school-card" key={c.id}>
                    <h3>{c.title}</h3>
                    <p>
                      {released
                        ? "Released for pilot learning"
                        : "Awaiting founder content review"}
                    </p>
                    <p>{passed} of 4 knowledge checks passed</p>
                    <Link href={`/apps/cornett-school/courses/${c.slug}`}>
                      Open lessons and syllabus
                    </Link>
                    <div className="school-actions">
                      <button
                        disabled={
                          busy ||
                          !released ||
                          !data.access ||
                          !data.profile ||
                          enrolled
                        }
                        onClick={() =>
                          action({ action: "enroll", courseId: c.id })
                        }
                      >
                        {enrolled ? "Enrolled" : "Enroll in pilot course"}
                      </button>
                    </div>
                  </article>
                );
              })}
          </div>
          <section className="school-card">
            <h2>Submit a course assignment</h2>
            <p>
              Pass all four lesson checks, then submit the course assignment for
              founder review. Keep your own copy. Revisions create a new
              submission after the previous review, preserving feedback history.
            </p>
            <label className="school-field">
              Course
              <select
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
              >
                {curriculum
                  .filter((c) => c.pathway === 0)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
              </select>
            </label>
            <p>{curriculum.find((c) => c.id === courseId)?.assignment}</p>
            <label className="school-field">
              Assignment text
              <textarea
                rows={10}
                maxLength={20000}
                value={assignment}
                onChange={(e) => setAssignment(e.target.value)}
              />
            </label>
            <button
              disabled={busy || !data.access || assignment.trim().length < 100}
              onClick={async () => {
                if (await action({ action: "submit", courseId, assignment }))
                  setAssignment("");
              }}
            >
              Submit for founder review
            </button>
            <p className="school-muted">
              100–20,000 characters. Declaring sources and AI assistance is part
              of academic integrity. Recorded teaching and file uploads are not
              yet supported; use the pilot for text work only.
            </p>
          </section>
          <section className="school-card">
            <h2>Foundations integration project</h2>
            <p>
              After all six course assignments are approved, bring together a
              contextual passage study, your gospel explanation, and a realistic
              discipleship and study plan. Explain how history and reflection on
              human experience informed your choices. Cite sources, declare AI
              assistance, and identify questions for continued study.
            </p>
            <label className="school-field">
              Project text
              <textarea
                rows={8}
                maxLength={20000}
                value={project}
                onChange={(e) => setProject(e.target.value)}
              />
            </label>
            <button
              disabled={busy || !data.access || project.trim().length < 300}
              onClick={async () => {
                if (await action({ action: "project", assignment: project }))
                  setProject("");
              }}
            >
              Submit pathway project
            </button>
          </section>
          <section className="school-card">
            <h2>Your certificates</h2>
            {data.certificates.length === 0 && (
              <p>
                No certificates have been issued. Completing practice or a draft
                syllabus does not issue one.
              </p>
            )}
            {data.certificates.map((c) => (
              <article key={c.id}>
                <h3>
                  Foundations of Christian Faith ·{" "}
                  {c.revoked_at ? "Revoked" : "Issued"}
                </h3>
                <Link href={`/apps/cornett-school/certificates/${c.id}`}>
                  View and print certificate
                </Link>
                <p>
                  <Link href={`/apps/cornett-school/verify/${c.id}`}>
                    Public verification record
                  </Link>
                </p>
                <label className="school-choice">
                  <input
                    type="checkbox"
                    checked={c.public_name}
                    disabled={busy || Boolean(c.revoked_at)}
                    onChange={(e) =>
                      action(
                        {
                          action: "privacy",
                          id: c.id,
                          publicName: e.target.checked,
                        },
                        "certificate",
                      )
                    }
                  />
                  Show my display name on public verification. Off by default.
                </label>
              </article>
            ))}
          </section>
          <section className="school-card">
            <h2>Your assignment history</h2>
            <p className="school-muted">
              Showing your latest 100 submissions. The export includes the
              records loaded in this view.
            </p>
            {data.submissions.length === 0 && <p>No assignments submitted.</p>}
            {data.submissions.map((s) => (
              <details key={s.id}>
                <summary>
                  {s.course_id} · {s.status} ·{" "}
                  {new Date(s.created_at).toLocaleDateString()}
                </summary>
                <p className="school-preserve">{s.body}</p>
                <p>
                  <strong>Founder feedback:</strong>{" "}
                  {s.feedback ?? "Awaiting review"}
                </p>
              </details>
            ))}
            <button onClick={exportRecords}>
              Export loaded student records
            </button>
          </section>
          <section className="school-card">
            <h2>Delete my school records</h2>
            <p>
              Export your records first if you want a copy. Deletion removes
              your school profile, enrollments, progress, assignments, and
              certificate records; certificate verification will no longer work.
              Your Blended Works sign-in account is separate. This does not
              promise immediate removal from database backups.
            </p>
            <label className="school-field">
              Type DELETE MY SCHOOL RECORDS to confirm
              <input
                value={deletion}
                onChange={(e) => setDeletion(e.target.value)}
              />
            </label>
            <button
              disabled={busy || deletion !== "DELETE MY SCHOOL RECORDS"}
              onClick={deleteRecords}
            >
              Permanently delete my school records
            </button>
          </section>
          {data.isAdmin && (
            <section className="school-card">
              <h2>Founder administration</h2>
              <h3>Release reviewed Foundations courses</h3>
              <p>
                Review every lesson, source, practice question, and assignment
                before approving this version. Approval enables pilot
                recordkeeping, not paid enrollment or certificate issuance.
              </p>
              {curriculum
                .filter((c) => c.pathway === 0)
                .map((c) => (
                  <div className="school-release" key={c.id}>
                    <label className="school-choice">
                      <input
                        type="checkbox"
                        checked={confirmed[c.id] ?? false}
                        onChange={(e) =>
                          setConfirmed((prev) => ({
                            ...prev,
                            [c.id]: e.target.checked,
                          }))
                        }
                      />
                      I reviewed {c.title} and its assessments.
                    </label>
                    <button
                      disabled={busy || !confirmed[c.id]}
                      onClick={() =>
                        action(
                          {
                            action: "release",
                            courseId: c.id,
                            reviewConfirmed: true,
                          },
                          true,
                        )
                      }
                    >
                      Approve course version
                    </button>
                  </div>
                ))}
              <h3>Grant 30-day pilot access</h3>
              <label className="school-field">
                Existing student Clerk user ID
                <input
                  value={pilotUser}
                  onChange={(e) => setPilotUser(e.target.value)}
                  placeholder="user_…"
                />
              </label>
              <button
                disabled={busy || !pilotUser.trim()}
                onClick={() =>
                  action({ action: "pilot", userId: pilotUser.trim() }, true)
                }
              >
                Grant pilot access
              </button>
              <h3>Final certificate review</h3>
              <p>
                Issuance is disabled until live storage, review standards, and
                certificate wording are verified. The server checks all 24
                lesson checks, six approved course assignments, course releases,
                and the approved integration project.
              </p>
              <label className="school-field">
                Student Clerk user ID
                <input
                  value={certificateStudent}
                  onChange={(e) => setCertificateStudent(e.target.value)}
                />
              </label>
              <label className="school-choice">
                <input
                  type="checkbox"
                  checked={certificateReviewed}
                  onChange={(e) => setCertificateReviewed(e.target.checked)}
                />
                I completed final portfolio review and approve this certificate.
              </label>
              <button
                disabled={
                  busy ||
                  !data.certificatesEnabled ||
                  !certificateReviewed ||
                  !certificateStudent.trim()
                }
                onClick={() =>
                  action(
                    {
                      action: "issue",
                      studentId: certificateStudent.trim(),
                      reviewConfirmed: true,
                    },
                    "certificate",
                  )
                }
              >
                Issue Foundations certificate
              </button>
              <label className="school-field">
                Certificate ID to revoke
                <input
                  value={revokeId}
                  onChange={(e) => setRevokeId(e.target.value)}
                />
              </label>
              <button
                disabled={busy || !data.certificatesEnabled || !revokeId.trim()}
                onClick={() =>
                  action(
                    { action: "revoke", id: revokeId.trim() },
                    "certificate",
                  )
                }
              >
                Revoke certificate
              </button>
              <h3>Review assignments</h3>
              <button disabled={busy} onClick={loadReview}>
                Load pending assignments
              </button>
              {pending.map((s) => (
                <article className="school-review" key={s.id}>
                  <h3>
                    {s.course_id} · {s.user_id}
                  </h3>
                  <p className="school-preserve">{s.body}</p>
                  <fieldset>
                    <legend>
                      Rubric — mark each dimension that meets the competent
                      standard
                    </legend>
                    {assessmentPolicy.rubric.map((dimension, index) => (
                      <label className="school-choice" key={dimension.title}>
                        <input
                          type="checkbox"
                          checked={rubrics[s.id]?.[index] ?? false}
                          onChange={(e) =>
                            setRubrics((prev) => {
                              const ratings = [
                                ...(prev[s.id] ?? [false, false, false, false]),
                              ];
                              ratings[index] = e.target.checked;
                              return { ...prev, [s.id]: ratings };
                            })
                          }
                        />
                        {dimension.title}: {dimension.standard}
                      </label>
                    ))}
                  </fieldset>
                  <label className="school-field">
                    Feedback
                    <textarea
                      rows={4}
                      maxLength={10000}
                      value={feedback[s.id] ?? ""}
                      onChange={(e) =>
                        setFeedback((prev) => ({
                          ...prev,
                          [s.id]: e.target.value,
                        }))
                      }
                    />
                  </label>
                  <div className="school-actions">
                    {["approved", "revise"].map((status) => (
                      <button
                        key={status}
                        disabled={
                          busy || (feedback[s.id] ?? "").trim().length < 20
                        }
                        onClick={async () => {
                          if (
                            await action(
                              {
                                action: "review",
                                submissionId: s.id,
                                status,
                                feedback: feedback[s.id],
                                rubric: rubrics[s.id] ?? [
                                  false,
                                  false,
                                  false,
                                  false,
                                ],
                              },
                              true,
                            )
                          )
                            await loadReview();
                        }}
                      >
                        {status === "approved"
                          ? "Approve assignment"
                          : "Request revision"}
                      </button>
                    ))}
                  </div>
                </article>
              ))}
            </section>
          )}
        </>
      )}
    </>
  );
}
