const CACHE='pilotdesk-v25';
const CORE=[
  '/','/index.html','/offline.html','/404.html','/planner.html','/airport.html','/weather.html','/flight-planning-workspace.html','/weight-balance.html','/history.html',
  '/calculators/crosswind/','/calculators/time-speed-distance/','/calculators/fuel-required/','/calculators/top-of-descent/',
  '/assets/styles.css','/assets/professional-polish.css','/assets/performance.css','/assets/weather.css','/assets/wb-v2.css','/assets/planner-suite.css',
  '/assets/site.js','/assets/app-bootstrap.js','/assets/performance.js','/assets/tool-first-layout.js','/assets/sticky-app.js','/assets/flight-workspace.js','/assets/product-nav.js',
  '/assets/safety.js','/assets/global-nav.js','/assets/brand.js','/assets/theme.js','/assets/features.js','/assets/share-enhance.js','/assets/calculator-ux.js','/assets/offline-weather.js',
  '/assets/icon.svg','/site.webmanifest'
];
const CORE_PATHS=new Set(CORE);
const MAX_RUNTIME_ENTRIES=120;
const NETWORK_FIRST_ASSETS=new Set([
  '/assets/app-bootstrap.js','/assets/tool-first-layout.js','/assets/performance.js','/assets/sticky-app.js','/assets/weather-fixed.js','/assets/weather-extra.js',
  '/assets/product-nav.js','/assets/airport.js','/assets/flights.js','/assets/flight-brief.js','/assets/route-save.js','/assets/aircraft-v2.js'
]);
const cacheable=r=>r&&r.ok&&(r.type==='basic'||r.type==='default');
const pathOf=req=>{try{return new URL(typeof req==='string'?req:req.url,self.location.origin).pathname}catch{return String(req||'')}};
const keyFor=req=>{if(typeof req==='string')return req;const u=new URL(req.url);if(req.mode==='navigate'){u.search='';u.hash='';return u.pathname}return req};
async function trim(cache){
  const keys=await cache.keys();
  const runtime=keys.filter(req=>!CORE_PATHS.has(new URL(req.url).pathname));
  const overflow=runtime.length-MAX_RUNTIME_ENTRIES;
  if(overflow>0)await Promise.all(runtime.slice(0,overflow).map(req=>cache.delete(req)));
}
async function put(cache,req,res){
  if(cacheable(res)){
    await cache.put(keyFor(req),res.clone());
    if(!CORE_PATHS.has(pathOf(req)))trim(cache).catch(()=>{});
  }
  return res;
}
async function match(cache,req){return (await cache.match(keyFor(req)))||(await cache.match(pathOf(req)))}
async function precache(){
  const cache=await caches.open(CACHE);
  await Promise.allSettled(CORE.map(async url=>{try{const res=await fetch(url,{cache:'reload'});if(cacheable(res))await cache.put(url,res)}catch{}}));
}
self.addEventListener('install',e=>e.waitUntil((async()=>{await precache();await self.skipWaiting()})()));
self.addEventListener('message',e=>{if(e.data?.type==='SKIP_WAITING')self.skipWaiting()});
self.addEventListener('activate',e=>e.waitUntil((async()=>{
  const keys=await caches.keys();
  await Promise.all(keys.filter(k=>k.startsWith('pilotdesk-')&&k!==CACHE).map(k=>caches.delete(k)));
  if(self.registration.navigationPreload)await self.registration.navigationPreload.enable().catch(()=>{});
  await self.clients.claim();
})()));
async function networkFirst(req,preloadPromise){
  const cache=await caches.open(CACHE);
  try{
    if(preloadPromise){const pre=await preloadPromise.catch(()=>null);if(cacheable(pre))return put(cache,req,pre)}
    const res=await fetch(req,{cache:'no-store'});
    return put(cache,req,res);
  }catch{
    return (await match(cache,req))||(await cache.match('/offline.html'))||(await cache.match('/index.html'));
  }
}
async function staleWhileRevalidate(event,req){
  const cache=await caches.open(CACHE),hit=await match(cache,req);
  const fresh=fetch(req).then(r=>put(cache,req,r)).catch(()=>null);
  if(hit){event.waitUntil(fresh.then(()=>{}));return hit}
  return (await fresh)||Response.error();
}
async function cacheFirst(req){
  const cache=await caches.open(CACHE),hit=await match(cache,req);
  if(hit)return hit;
  try{return put(cache,req,await fetch(req))}catch{return Response.error()}
}
self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.method!=='GET')return;
  const url=new URL(req.url);
  if(url.origin!==self.location.origin)return;
  if(url.pathname.startsWith('/api/')||url.pathname.startsWith('/_vercel/'))return;
  if(req.mode==='navigate'){event.respondWith(networkFirst(req,event.preloadResponse));return}
  if(NETWORK_FIRST_ASSETS.has(url.pathname)){event.respondWith(networkFirst(req));return}
  if(/\.(?:js|css|svg|png|jpg|jpeg|webp|woff2?)$/i.test(url.pathname)){event.respondWith(staleWhileRevalidate(event,req));return}
  event.respondWith(cacheFirst(req));
});
