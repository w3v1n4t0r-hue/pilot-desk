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

  const navigationPages=['/','/tools.html','/route-planner.html','/weather.html','/written-prep.html','/account.html'];
  const navigationWidths=[375,390,430,768,820,821,1024,1365];
  for(const route of navigationPages){
    for(const width of navigationWidths){
      await page.setViewportSize({width,height:844});
      const response=await page.goto(`${base}${route}`,{waitUntil:'domcontentloaded',timeout:30000});
      check(response?.ok(),`navigation QA route ${route} failed at ${width}px (${response?.status()||'no response'})`);
      try{
        await page.waitForFunction(()=>document.querySelectorAll('header.topbar nav.pd-main-nav [data-pd-nav-item]').length===4,{timeout:15000});
        const initial=await page.evaluate(()=>{
          const nav=document.querySelector('header.topbar nav.pd-main-nav');
          const menu=document.querySelector('header.topbar [data-menu]');
          const account=document.querySelector('header.topbar .pd-account-link');
          const accountText=account?.querySelector('.pd-account-text');
          const accountAvatar=account?.querySelector('.pd-account-avatar');
          const accountRect=account?.getBoundingClientRect();
          const textVisible=!!accountText&&getComputedStyle(accountText).display!=='none'&&accountText.getBoundingClientRect().width>0&&accountText.textContent.trim().length>0;
          const avatarVisible=!!accountAvatar&&!accountAvatar.hidden&&getComputedStyle(accountAvatar).display!=='none'&&accountAvatar.getBoundingClientRect().width>0;
          const accountVisible=!!account&&getComputedStyle(account).display!=='none'&&getComputedStyle(account).visibility!=='hidden'&&accountRect.width>=42&&accountRect.height>=42&&(textVisible||avatarVisible);
          return {native:document.documentElement.dataset.pdAstroNative==='1',navDisplay:getComputedStyle(nav).display,navPosition:getComputedStyle(nav).position,menuDisplay:getComputedStyle(menu).display,menuExpanded:menu.getAttribute('aria-expanded'),accountVisible,navWidth:nav.getBoundingClientRect().width,viewportWidth:document.documentElement.clientWidth};
        });
        check(initial.native===(route==='/'||route==='/tools.html'),`${route} was served by the unexpected shell at ${width}px`);
        if(width<=820){
          check(initial.navDisplay==='none',`mobile navigation was visible before opening on ${route} at ${width}px`);
          check(initial.menuDisplay!=='none',`mobile menu control was hidden on ${route} at ${width}px`);
          check(initial.menuExpanded==='false',`mobile menu did not start collapsed on ${route} at ${width}px`);
          check(initial.accountVisible,`account control was hidden on ${route} at ${width}px`);
          await page.locator('header.topbar [data-menu]').click();
          await page.waitForFunction(()=>document.querySelector('header.topbar nav.pd-main-nav')?.classList.contains('open'),{timeout:5000});
          const opened=await page.evaluate(()=>{
            const nav=document.querySelector('header.topbar nav.pd-main-nav');
            const menu=document.querySelector('header.topbar [data-menu]');
            const rect=nav.getBoundingClientRect();
            return {display:getComputedStyle(nav).display,position:getComputedStyle(nav).position,left:rect.left,width:rect.width,viewportWidth:document.documentElement.clientWidth,expanded:menu.getAttribute('aria-expanded'),label:menu.getAttribute('aria-label')};
          });
          check(opened.display!=='none'&&opened.position==='fixed'&&opened.left>=0&&opened.left<=16&&opened.width>=opened.viewportWidth-34,`mobile navigation did not open as a full-width or near-full-width fixed panel on ${route} at ${width}px (${JSON.stringify(opened)})`);
          check(opened.expanded==='true'&&opened.label==='Close navigation',`mobile menu state or accessible label did not update on ${route} at ${width}px`);
          if(route==='/'&&width===375){
            const group=page.locator('header.topbar .pd-nav-item').first();
            const groupButton=group.locator('.pd-nav-button');
            await groupButton.click();
            check(await groupButton.getAttribute('aria-expanded')==='true',`navigation group failed to expand on ${width}px`);
            check(await group.locator('.pd-nav-menu').evaluate(menu=>getComputedStyle(menu).display)!=='none',`expanded navigation group did not reveal its destinations on ${width}px`);
            await groupButton.click();
            check(await groupButton.getAttribute('aria-expanded')==='false',`navigation group failed to collapse on ${width}px`);
            await groupButton.click();
          }
          await page.keyboard.press('Escape');
          const closed=await page.evaluate(()=>{
            const nav=document.querySelector('header.topbar nav.pd-main-nav');
            const menu=document.querySelector('header.topbar [data-menu]');
            const group=document.querySelector('header.topbar .pd-nav-button');
            return {open:nav.classList.contains('open'),expanded:menu.getAttribute('aria-expanded'),label:menu.getAttribute('aria-label'),groupExpanded:group.getAttribute('aria-expanded')};
          });
          check(!closed.open&&closed.expanded==='false'&&closed.label==='Open navigation'&&closed.groupExpanded==='false',`Escape did not fully close and reset the mobile navigation on ${route} at ${width}px`);
        }else{
          check(initial.navDisplay!=='none',`desktop navigation was hidden on ${route} at ${width}px`);
          check(initial.menuDisplay==='none',`mobile menu control appeared on ${route} at desktop width ${width}px`);
        }
      }catch(error){
        check(false,`navigation QA could not verify ${route} at ${width}px: ${error.message}`);
      }
    }
  }
  await page.setViewportSize({width:390,height:844});
  await page.goto(`${base}/`,{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForFunction(()=>document.querySelectorAll('header.topbar nav.pd-main-nav [data-pd-nav-item]').length===4,{timeout:15000});
  await page.locator('header.topbar [data-menu]').click();
  await page.locator('header.topbar .pd-nav-item[data-section="Weather"] .pd-nav-button').click();
  const weatherDestination=page.locator('header.topbar .pd-nav-item[data-section="Weather"] a[href="/weather.html"]');
  check(await weatherDestination.count()===1,'Weather navigation destination missing from its mobile group');
  if(await weatherDestination.count()){
    await weatherDestination.click();
    await page.waitForURL(`${base}/weather.html`,{timeout:15000});
    await page.waitForFunction(()=>document.querySelector('header.topbar [data-menu]')?.getAttribute('aria-expanded')==='false',{timeout:10000});
  }


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

  failedRequests.length=0;
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
