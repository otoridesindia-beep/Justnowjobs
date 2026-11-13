-- Admin-managed daily interview questions.
-- Run in Supabase Dashboard > SQL Editor after supabase-setup.sql.

create table if not exists public.daily_questions (
  id uuid primary key default gen_random_uuid(),
  publish_date date not null unique,
  question text not null check (char_length(question) between 10 and 500),
  answer text not null check (char_length(answer) between 10 and 3000),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.daily_questions enable row level security;

drop policy if exists "daily_questions_select_public" on public.daily_questions;
create policy "daily_questions_select_public" on public.daily_questions
  for select to anon, authenticated using (true);

drop policy if exists "daily_questions_insert_admin" on public.daily_questions;
create policy "daily_questions_insert_admin" on public.daily_questions
  for insert to authenticated with check (public.is_admin() and (created_by = auth.uid() or created_by is null));

drop policy if exists "daily_questions_update_admin" on public.daily_questions;
create policy "daily_questions_update_admin" on public.daily_questions
  for update to authenticated using (public.is_admin())
  with check (public.is_admin() and (created_by = auth.uid() or created_by is null));

drop policy if exists "daily_questions_delete_admin" on public.daily_questions;
create policy "daily_questions_delete_admin" on public.daily_questions
  for delete to authenticated using (public.is_admin());

drop trigger if exists daily_questions_touch_updated_at on public.daily_questions;
create trigger daily_questions_touch_updated_at
  before update on public.daily_questions
  for each row execute function public.touch_updated_at();

notify pgrst, 'reload schema';
