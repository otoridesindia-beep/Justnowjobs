-- Admin allow-list. Run once in the Supabase SQL Editor (after supabase-setup.sql).
-- A mobile number listed here becomes admin automatically, whether it signs up
-- before or after being added.

create table if not exists public.admins (
  mobile text primary key check (mobile ~ '^[0-9]{10}$'),
  created_at timestamptz not null default now()
);

alter table public.admins enable row level security;
-- No policies: browser clients cannot read or change this table.
-- Manage it only from the SQL Editor.

create or replace function public.sync_admin_flag()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_table_name = 'admins' then
    update public.profiles set is_admin = true where mobile = new.mobile;
  else
    new.is_admin := exists (select 1 from public.admins a where a.mobile = new.mobile);
  end if;
  return new;
end;
$$;

drop trigger if exists admins_grant on public.admins;
create trigger admins_grant after insert on public.admins
  for each row execute function public.sync_admin_flag();

drop trigger if exists profiles_admin_flag on public.profiles;
create trigger profiles_admin_flag before insert on public.profiles
  for each row execute function public.sync_admin_flag();

create or replace function public.revoke_admin_flag()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles set is_admin = false where mobile = old.mobile;
  return old;
end;
$$;

drop trigger if exists admins_revoke on public.admins;
create trigger admins_revoke after delete on public.admins
  for each row execute function public.revoke_admin_flag();

-- Add admins from the SQL Editor, for example:
-- insert into public.admins (mobile) values ('XXXXXXXXXX') on conflict do nothing;
