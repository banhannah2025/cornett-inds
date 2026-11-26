const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
const root = path.resolve(__dirname, "../..");
function load(file, imports = {}, env = {}) {
  const source = fs.readFileSync(file, "utf8");
  const code = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
  }).outputText;
  const exports = {};
  vm.runInNewContext(code, {
    exports,
    require: (name) => {
      if (!(name in imports)) throw new Error(`Unexpected import ${name}`);
      return imports[name];
    },
    process: { env: { NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "test", ...env } },
    URL,
    Response,
    Request,
    AbortSignal,
    Date,
    console,
  });
  return exports;
}
const model = load(path.join(__dirname, "model.ts"));
const lessons = JSON.parse(
  fs.readFileSync(path.join(root, "app/apps/cornett-school/lessons.json")),
);
const curriculum = JSON.parse(
  fs.readFileSync(path.join(root, "app/apps/cornett-school/curriculum.json")),
);
function routeHarness(overrides = {}) {
  const writes = [];
  const state = {
    userId: "user_studentA",
    admin: false,
    access: true,
    released: true,
    enrolled: true,
    ready: true,
    progress: [],
    ...overrides,
  };
  const db = async (table, params, method = "GET", body) => {
    if (method !== "GET") {
      writes.push({ table, params: Object.fromEntries(params), method, body });
      return [{ ...body, id: "test-id" }];
    }
    if (table === "school_students")
      return [
        { user_id: state.userId, policy_version: model.SCHOOL_POLICY_VERSION },
      ];
    if (table === "school_releases")
      return state.released
        ? [{ course_id: "CSC-101", content_version: model.FOUNDATIONS_VERSION }]
        : [];
    if (table === "school_enrollments")
      return state.enrolled ? [{ course_id: "CSC-101" }] : [];
    if (table === "school_progress") return state.progress;
    return [];
  };
  const imports = {
    "@clerk/nextjs/server": {
      auth: async () => ({ userId: state.userId }),
      currentUser: async () => ({
        publicMetadata: state.access
          ? { schoolAccess: "pilot", schoolAccessUntil: "2099-01-01" }
          : {},
      }),
    },
    "@/lib/admin": { getAdminContext: async () => ({ isAdmin: state.admin }) },
    "@/lib/school/store": {
      schoolDb: db,
      schoolStorageReady: () => state.ready,
      query: (values) => new URLSearchParams(values),
    },
    "@/lib/school/model": model,
    "@/app/apps/cornett-school/lessons.json": lessons,
    "@/app/apps/cornett-school/curriculum": { curriculum },
  };
  return {
    routes: load(path.join(root, "app/api/school/workspace/route.ts"), imports),
    writes,
  };
}
function request(body, origin = "https://school.example") {
  return new Request("https://school.example/api/school/workspace", {
    method: "POST",
    headers: { Origin: origin, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}
const lesson = lessons[0];
const progressBody = {
  action: "progress",
  courseId: lesson.courseId,
  lessonId: lesson.id,
  answer: lesson.correct,
  reflection: "A contextual observation and a practical response.",
};
test("pilot entitlements expire and invalid dates do not grant access", () => {
  assert.equal(
    model.hasSchoolAccess(false, {
      schoolAccess: "pilot",
      schoolAccessUntil: "invalid",
    }),
    false,
  );
  assert.equal(
    model.hasSchoolAccess(false, {
      schoolAccess: "pilot",
      schoolAccessUntil: "2020-01-01",
    }),
    false,
  );
  assert.equal(
    model.hasSchoolAccess(false, {
      schoolAccess: "pilot",
      schoolAccessUntil: "2099-01-01",
    }),
    true,
  );
});
test("grading rejects booleans, strings, fractional and out-of-range answers", () => {
  for (const value of [true, "0", -1, 1.5, 99, null])
    assert.equal(model.gradeAnswer(value, 0, 3), null);
});
test("cross-origin mutation is rejected without a write", async () => {
  const h = routeHarness();
  assert.equal(
    (await h.routes.POST(request(progressBody, "https://evil.example"))).status,
    403,
  );
  assert.equal(h.writes.length, 0);
});
test("anonymous users cannot read or save student records", async () => {
  const h = routeHarness({ userId: null });
  assert.equal((await h.routes.GET()).status, 401);
  assert.equal((await h.routes.POST(request(progressBody))).status, 401);
  assert.equal(h.writes.length, 0);
});
test("missing private storage fails closed", async () => {
  const h = routeHarness({ ready: false });
  assert.equal((await h.routes.POST(request(progressBody))).status, 503);
  assert.equal(h.writes.length, 0);
});
test("unapproved pilot access, unreleased content and unenrolled learning cannot be saved", async () => {
  for (const state of [
    { access: false },
    { released: false },
    { enrolled: false },
  ]) {
    const h = routeHarness(state);
    const response = await h.routes.POST(request(progressBody));
    assert.ok([403, 409].includes(response.status));
    assert.equal(h.writes.length, 0);
  }
});
test("forged ownership and pass flags are ignored; grading is computed by the server", async () => {
  const h = routeHarness();
  const response = await h.routes.POST(
    request({
      ...progressBody,
      userId: "user_victim",
      passed: true,
      answer: (lesson.correct + 1) % lesson.options.length,
    }),
  );
  assert.equal(response.status, 200);
  assert.equal(h.writes[0].body.user_id, "user_studentA");
  assert.equal(h.writes[0].body.passed, false);
});
test("lesson must belong to the requested course", async () => {
  const h = routeHarness();
  assert.equal(
    (await h.routes.POST(request({ ...progressBody, lessonId: lessons[4].id })))
      .status,
    400,
  );
  assert.equal(h.writes.length, 0);
});
test("adult orientation requires explicit policy acceptance", async () => {
  const h = routeHarness();
  assert.equal(
    (
      await h.routes.POST(
        request({
          action: "profile",
          displayName: "Student",
          adultConfirmed: true,
          policyVersion: model.SCHOOL_POLICY_VERSION,
        }),
      )
    ).status,
    400,
  );
  assert.equal(h.writes.length, 0);
});
test("assignment cannot bypass required lesson mastery", async () => {
  const h = routeHarness();
  const response = await h.routes.POST(
    request({
      action: "submit",
      courseId: "CSC-101",
      assignment: "An assignment. ".repeat(20),
    }),
  );
  assert.equal(response.status, 409);
  assert.equal(h.writes.length, 0);
});
test("all six foundation courses have four substantive original lessons and valid answers", () => {
  assert.equal(lessons.length, 24);
  assert.equal(new Set(lessons.map((l) => l.id)).size, 24);
  for (const course of curriculum.filter((c) => c.pathway === 0))
    assert.equal(lessons.filter((l) => l.courseId === course.id).length, 4);
  for (const l of lessons) {
    assert.ok(l.paragraphs.join(" ").split(/\s+/).length > 110);
    assert.ok(l.correct >= 0 && l.correct < l.options.length);
    assert.equal(new Set(l.options).size, l.options.length);
  }
});

test("a more recent revision request supersedes an older approved assignment", () => {
  const base = {
    course_id: "CSC-101",
    content_version: model.FOUNDATIONS_VERSION,
  };
  assert.equal(
    model.latestAssignmentApproved(
      [
        { ...base, status: "approved", created_at: "2026-11-01" },
        { ...base, status: "revise", created_at: "2026-11-02" },
      ],
      "CSC-101",
    ),
    false,
  );
});
test("approval requires competence in every rubric dimension", () => {
  assert.equal(
    model.validReviewRubric([true, true, true, false], "approved"),
    false,
  );
  assert.equal(
    model.validReviewRubric([true, true, true, true], "approved"),
    true,
  );
  assert.equal(
    model.validReviewRubric([false, false, false, false], "revise"),
    true,
  );
  assert.equal(model.validReviewRubric([1, 1, 1, 1], "approved"), false);
});
test("deletion requires explicit confirmation and scopes deletion to the signed-in student", async () => {
  const h = routeHarness();
  const url = "https://school.example/api/school/workspace";
  const make = (body) =>
    new Request(url, {
      method: "DELETE",
      headers: {
        Origin: "https://school.example",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
  assert.equal(
    (await h.routes.DELETE(make({ confirmation: "yes" }))).status,
    400,
  );
  assert.equal(h.writes.length, 0);
  assert.equal(
    (
      await h.routes.DELETE(
        make({
          confirmation: "DELETE MY SCHOOL RECORDS",
          userId: "user_victim",
        }),
      )
    ).status,
    200,
  );
  assert.equal(h.writes[0].params.user_id, "eq.user_studentA");
});
test("founder review endpoints reject a student before database access", async () => {
  const routes = load(path.join(root, "app/api/school/review/route.ts"), {
    "@/lib/admin": { getAdminContext: async () => ({ isAdmin: false }) },
    "@clerk/nextjs/server": {},
    "@/lib/school/store": {
      schoolDb: () => {
        throw new Error("Must not access database");
      },
      schoolStorageReady: () => true,
    },
    "@/lib/school/model": model,
    "@/app/apps/cornett-school/curriculum": { curriculum },
  });
  assert.equal((await routes.GET()).status, 403);
  assert.equal(
    (
      await routes.POST(
        request({
          action: "release",
          courseId: "CSC-101",
          reviewConfirmed: true,
        }),
      )
    ).status,
    403,
  );
});

function certificateHarness({ admin = false, complete = true } = {}) {
  const writes = [];
  const schoolDb = async (table, params, method = "GET", body) => {
    if (method !== "GET") {
      writes.push({ table, params: Object.fromEntries(params), body });
      return [{ ...body, id: "00000000-0000-0000-0000-000000000001" }];
    }
    if (table === "school_students")
      return [{ user_id: "user_studentA", display_name: "Student A" }];
    if (table === "school_progress")
      return complete
        ? lessons.map((l) => ({ lesson_id: l.id, passed: true }))
        : [];
    if (table === "school_releases")
      return curriculum
        .filter((c) => c.pathway === 0)
        .map((c) => ({ course_id: c.id }));
    if (table === "school_submissions")
      return [
        ...curriculum.filter((c) => c.pathway === 0).map((c) => c.id),
        "CSC-P1",
      ].map((id) => ({
        course_id: id,
        content_version: model.FOUNDATIONS_VERSION,
        status: "approved",
        created_at: "2026-11-26T00:00:00Z",
      }));
    return [];
  };
  const routes = load(
    path.join(root, "app/api/school/certificates/route.ts"),
    {
      "@clerk/nextjs/server": {
        auth: async () => ({ userId: "user_studentA" }),
      },
      "@/lib/admin": { getAdminContext: async () => ({ isAdmin: admin }) },
      "@/lib/school/store": {
        schoolDb,
        schoolStorageReady: () => true,
        query: (values) => new URLSearchParams(values),
      },
      "@/lib/school/model": model,
      "@/app/apps/cornett-school/lessons.json": lessons,
      "@/app/apps/cornett-school/curriculum": { curriculum },
    },
    { SCHOOL_CERTIFICATES_ENABLED: "true" },
  );
  return { routes, writes };
}
test("students cannot issue their own certificate", async () => {
  const h = certificateHarness();
  assert.equal(
    (
      await h.routes.POST(
        request({
          action: "issue",
          studentId: "user_studentA",
          reviewConfirmed: true,
        }),
      )
    ).status,
    403,
  );
  assert.equal(h.writes.length, 0);
});
test("founder certificate issuance fails when lesson evidence is incomplete", async () => {
  const h = certificateHarness({ admin: true, complete: false });
  assert.equal(
    (
      await h.routes.POST(
        request({
          action: "issue",
          studentId: "user_studentA",
          reviewConfirmed: true,
        }),
      )
    ).status,
    409,
  );
  assert.equal(h.writes.length, 0);
});
test("certificate issuance requires all evidence and defaults the recipient name to private", async () => {
  const h = certificateHarness({ admin: true });
  assert.equal(
    (
      await h.routes.POST(
        request({
          action: "issue",
          studentId: "user_studentA",
          reviewConfirmed: true,
          publicName: true,
        }),
      )
    ).status,
    200,
  );
  assert.equal(h.writes[0].body.public_name, false);
});
test("certificate privacy changes are scoped to the signed-in owner", async () => {
  const h = certificateHarness();
  assert.equal(
    (
      await h.routes.POST(
        request({
          action: "privacy",
          id: "00000000-0000-0000-0000-000000000001",
          publicName: true,
          userId: "user_victim",
        }),
      )
    ).status,
    200,
  );
  assert.equal(h.writes[0].params.user_id, "eq.user_studentA");
});
