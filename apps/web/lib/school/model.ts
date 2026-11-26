export const SCHOOL_POLICY_VERSION = "2026-11-26-pilot-v1";
export const FOUNDATIONS_VERSION = "2026-11-foundations-v1";
export type StudentProfile = {
  user_id: string;
  display_name: string;
  adult_confirmed: boolean;
  policy_version: string;
  created_at: string;
};
export type Progress = {
  user_id: string;
  lesson_id: string;
  content_version: string;
  passed: boolean;
  reflection: string;
  updated_at: string;
};
export type Submission = {
  id: string;
  user_id: string;
  course_id: string;
  content_version: string;
  body: string;
  status: "pending" | "approved" | "revise";
  feedback: string | null;
  reviewed_by: string | null;
  created_at: string;
};
export type Release = {
  course_id: string;
  content_version: string;
  approved_by: string;
  approved_at: string;
};
export function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
export function text(value: unknown, min: number, max: number) {
  return typeof value === "string" &&
    value.trim().length >= min &&
    value.length <= max
    ? value.trim()
    : null;
}
export function isSameOrigin(origin: string | null, url: string) {
  return origin !== null && origin === new URL(url).origin;
}
export function hasSchoolAccess(
  isAdmin: boolean,
  metadata: Record<string, unknown>,
  now = Date.now(),
) {
  if (isAdmin) return true;
  return (
    metadata.schoolAccess === "pilot" &&
    typeof metadata.schoolAccessUntil === "string" &&
    Number.isFinite(Date.parse(metadata.schoolAccessUntil)) &&
    Date.parse(metadata.schoolAccessUntil) > now
  );
}
export function gradeAnswer(
  answer: unknown,
  correct: number,
  optionCount: number,
) {
  if (
    typeof answer !== "number" ||
    !Number.isInteger(answer) ||
    answer < 0 ||
    answer >= optionCount
  )
    return null;
  return answer === correct;
}

export type Certificate = {
  id: string;
  user_id: string;
  pathway: number;
  content_version: string;
  display_name: string;
  public_name: boolean;
  issued_by: string;
  issued_at: string;
  revoked_at: string | null;
};
export function latestAssignmentApproved(
  submissions: Submission[],
  courseId: string,
) {
  const latest = submissions
    .filter(
      (s) =>
        s.course_id === courseId && s.content_version === FOUNDATIONS_VERSION,
    )
    .sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
  return latest?.status === "approved";
}

export function validReviewRubric(
  value: unknown,
  status: string,
): value is boolean[] {
  return (
    Array.isArray(value) &&
    value.length === 4 &&
    value.every((item) => typeof item === "boolean") &&
    (status !== "approved" || value.every(Boolean))
  );
}
