import fs from 'node:fs';

const failures=[];
const check=(ok,msg)=>{if(!ok)failures.push(msg)};
const size=p=>fs.statSync(p).size;
const kb=n=>`${(n/1024).toFixed(1)} KB`;

const budgets={
  'assets/app-bootstrap.js':12*1024,
  'assets/performance.js':6*1024,
  'assets/tool-first-layout.js':16*1024,
  'assets/sticky-app.js':30*1024,
  'assets/pilotdesk-plus.js':40*1024,
  'assets/professional-polish.css':40*1024,
  'assets/performance.css':12*1024,
  'assets/styles.css':70*1024,
  'index.html':80*1024,
  'calculators/crosswind/index.html':60*1024
};

for(const [file,max] of Object.entries(budgets)){
  check(fs.existsSync(file),`${file} is missing`);
  if(!fs.existsSync(file))continue;
  const actual=size(file);
  check(actual<=max,`${file} is ${kb(actual)}; budget is ${kb(max)}`);
}

const bootstrap=fs.readFileSync('assets/app-bootstrap.js','utf8');
/* Network/analytics/product extras that do not define the visible shell stay deferred. */
for(const deferred of ['seo.js','errors.js','analytics.js','pilotdesk-plus.js','update.js']){
  check(bootstrap.includes(`deferLoad('/assets/${deferred}'`),`${deferred} should stay off the first-paint path`);
}
/* Anything that visibly rearranges or restyles the shell must settle behind the boot gate,
   otherwise the page paints an obsolete intermediate version and visibly changes afterward. */
for(const eager of ['global-nav.js','brand.js','theme.js','performance.js','tool-first-layout.js','product-polish.js','runtime-qol.js']){
  check(bootstrap.includes(`/assets/${eager}`),`${eager} should be owned by the guarded visible-shell boot`);
}
check(bootstrap.includes('pd-ui-booting')&&bootstrap.includes('Promise.allSettled(jobs)'),'visible-shell work must remain behind the flash-prevention boot gate');

const vercel=JSON.parse(fs.readFileSync('vercel.json','utf8'));
check(vercel.ignoreCommand==='bash scripts/vercel-ignore-build.sh','Vercel ignored-build step must protect deployment quota');
const htmlHeaders=(vercel.headers||[]).filter(x=>x.source==='/'||String(x.source).includes('html'));
check(htmlHeaders.some(x=>(x.headers||[]).some(h=>h.key==='Cache-Control'&&h.value.includes('must-revalidate'))),'HTML should revalidate so new releases appear immediately');

if(failures.length){
  console.error(`Performance budget failed with ${failures.length} issue(s):`);
  failures.forEach(x=>console.error(' - '+x));
  process.exit(1);
}
console.log('Performance budget passed: assets remain bounded, nonvisual work stays deferred, visible mutations settle before reveal, HTML revalidates, and deployment quota protection is configured.');
