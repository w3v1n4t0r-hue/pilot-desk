const CACHE='pilotdesk-v8';
const CORE=['/','/index.html','/about.html','/weather.html','/aircraft.html','/assets/styles.css','/assets/site.js','/assets/ad-config.js','/assets/ads.js','/assets/analytics.js','/assets/features.js','/assets/brand.js','/assets/share-enhance.js','/assets/aircraft-transfer.js','/assets/update.js','/assets/errors.js','/assets/icon.svg','/site.webmanifest'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)))});
self.addEventListener('message',event=>{if(event.data?.type==='SKIP_WAITING')self.skipWaiting()});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',event=>{
  const req=event.request;if(req.method!=='GET')return;const url=new URL(req.url);if(url.origin!==self.location.origin)return;if(url.pathname.startsWith('/api/')||url.pathname.startsWith('/_vercel/'))return;
  if(req.mode==='navigate'){event.respondWith(fetch(req).then(res=>{const copy=res.clone();caches.open(CACHE).then(cache=>cache.put(req,copy));return res}).catch(()=>caches.match(req).then(hit=>hit||caches.match('/index.html'))));return}
  event.respondWith(caches.match(req).then(hit=>{const network=fetch(req).then(res=>{if(res.ok){const copy=res.clone();caches.open(CACHE).then(cache=>cache.put(req,copy))}return res}).catch(()=>hit);return hit||network}))
});
