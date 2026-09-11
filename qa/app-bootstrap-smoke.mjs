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
for(const asset of ['analytics.js','errors.js','seo.js','product-polish.js','runtime-qol.js','pilotdesk-plus.js','sticky-app.js','update.js','performance.js','tool-first-layout.js']){
  check(bootstrap.includes(`/assets/${asset}`),`app bootstrap is missing ${asset}`);
  check(!ads.includes(`/assets/${asset}`),`ads.js still owns non-ad module ${asset}`);
}
check(bootstrap.includes("loadStyle('/assets/professional-polish.css','pd-professional-polish')"),'professional visual layer must load from the ad-independent bootstrap');
check(bootstrap.includes("loadStyle('/assets/performance.css','pd-performance-css')"),'performance layer must load from the ad-independent bootstrap');
check(bootstrap.includes('deferLoad'),'non-critical modules should be deferred off the first-paint path');
check(bootstrap.includes('__pdTrackQueue'),'deferred analytics must preserve early product events');
check(!ads.includes('professional-polish.css')&&!ads.includes('performance.css'),'visual/performance layers must not depend on ads.js');
check(safety.includes('/assets/app-bootstrap.js'),'calculator/home path must load app bootstrap without ads.js');
check(productNav.includes('/assets/app-bootstrap.js'),'workspace path must load app bootstrap without ads.js');
check(bootstrap.includes("Quick Start")&&bootstrap.includes('data-pd-launch'),'homepage quick-start conversion surface is missing');
check(!bootstrap.includes("query:search.value"),'homepage analytics must not send search text');

const wb=(manifest.shortcuts||[]).find(x=>x.short_name==='W&B'||x.name==='Weight & Balance');
const flightMath=(manifest.shortcuts||[]).find(x=>x.short_name==='Flight Math');
check(wb?.url==='/weight-balance.html','installed-app Weight & Balance shortcut must use the canonical tool URL');
check(flightMath?.url==='/flight-planning-workspace.html','installed app must expose the connected flight-planning workspace');
check(manifest.launch_handler?.client_mode==='navigate-existing','installed app should reuse an existing app window where supported');
for(const asset of ['/assets/app-bootstrap.js','/assets/sticky-app.js','/assets/professional-polish.css','/assets/performance.css','/assets/performance.js','/assets/tool-first-layout.js'])check(sw.includes(`'${asset}'`),`service worker must cache ${asset}`);
check(sw.includes("CACHE='pilotdesk-v24'"),'service worker cache version should match the optimization release');
check(sw.includes("'/offline.html'"),'service worker must cache a dedicated offline fallback');
check(sw.includes('Promise.allSettled'),'precache should tolerate a single optional asset failure');
check(!sw.includes("fetch('/sitemap.xml'"),'service-worker install should not crawl the whole sitemap');

if(failures.length){
  console.error(`App bootstrap checks failed with ${failures.length} issue(s):`);
  failures.forEach(x=>console.error(' - '+x));
  process.exit(1);
}
console.log('App bootstrap checks passed: ad-independent features, deferred non-critical work, tool-first layout, PWA cache, and analytics privacy verified.');
