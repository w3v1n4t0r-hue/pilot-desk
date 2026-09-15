-- PilotDesk Written Prep: account-gated study progress, sessions, and bookmarks.
create table if not exists public.written_prep_stats (
  user_id uuid not null references auth.users(id) on delete cascade,
  track text not null check (track in ('ppl','ira','cpl','cfi','cfii','atp')),
  question_id text not null,
  skill_area text not null,
  acs_code text,
  correct_count integer not null default 0 check (correct_count >= 0),
  total_count integer not null default 0 check (total_count >= 0),
  correct_streak integer not null default 0 check (correct_streak >= 0),
  last_result boolean,
  mastery numeric(5,2) not null default 0 check (mastery >= 0 and mastery <= 100),
  due_at timestamptz not null default now(),
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, track, question_id)
);

create table if not exists public.written_prep_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  track text not null check (track in ('ppl','ira','cpl','cfi','cfii','atp')),
  mode text not null check (mode in ('learn','random','missed','marked','exam')),
  question_payload jsonb not null default '[]'::jsonb,
  current_index integer not null default 0 check (current_index >= 0),
  score integer not null default 0 check (score >= 0),
  answered integer not null default 0 check (answered >= 0),
  total integer not null check (total > 0),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.written_prep_bookmarks (
  user_id uuid not null references auth.users(id) on delete cascade,
  track text not null check (track in ('ppl','ira','cpl','cfi','cfii','atp')),
  question_id text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, track, question_id)
);

create index if not exists written_prep_stats_user_track_due_idx on public.written_prep_stats(user_id, track, due_at);
create index if not exists written_prep_stats_user_track_result_idx on public.written_prep_stats(user_id, track, last_result);
create index if not exists written_prep_sessions_user_created_idx on public.written_prep_sessions(user_id, created_at desc);
create index if not exists written_prep_sessions_track_created_idx on public.written_prep_sessions(track, created_at desc);
create index if not exists written_prep_bookmarks_user_track_idx on public.written_prep_bookmarks(user_id, track);

alter table public.written_prep_stats enable row level security;
alter table public.written_prep_sessions enable row level security;
alter table public.written_prep_bookmarks enable row level security;

-- Users may read their own study history. All writes are performed by the authenticated
-- Written Prep Edge Function so answer scoring and mastery cannot be forged client-side.
drop policy if exists "written prep stats own select" on public.written_prep_stats;
create policy "written prep stats own select" on public.written_prep_stats for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "written prep sessions own select" on public.written_prep_sessions;
create policy "written prep sessions own select" on public.written_prep_sessions for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "written prep bookmarks own select" on public.written_prep_bookmarks;
create policy "written prep bookmarks own select" on public.written_prep_bookmarks for select to authenticated using ((select auth.uid()) = user_id);

revoke insert, update, delete on public.written_prep_stats from anon, authenticated;
revoke insert, update, delete on public.written_prep_sessions from anon, authenticated;
revoke insert, update, delete on public.written_prep_bookmarks from anon, authenticated;
grant select on public.written_prep_stats, public.written_prep_sessions, public.written_prep_bookmarks to authenticated;
