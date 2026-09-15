-- PilotDesk Written Prep: ACS/PTS grading metadata and difficulty tracking.
-- Existing rows remain valid; metadata is filled as questions are answered again.

alter table public.written_prep_stats
  add column if not exists acs_code text,
  add column if not exists standard_doc text,
  add column if not exists difficulty text;

alter table public.written_prep_sessions
  add column if not exists difficulty text not null default 'all';

alter table public.written_prep_stats
  drop constraint if exists written_prep_stats_difficulty_check;
alter table public.written_prep_stats
  add constraint written_prep_stats_difficulty_check
  check (difficulty is null or difficulty in ('foundation','applied','advanced'));

alter table public.written_prep_sessions
  drop constraint if exists written_prep_sessions_difficulty_check;
alter table public.written_prep_sessions
  add constraint written_prep_sessions_difficulty_check
  check (difficulty in ('all','foundation','applied','advanced'));

create index if not exists written_prep_stats_user_track_acs_idx
  on public.written_prep_stats(user_id, track, acs_code);
create index if not exists written_prep_stats_user_track_difficulty_idx
  on public.written_prep_stats(user_id, track, difficulty);
create index if not exists written_prep_sessions_user_track_difficulty_idx
  on public.written_prep_sessions(user_id, track, difficulty, created_at desc);

-- Keep all direct mutation server-owned. Users may read only the progress tables
-- already exposed by the prior Written Prep RLS policies.
revoke insert, update, delete on public.written_prep_stats from anon, authenticated;
revoke insert, update, delete on public.written_prep_sessions from anon, authenticated;
revoke insert, update, delete on public.written_prep_bookmarks from anon, authenticated;
