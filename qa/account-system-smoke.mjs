import fs from 'node:fs';
const read=p=>fs.readFileSync(new URL(`../${p}`,import.meta.url),'utf8');
const account=read('account.html'),client=read('assets/account.js'),sql=read('supabase/migrations/001_pilotdesk_accounts.sql'),ownerSql=read('supabase/migrations/002_owner_metrics.sql'),edgeSql=read('supabase/migrations/004_move_owner_metrics_to_edge.sql'),deleteFn=read('supabase/functions/delete-account/index.ts'),ownerFn=read('supabase/functions/owner-metrics/index.ts'),nav=read('assets/global-nav.js');
const checks=[
  ['account page is noindex',/name="robots" content="noindex,nofollow"/.test(account)],
  ['client uses browser-safe publishable key',/sb_publishable_/.test(client)&&!/SERVICE_ROLE|sb_secret_/.test(client)],
  ['Google auth is available when provider is enabled',/signInWithOAuth\(\{provider:'google'/.test(client)&&/auth\/v1\/settings/.test(client)],
  ['magic-link auth is available',/signInWithOtp/.test(client)],
  ['owner metrics use authenticated edge function',/functions\/v1\/owner-metrics/.test(client)&&/auth\/v1\/user/.test(ownerFn)&&/admin_users/.test(ownerFn)],
  ['owner access uses one-time claim flow',/claimToken/.test(client)&&/claim_token\s*:\s*crypto\.randomUUID\(\)/.test(ownerFn)&&/claim_token uuid not null default gen_random_uuid\(\)/.test(ownerSql)],
  ['owner tables deny direct client access',/admin_users_deny_all/.test(edgeSql)&&/admin_claim_config_deny_all/.test(edgeSql)],
  ['account deletion uses authenticated edge function',/functions\/v1\/delete-account/.test(client)&&/auth\/v1\/user/.test(deleteFn)&&/auth\/v1\/admin\/users/.test(deleteFn)],
  ['profile RLS is enabled',/alter table public\.profiles enable row level security/i.test(sql)],
  ['saved data is scoped to auth.uid',/auth\.uid\(\)/.test(sql)],
  ['client profile updates are column-limited',/grant update \(display_name, avatar_url, pilot_stage, home_airport, last_seen_at\) on public\.profiles/i.test(sql)],
  ['clients cannot award daily XP',/grant select on public\.daily_progress to authenticated/i.test(sql)&&!/grant select, insert, update on public\.daily_progress/i.test(sql)],
  ['new auth users get profiles',/on_auth_user_created/.test(sql)&&/handle_new_user/.test(sql)],
  ['account is in global navigation',/\/account\.html','Account'/.test(nav)]
];
let failed=0;for(const [name,ok] of checks){if(ok)console.log(`✓ ${name}`);else{failed++;console.error(`✗ ${name}`)}}if(failed)process.exit(1);console.log('Account system smoke checks passed.');