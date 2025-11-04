-- V2: village_invites for share/join codes
BEGIN;

create table if not exists village_invites (
  code text primary key, -- short code, e.g., 6-8 chars
  village_id uuid not null,
  created_by uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz,
  revoked boolean not null default false
);

create index if not exists village_invites_active_idx
  on village_invites(village_id)
  where (revoked = false) and (expires_at is null or expires_at > now());

COMMIT;
