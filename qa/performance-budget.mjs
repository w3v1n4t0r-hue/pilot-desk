import fs from 'node:fs';

const failures=[];
const check=(ok,msg)=>{if(!ok)failures.push(msg)};
const size=p=>fs.statSync(p).size;
const kb=n=>`${(n/1024).toFixed(1)} KB`;

const budgets={
  'assets/app-bootstrap.js':8*1024,
  'assets/navigation-core.js':8*1024,
  'assets/navigation-search.js':24*1024,
  'assets/search-intelligence.js':12*1024,
  'assets/flight-journey.js':12*1024,
  'assets/inventory-data.js':24*1024,
  'assets/experience.js':24*1024,
  'assets/experience.css':40*1024,
  'assets/design-tokens.css':8*1024,
  'assets/pilotdesk-plus.js':40*1024,
  'sw.js':24*1024,
  'scripts/prepare-astro-public.mjs':12*1024,
  'src/pages/index.astro':16*1024,
  'calculators/crosswind/index.html':60*1024
};

for(const [file,max] of Object.entries(budgets)){
  check(fs.existsSync(file),`${file} is missing`);
  if(!fs.existsSync(file))continue;
  const actual=size(file);
  check(actual<=max,`${file} is ${kb(actual)}; budget is ${kb(max)}`);
}

const bootstrap=fs.readFileSync('assets/app-bootstrap.js','utf8');
check(!bootstrap.includes('visibility:hidden')&&!bootstrap.includes('pd-ui-booting'),'static content must not wait behind a JavaScript boot gate');
for(const eager of ['navigation-core.js','global-nav.js','theme.js','errors.js','analytics.js','update.js'])check(bootstrap.includes(`/assets/${eager}`),`${eager} must remain in the small shared enhancement bootstrap`);
check(!bootstrap.includes('/assets/navigation-data.js'),'full navigation/search/inventory payload must not load on every page');
check(!bootstrap.includes('/assets/flight-store.js'),'flight-store must stay on the planning pages that explicitly need it');
const globalNav=fs.readFileSync('assets/global-nav.js','utf8');
check(globalNav.includes('/assets/navigation-search.js')&&globalNav.includes('/assets/search-intelligence.js')&&globalNav.includes('ensureSearchData'),'site search data and intent intelligence must lazy-load only after search interaction');
check(globalNav.includes('scheduleAccountHydration')&&globalNav.includes('requestIdleCallback'),'account-session hydration should stay off the critical render path');
const site=fs.readFileSync('assets/site.js','utf8');
check(site.includes("(hover:hover) and (pointer:fine)")&&site.includes('if(finePointer)'), 'touch devices should not pay for decorative pointer tracking');
const toolsDirectory=fs.readFileSync('assets/tools-directory.js','utf8');
check(toolsDirectory.includes('/assets/inventory-data.js')&&!toolsDirectory.includes("s.src='/assets/navigation-data.js'"),'tools directory should load only inventory data, not the full navigation payload');
for(const conditional of [
  ["if(calc)",'features.js'],["if(calc)",'calculator-ux.js'],["path==='/weather.html'",'offline-weather.js'],["path==='/route-planner.html'",'planner-pro.js'],["path==='/procedures.html'",'procedure-pro.js'],["path==='/checklist-trainer.html'",'trainer-pro.js']
])check(bootstrap.includes(conditional[0])&&bootstrap.includes(`/assets/${conditional[1]}`),`${conditional[1]} should remain route-scoped`);
check(bootstrap.includes('/assets/flight-journey.js')&&bootstrap.includes("'/flight-brief.html'"),'flight journey should remain scoped to planning pages');
for(const retired of ['professional-polish.css','tool-first-layout.js','product-polish.js','sticky-app.js','avionics-command.js'])check(!bootstrap.includes(`/assets/${retired}`),`retired visible-shell layer returned: ${retired}`);
check(bootstrap.includes('requestIdleCallback')&&bootstrap.includes('timeout:1500'),'service-worker registration should happen after load/idle without a 12-second delay');
const sw=fs.readFileSync('sw.js','utf8');
check(sw.includes("CACHE='pilotdesk-v40'"),'performance release must advance the service-worker cache version');
for(const retired of ['home-command-center.js','sticky-app.js','growth-suite.js','avionics-command.js','context-widget.js'])check(!sw.includes(`'/assets/${retired}'`),`service-worker precache must not fetch retired runtime: ${retired}`);
check(sw.includes("'/assets/navigation-core.js'")&&!sw.includes("'/assets/navigation-data.js'"),'offline calculator shell should cache the light navigation core, not the full navigation payload');

const vercel=JSON.parse(fs.readFileSync('vercel.json','utf8'));
check(vercel.ignoreCommand==='bash scripts/vercel-ignore-build.sh','Vercel ignored-build step must protect deployment quota');
const htmlHeaders=(vercel.headers||[]).filter(x=>x.source==='/'||String(x.source).includes('html'));
check(htmlHeaders.some(x=>(x.headers||[]).some(h=>h.key==='Cache-Control'&&h.value.includes('must-revalidate'))),'HTML should revalidate so new releases appear immediately');

if(failures.length){
  console.error(`Performance budget failed with ${failures.length} issue(s):`);
  failures.forEach(x=>console.error(' - '+x));
  process.exit(1);
}
console.log('Performance budget passed: the shared runtime stays small, expensive modules remain route-scoped, static content is immediately visible, and deployment/cache discipline is intact.');
