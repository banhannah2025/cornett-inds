import { getAdminContext } from "@/lib/admin";
import { clerkClient } from "@clerk/nextjs/server";
import { schoolDb, schoolStorageReady, query } from "@/lib/school/store";
import {
  FOUNDATIONS_VERSION,
  validReviewRubric,
  isObject,
  isSameOrigin,
  text,
  type Submission,
} from "@/lib/school/model";
import { curriculum } from "@/app/apps/cornett-school/curriculum";
const json = (body: unknown, status = 200) =>
  Response.json(body, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });
export async function GET() {
  const admin = await getAdminContext();
  if (!admin.isAdmin)
    return json({ error: "Administrator access required." }, 403);
  if (!schoolStorageReady())
    return json({ error: "Private school storage is not configured." }, 503);
  try {
    return json({
      submissions: await schoolDb<Submission[]>(
        "school_submissions",
        query({
          status: "eq.pending",
          select: "*",
          order: "created_at.asc",
          limit: "50",
        }),
      ),
    });
  } catch {
    return json({ error: "The review queue is unavailable." }, 503);
  }
}
export async function POST(request: Request) {
  if (!isSameOrigin(request.headers.get("origin"), request.url))
    return json({ error: "Invalid request origin." }, 403);
  const admin = await getAdminContext();
  if (!admin.isAdmin || !admin.userId)
    return json({ error: "Administrator access required." }, 403);
  const raw = await request.text();
  if (raw.length > 15000) return json({ error: "Request is too large." }, 413);
  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return json({ error: "Invalid request." }, 400);
  }
  if (!isObject(body)) return json({ error: "Invalid request." }, 400);
  try {
    if (body.action === "pilot") {
      const userId = text(body.userId, 1, 100);
      if (!userId || !/^user_[a-zA-Z0-9]+$/.test(userId))
        return json({ error: "Enter a valid Clerk user ID." }, 400);
      const client = await clerkClient();
      await client.users.updateUserMetadata(userId, {
        publicMetadata: {
          schoolAccess: "pilot",
          schoolAccessUntil: new Date(Date.now() + 30 * 86400000).toISOString(),
        },
      });
      return json({ granted: true });
    }
    if (!schoolStorageReady())
      return json({ error: "Private school storage is not configured." }, 503);
    if (body.action === "release") {
      const course = curriculum.find(
        (c) => c.id === body.courseId && c.pathway === 0,
      );
      if (!course || body.reviewConfirmed !== true)
        return json(
          {
            error: "Confirm review of the complete course and its assessments.",
          },
          400,
        );
      await schoolDb(
        "school_releases",
        query({ on_conflict: "course_id" }),
        "POST",
        {
          course_id: course.id,
          content_version: FOUNDATIONS_VERSION,
          approved_by: admin.userId,
          approved_at: new Date().toISOString(),
        },
        true,
      );
      return json({ released: true });
    }
    if (body.action === "review") {
      const id = text(body.submissionId, 36, 36),
        feedback = text(body.feedback, 20, 10000);
      if (
        !id ||
        !/^[0-9a-f-]{36}$/i.test(id) ||
        !feedback ||
        !["approved", "revise"].includes(String(body.status))
      )
        return json(
          {
            error:
              "Choose a decision and provide at least 20 characters of feedback.",
          },
          400,
        );
      if (!validReviewRubric(body.rubric, String(body.status)))
        return json(
          {
            error:
              "Assess all four rubric dimensions; approval requires competence in each.",
          },
          400,
        );
      const rows = await schoolDb<Submission[]>(
        "school_submissions",
        query({ id: `eq.${id}`, status: "eq.pending" }),
        "PATCH",
        {
          status: body.status,
          feedback,
          review_rubric: body.rubric,
          reviewed_by: admin.userId,
          reviewed_at: new Date().toISOString(),
        },
      );
      if (!rows.length)
        return json(
          {
            error:
              "This assignment was already reviewed or no longer exists. Refresh the queue.",
          },
          409,
        );
      return json({ reviewed: true });
    }
    return json({ error: "Unknown review action." }, 400);
  } catch {
    return json(
      {
        error: "The operation could not be confirmed. Reload before retrying.",
      },
      503,
    );
  }
}
