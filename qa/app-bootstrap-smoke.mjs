import fs from 'node:fs';

const read=p=>fs.readFileSync(p,'utf8');
const failures=[];
const check=(ok,msg)=>{if(!ok)failures.push(msg)};

const bootstrap=read('assets/app-bootstrap.js');
const ads=read('assets/ads.js');
const safety=read('assets/safety.js');
const productNav=read('assets/product-nav.js');
const manifest=JSON.parse(read('site.webmanifest'));
const sw=read('sw.js');

check(bootstrap.includes("window.__pilotDeskAppBootstrap"),'app bootstrap needs an idempotency guard');
for(const asset of ['analytics.js','errors.js','seo.js','product-polish.js','runtime-qol.js','pilotdesk-plus.js','sticky-app.js','update.js']){
  check(bootstrap.includes(`/assets/${asset}`),`app bootstrap is missing ${asset}`);
  check(!ads.includes(`/assets/${asset}`),`ads.js still owns non-ad module ${asset}`);
}
check(safety.includes('/assets/app-bootstrap.js'),'calculator/home path must load app bootstrap without ads.js');
check(productNav.includes('/assets/app-bootstrap.js'),'workspace path must load app bootstrap without ads.js');
check(bootstrap.includes("Quick Start")&&bootstrap.includes('data-pd-launch'),'homepage quick-start conversion surface is missing');
check(!bootstrap.includes("query:search.value"),'homepage analytics must not send search text');

const wb=(manifest.shortcuts||[]).find(x=>x.short_name==='W&B'||x.name==='Weight & Balance');
const flightMath=(manifest.shortcuts||[]).find(x=>x.short_name==='Flight Math');
check(wb?.url==='/weight-balance.html','installed-app Weight & Balance shortcut must use the canonical tool URL');
check(flightMath?.url==='/flight-planning-workspace.html','installed app must expose the connected flight-planning workspace');
check(manifest.launch_handler?.client_mode==='navigate-existing','installed app should reuse an existing app window where supported');
check(sw.includes("'/assets/app-bootstrap.js'"),'service worker must cache app-bootstrap.js');
check(sw.includes("'/assets/sticky-app.js'"),'service worker must cache sticky-app.js');
check(sw.includes("CACHE='pilotdesk-v22'"),'service worker cache version should match the sticky-app release');
check(sw.includes("'/offline.html'"),'service worker must cache a dedicated offline fallback');
check(sw.includes('Promise.allSettled'),'precache should tolerate a single optional asset failure');
check(!sw.includes("fetch('/sitemap.xml'"),'service-worker install should not crawl the whole sitemap');

if(failures.length){
  console.error(`App bootstrap checks failed with ${failures.length} issue(s):`);
  failures.forEach(x=>console.error(' - '+x));
  process.exit(1);
}
console.log('App bootstrap checks passed: ad-independent features, sticky app shell, PWA shortcuts, resilient offline cache, and analytics privacy verified.');
