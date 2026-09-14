create index if not exists idx_admin_claim_config_claimed_by on public.admin_claim_config(claimed_by);

drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_select_own" on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy "profiles_update_own" on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

drop policy if exists "saved_airports_select_own" on public.saved_airports;
drop policy if exists "saved_airports_insert_own" on public.saved_airports;
drop policy if exists "saved_airports_update_own" on public.saved_airports;
drop policy if exists "saved_airports_delete_own" on public.saved_airports;
create policy "saved_airports_select_own" on public.saved_airports for select to authenticated using ((select auth.uid()) = user_id);
create policy "saved_airports_insert_own" on public.saved_airports for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "saved_airports_update_own" on public.saved_airports for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "saved_airports_delete_own" on public.saved_airports for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "aircraft_profiles_select_own" on public.aircraft_profiles;
drop policy if exists "aircraft_profiles_insert_own" on public.aircraft_profiles;
drop policy if exists "aircraft_profiles_update_own" on public.aircraft_profiles;
drop policy if exists "aircraft_profiles_delete_own" on public.aircraft_profiles;
create policy "aircraft_profiles_select_own" on public.aircraft_profiles for select to authenticated using ((select auth.uid()) = user_id);
create policy "aircraft_profiles_insert_own" on public.aircraft_profiles for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "aircraft_profiles_update_own" on public.aircraft_profiles for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "aircraft_profiles_delete_own" on public.aircraft_profiles for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "saved_calculations_select_own" on public.saved_calculations;
drop policy if exists "saved_calculations_insert_own" on public.saved_calculations;
drop policy if exists "saved_calculations_delete_own" on public.saved_calculations;
create policy "saved_calculations_select_own" on public.saved_calculations for select to authenticated using ((select auth.uid()) = user_id);
create policy "saved_calculations_insert_own" on public.saved_calculations for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "saved_calculations_delete_own" on public.saved_calculations for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "daily_progress_select_own" on public.daily_progress;
create policy "daily_progress_select_own" on public.daily_progress for select to authenticated using ((select auth.uid()) = user_id);
