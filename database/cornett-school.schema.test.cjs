// Run with @electric-sql/pglite@0.6.0 available via NODE_PATH or
// SCHOOL_PGLITE_MODULE pointing to a scratch installation. No live database is used.
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { PGlite } = require(
  process.env.SCHOOL_PGLITE_MODULE || "@electric-sql/pglite",
);
test("private school schema enforces access, review, uniqueness and deletion rules", async () => {
  const db = new PGlite();
  try {
    await db.exec(
      "create role anon; create role authenticated; create role service_role bypassrls;",
    );
    await db.exec(
      fs.readFileSync(path.join(__dirname, "cornett-school.sql"), "utf8"),
    );
    const secured = await db.query(
      "select relname,relrowsecurity from pg_class where relname in ('school_students','school_releases','school_enrollments','school_progress','school_submissions','school_certificates')",
    );
    assert.equal(secured.rows.length, 6);
    assert.ok(secured.rows.every((r) => r.relrowsecurity));
    await db.exec(
      "insert into school_students(user_id,display_name,adult_confirmed,policy_version) values ('user_A','A',true,'pilot'),('user_B','B',true,'pilot');",
    );
    for (const role of ["anon", "authenticated"]) {
      await db.exec(`set role ${role}`);
      await assert.rejects(
        db.query("select * from school_students"),
        /permission denied/,
      );
      await assert.rejects(
        db.query(
          "insert into school_releases(course_id,content_version,approved_by) values ('FAKE','v1','attacker')",
        ),
        /permission denied/,
      );
      await db.exec("reset role");
    }
    await db.exec(
      "insert into school_enrollments(user_id,course_id,content_version) values ('user_A','CSC-101','v1'); insert into school_progress(user_id,lesson_id,content_version,passed,reflection) values ('user_A','CSC-101-U1','v1',true,'A reflection');",
    );
    const body = "An original assignment. ".repeat(10);
    await db.query(
      "insert into school_submissions(user_id,course_id,content_version,body) values ('user_A','CSC-101','v1',$1)",
      [body],
    );
    await assert.rejects(
      db.query(
        "insert into school_submissions(user_id,course_id,content_version,body) values ('user_A','CSC-101','v1',$1)",
        [body],
      ),
      /unique/,
    );
    await assert.rejects(
      db.query(
        "update school_submissions set status='approved' where user_id='user_A'",
      ),
      /check constraint/,
    );
    await db.exec(
      "update school_submissions set status='approved',reviewed_by='founder',reviewed_at=now(),review_rubric='[true,true,true,true]'::jsonb where user_id='user_A';",
    );
    await db.query(
      "insert into school_submissions(user_id,course_id,content_version,body) values ('user_A','CSC-101','v1',$1)",
      [body],
    );
    const issued = await db.query(
      "insert into school_certificates(user_id,pathway,content_version,display_name,issued_by) values ('user_A',0,'v1','A','founder') returning public_name",
    );
    assert.equal(issued.rows[0].public_name, false);
    await assert.rejects(
      db.query(
        "insert into school_certificates(user_id,pathway,content_version,display_name,issued_by) values ('user_A',0,'v1','A','founder')",
      ),
      /unique/,
    );
    await db.exec("delete from school_students where user_id='user_A';");
    for (const table of [
      "school_enrollments",
      "school_progress",
      "school_submissions",
      "school_certificates",
    ])
      assert.equal(
        (await db.query(`select count(*)::integer as count from ${table}`))
          .rows[0].count,
        0,
      );
    assert.equal(
      (await db.query("select user_id from school_students")).rows[0].user_id,
      "user_B",
    );
  } finally {
    await db.close();
  }
});
