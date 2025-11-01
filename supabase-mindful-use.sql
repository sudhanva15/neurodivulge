create table if not exists public.mindful_use (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  substance text not null check (substance in ('cannabis','alcohol','nicotine','caffeine')),
  pre_intent text,
  post_reflect text,
  effect_focus smallint check (effect_focus between -2 and 2),
  effect_mood  smallint check (effect_mood  between -2 and 2),
  created_at timestamptz not null default now()
);
alter table public.mindful_use enable row level security;

drop policy if exists "mu insert self" on public.mindful_use;
create policy "mu insert self"
on public.mindful_use as permissive
for insert to authenticated
with check (auth.uid() = user_id);

drop policy if exists "mu select self" on public.mindful_use;
create policy "mu select self"
on public.mindful_use as permissive
for select to authenticated
using (auth.uid() = user_id);
