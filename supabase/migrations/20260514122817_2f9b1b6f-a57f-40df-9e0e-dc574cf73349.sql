
-- Roles enum
create type public.app_role as enum ('candidate', 'hr');
create type public.job_status as enum ('open', 'closed');
create type public.application_status as enum ('pending', 'accepted', 'rejected');

-- Profiles
create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  full_name text,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

-- User roles (separate table)
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique(user_id, role)
);
alter table public.user_roles enable row level security;

-- has_role helper
create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists(select 1 from public.user_roles where user_id = _user_id and role = _role);
$$;

create or replace function public.get_user_role(_user_id uuid)
returns public.app_role
language sql stable security definer set search_path = public
as $$
  select role from public.user_roles where user_id = _user_id limit 1;
$$;

-- Jobs
create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  hr_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  company text not null,
  description text not null,
  required_skills text[] not null default '{}',
  status public.job_status not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.jobs enable row level security;

-- Applications
create table public.applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  candidate_id uuid not null references auth.users(id) on delete cascade,
  resume_text text not null,
  resume_file_name text,
  resume_storage_path text,
  match_score int not null default 0,
  ats_score int not null default 0,
  matched_keywords text[] not null default '{}',
  missing_keywords text[] not null default '{}',
  verdict text,
  report jsonb,
  status public.application_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(job_id, candidate_id)
);
alter table public.applications enable row level security;

-- updated_at trigger
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();
create trigger jobs_touch before update on public.jobs
  for each row execute function public.touch_updated_at();
create trigger applications_touch before update on public.applications
  for each row execute function public.touch_updated_at();

-- Auto-create profile + default role on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  chosen_role public.app_role;
begin
  insert into public.profiles (user_id, full_name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''), new.email);

  chosen_role := coalesce((new.raw_user_meta_data->>'role')::public.app_role, 'candidate');
  insert into public.user_roles (user_id, role) values (new.id, chosen_role);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- RLS: profiles
create policy "users read own profile" on public.profiles
  for select using (auth.uid() = user_id);
create policy "users update own profile" on public.profiles
  for update using (auth.uid() = user_id);
create policy "hr reads applicant profiles" on public.profiles
  for select using (
    exists (
      select 1 from public.applications a
      join public.jobs j on j.id = a.job_id
      where a.candidate_id = profiles.user_id and j.hr_id = auth.uid()
    )
  );

-- RLS: user_roles
create policy "users read own roles" on public.user_roles
  for select using (auth.uid() = user_id);

-- RLS: jobs
create policy "anyone authed can read open jobs" on public.jobs
  for select using (auth.uid() is not null);
create policy "hr inserts own jobs" on public.jobs
  for insert with check (auth.uid() = hr_id and public.has_role(auth.uid(), 'hr'));
create policy "hr updates own jobs" on public.jobs
  for update using (auth.uid() = hr_id and public.has_role(auth.uid(), 'hr'));
create policy "hr deletes own jobs" on public.jobs
  for delete using (auth.uid() = hr_id and public.has_role(auth.uid(), 'hr'));

-- RLS: applications
create policy "candidate reads own applications" on public.applications
  for select using (auth.uid() = candidate_id);
create policy "hr reads applications to own jobs" on public.applications
  for select using (
    exists (select 1 from public.jobs j where j.id = applications.job_id and j.hr_id = auth.uid())
  );
create policy "candidate inserts own applications" on public.applications
  for insert with check (
    auth.uid() = candidate_id and public.has_role(auth.uid(), 'candidate')
  );
create policy "hr updates application status" on public.applications
  for update using (
    exists (select 1 from public.jobs j where j.id = applications.job_id and j.hr_id = auth.uid())
  );

-- Resumes storage bucket
insert into storage.buckets (id, name, public) values ('resumes', 'resumes', false)
on conflict (id) do nothing;

create policy "candidate uploads own resume" on storage.objects
  for insert with check (
    bucket_id = 'resumes' and auth.uid()::text = (storage.foldername(name))[1]
  );
create policy "candidate reads own resume" on storage.objects
  for select using (
    bucket_id = 'resumes' and auth.uid()::text = (storage.foldername(name))[1]
  );
create policy "hr reads applicant resumes" on storage.objects
  for select using (
    bucket_id = 'resumes' and exists (
      select 1 from public.applications a
      join public.jobs j on j.id = a.job_id
      where j.hr_id = auth.uid()
        and a.resume_storage_path = storage.objects.name
    )
  );

create index applications_job_id_idx on public.applications(job_id);
create index applications_candidate_id_idx on public.applications(candidate_id);
create index jobs_hr_id_idx on public.jobs(hr_id);
