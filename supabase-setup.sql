-- Justnow Jobs: Supabase schema. Run once in Supabase Dashboard > SQL Editor.

-- ===== Profiles (one row per registered user) =====
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 2 and 100),
  email text not null,
  mobile text not null unique check (mobile ~ '^[0-9]{10}$'),
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select p.is_admin from public.profiles p where p.id = auth.uid()), false);
$$;

-- Creates the profile when a user signs up. is_admin is always false here.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, email, mobile)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', ''),
    coalesce(new.raw_user_meta_data ->> 'email', ''),
    coalesce(new.raw_user_meta_data ->> 'mobile', '')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Users can read their own profile; admins can read all. No client insert/update/delete.
drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin" on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.is_admin());

-- ===== Jobs =====
create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 150),
  company text not null check (char_length(company) between 1 and 150),
  role text not null check (role in ('Analytics', 'Engineering', 'Science', 'Product')),
  location text not null check (location in ('Remote', 'Hybrid', 'On-site')),
  arrangement text not null check (char_length(arrangement) between 1 and 80),
  salary text not null check (char_length(salary) between 1 and 80),
  skills text not null default '' check (char_length(skills) <= 300),
  apply text not null check (apply ~* '^(https?://|mailto:)' and char_length(apply) <= 500),
  logo_mark text not null default '',
  logo_accent text not null default '',
  logo_class text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.jobs enable row level security;

-- Everyone can read jobs; only admins can write.
drop policy if exists "jobs_select_all" on public.jobs;
create policy "jobs_select_all" on public.jobs
  for select to anon, authenticated using (true);

drop policy if exists "jobs_insert_admin" on public.jobs;
create policy "jobs_insert_admin" on public.jobs
  for insert to authenticated with check (public.is_admin());

drop policy if exists "jobs_update_admin" on public.jobs;
create policy "jobs_update_admin" on public.jobs
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "jobs_delete_admin" on public.jobs;
create policy "jobs_delete_admin" on public.jobs
  for delete to authenticated using (public.is_admin());

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists jobs_touch_updated_at on public.jobs;
create trigger jobs_touch_updated_at
  before update on public.jobs
  for each row execute function public.touch_updated_at();

-- ===== Sample listings (only inserted when the table is empty) =====
insert into public.jobs (title, company, role, location, arrangement, salary, skills, apply, logo_mark, logo_accent, logo_class, created_at)
select * from (values
  ('Senior Data Analyst', 'Northstar Analytics', 'Analytics', 'Remote', 'Full-time', '$110k – $140k', 'SQL, Tableau', 'mailto:careers@northstar.example?subject=Senior%20Data%20Analyst', 'N', '↗', 'logo-northstar', now() - interval '2 days'),
  ('Analytics Engineer', 'Bloom Commerce', 'Engineering', 'Hybrid', 'Full-time · Hybrid', '$125k – $155k', 'dbt, Snowflake, New York', 'mailto:careers@bloom.example?subject=Analytics%20Engineer', 'b', '.', 'logo-bloom', now() - interval '4 days'),
  ('Machine Learning Scientist', 'Vertex Health', 'Science', 'Remote', 'Full-time', '$145k – $180k', 'Python, PyTorch, healthcare', 'mailto:careers@vertex.example?subject=Machine%20Learning%20Scientist', 'V', '+', 'logo-vertex', now() - interval '7 days'),
  ('Product Data Analyst', 'Goodside Labs', 'Product', 'Hybrid', 'Full-time · Hybrid', '$95k – $120k', 'experimentation, metrics, Austin', 'mailto:careers@goodside.example?subject=Product%20Data%20Analyst', 'g', '+', 'logo-goodside', now() - interval '7 days'),
  ('Data Engineer', 'Fieldwork Climate', 'Engineering', 'On-site', 'Full-time · On-site', '$130k – $165k', 'BigQuery, Airflow, San Francisco', 'mailto:careers@fieldwork.example?subject=Data%20Engineer', 'F', '/', 'logo-fieldwork', now() - interval '14 days'),
  ('Business Intelligence Analyst', 'Orbit Finance', 'Analytics', 'Remote', 'Full-time', '$90k – $115k', 'Power BI, SQL', 'mailto:careers@orbit.example?subject=Business%20Intelligence%20Analyst', 'O', '°', 'logo-orbit', now() - interval '14 days')
) as seed (title, company, role, location, arrangement, salary, skills, apply, logo_mark, logo_accent, logo_class, created_at)
where not exists (select 1 from public.jobs);

-- ===== Make someone an admin =====
-- 1) Register that person in the app (profile icon > Sign up).
-- 2) Run this with their 10-digit mobile number:
--
-- update public.profiles set is_admin = true where mobile = '9876543210';
