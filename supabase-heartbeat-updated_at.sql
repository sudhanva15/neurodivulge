-- === Heartbeats (using updated_at) =========================================
create table if not exists public.heartbeats (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email   text not null,
  status  text not null default 'ok',  -- ok | low | sos
  updated_at timestamptz not null default now()
);

alter table public.heartbeats enable row level security;

-- write/update policies
drop policy if exists "own heartbeat write" on public.heartbeats;
create policy "own heartbeat write"
on public.heartbeats
as permissive
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "own heartbeat update" on public.heartbeats;
create policy "own heartbeat update"
on public.heartbeats
as permissive
for update
to authenticated
using (auth.uid() = user_id);

-- (optional) read policy for authenticated
drop policy if exists "read heartbeats" on public.heartbeats;
create policy "read heartbeats"
on public.heartbeats
as permissive
for select
to authenticated
using (true);

-- presence lookup view (no user_id exposed)
create or replace view public.heartbeat_lookup as
select lower(email) as email_key, status, updated_at
from public.heartbeats;

grant select on public.heartbeat_lookup to anon, authenticated;
