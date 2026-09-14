drop function if exists public.claim_pilotdesk_admin(uuid);
drop function if exists public.get_account_growth_metrics();

drop policy if exists "admin_users_deny_all" on public.admin_users;
create policy "admin_users_deny_all" on public.admin_users
for all to anon, authenticated
using (false)
with check (false);

drop policy if exists "admin_claim_config_deny_all" on public.admin_claim_config;
create policy "admin_claim_config_deny_all" on public.admin_claim_config
for all to anon, authenticated
using (false)
with check (false);
