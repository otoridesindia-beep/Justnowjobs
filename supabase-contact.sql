-- Contact-us enquiries + resume uploads. Run once in the Supabase SQL Editor.
-- Anyone can submit; only admins can read or delete.

create table if not exists public.contact_requests (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 100),
  mobile text not null check (mobile ~ '^[0-9]{10}$'),
  job_role text not null check (char_length(job_role) between 2 and 150),
  location text not null check (char_length(location) between 2 and 150),
  resume_path text check (resume_path is null or char_length(resume_path) <= 200),
  created_at timestamptz not null default now()
);

alter table public.contact_requests enable row level security;

drop policy if exists "Anyone can submit a contact request" on public.contact_requests;
create policy "Anyone can submit a contact request" on public.contact_requests
  for insert to anon, authenticated with check (true);

drop policy if exists "Admins read contact requests" on public.contact_requests;
create policy "Admins read contact requests" on public.contact_requests
  for select to authenticated using (public.is_admin());

drop policy if exists "Admins delete contact requests" on public.contact_requests;
create policy "Admins delete contact requests" on public.contact_requests
  for delete to authenticated using (public.is_admin());

-- Private bucket for resumes: 5 MB, PDF/DOC/DOCX only.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'resumes', 'resumes', false, 5242880,
  array['application/pdf', 'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
on conflict (id) do update
  set public = false, file_size_limit = 5242880, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Anyone can upload a resume" on storage.objects;
create policy "Anyone can upload a resume" on storage.objects
  for insert to anon, authenticated with check (bucket_id = 'resumes');

drop policy if exists "Admins read resumes" on storage.objects;
create policy "Admins read resumes" on storage.objects
  for select to authenticated using (bucket_id = 'resumes' and public.is_admin());

drop policy if exists "Admins delete resumes" on storage.objects;
create policy "Admins delete resumes" on storage.objects
  for delete to authenticated using (bucket_id = 'resumes' and public.is_admin());
