-- Extensions
create extension if not exists pgcrypto;

-- Villages
create table if not exists public.villages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_code text unique not null default substr(encode(gen_random_bytes(6),'hex'),1,6),
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- Members (max 5 per village)
create table if not exists public.village_members (
  village_id uuid not null references public.villages(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member', -- 'owner'|'member'
  joined_at timestamptz not null default now(),
  primary key (village_id, user_id)
);

-- Posts (daily check-ins)
create table if not exists public.village_posts (
  id uuid primary key default gen_random_uuid(),
  village_id uuid not null references public.villages(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  text text,                -- keep it short in UI
  mood smallint,            -- 1..5 optional
  created_at timestamptz not null default now()
);

-- Reactions (kindness-only "resonate")
create table if not exists public.village_reactions (
  post_id uuid not null references public.village_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

-- Enable RLS
alter table public.villages enable row level security;
alter table public.village_members enable row level security;
alter table public.village_posts enable row level security;
alter table public.village_reactions enable row level security;

-- Policies: members can see their villages, posts, reactions
drop policy if exists "village select members" on public.villages;
create policy "village select members"
on public.villages
as permissive
for select
to authenticated
using (exists(select 1 from public.village_members vm where vm.village_id = id and vm.user_id = auth.uid()));

drop policy if exists "members manage membership view" on public.village_members;
create policy "members manage membership view"
on public.village_members
as permissive
for select
to authenticated
using (user_id = auth.uid() or exists(select 1 from public.village_members vm where vm.village_id = village_id and vm.user_id = auth.uid()));

drop policy if exists "members insert posts" on public.village_posts;
create policy "members insert posts"
on public.village_posts
as permissive
for insert
to authenticated
with check (exists(select 1 from public.village_members vm where vm.village_id = village_id and vm.user_id = auth.uid()));

drop policy if exists "members select posts" on public.village_posts;
create policy "members select posts"
on public.village_posts
as permissive
for select
to authenticated
using (exists(select 1 from public.village_members vm where vm.village_id = village_id and vm.user_id = auth.uid()));

drop policy if exists "members react" on public.village_reactions;
create policy "members react"
on public.village_reactions
as permissive
for all
to authenticated
using (exists(select 1 from public.village_posts p join public.village_members vm on vm.village_id = p.village_id and vm.user_id = auth.uid() where p.id = post_id))
with check (exists(select 1 from public.village_posts p join public.village_members vm on vm.village_id = p.village_id and vm.user_id = auth.uid() where p.id = post_id));

-- RPC: create_village(name) -> village row (caller becomes owner and member)
create or replace function public.create_village(v_name text)
returns public.villages
language plpgsql
security definer
as $$
declare v public.villages;
begin
  if v_name is null or length(trim(v_name)) = 0 then
    raise exception 'name required';
  end if;
  insert into public.villages (name, created_by) values (trim(v_name), auth.uid())
  returning * into v;
  insert into public.village_members (village_id, user_id, role) values (v.id, auth.uid(), 'owner')
  on conflict do nothing;
  return v;
end;
$$;
grant execute on function public.create_village(text) to authenticated;

-- RPC: join_village(invite_code) -> village row (enforces cap 5)
create or replace function public.join_village(v_code text)
returns public.villages
language plpgsql
security definer
as $$
declare v public.villages;
declare cnt int;
begin
  select * into v from public.villages where invite_code = v_code;
  if not found then
    raise exception 'invalid code';
  end if;
  select count(*) into cnt from public.village_members where village_id = v.id;
  if cnt >= 5 then
    raise exception 'village full';
  end if;
  insert into public.village_members (village_id, user_id, role)
  values (v.id, auth.uid(), 'member')
  on conflict do nothing;
  return v;
end;
$$;
grant execute on function public.join_village(text) to authenticated;

-- RPC: leave_village(village_id)
create or replace function public.leave_village(v_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  delete from public.village_members where village_id = v_id and user_id = auth.uid();
end;
$$;
grant execute on function public.leave_village(uuid) to authenticated;

-- RPC: post_checkin(village_id, text, mood) -> post row
create or replace function public.post_checkin(v_id uuid, p_text text, p_mood int)
returns public.village_posts
language plpgsql
security definer
as $$
declare p public.village_posts;
begin
  if not exists (select 1 from public.village_members where village_id = v_id and user_id = auth.uid()) then
    raise exception 'not a member';
  end if;
  insert into public.village_posts (village_id, user_id, text, mood)
  values (v_id, auth.uid(), left(coalesce(p_text,''), 120), p_mood)
  returning * into p;
  return p;
end;
$$;
grant execute on function public.post_checkin(uuid, text, int) to authenticated;

-- RPC: react_post(post_id) -> toggles resonate reaction
create or replace function public.react_post(p_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  if exists (
    select 1 from public.village_reactions where post_id = p_id and user_id = auth.uid()
  ) then
    delete from public.village_reactions where post_id = p_id and user_id = auth.uid();
  else
    -- ensure member of that village
    if not exists (
      select 1 from public.village_posts p
      join public.village_members m on m.village_id = p.village_id and m.user_id = auth.uid()
      where p.id = p_id
    ) then
      raise exception 'not a member';
    end if;
    insert into public.village_reactions (post_id, user_id) values (p_id, auth.uid());
  end if;
end;
$$;
grant execute on function public.react_post(uuid) to authenticated;
