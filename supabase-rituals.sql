create table if not exists public.ritual_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  steps jsonb not null,   -- [{title, seconds}]
  duration_sec integer not null,
  created_at timestamptz not null default now()
);
alter table public.ritual_logs enable row level security;

drop policy if exists "ritual insert self" on public.ritual_logs;
create policy "ritual insert self"
on public.ritual_logs as permissive
for insert to authenticated
with check (auth.uid() = user_id);

drop policy if exists "ritual select self" on public.ritual_logs;
create policy "ritual select self"
on public.ritual_logs as permissive
for select to authenticated
using (auth.uid() = user_id);
