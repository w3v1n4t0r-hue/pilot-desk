import fs from 'node:fs';

const failures=[];
const check=(ok,msg)=>{if(!ok)failures.push(msg)};
const size=p=>fs.statSync(p).size;
const kb=n=>`${(n/1024).toFixed(1)} KB`;

const budgets={
  'assets/app-bootstrap.js':8*1024,
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
for(const eager of ['navigation-data.js','flight-store.js','global-nav.js','theme.js','errors.js','analytics.js','update.js'])check(bootstrap.includes(`/assets/${eager}`),`${eager} must remain in the small shared enhancement bootstrap`);
for(const conditional of [
  ["if(calc)",'features.js'],["if(calc)",'calculator-ux.js'],["path==='/weather.html'",'offline-weather.js'],["path==='/route-planner.html'",'planner-pro.js'],["path==='/procedures.html'",'procedure-pro.js'],["path==='/checklist-trainer.html'",'trainer-pro.js']
])check(bootstrap.includes(conditional[0])&&bootstrap.includes(`/assets/${conditional[1]}`),`${conditional[1]} should remain route-scoped`);
for(const retired of ['professional-polish.css','tool-first-layout.js','product-polish.js','sticky-app.js','avionics-command.js'])check(!bootstrap.includes(`/assets/${retired}`),`retired visible-shell layer returned: ${retired}`);
check(bootstrap.includes('requestIdleCallback')&&bootstrap.includes('timeout:1500'),'service-worker registration should happen after load/idle without a 12-second delay');

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
