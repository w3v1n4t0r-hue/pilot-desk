import fs from 'node:fs';

const failures=[];
const check=(ok,msg)=>{if(!ok)failures.push(msg)};
const read=p=>fs.readFileSync(p,'utf8');

const account=read('account.html');
const accountJs=read('assets/account.js');
const accountCss=read('assets/account.css');
const pricing=read('pricing.html');
const pricingJs=read('assets/pricing-billing.js');
const pricingCss=read('assets/pricing.css');
const stateJs=read('assets/system-states.js');
const stateCss=read('assets/system-states.css');
const site=read('src/data/site.mjs');
const footer=read('src/components/Footer.astro');
const shell=read('scripts/shared-shell.mjs');
const boot=read('assets/app-bootstrap.js');
const styles=read('assets/styles.css');
const sw=read('sw.js');

check(account.includes('Your PilotDesk home base.'),'Account hero is not home-base oriented');
for(const id of ['pdAccountRecentActivity','pdAccountCurrency','pdAccountPrepProgress','pdSettingReduceMotion','pdSettingDeviceActivity','pdSettingGoalStudy'])
  check(account.includes('id="'+id+'"'),'Account missing '+id);
check(!account.includes('id="pdXp"')&&!account.includes('id="pdLevel"')&&!account.includes('id="pdBestStreak"'),'Account still foregrounds XP / level gamification');
check(accountJs.includes("localJson('pd-recent'")&&accountJs.includes("localJson('pd-saved-flights'"),'Account recent activity is not grounded in real device data');
check(accountJs.includes("localJson('pd-daily-currency-reminders'"),'Account currency widget does not reuse pilot-entered Daily reminders');
check(accountJs.includes('/functions/v1/written-prep')&&accountJs.includes('renderPrepProgress'),'Account does not load real Written Prep progress');
check(accountJs.includes("cache:'no-store'"),'Account study progress should not rely on a stale response');
check(accountJs.includes("pd-setting-reduce-motion")&&accountJs.includes("pd-setting-device-activity")&&accountJs.includes("pd-setting-goal-study"),'Account settings are not functional');
check(accountCss.includes('.pd-account-homebase-grid')&&accountCss.includes('.pd-switch-row input[role="switch"]'),'Account home-base / EFB switch styling missing');
check(accountCss.includes('grid-template-columns:170px minmax(150px,.65fr) minmax(0,1fr) auto'),'Account quick access is not compact row-oriented');

check(pricing.includes('PilotDesk stays useful free.'),'Pricing still opens like a sales landing page');
check(pricing.includes('pd-pricing-table')&&pricing.includes('Free vs. Pro'),'Free-vs-Pro comparison missing');
check(pricing.includes('data-pd-checkout-plan="pro"'),'Pro checkout action missing');
check(pricing.includes('Manual cloud backup / restore')&&pricing.includes('not live two-way sync'),'Pro scope is not explicit');
check(!pricing.includes('pd-plan-grid')&&!pricing.includes('pd-plan-card'),'Pricing still uses three-card SaaS plan theater');
check(pricing.includes('There is no public Flight School checkout yet.'),'Flight School status is ambiguous');
check(pricingJs.includes('PilotDeskState.render'),'Pricing does not use shared billing states');
check(pricingCss.includes('.pd-pricing-row')&&pricingCss.includes('grid-template-columns:minmax(0,1fr) 130px 130px'),'Pricing comparison hierarchy missing');

check(stateJs.includes('window.PilotDeskState={render,applyMotionPreference}'),'Shared state renderer missing');
for(const kind of ['pd-state-loading','pd-state-empty','pd-state-error','pd-state-warning'])
  check(stateCss.includes('.'+kind),'Shared state CSS missing '+kind);
check(stateCss.includes('@keyframes pd-state-online')&&!/\.spinner\b|class=["'][^"']*spinner/i.test(stateCss),'Loading state is not instrument-like');
check(stateJs.includes("cls==='error'?'alert':'status'")&&stateJs.includes("aria-busy"),'Shared states do not expose accessible status roles');
check(stateCss.includes('html[data-pd-reduce-motion="1"]'),'Reduced-motion account setting is not honored globally');
check(boot.includes('/assets/system-states.js'),'Shared state runtime is not loaded by app bootstrap');
check(styles.includes('@import url("/assets/system-states.css");'),'Shared state CSS is not in the global cascade');

check(site.includes("['/about.html', 'About']")&&site.includes("['/feedback.html', 'Contact']")&&site.includes("['/legal/terms.html', 'Terms']")&&site.includes("['/legal/privacy.html', 'Privacy']"),'Minimal footer links missing');
const footerBlock=(site.match(/export const footerLinks = \[([\s\S]*?)\];/)||[])[1]||'';
check(!/Flight Schools|Plans|Sources|Safety/.test(footerBlock),'Shared footer still contains nonessential links');
const disclaimer='PilotDesk supplements, but does not replace, official flight planning, weather, aircraft, regulatory, or operational sources.';
check(footer.includes(disclaimer),'Astro footer disclaimer missing');
check(shell.includes(disclaimer),'Legacy shared-shell footer disclaimer missing');
check(stateCss.includes('footer .footer-links')&&stateCss.includes('grid-template-columns:minmax(180px,.8fr) auto minmax(260px,1.1fr)'),'Minimal footer layout missing');

for(const asset of ['/assets/system-states.js','/assets/system-states.css','/assets/account.js','/assets/pricing-billing.js'])
  check(sw.includes("'"+asset+"'"),'Step 6 asset is not network-first: '+asset);
check(Number(sw.match(/CACHE='pilotdesk-v(\d+)'/)?.[1]||0)>=49,'Step 6 service-worker version did not advance');
check(styles.trim().endsWith('@import url("/assets/design-tokens.css");'),'Design tokens must remain final shared CSS authority');

if(failures.length){
 console.error('Claude Step 6 account/pricing/states smoke failed ('+failures.length+')');
 failures.forEach(x=>console.error(' - '+x));
 process.exit(1);
}
console.log('Claude Step 6 account, pricing, footer, and shared-state smoke passed.');
