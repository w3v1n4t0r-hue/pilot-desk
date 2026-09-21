importScripts('/assets/offline-precache.js');

const CACHE='pilotdesk-v41';
const GENERATED_CALCULATORS=Array.isArray(self.PILOTDESK_OFFLINE_CALCULATORS)?self.PILOTDESK_OFFLINE_CALCULATORS:[];
const GENERATED_ASSETS=Array.isArray(self.PILOTDESK_OFFLINE_ASSETS)?self.PILOTDESK_OFFLINE_ASSETS:[];
const CORE=[...new Set([
  '/','/index.html','/offline.html','/404.html','/tools.html',
  ...GENERATED_CALCULATORS,
  '/assets/styles.css','/assets/styles-legacy.css','/assets/hub.css','/assets/experience.css','/assets/consistency.css','/assets/visual-system.css','/assets/design-tokens.css',
  '/assets/site.js','/assets/safety.js','/assets/app-bootstrap.js','/assets/home-desk.js','/assets/home-desk.css','/assets/navigation-core.js','/assets/global-nav.js','/assets/theme.js','/assets/features.js','/assets/calculator-ux.js','/assets/crosswind-mfd.js','/assets/pilotdesk-plus.js','/assets/experience.js','/assets/errors.js','/assets/analytics.js','/assets/update.js','/assets/ad-config.js','/assets/ads.js','/assets/share-enhance.js','/assets/inventory-data.js',
  ...GENERATED_ASSETS,
  '/assets/icon.svg','/assets/hero-flightline.svg','/site.webmanifest'
])];
const CORE_PATHS=new Set(CORE);
const MAX_RUNTIME_ENTRIES=140;
const NETWORK_FIRST_ASSETS=new Set([
  '/assets/app-bootstrap.js','/assets/navigation-core.js','/assets/navigation-search.js','/assets/inventory-data.js','/assets/global-nav.js','/assets/icon.svg',
  '/assets/styles.css','/assets/styles-legacy.css','/assets/hub.css','/assets/experience.css','/assets/consistency.css','/assets/design-tokens.css',
  '/assets/analytics.js','/assets/share-enhance.js','/assets/page-share.js'
]);
const cacheable=r=>r&&r.ok&&(r.type==='basic'||r.type==='default');
const pathOf=req=>{try{return new URL(typeof req==='string'?req:req.url,self.location.origin).pathname}catch{return String(req||'')}};
const keyFor=req=>{if(typeof req==='string')return req;const u=new URL(req.url);if(req.mode==='navigate'){u.search='';u.hash='';return u.pathname}return req};
const networkOnlyPath=pathname=>pathname.startsWith('/api/')||pathname.startsWith('/_vercel/');

async function trim(cache){
  const keys=await cache.keys();
  const runtime=keys.filter(req=>!CORE_PATHS.has(new URL(req.url).pathname));
  const overflow=runtime.length-MAX_RUNTIME_ENTRIES;
  if(overflow>0) await Promise.all(runtime.slice(0,overflow).map(req=>cache.delete(req)));
}

async function put(cache,req,res){
  if(cacheable(res)){
    await cache.put(keyFor(req),res.clone());
    if(!CORE_PATHS.has(pathOf(req))) trim(cache).catch(()=>{});
  }
  return res;
}

async function match(cache,req){
  return (await cache.match(keyFor(req)))||(await cache.match(pathOf(req)));
}

async function precache(){
  const cache=await caches.open(CACHE);
  await Promise.allSettled(CORE.map(async url=>{
    try{
      const res=await fetch(url,{cache:'reload'});
      if(cacheable(res)) await cache.put(url,res);
    }catch{}
  }));
}

async function migrateCalculatorEntries(cache,oldCacheNames){
  for(const cacheName of oldCacheNames){
    const oldCache=await caches.open(cacheName);
    for(const request of await oldCache.keys()){
      const pathname=new URL(request.url).pathname;
      if(!pathname.startsWith('/calculators/')) continue;
      if(await cache.match(pathname)) continue;
      const response=await oldCache.match(request);
      if(cacheable(response)) await cache.put(pathname,response.clone());
    }
  }
}

/* New workers wait. PilotDesk only switches versions after the user explicitly accepts the update,
   so an open page can never jump into a new shell halfway through a session. */
self.addEventListener('install',event=>event.waitUntil(precache()));
self.addEventListener('message',event=>{if(event.data?.type==='SKIP_WAITING')self.skipWaiting()});
self.addEventListener('activate',event=>event.waitUntil((async()=>{
  const keys=await caches.keys();
  const oldPilotDeskCaches=keys.filter(k=>k.startsWith('pilotdesk-')&&k!==CACHE);
  const current=await caches.open(CACHE);
  await migrateCalculatorEntries(current,oldPilotDeskCaches);
  await Promise.all(oldPilotDeskCaches.map(k=>caches.delete(k)));
  if(self.registration.navigationPreload) await self.registration.navigationPreload.enable().catch(()=>{});
  await self.clients.claim();
})()));

async function networkFirst(req,preloadPromise){
  const cache=await caches.open(CACHE);
  try{
    if(preloadPromise){
      const pre=await preloadPromise.catch(()=>null);
      if(cacheable(pre)) return put(cache,req,pre);
    }
    const res=await fetch(req,{cache:'no-store'});
    return put(cache,req,res);
  }catch{
    return (await match(cache,req))||(await cache.match('/offline.html'))||(await cache.match('/index.html'));
  }
}

async function staleWhileRevalidate(event,req){
  const cache=await caches.open(CACHE),hit=await match(cache,req);
  const fresh=fetch(req).then(r=>put(cache,req,r)).catch(()=>null);
  if(hit){
    event.waitUntil(fresh.then(()=>{}));
    return hit;
  }
  return (await fresh)||Response.error();
}

async function cacheFirst(req){
  const cache=await caches.open(CACHE),hit=await match(cache,req);
  if(hit) return hit;
  try{return put(cache,req,await fetch(req))}catch{return Response.error()}
}

self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.method!=='GET') return;
  const url=new URL(req.url);
  if(url.origin!==self.location.origin) return;
  if(networkOnlyPath(url.pathname)) return;
  if(req.mode==='navigate'){
    event.respondWith(networkFirst(req,event.preloadResponse));
    return;
  }
  if(NETWORK_FIRST_ASSETS.has(url.pathname)){
    event.respondWith(networkFirst(req));
    return;
  }
  if(/\.(?:js|css|svg|png|jpg|jpeg|webp|woff2?)$/i.test(url.pathname)){
    event.respondWith(staleWhileRevalidate(event,req));
    return;
  }
  event.respondWith(cacheFirst(req));
});
