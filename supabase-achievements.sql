-- === Achievements core ======================================================
create table if not exists public.achievements (
  id text primary key,
  title text not null,
  description text,
  condition_key text not null,      -- e.g., reflection_created, focus_pillar_day, hydration_60
  threshold integer not null default 1,
  created_at timestamptz not null default now()
);

create table if not exists public.user_achievements (
  user_id uuid not null references auth.users(id) on delete cascade,
  achievement_id text not null references public.achievements(id) on delete cascade,
  unlocked_at timestamptz not null default now(),
  primary key (user_id, achievement_id)
);

-- Optional: event stream for research / analytics (client writes lightweight events)
create table if not exists public.game_events (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  event_key text not null,
  amount integer not null default 1,
  created_at timestamptz not null default now()
);

-- RLS
alter table public.user_achievements enable row level security;
alter table public.game_events enable row level security;

drop policy if exists "ua insert self" on public.user_achievements;
create policy "ua insert self"
on public.user_achievements
as permissive
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "ua select self" on public.user_achievements;
create policy "ua select self"
on public.user_achievements
as permissive
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "events insert self" on public.game_events;
create policy "events insert self"
on public.game_events
as permissive
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "events select self" on public.game_events;
create policy "events select self"
on public.game_events
as permissive
for select
to authenticated
using (auth.uid() = user_id);

-- Seed (idempotent)
insert into public.achievements (id, title, description, condition_key, threshold)
values
  ('reflection_3',      'First Mirrors',          'Log 3 reflections',               'reflection_created', 3),
  ('reflection_10',     'Mirror Streak',          'Log 10 reflections',              'reflection_created', 10),
  ('focus_pillar_3',    'Bronze Spark',           'Hit Focus pillar on 3 days',      'focus_pillar_day',   3),
  ('ritual_3',          'Ritual Rising',          'Complete morning ritual 3 times', 'ritual_done',        3),
  ('hydration_60',      'Hydration Hero',         'Reach 60% hydration in a day',    'hydration_60',       1),
  ('combo_day',         'Combo Day',              'Hydration ≥60% + Activity',       'combo_day',          1)
on conflict (id) do nothing;
