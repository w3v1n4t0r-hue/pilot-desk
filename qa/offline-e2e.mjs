import { chromium } from 'playwright';

const base=(process.env.PILOTDESK_BASE_URL||'http://127.0.0.1:4173').replace(/\/$/,'');
const baseOrigin=new URL(base).origin;
const coldRoute='/calculators/density-altitude/';
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({serviceWorkers:'allow'});
const failures=[];
const failedRequests=[];
const check=(ok,msg)=>{if(!ok)failures.push(msg)};

try{
  const page=await context.newPage();
  page.on('requestfailed',request=>{
    const url=new URL(request.url());
    if(url.origin!==baseOrigin) return;
    if(url.pathname.startsWith('/api/')||url.pathname.startsWith('/_vercel/')) return;
    failedRequests.push(`${url.pathname}: ${request.failure()?.errorText||'failed'}`);
  });

  const home=await page.goto(`${base}/`,{waitUntil:'load',timeout:30000});
  check(home?.ok(),`homepage failed before offline install (${home?.status()||'no response'})`);

  await page.evaluate(async()=>{
    await navigator.serviceWorker.ready;
    if(navigator.serviceWorker.controller)return;
    await new Promise((resolve,reject)=>{
      const timer=setTimeout(()=>reject(new Error('service worker did not claim the page')),30000);
      navigator.serviceWorker.addEventListener('controllerchange',()=>{clearTimeout(timer);resolve();},{once:true});
    });
  });

  const cachedBeforeVisit=await page.evaluate(async route=>{
    const names=(await caches.keys()).filter(name=>name.startsWith('pilotdesk-'));
    for(const name of names){
      const cache=await caches.open(name);
      if(await cache.match(route))return true;
    }
    return false;
  },coldRoute);
  check(cachedBeforeVisit,`${coldRoute} was not precached before its first navigation`);

  await context.setOffline(true);
  const offlinePage=await context.newPage();
  offlinePage.on('requestfailed',request=>{
    const url=new URL(request.url());
    if(url.origin!==baseOrigin) return;
    if(url.pathname.startsWith('/api/')||url.pathname.startsWith('/_vercel/')) return;
    failedRequests.push(`${url.pathname}: ${request.failure()?.errorText||'failed'}`);
  });

  const response=await offlinePage.goto(`${base}${coldRoute}`,{waitUntil:'domcontentloaded',timeout:20000});
  check(response?.ok(),`cold offline calculator navigation failed (${response?.status()||'no response'})`);
  check((await offlinePage.locator('h1').first().textContent())?.toLowerCase().includes('density altitude'),'cold offline route did not render the density altitude calculator');
  check(await offlinePage.locator('[data-calculate]').count()>0,'cold offline calculator lost its calculate control');

  await offlinePage.locator('[data-calculate]').click();
  const results=(await offlinePage.locator('.result strong').allTextContents()).map(x=>x.trim());
  check(results.length>0&&results.some(x=>x&&x!=='—'),'cold offline calculator JavaScript did not produce a result');
  check(failedRequests.length===0,`cold offline calculator had uncached same-origin requests: ${failedRequests.join(', ')}`);
}finally{
  await context.close();
  await browser.close();
}

if(failures.length){
  console.error(`Cold-offline E2E failed with ${failures.length} issue(s):`);
  failures.forEach(x=>console.error(' - '+x));
  process.exit(1);
}
console.log(`Cold-offline E2E passed: ${coldRoute} loaded and calculated without ever being manually visited online.`);
