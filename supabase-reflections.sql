-- === Extensions (hashing) ===================================================
create extension if not exists pgcrypto;

-- === Reflections table ======================================================
create table if not exists public.reflections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  mood smallint check (mood between 1 and 5),
  note text,
  tags text[],                -- e.g. {'Focus','Joy'}
  shared boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.reflections enable row level security;

-- Policies: user can read/write their own reflections
drop policy if exists "reflections insert self" on public.reflections;
create policy "reflections insert self"
on public.reflections
as permissive
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "reflections update self" on public.reflections;
create policy "reflections update self"
on public.reflections
as permissive
for update
to authenticated
using (auth.uid() = user_id);

drop policy if exists "reflections select self" on public.reflections;
create policy "reflections select self"
on public.reflections
as permissive
for select
to authenticated
using (auth.uid() = user_id);

-- Public, anonymized community stream (only shared rows; no user_id)
create or replace view public.community_reflections as
select
  left(encode(digest(user_id::text, 'sha256'), 'hex'), 12) as anon_id,
  mood, note, tags, created_at
from public.reflections
where shared = true
order by created_at desc;

grant select on public.community_reflections to anon, authenticated;
