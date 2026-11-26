import { auth } from "@clerk/nextjs/server";
import { getAdminContext } from "@/lib/admin";
import { schoolDb, schoolStorageReady, query } from "@/lib/school/store";
import {
  FOUNDATIONS_VERSION,
  isObject,
  isSameOrigin,
  latestAssignmentApproved,
  text,
  type Certificate,
  type StudentProfile,
  type Progress,
  type Release,
  type Submission,
} from "@/lib/school/model";
import lessons from "@/app/apps/cornett-school/lessons.json";
import { curriculum } from "@/app/apps/cornett-school/curriculum";
const json = (body: unknown, status = 200) =>
  Response.json(body, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });
export async function POST(request: Request) {
  if (!isSameOrigin(request.headers.get("origin"), request.url))
    return json({ error: "Invalid request origin." }, 403);
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY)
    return json({ error: "Sign-in is not configured." }, 503);
  const { userId } = await auth();
  if (!userId) return json({ error: "Sign in to continue." }, 401);
  if (
    !schoolStorageReady() ||
    process.env.SCHOOL_CERTIFICATES_ENABLED !== "true"
  )
    return json(
      {
        error:
          "Certificate issuance has not been enabled. No certificate was issued.",
      },
      503,
    );
  const raw = await request.text();
  if (raw.length > 3000) return json({ error: "Request is too large." }, 413);
  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return json({ error: "Invalid request." }, 400);
  }
  if (!isObject(body)) return json({ error: "Invalid request." }, 400);
  try {
    if (body.action === "privacy") {
      const id = text(body.id, 36, 36);
      if (
        !id ||
        !/^[0-9a-f-]{36}$/i.test(id) ||
        typeof body.publicName !== "boolean"
      )
        return json({ error: "Invalid privacy choice." }, 400);
      const rows = await schoolDb<Certificate[]>(
        "school_certificates",
        query({ id: `eq.${id}`, user_id: `eq.${userId}` }),
        "PATCH",
        { public_name: body.publicName },
      );
      if (!rows.length) return json({ error: "Certificate not found." }, 404);
      return json({ updated: true });
    }
    const admin = await getAdminContext();
    if (!admin.isAdmin)
      return json({ error: "Founder approval is required." }, 403);
    if (body.action === "revoke") {
      const id = text(body.id, 36, 36);
      if (!id || !/^[0-9a-f-]{36}$/i.test(id))
        return json({ error: "Invalid certificate." }, 400);
      const rows = await schoolDb<Certificate[]>(
        "school_certificates",
        query({ id: `eq.${id}`, revoked_at: "is.null" }),
        "PATCH",
        { revoked_at: new Date().toISOString(), public_name: false },
      );
      return rows.length
        ? json({ revoked: true })
        : json({ error: "Certificate not found or already revoked." }, 409);
    }
    const studentId = text(body.studentId, 1, 100);
    if (
      body.action !== "issue" ||
      !studentId ||
      !/^user_[a-zA-Z0-9]+$/.test(studentId) ||
      body.reviewConfirmed !== true
    )
      return json(
        { error: "Confirm final portfolio review and select a valid student." },
        400,
      );
    const [profiles, progress, submissions, releases] = await Promise.all([
      schoolDb<StudentProfile[]>(
        "school_students",
        query({ user_id: `eq.${studentId}`, select: "*" }),
      ),
      schoolDb<Progress[]>(
        "school_progress",
        query({
          user_id: `eq.${studentId}`,
          content_version: `eq.${FOUNDATIONS_VERSION}`,
          select: "lesson_id,passed",
        }),
      ),
      schoolDb<Submission[]>(
        "school_submissions",
        query({
          user_id: `eq.${studentId}`,
          content_version: `eq.${FOUNDATIONS_VERSION}`,
          select: "*",
          order: "created_at.desc",
        }),
      ),
      schoolDb<Release[]>(
        "school_releases",
        query({
          content_version: `eq.${FOUNDATIONS_VERSION}`,
          select: "course_id",
        }),
      ),
    ]);
    const courses = curriculum.filter((c) => c.pathway === 0);
    if (
      !profiles[0] ||
      courses.some(
        (c) =>
          !releases.some((r) => r.course_id === c.id) ||
          !latestAssignmentApproved(submissions, c.id),
      ) ||
      lessons
        .filter((l) => courses.some((c) => c.id === l.courseId))
        .some((l) => !progress.some((p) => p.lesson_id === l.id && p.passed)) ||
      !latestAssignmentApproved(submissions, "CSC-P1")
    )
      return json(
        {
          error:
            "The six course reviews, all lesson checks, course releases, and pathway project approval must be complete.",
        },
        409,
      );
    const existing = await schoolDb<Certificate[]>(
      "school_certificates",
      query({
        user_id: `eq.${studentId}`,
        pathway: "eq.0",
        content_version: `eq.${FOUNDATIONS_VERSION}`,
        select: "id",
      }),
    );
    if (existing.length)
      return json(
        {
          error:
            "A certificate record already exists for this program version. Review that record instead of issuing another.",
        },
        409,
      );
    const rows = await schoolDb<Certificate[]>(
      "school_certificates",
      query({}),
      "POST",
      {
        user_id: studentId,
        pathway: 0,
        content_version: FOUNDATIONS_VERSION,
        display_name: profiles[0].display_name,
        public_name: false,
        issued_by: userId,
      },
    );
    return json({ certificate: rows[0] });
  } catch {
    return json(
      {
        error:
          "The certificate operation could not be confirmed. Reload records before retrying.",
      },
      503,
    );
  }
}
