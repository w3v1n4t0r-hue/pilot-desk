import fs from 'node:fs';

const read=p=>fs.readFileSync(p,'utf8');
const failures=[];
const check=(ok,msg)=>{if(!ok)failures.push(msg)};

const bootstrap=read('assets/app-bootstrap.js');
const safety=read('assets/safety.js');
const productNav=read('assets/product-nav.js');
const manifest=JSON.parse(read('site.webmanifest'));
const sw=read('sw.js');

check(bootstrap.includes("window.__pilotDeskAppBootstrap"),'app bootstrap needs an idempotency guard');
for(const asset of ['analytics.js','errors.js','product-polish.js','runtime-qol.js','pilotdesk-plus.js','update.js']){
  check(bootstrap.includes(`/assets/${asset}`),`app bootstrap is missing ${asset}`);
}
check(safety.includes('/assets/app-bootstrap.js'),'calculator/home path must load app bootstrap without ads.js');
check(productNav.includes('/assets/app-bootstrap.js'),'workspace path must load app bootstrap without ads.js');
check(bootstrap.includes("Quick Start")&&bootstrap.includes('data-pd-launch'),'homepage quick-start conversion surface is missing');
check(!bootstrap.includes('search.value.trim()')||!bootstrap.includes("query:search.value"),'homepage analytics must not send search text');

const wb=(manifest.shortcuts||[]).find(x=>x.short_name==='W&B'||x.name==='Weight & Balance');
check(wb?.url==='/weight-balance.html','installed-app Weight & Balance shortcut must use the canonical tool URL');
check(sw.includes("'/assets/app-bootstrap.js'"),'service worker must cache app-bootstrap.js');
check(sw.includes("CACHE='pilotdesk-v21'"),'service worker cache version should match the hardening release');
check(!sw.includes("fetch('/sitemap.xml'"),'service-worker install should not crawl the whole sitemap');

if(failures.length){
  console.error(`App bootstrap checks failed with ${failures.length} issue(s):`);
  failures.forEach(x=>console.error(' - '+x));
  process.exit(1);
}
console.log('App bootstrap checks passed: ad-independent features, quick start, analytics privacy, install shortcut, and offline cache verified.');
