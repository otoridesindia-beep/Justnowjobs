-- Adds the Indian state / UT to jobs so listings can be filtered by state. Run once in the SQL Editor.
alter table public.jobs add column if not exists state text not null default '';
notify pgrst, 'reload schema';
