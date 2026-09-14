-- Avoid per-row auth.uid() re-evaluation on user badge reads.
drop policy if exists "user_badges_select_own" on public.user_badges;
create policy "user_badges_select_own"
on public.user_badges
for select
to authenticated
using ((select auth.uid()) = user_id);
