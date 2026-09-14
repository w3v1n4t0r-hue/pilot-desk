import fs from 'node:fs';
const read=p=>fs.readFileSync(new URL(`../${p}`,import.meta.url),'utf8');
const account=read('account.html'),client=read('assets/account.js'),stats=read('api/account-stats.js'),del=read('api/delete-account.js'),config=read('api/public-config.js'),sql=read('supabase/migrations/001_pilotdesk_accounts.sql'),nav=read('assets/global-nav.js');
const checks=[
  ['account page is noindex',/name="robots" content="noindex,nofollow"/.test(account)],
  ['Google auth is available',/signInWithOAuth\(\{provider:'google'/.test(client)],
  ['magic-link auth is available',/signInWithOtp/.test(client)],
  ['core account page exposes owner growth panel',/Account growth/.test(account)&&/pdMetricTotal/.test(account)],
  ['admin metrics require authenticated admin',/authenticatedAdmin/.test(stats)&&/PILOTDESK_ADMIN_EMAIL/.test(stats)],
  ['service role never enters public config',!/SERVICE_ROLE/.test(config)],
  ['account deletion verifies current user',/auth\/v1\/user/.test(del)&&/auth\/v1\/admin\/users/.test(del)],
  ['profile RLS is enabled',/alter table public\.profiles enable row level security/i.test(sql)],
  ['saved data is scoped to auth.uid',/auth\.uid\(\) = user_id/.test(sql)],
  ['client profile updates are column-limited',/grant update \(display_name, avatar_url, pilot_stage, home_airport, last_seen_at\) on public\.profiles/i.test(sql)],
  ['clients cannot award daily XP',/grant select on public\.daily_progress to authenticated/i.test(sql)&&!/grant select, insert, update on public\.daily_progress/i.test(sql)],
  ['new auth users get profiles',/on_auth_user_created/.test(sql)&&/handle_new_user/.test(sql)],
  ['account is in global navigation',/\/account\.html','Account'/.test(nav)]
];
let failed=0;for(const [name,ok] of checks){if(ok)console.log(`✓ ${name}`);else{failed++;console.error(`✗ ${name}`)}}if(failed)process.exit(1);console.log('Account system smoke checks passed.');
