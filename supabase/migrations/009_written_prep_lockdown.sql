-- Written Prep answer keys and study state are server-owned.
-- The browser uses the authenticated Written Prep Edge Function for all reads/writes,
-- so no direct PostgREST access is needed for authenticated or anonymous clients.
revoke all on public.written_prep_stats from anon, authenticated;
revoke all on public.written_prep_sessions from anon, authenticated;
revoke all on public.written_prep_bookmarks from anon, authenticated;

-- Keep RLS enabled as defense in depth even though table privileges are revoked.
alter table public.written_prep_stats enable row level security;
alter table public.written_prep_sessions enable row level security;
alter table public.written_prep_bookmarks enable row level security;
