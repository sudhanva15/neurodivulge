-- V2: maintenance logs + targets
BEGIN;

create table if not exists maintenance_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  date date not null default (now() at time zone 'utc')::date,
  habit text not null,          -- e.g., 'meals','badminton','cannabis'
  unit text not null,           -- 'count','minutes','puffs'
  amount numeric not null,      -- e.g., 1, 25
  meta jsonb not null default '{}'::jsonb
);

create index if not exists maintenance_logs_user_date_idx
  on maintenance_logs(user_id, date);

create table if not exists maintenance_targets (
  user_id uuid primary key references profiles(id) on delete cascade,
  meals_per_day int not null default 3,
  badminton_per_week int not null default 1,
  cannabis_max_puffs_per_day int not null default 10,
  updated_at timestamptz not null default now()
);

create or replace view maintenance_weekly_totals as
select
  user_id,
  date_trunc('week', date)::date as week_start,
  habit,
  unit,
  sum(amount)::numeric as total
from maintenance_logs
group by 1,2,3,4;

COMMIT;
