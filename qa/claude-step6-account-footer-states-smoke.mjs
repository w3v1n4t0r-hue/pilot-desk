import fs from 'node:fs';

const failures=[];
const check=(ok,msg)=>{if(!ok)failures.push(msg)};
const read=p=>fs.readFileSync(p,'utf8');

const account=read('account.html');
const accountJs=read('assets/account.js');
const accountCss=read('assets/account.css');
const step6=read('assets/step6-2026.css');
const prefs=read('assets/user-preferences.js');
const states=read('assets/system-states.js');
const pricing=read('pricing.html');
const pricingCss=read('assets/pricing.css');
const experience=read('assets/experience.js');
const footerAstro=read('src/components/Footer.astro');
const site=read('src/data/site.mjs');
const boot=read('assets/app-bootstrap.js');
const styles=read('assets/styles.css');
const sw=read('sw.js');

// Account = personalized home base.
check(account.includes('Your PilotDesk home base.'),'Account hero does not frame the page as a personalized home base');
for(const id of ['pdAccountRecentActivity','pdAccountCurrency','pdAccountPrep','pdAccountSettings','pdSettingCompact','pdSettingMotion'])
  check(account.includes('id="'+id+'"'),'Account missing '+id);
check(accountJs.includes("from('saved_calculations').select"),'Recent account-saved calculations are not loaded');
check(accountJs.includes("localJson('pd-saved-flights'"),'Recent device-local flights are not loaded');
check(accountJs.includes("localJson('pd-daily-currency-reminders'"),'Account does not reuse Daily currency reminders');
check(accountJs.includes('/functions/v1/written-prep')&&accountJs.includes("cache:'no-store'"),'Account Written Prep progress is not loaded from the saved account service');
check(accountJs.includes('renderHomeOverview')&&accountJs.includes('renderInterfaceSettings'),'Account home-base data/settings render path missing');
check(!account.includes('id="pdXp"')&&!account.includes('id="pdLevel"'),'Account still foregrounds XP/level gamification');

// Functional settings.
check(prefs.includes("'pd-setting-compact'")&&prefs.includes("'pd-setting-reduced-motion'"),'Interface preference storage keys missing');
check(prefs.includes("classList.toggle('pd-compact-ui'")&&prefs.includes("classList.toggle('pd-reduced-motion'"),'Interface preferences do not change the document state');
check(accountJs.includes("PilotDeskPreferences?.set?.('compact'")&&accountJs.includes("PilotDeskPreferences?.set?.('motion'"),'Account switches are not wired to functional preferences');
check(step6.includes('html.pd-compact-ui')&&step6.includes('html.pd-reduced-motion'),'Global preference CSS behavior missing');
check(step6.includes('.pd-toggle-switch'),'EFB-style switch treatment missing');

// Pricing = factual comparison.
check(pricing.includes('Free tools. Optional account backup.'),'Pricing still uses a sales-heavy hero');
check((pricing.match(/class="pd-plan-card/g)||[]).length===2,'Pricing should compare only Free and Pro as active plans');
check(pricing.includes('pd-pricing-school-note')&&pricing.includes('No school checkout yet.'),'Flight School status is not a restrained development note');
check(step6.includes('.pd-plan-grid{grid-template-columns:1fr 1fr!important'),'Pricing comparison is not reduced to two factual columns');

// Footer = minimal utility links + clear supplemental disclaimer.
for(const file of [experience,site]){
  for(const label of ['About','Contact','Terms','Privacy'])check(file.includes(label),'Shared footer missing '+label);
}
check(footerAstro.includes('footerLinks.map'),'Astro footer no longer renders the shared footer link model');
check(!experience.includes("['/sources.html','Sources']")&&!experience.includes("['/legal/safety.html','Safety']"),'Legacy footer still builds the old link wall');
check(site.includes("['/feedback.html', 'Contact']"),'Astro footer does not expose Contact');
check(footerAstro.includes('supplements, but does not replace'),'Astro footer disclaimer is not explicit');
check(experience.includes('supplements, but does not replace'),'Legacy footer disclaimer is not explicit');
check(step6.includes('footer.pd-footer-2026'),'Minimal footer visual contract missing');

// Shared loading / empty / error states.
check(states.includes('window.PilotDeskStates'),'Shared state helper is not exported');
for(const kind of ['loading','empty','error'])check(states.includes(kind+':('),'Shared state helper missing '+kind);
check(states.includes("document.querySelectorAll('.pd-empty')"),'Existing empty states are not normalized');
check(states.includes("document.querySelectorAll('.wx-skeleton,.pd-loading')"),'Existing loading states are not normalized');
check(states.includes("document.querySelectorAll('.wx-error,.pd-gap-error')"),'Existing error states are not normalized');
check(step6.includes('.pd-state-instrument'),'Instrument-like state indicator missing');
check(!/spinner|border-radius:\s*50%/i.test(step6),'Step 6 state layer fell back to generic spinner styling');
check(!/radial-gradient|linear-gradient|backdrop-filter|repeating-linear-gradient/i.test(step6),'Step 6 layer contains decorative gradient/glass styling');
check(account.includes('data-state="loading"')&&account.includes('Loading recent activity'),'Account loading state does not use instrument-style language');

// Shared loading across the app.
check(boot.includes("load('/assets/user-preferences.js')"),'User preferences are not loaded globally');
check(boot.includes("load('/assets/system-states.js')"),'Shared system states are not loaded globally');
check(styles.includes('@import url("/assets/step6-2026.css");'),'Step 6 stylesheet is not globally loaded');
check(styles.trim().endsWith('@import url("/assets/design-tokens.css");'),'Design tokens must remain final CSS authority');
for(const asset of ['/assets/step6-2026.css','/assets/user-preferences.js','/assets/system-states.js'])
  check(sw.includes("'"+asset+"'"),'Step 6 asset missing from network-first shell: '+asset);
check(Number(sw.match(/CACHE='pilotdesk-v(\d+)'/)?.[1]||0)>=49,'Step 6 service-worker release version did not advance');

if(failures.length){
 console.error('Claude Step 6 account/footer/states smoke failed ('+failures.length+')');
 failures.forEach(x=>console.error(' - '+x));
 process.exit(1);
}
console.log('Claude Step 6 account/footer/states smoke passed.');
