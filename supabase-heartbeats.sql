-- Table
create table if not exists public.heartbeats (
  user_id uuid not null references auth.users(id) on delete cascade,
  email   text not null,
  status  text not null default 'ok',  -- ok | low | sos
  updated_at timestamptz not null default now(),
  primary key (user_id)
);

create index if not exists heartbeats_email_idx on public.heartbeats (lower(email));

alter table public.heartbeats enable row level security;

create policy "owner can upsert own heartbeat"
on public.heartbeats
for all
using ( auth.uid() = user_id )
with check ( auth.uid() = user_id );

-- Public, read-only lookup (no user_id exposed)
create or replace view public.heartbeat_lookup as
select lower(email) as email_key, status, updated_at
from public.heartbeats;

grant select on public.heartbeat_lookup to anon, authenticated;
