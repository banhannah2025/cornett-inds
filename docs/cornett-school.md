# Cornett School of Christianity

## Agreed scope

Adult (18+) open enrollment, nondenominational Christian school within Blended Works. Subscription funded; certificates only, no degrees or employment placement. Founder Robin Cornett leads teaching and operations with explicitly identified AI assistance. History and psychology run through beginner-to-advanced biblical, theological, and ministry studies. A church community is planned within the school. Ordination is separate from certificate completion and remains unavailable pending verification of authority and policy.

## Initial implementation

Route: `/apps/cornett-school`, linked from the shared Apps menu.

Public founding preview with four proposed pathways, 24 dedicated draft course syllabi, 96 planned learning units, proposed assessment rubrics and pathway projects, an original orientation lesson with a practice question and reflection, an external resource directory, and interactive weekly study planning, priorities, budget arithmetic, text export, and printing. No enrollment, grades, payments, certificate issuance, private messaging, or prayer submissions are represented as active. Planner/reflection data exists only in memory in the open page. Reloading loses it unless exported. It is not stored in public Sanity content.

## Delivery sequence and acceptance criteria

1. **Enrollment and private student records**: Reuse Clerk authentication; verify adult eligibility, accept versioned policies, and keep account ownership checks on every operation. Select private durable storage with a migration/backup strategy. Students can resume on another device and export their records; journals/budgets remain separate from grading records. Test anonymous access, cross-account access, error handling, and concurrent changes.
2. **Subscription access**: Founder chooses price, billing interval, refund policy, and provider account. Build hosted checkout, customer billing portal, signed/idempotent webhook processing, server-side entitlements, cancellation at period end, failed-payment handling, and reconciliation. Test in provider sandbox before collecting payment. Do not infer access from client state or a checkout redirect.
3. **Academic authoring and release**: Versioned programs, prerequisites, outcomes, estimated hours, original lessons, citations, licensed media, transcripts, assessments, rubrics, review status, and founder approval. Only approved content reaches enrolled students. Draft a statement of faith for explicit founder review rather than inventing doctrinal commitments.
4. **Assessment and certificates**: Persist attempts/submissions; calculate objective results on the server; identify AI feedback; require founder review for substantial work and final certificate eligibility. Issue immutable records with verification identifiers, a public endpoint exposing only consented minimal details, and revocation/correction history. No certificate for merely opening lessons.
5. **Student life**: Private tasks/calendar, workload estimates, optional reminders, rest/catch-up plans, budgeting, study-skills guidance, extension requests, and support inbox. Confirm timezone, reminder consent, notification delivery, data deletion/export, and accessibility. Avoid clinical diagnosis or simulated professional services.
6. **Church and community**: Publish doctrine, conduct, privacy boundaries, moderation/reporting rules, founder availability, and gathering schedule before enabling participation. Prayer requests need explicit audience choices. AI must never impersonate the founder, clergy, or a clinician. Do not publish personal pastoral material to the public content store.
7. **Administration and operations**: Role checks, support queue, moderation actions, appeals, content approval, subscription reporting, minimal audit records, backup restore verification, retention policy, accessibility evaluation, and a documented incident response contact. Design enrollment volume around founder capacity.

## Content rights register

Track exact work/edition, author, source URL, license/version, attribution, third-party exceptions, intended countries, commercial permission, adaptation/hosting permissions, evidence date, reviewer, and expiry where applicable. Public-domain claims must be checked for the chosen edition and jurisdiction. External reference links are not imported course assets.

Initial candidates: World English Bible text; individually reviewed Gutenberg books and LibriVox recordings. OpenStax Psychology 2e, Noba, and Open Yale Courses are external references only; do not copy or embed their noncommercial material into the paid curriculum without clearance. BibleProject and BiblicalTraining are not treated as copyright-free providers.

## Decisions still needed for paid launch

Subscription amount/interval; operating budget; policy approval; theological statement; content approval and assessment standards; private data service and region; payment provider credentials configured as secrets; school contact/support availability; church participation access model. Review deployment configuration and current production services before adding another paid service.

## Verification

Run the web workspace type check and production build. Before enrollment, additionally test authentication/authorization, billing lifecycle, record persistence, assessment integrity, certificate verification, accessibility with keyboard and assistive technology, responsive layouts, and data recovery. The founding preview is not a production learning-management system.

## Pathway curriculum expansion

Each syllabus has three learning outcomes, four planned units with guiding questions, a course-specific applied assignment, historical and psychological inquiry, Scripture study, recommended preparation, and a workload estimate. Estimated pathway hours are 96 (foundations), 120 (historical study), 144 (advanced study), and 168 (ministry), totaling 528 hours. These are planning estimates, not academic credit or a representation of released instructional hours.

Course pages are statically generated under `/apps/cornett-school/courses/[slug]`; unknown slugs return not found. Returning to the catalog preserves the Programs section through a validated query parameter. Course links and the certificate section expose proposed standards: 80% knowledge checks, every assignment submitted, competence in each rubric dimension, a pathway integration project, and founder review. These policies remain drafts until approved; no grades or certificates are issued.

The 96 units are lesson-development plans, not complete lessons. Next content work must supply substantive original teaching, reviewed sources and commercial reuse clearance, accessible media where selected, meaningful assessments, and release approval. Do not equate a syllabus with a finished course.
