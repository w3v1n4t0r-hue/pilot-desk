-- PilotDesk Pro groundwork: training focus and manual cloud flight backup.
-- Applied to the PilotDesk Supabase project on 2026-09-19.

alter table public.profiles
  add column if not exists training_goal text,
  add column if not exists checkride_date date;

alter table public.profiles
  drop constraint if exists profiles_training_goal_check;

alter table public.profiles
  add constraint profiles_training_goal_check
  check (
    training_goal is null
    or training_goal = any (array['ppl','ira','cpl','multi','cfi','cfii','atp'])
  );

create table if not exists public.saved_flights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  route text,
  aircraft_id uuid,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists saved_flights_user_id_idx
  on public.saved_flights(user_id);

alter table public.saved_flights enable row level security;

drop policy if exists saved_flights_select_own on public.saved_flights;
create policy saved_flights_select_own
  on public.saved_flights for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists saved_flights_insert_own on public.saved_flights;
create policy saved_flights_insert_own
  on public.saved_flights for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists saved_flights_update_own on public.saved_flights;
create policy saved_flights_update_own
  on public.saved_flights for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists saved_flights_delete_own on public.saved_flights;
create policy saved_flights_delete_own
  on public.saved_flights for delete to authenticated
  using ((select auth.uid()) = user_id);

revoke all on public.saved_flights from anon;
grant select, insert, update, delete on public.saved_flights to authenticated;

grant select on public.profiles to authenticated;
grant update (
  display_name,
  avatar_url,
  pilot_stage,
  home_airport,
  training_goal,
  checkride_date,
  last_seen_at
) on public.profiles to authenticated;
