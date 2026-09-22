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
const states=read('assets/product-states.js');
const finalCss=read('assets/final-shell-2026.css');
const history=read('assets/pilotdesk-plus.js');
const footer=read('src/components/Footer.astro');
const site=read('src/data/site.mjs');
const shell=read('scripts/shared-shell.mjs');
const bootstrap=read('assets/app-bootstrap.js');
const styles=read('assets/styles.css');
const sw=read('sw.js');

// Parse browser scripts even though they depend on browser globals at runtime.
for(const [name,src] of [['account',accountJs],['pricing billing',pricingJs],['product states',states],['history',history]]){
 try{new Function(src)}catch(e){failures.push(name+' JS does not parse: '+e.message)}
}

// Account: personalized home base, not gamification.
check(account.includes('Your PilotDesk home base.'),'Account hero is not framed as a personalized home base');
check(account.includes('id="pdAccountRecent"')&&account.includes('id="pdAccountRecentList"'),'Recent Activity surface missing');
check(account.includes('id="pdAccountCurrencyCard"')&&account.includes('CURRENCY REMINDER'),'Currency reminder widget missing');
check(account.includes('id="pdAccountPrepCard"')&&account.includes('WRITTEN PREP'),'Written Prep progress widget missing');
check(account.includes('id="pdAccountSettings"')&&account.includes('pdSettingRecent')&&account.includes('pdSettingCurrency')&&account.includes('pdSettingCompact'),'EFB-style dashboard settings toggles missing');
check(accountJs.includes("from('saved_calculations').select"),'Account Recent Activity does not read account-saved calculations');
check(accountJs.includes("localJson('pd-calculation-history'")&&accountJs.includes("localJson('pd-saved-flights'")&&accountJs.includes("localJson('pd-recent'"),'Account Recent Activity does not combine device-local work');
check(accountJs.includes("localJson('pd-daily-currency-reminders'"),'Account currency widget does not use the Daily reminder source');
check(accountJs.includes('PilotDesk does not determine legal currency')||account.includes('PilotDesk does not determine legal currency'),'Account reminder safety boundary missing');
check(accountJs.includes('/functions/v1/written-prep')&&accountJs.includes('standardCoverage')&&accountJs.includes('skillAreas?.[0]?.area'),'Account Written Prep widget is not grounded in saved rating progress');
check(accountJs.includes("const ACCOUNT_UI_KEY='pd-account-ui-settings'")&&accountJs.includes('saveAccountUi'),'Account display settings are not persisted');
check(finalCss.includes('.pd-user-stats,#pdAccountDailyCta,#pdAccountWrittenPrep{display:none!important}'),'Gamified XP/level/streak block is still visible');
check(!accountJs.includes('🔥'),'Account dashboard still contains game-like flame treatment');

// Pricing: factual capability comparison.
check(pricing.includes('Free covers the tools. Pro adds account-backed backup.'),'Pricing hero is still marketing-first');
check(pricing.includes('CURRENT ACCOUNT PLAN')&&pricing.includes('data-pd-billing-plan'),'Pricing does not show current account plan');
check((pricing.match(/class="pd-plan-card/g)||[]).length===2,'Pricing should show exactly Free and Pro as purchasable plan cards');
check(pricing.includes('Cloud backup is manual today. It is not live two-way sync.'),'Pro backup limitation is unclear');
check(pricing.includes('There is no public school checkout.'),'Flight School development status is unclear');
check(pricing.includes('data-pd-checkout-plan="pro"'),'Pro checkout wiring was lost');
check(pricingJs.includes("note('Checking the account plan and Stripe availability.','loading')"),'Pricing does not use a deliberate loading state');
check(pricingJs.includes("kind==='bad'?'error'"),'Pricing errors do not use the shared calm error state');

// Shared states.
for(const marker of ["['loading','empty','error','ready'].includes(opts.kind)","kind==='loading'","kind==='error'",'pd-state-scan','data-pd-state-retry'])
 check(states.includes(marker),'Shared state helper missing '+marker);
check(!/spinner|border-radius:\s*50%/i.test(states),'Shared loading state regressed to a generic spinner');
check(history.includes('No calculation history on this device')&&history.includes('href="/tools.html"'),'Calculation History empty state lacks one clear action');
check(finalCss.includes('.pd-system-state')&&finalCss.includes('@keyframes pd-state-online'),'Instrument-style shared state CSS missing');
check(!/radial-gradient|linear-gradient|backdrop-filter/i.test(finalCss),'Final Step 6 layer contains decorative SaaS effects');

// Footer: same minimal contract across Astro and legacy build shell.
for(const pair of [["'/about.html', 'About'"],["'/feedback.html', 'Contact'"],["'/legal/terms.html', 'Terms'"],["'/legal/privacy.html', 'Privacy'"]])
 check(site.includes(pair[0]),'Minimal footer link missing '+pair[0]);
check(!site.match(/export const footerLinks = \[[\s\S]*?Pricing[\s\S]*?\];/),'Pricing should not be part of the minimal footer link set');
const footerBlock=site.match(/export const footerLinks = \[([\s\S]*?)\];/)?.[1]||'';
check((footerBlock.match(/^\s*\[/gm)||[]).length===4,'Shared footer should contain four utility links');
for(const text of ['PilotDesk supplements—not replaces—current official weather, charts, NOTAMs, regulations, procedures, and approved aircraft data.']){
 check(footer.includes(text),'Astro footer disclaimer missing');
 check(shell.includes(text),'Legacy footer disclaimer missing');
}
check(shell.includes('footerLinks.map'),'Legacy build shell no longer uses shared footer links');

// Load/caching contract.
check(bootstrap.includes("load('/assets/product-states.js')"),'Shared product states are not loaded globally');
check(styles.includes('@import url("/assets/final-shell-2026.css");'),'Final shell stylesheet is not in shared CSS');
check(styles.trim().endsWith('@import url("/assets/design-tokens.css");'),'Design tokens must remain final shared CSS authority');
for(const asset of ['/assets/product-states.js','/assets/final-shell-2026.css','/assets/account.js','/assets/pricing-billing.js'])
 check(sw.includes("'"+asset+"'"),'Step 6 asset is not network-first/cached: '+asset);
check(Number(sw.match(/CACHE='pilotdesk-v(\d+)'/)?.[1]||0)>=49,'Step 6 service-worker release version did not advance');

if(failures.length){
 console.error('Claude Step 6 account/shared-state smoke failed ('+failures.length+')');
 failures.forEach(x=>console.error(' - '+x));
 process.exit(1);
}
console.log('Claude Step 6 account, pricing, footer, and shared-state smoke passed.');
