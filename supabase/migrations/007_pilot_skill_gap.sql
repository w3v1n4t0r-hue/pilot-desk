-- PilotDesk Pilot Skill Gap: persistent ACS-area proficiency for PPL/CPL/ATP.

alter table public.profiles
  add column if not exists knowledge_track text
  check (knowledge_track is null or knowledge_track in ('ppl','cpl','atp'));

grant update (knowledge_track) on public.profiles to authenticated;

create table if not exists public.skill_gap_stats (
  user_id uuid not null references auth.users(id) on delete cascade,
  track text not null check (track in ('ppl','cpl','atp')),
  skill_area text not null check (char_length(skill_area) between 1 and 80),
  correct_count integer not null default 0 check (correct_count >= 0),
  total_count integer not null default 0 check (total_count >= 0 and total_count >= correct_count),
  last_attempted_at timestamptz not null default now(),
  primary key (user_id, track, skill_area)
);

create index if not exists idx_skill_gap_user_track
  on public.skill_gap_stats(user_id, track, last_attempted_at desc);

alter table public.skill_gap_stats enable row level security;
drop policy if exists "skill_gap_select_own" on public.skill_gap_stats;
create policy "skill_gap_select_own" on public.skill_gap_stats
  for select to authenticated
  using ((select auth.uid()) = user_id);

revoke all on public.skill_gap_stats from anon, authenticated;
grant select on public.skill_gap_stats to authenticated;

create or replace function public.record_skill_gap_attempt(
  p_user_id uuid,
  p_track text,
  p_area_results jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  item jsonb;
  area_name text;
  c integer;
  t integer;
begin
  if p_user_id is null then raise exception 'missing user'; end if;
  if p_track not in ('ppl','cpl','atp') then raise exception 'invalid track'; end if;
  if jsonb_typeof(p_area_results) <> 'array' then raise exception 'invalid area results'; end if;

  for item in select * from jsonb_array_elements(p_area_results)
  loop
    area_name := nullif(trim(item->>'area'), '');
    c := coalesce((item->>'correct')::integer, 0);
    t := coalesce((item->>'total')::integer, 0);
    if area_name is null or char_length(area_name) > 80 or c < 0 or t < 1 or c > t then
      raise exception 'invalid area result';
    end if;

    insert into public.skill_gap_stats(user_id, track, skill_area, correct_count, total_count, last_attempted_at)
    values (p_user_id, p_track, area_name, c, t, now())
    on conflict (user_id, track, skill_area) do update
      set correct_count = public.skill_gap_stats.correct_count + excluded.correct_count,
          total_count = public.skill_gap_stats.total_count + excluded.total_count,
          last_attempted_at = now();
  end loop;

  update public.profiles
    set knowledge_track = p_track, updated_at = now()
    where id = p_user_id;

  return (
    select coalesce(jsonb_agg(jsonb_build_object(
      'area', skill_area,
      'correct', correct_count,
      'total', total_count,
      'percent', case when total_count > 0 then round((correct_count::numeric / total_count::numeric) * 100) else 0 end,
      'lastAttemptedAt', last_attempted_at
    ) order by (case when total_count > 0 then correct_count::numeric / total_count::numeric else 0 end), skill_area), '[]'::jsonb)
    from public.skill_gap_stats
    where user_id = p_user_id and track = p_track
  );
end;
$$;

revoke all on function public.record_skill_gap_attempt(uuid,text,jsonb) from public, anon, authenticated;
grant execute on function public.record_skill_gap_attempt(uuid,text,jsonb) to service_role;
