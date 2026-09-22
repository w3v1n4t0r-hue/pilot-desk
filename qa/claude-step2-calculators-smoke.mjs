import fs from 'node:fs';

const failures=[];
const check=(ok,msg)=>{if(!ok)failures.push(msg)};
const read=p=>fs.readFileSync(p,'utf8');

const tools=read('src/pages/tools.astro');
const dir=read('assets/tools-directory.js');
const site=read('assets/site.js');
const ux=read('assets/calculator-ux.js');
const account=read('assets/calculation-account.js');
const wb=read('weight-balance.html');
const wbjs=read('assets/weight-balance.js');
const css=read('assets/calculators-2026.css');
const styles=read('assets/styles.css');
const bootstrap=read('assets/app-bootstrap.js');
const sw=read('sw.js');
const migration=read('supabase/migrations/001_pilotdesk_accounts.sql');

// Hub: dense, searchable, grouped, recent-first.
for(const marker of ['pdToolDirectorySearch','pdToolDirectoryGroup','pdToolChips','pdToolPersonal','RECENTLY USED'])
  check(tools.includes(marker),'Calculator hub missing '+marker);
check(dir.includes('CATEGORY_ORDER')&&dir.includes('Flight Planning')&&dir.includes('Performance')&&dir.includes('Navigation')&&dir.includes('Weight & Balance'),'Calculator category grouping incomplete');
check(dir.includes('toolIcon(')&&dir.includes('pd-directory-icon'),'Calculator entries are missing instrumentation-style icons');
check(dir.includes('relativeUsed')&&dir.includes('Last used today')&&dir.includes('Last used yesterday'),'Recent-use timing labels missing');
check(dir.includes('pd-directory-last-used'),'Recent-use tag missing from directory rows');
check(site.includes('usedAt:Date.now()'),'Calculator usage timestamp is not recorded');
check(!site.includes('calculate();recordRecent();renderRecent();'),'A calculator page visit is still being counted as use');

// Generic calculator template: inputs bounded, outputs dominant, account save real.
for(const marker of ['pd-calc-workbench','pd-calc-input-panel','pd-calc-output-panel','data-pd-save-calculation'])
  check(ux.includes(marker),'Calculator template missing '+marker);
check(css.includes('grid-template-columns:minmax(300px,.86fr) minmax(360px,1.14fr)'),'Desktop calculator workbench hierarchy missing');
check(css.includes('.pd-calc-output-panel .result.primary')&&css.includes('font-size:38px'),'Primary numeric output is not visually dominant');
check(css.includes('position:sticky;top:82px'),'Desktop outputs do not remain visible while working inputs');
check(css.includes('@media(max-width:980px)')&&css.includes('.pd-calc-output-panel{position:static;grid-row:1}'),'Mobile/tablet output-first order missing');
check(account.includes("from('saved_calculations').insert"),'Save calculation does not write to the account table');
check(account.includes("reason:'signin'")&&account.includes('/account.html?next='),'Guest Save calculation does not route through sign-in');
check(migration.includes('create table if not exists public.saved_calculations'),'Account schema does not support saved calculations');
check(bootstrap.includes('/assets/calculation-account.js'),'Account-save helper not loaded on calculator pages');

// W&B example: result deck + graph first, warnings only for real limit state.
check(wb.includes('class="wb-result-deck"'),'W&B result deck missing');
check(wb.indexOf('class="wb-result-deck"')<wb.indexOf('class="wb-cabin-card"'),'W&B inputs appear before outputs');
check(wb.includes('id="wbChart"')&&wb.indexOf('id="wbChart"')<wb.indexOf('id="wbCabinTitle"'),'W&B CG graph is not part of the dominant result surface');
check(wb.includes('id="wbSaveAccount"'),'W&B Save to account action missing');
check(wbjs.includes("toolSlug:'weight-balance-builder'")&&wbjs.includes('PilotDeskSavedCalculations'),'W&B account save is not wired');
check(wbjs.includes('outside the entered CG envelope'),'W&B out-of-envelope warning missing');
check(css.includes('.wb-envelope-state[data-state="outside"]')&&css.includes('var(--pd-danger)'),'W&B genuine limit warning does not use the alert token');

// Visual language: no AI/SaaS effects in this layer.
check(!/radial-gradient|linear-gradient|backdrop-filter|glow/i.test(css),'Calculator Step 2 CSS contains decorative SaaS effects');
check(styles.includes('@import url("/assets/calculators-2026.css");'),'Calculator Step 2 stylesheet not loaded');
check(styles.trim().endsWith('@import url("/assets/design-tokens.css");'),'Design tokens must remain final CSS authority');
check(sw.includes("'/assets/calculators-2026.css'")&&sw.includes("'/assets/calculation-account.js'"),'Calculator Step 2 assets are missing from offline shell');
check(Number(sw.match(/CACHE='pilotdesk-v(\d+)'/)?.[1]||0)>=45,'Step 2 service-worker version did not advance');

if(failures.length){
 console.error('Claude Step 2 calculator smoke failed ('+failures.length+')');
 failures.forEach(x=>console.error(' - '+x));
 process.exit(1);
}
console.log('Claude Step 2 calculator smoke passed.');
