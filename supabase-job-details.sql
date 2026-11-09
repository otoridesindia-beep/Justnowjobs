-- Adds a free-text job location and a job description. Run once in the SQL Editor.
alter table public.jobs add column if not exists place text not null default '';
alter table public.jobs add column if not exists description text not null default '';
