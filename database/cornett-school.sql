-- Private school bootstrap schema. Review and execute against the selected school
-- database before configuring the server-only URL and secret key. Not yet applied.
-- Clerk identities are strings. All access goes through authenticated Next.js
-- endpoints; neither browser Supabase role receives access to these tables.
begin;
create table if not exists public.school_students (
  user_id text primary key,
  display_name text not null check (char_length(display_name) between 1 and 80),
  adult_confirmed boolean not null check (adult_confirmed),
  policy_version text not null,
  created_at timestamptz not null default now()
);
create table if not exists public.school_releases (
  course_id text primary key,
  content_version text not null,
  approved_by text not null,
  approved_at timestamptz not null default now()
);
create table if not exists public.school_enrollments (
  user_id text not null references public.school_students(user_id) on delete cascade,
  course_id text not null,
  content_version text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, course_id, content_version)
);
create table if not exists public.school_progress (
  user_id text not null references public.school_students(user_id) on delete cascade,
  lesson_id text not null,
  content_version text not null,
  passed boolean not null,
  reflection text not null check (char_length(reflection) <= 10000),
  updated_at timestamptz not null default now(),
  primary key (user_id, lesson_id, content_version)
);
create table if not exists public.school_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references public.school_students(user_id) on delete cascade,
  course_id text not null,
  content_version text not null,
  body text not null check (char_length(body) between 100 and 20000),
  status text not null default 'pending' check (status in ('pending','approved','revise')),
  review_rubric jsonb,
  feedback text check (char_length(feedback) <= 10000),
  reviewed_by text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  check ((status='pending' and reviewed_by is null and reviewed_at is null) or (status <> 'pending' and reviewed_by is not null and reviewed_at is not null)),
  check (status = 'pending' or (jsonb_typeof(review_rubric) = 'array' and jsonb_array_length(review_rubric) = 4 and review_rubric is not null)),
  check (status <> 'approved' or review_rubric = '[true,true,true,true]'::jsonb)
);
create index if not exists school_submissions_student_course on public.school_submissions(user_id, course_id, created_at desc);
create index if not exists school_submissions_pending on public.school_submissions(status, created_at);
alter table public.school_students enable row level security;
alter table public.school_releases enable row level security;
alter table public.school_enrollments enable row level security;
alter table public.school_progress enable row level security;
alter table public.school_submissions enable row level security;
revoke all on public.school_students, public.school_releases, public.school_enrollments, public.school_progress, public.school_submissions from public, anon, authenticated;
grant select, insert, update, delete on public.school_students, public.school_releases, public.school_enrollments, public.school_progress, public.school_submissions to service_role;
-- Enforce one pending assignment per student/course/version, including concurrent requests.
create unique index if not exists school_submissions_one_pending
on public.school_submissions(user_id, course_id, content_version) where status = 'pending';

-- Certificate records are private by default. Public verification is mediated by
-- the server and reveals a display name only when the student opted in.
create table if not exists public.school_certificates (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references public.school_students(user_id) on delete cascade,
  pathway integer not null check (pathway between 0 and 3),
  content_version text not null,
  display_name text not null,
  public_name boolean not null default false,
  issued_by text not null,
  issued_at timestamptz not null default now(),
  revoked_at timestamptz,
  unique(user_id, pathway, content_version)
);
alter table public.school_certificates enable row level security;
revoke all on public.school_certificates from public, anon, authenticated;
grant select, insert, update, delete on public.school_certificates to service_role;

commit;
