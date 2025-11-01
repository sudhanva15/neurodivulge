create table if not exists public.states (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  snapshot_date date not null,           -- YYYY-MM-DD
  data jsonb not null,                   -- your app state snapshot
  created_at timestamptz not null default now(),
  unique (user_id, snapshot_date)
);
alter table public.states enable row level security;

drop policy if exists "states insert self" on public.states;
create policy "states insert self"
on public.states as permissive
for insert to authenticated
with check (auth.uid() = user_id);

drop policy if exists "states select self" on public.states;
create policy "states select self"
on public.states as permissive
for select to authenticated
using (auth.uid() = user_id);
