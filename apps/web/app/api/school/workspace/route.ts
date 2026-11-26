import { auth, currentUser } from "@clerk/nextjs/server";
import { getAdminContext } from "@/lib/admin";
import { schoolDb, schoolStorageReady, query } from "@/lib/school/store";
import {
  SCHOOL_POLICY_VERSION,
  FOUNDATIONS_VERSION,
  gradeAnswer,
  hasSchoolAccess,
  isObject,
  isSameOrigin,
  text,
  type Certificate,
  latestAssignmentApproved,
  type StudentProfile,
  type Progress,
  type Release,
  type Submission,
} from "@/lib/school/model";
import lessons from "@/app/apps/cornett-school/lessons.json";
import { curriculum } from "@/app/apps/cornett-school/curriculum";
const privateHeaders = { "Cache-Control": "private, no-store" };
const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: privateHeaders });
export async function GET() {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY)
    return json({ error: "School sign-in is not configured." }, 503);
  const { userId } = await auth();
  if (!userId)
    return json({ error: "Sign in to open your student records." }, 401);
  if (!schoolStorageReady())
    return json(
      {
        error:
          "Private student storage is not configured. Practice lessons remain available; no student record has been saved.",
      },
      503,
    );
  try {
    const [user, admin] = await Promise.all([currentUser(), getAdminContext()]);
    const [
      profiles,
      enrollments,
      progress,
      submissions,
      releases,
      certificates,
    ] = await Promise.all([
      schoolDb<StudentProfile[]>(
        "school_students",
        query({ user_id: `eq.${userId}`, select: "*" }),
      ),
      schoolDb<Array<{ course_id: string; content_version: string }>>(
        "school_enrollments",
        query({
          user_id: `eq.${userId}`,
          select: "course_id,content_version",
        }),
      ),
      schoolDb<Progress[]>(
        "school_progress",
        query({
          user_id: `eq.${userId}`,
          content_version: `eq.${FOUNDATIONS_VERSION}`,
          select: "*",
        }),
      ),
      schoolDb<Submission[]>(
        "school_submissions",
        query({
          user_id: `eq.${userId}`,
          select: "*",
          order: "created_at.desc",
          limit: "100",
        }),
      ),
      schoolDb<Release[]>(
        "school_releases",
        query({ select: "course_id,content_version,approved_at" }),
      ),
      schoolDb<Certificate[]>(
        "school_certificates",
        query({ user_id: `eq.${userId}`, select: "*" }),
      ),
    ]);
    return json({
      profile: profiles[0] ?? null,
      enrollments,
      progress,
      submissions,
      releases,
      certificates,
      certificatesEnabled: process.env.SCHOOL_CERTIFICATES_ENABLED === "true",
      isAdmin: admin.isAdmin,
      access: hasSchoolAccess(admin.isAdmin, user?.publicMetadata ?? {}),
      policyVersion: SCHOOL_POLICY_VERSION,
    });
  } catch {
    return json(
      { error: "Student records could not be loaded. Please try again later." },
      503,
    );
  }
}
export async function POST(request: Request) {
  if (!isSameOrigin(request.headers.get("origin"), request.url))
    return json({ error: "Invalid request origin." }, 403);
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY)
    return json({ error: "School sign-in is not configured." }, 503);
  const { userId } = await auth();
  if (!userId) return json({ error: "Sign in to continue." }, 401);
  if (!schoolStorageReady())
    return json(
      {
        error: "Private student storage is not configured. Nothing was saved.",
      },
      503,
    );
  const raw = await request.text();
  if (raw.length > 30000)
    return json({ error: "Submission is too large." }, 413);
  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return json({ error: "Invalid request." }, 400);
  }
  if (!isObject(body)) return json({ error: "Invalid request." }, 400);
  try {
    if (body.action === "profile") {
      const name = text(body.displayName, 1, 80);
      if (
        !name ||
        body.adultConfirmed !== true ||
        body.policyAccepted !== true ||
        body.policyVersion !== SCHOOL_POLICY_VERSION
      )
        return json(
          {
            error:
              "Confirm you are 18 or older and accept the current pilot policy.",
          },
          400,
        );
      const profiles = await schoolDb<StudentProfile[]>(
        "school_students",
        query({ on_conflict: "user_id" }),
        "POST",
        {
          user_id: userId,
          display_name: name,
          adult_confirmed: true,
          policy_version: SCHOOL_POLICY_VERSION,
        },
        true,
      );
      return json({ profile: profiles[0] });
    }
    const [user, admin, profiles] = await Promise.all([
      currentUser(),
      getAdminContext(),
      schoolDb<StudentProfile[]>(
        "school_students",
        query({ user_id: `eq.${userId}`, select: "*" }),
      ),
    ]);
    if (!profiles[0] || profiles[0].policy_version !== SCHOOL_POLICY_VERSION)
      return json(
        { error: "Complete the current adult student orientation first." },
        403,
      );
    if (!hasSchoolAccess(admin.isAdmin, user?.publicMetadata ?? {}))
      return json(
        {
          error:
            "Recorded learning is currently available to founder-approved pilot students. Paid enrollment is not open.",
        },
        403,
      );
    if (body.action === "project") {
      const assignment = text(body.assignment, 300, 20000);
      if (!assignment)
        return json(
          {
            error: "Write a pathway project between 300 and 20,000 characters.",
          },
          400,
        );
      const submissions = await schoolDb<Submission[]>(
        "school_submissions",
        query({
          user_id: `eq.${userId}`,
          content_version: `eq.${FOUNDATIONS_VERSION}`,
          select: "*",
          order: "created_at.desc",
        }),
      );
      if (
        curriculum
          .filter((c) => c.pathway === 0)
          .some((c) => !latestAssignmentApproved(submissions, c.id))
      )
        return json(
          {
            error:
              "All six course assignments must be approved before the pathway project is submitted.",
          },
          409,
        );
      if (latestAssignmentApproved(submissions, "CSC-P1"))
        return json(
          { error: "Your pathway project is already approved." },
          409,
        );
      if (
        submissions.some(
          (s) => s.course_id === "CSC-P1" && s.status === "pending",
        )
      )
        return json(
          { error: "Your pathway project is already awaiting review." },
          409,
        );
      const result = await schoolDb<Submission[]>(
        "school_submissions",
        query({}),
        "POST",
        {
          user_id: userId,
          course_id: "CSC-P1",
          content_version: FOUNDATIONS_VERSION,
          body: assignment,
          status: "pending",
        },
      );
      return json({ submission: result[0] });
    }
    const course = curriculum.find(
      (c) => c.id === body.courseId && c.pathway === 0,
    );
    if (!course)
      return json(
        { error: "This course is not available for recorded learning." },
        400,
      );
    const releases = await schoolDb<Release[]>(
      "school_releases",
      query({
        course_id: `eq.${course.id}`,
        content_version: `eq.${FOUNDATIONS_VERSION}`,
        select: "*",
      }),
    );
    if (!releases[0])
      return json(
        {
          error:
            "The founder has not released this course version for recorded learning.",
        },
        409,
      );
    if (body.action === "enroll") {
      await schoolDb(
        "school_enrollments",
        query({ on_conflict: "user_id,course_id,content_version" }),
        "POST",
        {
          user_id: userId,
          course_id: course.id,
          content_version: FOUNDATIONS_VERSION,
        },
        true,
      );
      return json({ enrolled: true });
    }
    const enrollments = await schoolDb<unknown[]>(
      "school_enrollments",
      query({
        user_id: `eq.${userId}`,
        course_id: `eq.${course.id}`,
        content_version: `eq.${FOUNDATIONS_VERSION}`,
        select: "course_id",
      }),
    );
    if (!enrollments.length)
      return json({ error: "Enroll in this course before saving work." }, 403);
    if (body.action === "progress") {
      const lesson = lessons.find(
        (l) => l.id === body.lessonId && l.courseId === course.id,
      );
      const reflection = text(body.reflection, 20, 10000);
      const passed = lesson
        ? gradeAnswer(body.answer, lesson.correct, lesson.options.length)
        : null;
      if (!lesson || !reflection || passed === null)
        return json(
          {
            error:
              "Choose an answer and write at least 20 characters of reflection.",
          },
          400,
        );
      await schoolDb(
        "school_progress",
        query({ on_conflict: "user_id,lesson_id,content_version" }),
        "POST",
        {
          user_id: userId,
          lesson_id: lesson.id,
          content_version: FOUNDATIONS_VERSION,
          passed,
          reflection,
          updated_at: new Date().toISOString(),
        },
        true,
      );
      return json({ saved: true, passed, feedback: lesson.explanation });
    }
    if (body.action === "submit") {
      const assignment = text(body.assignment, 100, 20000);
      if (!assignment)
        return json(
          { error: "Write an assignment between 100 and 20,000 characters." },
          400,
        );
      const progress = await schoolDb<Progress[]>(
        "school_progress",
        query({
          user_id: `eq.${userId}`,
          content_version: `eq.${FOUNDATIONS_VERSION}`,
          select: "lesson_id,passed",
        }),
      );
      const required = lessons.filter((l) => l.courseId === course.id);
      if (
        required.some(
          (l) => !progress.some((p) => p.lesson_id === l.id && p.passed),
        )
      )
        return json(
          {
            error:
              "Pass all four lesson knowledge checks before submitting the course assignment.",
          },
          409,
        );
      const reviewed = await schoolDb<Submission[]>(
        "school_submissions",
        query({
          user_id: `eq.${userId}`,
          course_id: `eq.${course.id}`,
          content_version: `eq.${FOUNDATIONS_VERSION}`,
          select: "*",
          order: "created_at.desc",
          limit: "1",
        }),
      );
      if (latestAssignmentApproved(reviewed, course.id))
        return json(
          {
            error:
              "This course assignment is already approved. Contact the founder if a correction is needed.",
          },
          409,
        );
      const pending = await schoolDb<Submission[]>(
        "school_submissions",
        query({
          user_id: `eq.${userId}`,
          course_id: `eq.${course.id}`,
          status: "eq.pending",
          select: "id",
        }),
      );
      if (pending.length)
        return json(
          { error: "An assignment is already awaiting review." },
          409,
        );
      const submissions = await schoolDb<Submission[]>(
        "school_submissions",
        query({}),
        "POST",
        {
          user_id: userId,
          course_id: course.id,
          content_version: FOUNDATIONS_VERSION,
          body: assignment,
          status: "pending",
        },
      );
      return json({ submission: submissions[0] });
    }
    return json({ error: "Unknown school action." }, 400);
  } catch {
    return json(
      {
        error:
          "The operation could not be confirmed. Reload your records before retrying.",
      },
      503,
    );
  }
}

export async function DELETE(request: Request) {
  if (!isSameOrigin(request.headers.get("origin"), request.url))
    return json({ error: "Invalid request origin." }, 403);
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY)
    return json({ error: "School sign-in is not configured." }, 503);
  const { userId } = await auth();
  if (!userId) return json({ error: "Sign in to continue." }, 401);
  if (!schoolStorageReady())
    return json({ error: "Private school storage is not configured." }, 503);
  const body = await request.json().catch(() => null);
  if (!isObject(body) || body.confirmation !== "DELETE MY SCHOOL RECORDS")
    return json({ error: "Explicit deletion confirmation is required." }, 400);
  try {
    await schoolDb(
      "school_students",
      query({ user_id: `eq.${userId}` }),
      "DELETE",
    );
    return json({ deleted: true });
  } catch {
    return json(
      { error: "Deletion could not be confirmed. Reload your records." },
      503,
    );
  }
}
