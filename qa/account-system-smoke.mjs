import fs from 'node:fs';
const read=p=>fs.readFileSync(new URL(`../${p}`,import.meta.url),'utf8');
const account=read('account.html'),client=read('assets/account.js'),accountCss=read('assets/account.css'),analytics=read('assets/analytics.js'),aircraft=read('aircraft.html'),flights=read('flights.html'),history=read('history.html'),sql=read('supabase/migrations/001_pilotdesk_accounts.sql'),ownerSql=read('supabase/migrations/002_owner_metrics.sql'),edgeSql=read('supabase/migrations/004_move_owner_metrics_to_edge.sql'),deleteFn=read('supabase/functions/delete-account/index.ts'),ownerFn=read('supabase/functions/owner-metrics/index.ts'),nav=read('assets/global-nav.js');
const checks=[
  ['account page is noindex',/name="robots" content="noindex,nofollow"/.test(account)],
  ['client uses browser-safe publishable key',/sb_publishable_/.test(client)&&!/SERVICE_ROLE|sb_secret_/.test(client)],
  ['Google auth is available when provider is enabled',/signInWithOAuth\(\{provider:'google'/.test(client)&&/auth\/v1\/settings/.test(client)],
  ['magic-link auth is available',/signInWithOtp/.test(client)],
  ['password recovery has a form and callback handling',account.includes('pdRecoveryForm')&&client.includes("event==='PASSWORD_RECOVERY'")&&client.includes('auth.updateUser({password})')&&client.includes('callbackError()')],
  ['verification has a resend action and cooldown',account.includes('pdConfirmationEmail')&&account.includes('pdResendConfirmation')&&client.includes("auth.resend({type:'signup'")&&client.includes('pd-confirm-resend-until')],
  ['signup form is scoped to signed-out view',account.indexOf('pdCreateAccountForm')<account.indexOf('id="pdSignedIn"')&&account.indexOf('pdCreateAccountForm')<account.indexOf('id="pdRecoveryPanel"')],
  ['auth errors are translated for pilots',client.includes("code==='invalid_credentials'")&&client.includes("code==='email_not_confirmed'")&&client.includes('AuthRetryableFetchError')],
  ['account status is near forms and announced',account.indexOf('id="pdAccountStatus"')<account.indexOf('id="pdSignedOut"')&&account.includes('aria-live="polite"')],
  ['owner metrics use authenticated edge function',/functions\/v1\/owner-metrics/.test(client)&&/auth\/v1\/user/.test(ownerFn)&&/admin_users/.test(ownerFn)],
  ['owner access uses one-time claim flow',/claimToken/.test(client)&&/claim_token\s*:\s*crypto\.randomUUID\(\)/.test(ownerFn)&&/claim_token uuid not null default gen_random_uuid\(\)/.test(ownerSql)],
  ['owner tables deny direct client access',/admin_users_deny_all/.test(edgeSql)&&/admin_claim_config_deny_all/.test(edgeSql)],
  ['account deletion uses authenticated edge function',/functions\/v1\/delete-account/.test(client)&&/auth\/v1\/user/.test(deleteFn)&&/auth\/v1\/admin\/users/.test(deleteFn)],
  ['profile RLS is enabled',/alter table public\.profiles enable row level security/i.test(sql)],
  ['saved data is scoped to auth.uid',/auth\.uid\(\)/.test(sql)],
  ['client profile updates are column-limited',/grant update \(display_name, avatar_url, pilot_stage, home_airport, last_seen_at\) on public\.profiles/i.test(sql)],
  ['clients cannot award daily XP',/grant select on public\.daily_progress to authenticated/i.test(sql)&&!/grant select, insert, update on public\.daily_progress/i.test(sql)],
  ['new auth users get profiles',/on_auth_user_created/.test(sql)&&/handle_new_user/.test(sql)],
  ['account is always visible in the global header',nav.includes('data-pd-account-link')&&nav.includes('href="/account.html"')&&nav.includes("text.textContent='Sign in'")&&nav.includes("text.textContent='Account'")],
  ['account page distinguishes synced and device-local data',account.includes('Account synced')&&account.includes('Device local')&&account.includes('Aircraft & saved flights · this device')],
  ['signed-in account has a useful dashboard',account.includes('pdAccountDashboardGrid')&&client.includes('renderAccountDashboard')],
  ['account home base surfaces recent activity, currency reminders and Written Prep',account.includes('pdAccountRecentActivity')&&account.includes('pdAccountCurrency')&&account.includes('pdAccountPrep')&&client.includes('renderRecentActivity')&&client.includes('renderPrepOverview')],
  ['account dashboard reads device-local aircraft flights and pins',client.includes("localJson('pd-aircraft'")&&client.includes("localJson('pd-saved-flights'")&&client.includes("localJson('pd-favorites'")],
  ['account includes functional interface settings',account.includes('pdSettingCompact')&&account.includes('pdSettingMotion')&&client.includes('PilotDeskPreferences')],
  ['account dashboard actions are measurable',analytics.includes('Account Dashboard Action')&&client.includes('pdAccountAction')],
  ['account dashboard has a mobile layout',accountCss.includes('.pd-account-dashboard-grid')&&accountCss.includes('@media(max-width:620px)')],
  ['account-adjacent pages use official PilotDesk branding',[aircraft,flights,history].every(x=>x.includes('/favicon.svg')&&!x.includes('data-pd-wireframe="1"')&&!x.includes('viewBox="0 0 64 40"'))]
];
let failed=0;for(const [name,ok] of checks){if(ok)console.log(`✓ ${name}`);else{failed++;console.error(`✗ ${name}`)}}if(failed)process.exit(1);console.log('Account system smoke checks passed.');
