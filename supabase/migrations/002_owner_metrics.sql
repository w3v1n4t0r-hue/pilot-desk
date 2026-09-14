create extension if not exists pgcrypto with schema extensions;

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.admin_claim_config (
  singleton boolean primary key default true check (singleton),
  claim_token uuid not null default gen_random_uuid(),
  claimed_by uuid references auth.users(id) on delete set null,
  claimed_at timestamptz
);

insert into public.admin_claim_config (singleton)
values (true)
on conflict (singleton) do nothing;

alter table public.admin_users enable row level security;
alter table public.admin_claim_config enable row level security;
revoke all on public.admin_users from anon, authenticated;
revoke all on public.admin_claim_config from anon, authenticated;

create or replace function public.claim_pilotdesk_admin(p_token uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_token uuid;
  v_claimed uuid;
begin
  if v_uid is null then
    raise exception 'Authentication required';
  end if;

  select claim_token, claimed_by into v_token, v_claimed
  from public.admin_claim_config
  where singleton = true
  for update;

  if v_claimed is not null then
    return exists(select 1 from public.admin_users where user_id = v_uid);
  end if;

  if p_token is distinct from v_token then
    return false;
  end if;

  insert into public.admin_users(user_id) values (v_uid)
  on conflict (user_id) do nothing;

  update public.admin_claim_config
  set claimed_by = v_uid,
      claimed_at = now(),
      claim_token = gen_random_uuid()
  where singleton = true;

  return true;
end;
$$;

create or replace function public.get_account_growth_metrics()
returns table(total bigint, today bigint, last_7_days bigint, last_30_days bigint, generated_at timestamptz)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or not exists(select 1 from public.admin_users where user_id = auth.uid()) then
    raise exception 'Forbidden';
  end if;

  return query
  select
    count(*)::bigint,
    count(*) filter (where created_at >= date_trunc('day', now()))::bigint,
    count(*) filter (where created_at >= now() - interval '7 days')::bigint,
    count(*) filter (where created_at >= now() - interval '30 days')::bigint,
    now()
  from public.profiles;
end;
$$;

revoke all on function public.claim_pilotdesk_admin(uuid) from public, anon;
revoke all on function public.get_account_growth_metrics() from public, anon;
grant execute on function public.claim_pilotdesk_admin(uuid) to authenticated;
grant execute on function public.get_account_growth_metrics() to authenticated;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function public.set_updated_at() from public, anon, authenticated;
revoke all on function public.handle_new_user() from public, anon, authenticated;
