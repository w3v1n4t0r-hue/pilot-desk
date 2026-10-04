-- Add FOI without modifying existing progress or access policies.
begin;
alter table public.written_prep_stats drop constraint written_prep_stats_track_check;
alter table public.written_prep_stats add constraint written_prep_stats_track_check check (track in ('ppl','ira','cpl','cfi','cfii','atp','foi'));
alter table public.written_prep_sessions drop constraint written_prep_sessions_track_check;
alter table public.written_prep_sessions add constraint written_prep_sessions_track_check check (track in ('ppl','ira','cpl','cfi','cfii','atp','foi'));
alter table public.written_prep_bookmarks drop constraint written_prep_bookmarks_track_check;
alter table public.written_prep_bookmarks add constraint written_prep_bookmarks_track_check check (track in ('ppl','ira','cpl','cfi','cfii','atp','foi'));
commit;
