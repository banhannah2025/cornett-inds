# Cornett School of Christianity

## Agreed direction

Adult (18+), open-enrollment, nondenominational Christian school within Blended Works. Subscription funded; certificates only, no degrees or employment placement. Robin Cornett leads teaching and operations with explicitly identified AI assistance. History and psychology develop alongside Scripture, theology, discipleship, and ministry. A church community is planned. Certificate completion does not confer ordination; any future ordination requires a separate verified authority and process.

## Implemented in this branch

- Founding campus at `/apps/cornett-school`, linked from the shared Apps menu.
- Four proposed pathways, six courses each, with 24 individual syllabi, 96 planned units, objectives, assignments, Scripture study, interdisciplinary inquiry, workload estimates, and pathway projects.
- **24 original draft lessons for the six Foundations courses.** Each contains substantive instruction, assigned passage references, guided practice, a knowledge check, and an explanation. They are introductory lesson drafts for founder review, not a complete advanced curriculum. The remaining 72 units are still plans.
- Interactive lesson reader with local practice, reflection export, and optional authenticated record saving.
- Student center at `/apps/cornett-school/student`: adult/policy orientation, enrollment, progress, assignment submission/history, integration project, record export, and explicit record deletion. The history/export currently includes the latest 100 submissions; pagination/full archival export remains a launch requirement.
- Founder-only course release, 30-day pilot access grants, pending-work review, required rubric evaluation, and revision feedback. Student IDs must refer to existing Clerk accounts.
- Certificate issuance gates, owner-only printable certificate view, public verification with recipient name private by default, owner-controlled name visibility, and founder revocation. Issuance is disabled unless explicitly configured after live verification. Only Foundations is eligible in this implementation.
- Private database bootstrap schema with RLS, browser-role access revoked, ownership checks in server endpoints, one-pending-submission and one-certificate constraints, and cascading student-record deletion.
- External resource directory with rights notes, plus weekly study planning, tasks, budgeting, export, and print tools. Life-planning tools remain in-memory and are not saved to student records.

No paid enrollment is open. No content has been automatically founder-approved and no pilot access or certificates have been issued by this development work. No connected production database has been changed.

## Private storage setup

Existing public Sanity content is not used for school records. The school uses server-only Supabase Data API requests with a private table access model. Clerk handles identity; Supabase browser roles have no table privileges. The privileged server key never reaches the browser.

1. Select a private database project. Connected projects observed during development were inactive; do not repurpose or reactivate an unrelated project without deciding that target and checking cost.
2. Review and run `database/cornett-school.sql` in the chosen project. This is an unapplied bootstrap script, not a claim of deployed migration history.
3. Configure `SCHOOL_SUPABASE_URL` and `SCHOOL_SUPABASE_SECRET_KEY` as server secrets. Use a secret/service-role key, never a publishable or anon key.
4. Confirm the Data API is enabled for the intended schema and that `service_role` can access the six tables while `anon` and `authenticated` cannot.
5. Verify two-account isolation, real persistence, deletion, access expiry, review races, and backup/restore against the actual deployment before accepting students.
6. Review all Foundations content and assessments, approve course versions through the founder UI, then grant existing adult test accounts 30-day pilot access.
7. Keep `SCHOOL_CERTIFICATES_ENABLED=false` until final wording, standards, live evidence checks, private access, and public verification are tested. Enabling it is an operational decision, not an accreditation claim.

All student endpoints require Clerk sign-in. Mutations require same-origin requests. Learning writes also require current adult orientation, unexpired pilot access (or administrator access), founder-released course content, and enrollment. Answer correctness is computed on the server, not accepted from a client pass flag. Substantial assignments and pathway projects require founder review. Certificate issuance checks current-version lesson evidence, all six latest course reviews, the integration project, course releases, and explicit final founder approval. AI does not issue certificates.

Deletion removes school profile and dependent records, including certificates; verification then stops working. It does not delete the separate Clerk account or promise immediate erasure from backups. A full retention and support policy is still required before launch.

## Content and assessment status

The 24 course syllabi and 96 unit plans are a blueprint. Foundations now has 24 original lessons; the other pathways need substantive instruction and reviewed sources. All material remains draft. Current one-question lesson checks are formative mastery checks, not comprehensive final examinations. They can be retried and the founder must evaluate substantial work and the integration project. Richer summative assessments and assessed oral/recorded work remain necessary for the intended program.

Workload estimates are 96, 120, 144, and 168 hours per pathway (528 total), including future readings, practice, assignments, and review. They are planning estimates, not academic credit or released instructional-hour claims. The current short lesson drafts do not alone constitute those hours.

Version `2026-11-foundations-v1` ties releases, enrollments, progress, submissions, and certificates together. Substantive changes after pilot release require a new content version and an explicit transition policy; never silently change the evidence underlying issued certificates.

Proposed standards include 80% on future course knowledge assessments, all assignments, competence in each rubric dimension, integration work, and founder approval. Recorded pilot lesson checks currently require each of the four checks to be correct. These checks do not replace future course examinations. Rubric dimensions are textual/historical accuracy, reasoning/perspective, practical skill/care, and communication/integrity.

## Remaining work

- Develop the remaining 72 lessons with careful sourcing, then deepen and review all 96 units. Build broader assessments, revisions, accessibility alternatives, and teaching-recording submissions.
- Select individually verified books, articles, primary sources, audiobooks, and commercially reusable video; retain rights evidence and attribution. No external textbook or video has been copied into the paid curriculum.
- Build subscription checkout, billing portal, signed/idempotent webhooks, authoritative entitlement checks, cancellation and failed-payment handling, and reconciliation. Founder must select pricing, billing interval, refund policy, and payment account; no arbitrary price is assumed.
- Publish founder-approved doctrine, school policies, support availability, accessibility arrangements, retention rules, appeals, and community conduct. Draft policy language does not establish a founder’s doctrinal commitments.
- Implement private student life persistence, calendar/reminders with consent/timezones, catch-up and extension requests, support inbox, pagination/archival export, and appropriate content moderation.
- Establish church participation/access arrangements, real gathering schedule, prayer audiences, reporting/moderation, and pastoral privacy boundaries before opening those services. No fictional gatherings or support personnel are represented as active.
- Complete live security, accessibility, billing lifecycle, recovery, and operational verification before paid launch.

## Content rights register

For each exact work and edition, record author, source, license/version, attribution, third-party exceptions, intended countries, commercial/adaptation/hosting permissions, evidence date, reviewer, and expiry where relevant. Public-domain status depends on edition and jurisdiction.

World English Bible text and individually checked Gutenberg/LibriVox works are candidates. OpenStax Psychology 2e, Noba, and Open Yale Courses remain external references; their noncommercial material is not cleared for incorporation in a subscription curriculum. BibleProject and BiblicalTraining are not treated as copyright-free. Original lesson instruction in this branch does not reproduce those providers’ materials.

## Verification

- `node --test apps/web/lib/school/school.test.cjs`: route/model tests with mocked identity/storage cover ownership forgery, same-origin checks, anonymous access, missing configuration, access expiry, course release/enrollment gates, server grading, explicit adult/policy acceptance, required lesson evidence, rubric approval, deletion ownership, founder-only review, and certificate privacy/eligibility gates.
- `database/cornett-school.schema.test.cjs`: tested with scratch-installed `@electric-sql/pglite@0.6.0`, without adding it to application dependencies. Set `SCHOOL_PGLITE_MODULE` to that installation and run with `node --test`. Executes the actual SQL in ephemeral PostgreSQL and checks RLS, revoked browser-role permissions, pending-submission uniqueness, review constraints, default-private certificates, duplicate certificate prevention, and deletion cascades.
- Web type check and production build. Browser visual/interaction testing and live provider integration testing are not yet complete.
