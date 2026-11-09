-- Adds the listing type (Posting, Referral, Walk-in, Drive) to jobs. Run once in the SQL Editor.
alter table public.jobs
  add column if not exists listing_type text not null default 'Posting'
  check (listing_type in ('Posting', 'Referral', 'Walk-in', 'Drive'));
