import { chromium } from 'playwright';

const base=(process.env.PILOTDESK_BASE_URL||'https://www.pilot-desk.com').replace(/\/$/,'');
const browser=await chromium.launch({headless:true});
const desktop=await browser.newPage({viewport:{width:1365,height:900}});
const mobile=await browser.newPage({viewport:{width:390,height:844},isMobile:true});
const failures=[];
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const check=async(name,fn)=>{try{await fn();console.log('PASS',name)}catch(e){failures.push(`${name}: ${e.message}`);console.error('FAIL',name,e.message)}};

async function gotoRetry(page,path,{attempts=3,timeout=30000}={}){
  let last;
  for(let i=0;i<attempts;i++){
    try{
      const r=await page.goto(base+path,{waitUntil:'domcontentloaded',timeout});
      if(r?.ok())return r;
      last=new Error(`HTTP ${r?.status()??'no response'}`);
    }catch(e){last=e}
    await sleep(800*(i+1));
  }
  throw last||new Error(`Could not load ${path}`);
}

async function requestRetry(path,{attempts=2,timeout=15000,maxRedirects=20}={}){
  let last;
  for(let i=0;i<attempts;i++){
    try{
      const r=await desktop.request.get(base+path,{timeout,maxRedirects});
      if(r.ok())return r;
      last=new Error(`${path} returned ${r.status()}`);
    }catch(e){last=e}
    await sleep(400*(i+1));
  }
  throw last||new Error(`Request failed for ${path}`);
}

await check('homepage loads and growth search is usable',async()=>{
  await gotoRetry(desktop,'/');
  await desktop.waitForSelector('.brand',{state:'visible',timeout:12000});
  await desktop.waitForSelector('#pdUniversalSearch',{state:'visible',timeout:15000});
  await desktop.waitForSelector('[data-pd-global-search]',{state:'visible',timeout:15000});
  if(!(await desktop.locator('a[href="/weather.html"]').count()))throw new Error('Weather link missing');
  const input=desktop.locator('#pdUniversalSearch input');
  await input.fill('private pilot');
  await input.press('Enter');
  await desktop.waitForSelector('#pdSearchDialog[open]',{timeout:10000});
  if(!(await desktop.locator('#pdSearchDialog a[href="/training/private-pilot.html"]').count()))throw new Error('Private pilot search result missing');
  await desktop.locator('#pdSearchDialog button[aria-label="Close search"]').click();
});

await check('mobile navigation opens and exposes core destinations',async()=>{
  await gotoRetry(mobile,'/');
  await mobile.locator('[data-menu]').click();
  await mobile.waitForFunction(()=>document.querySelector('header.topbar nav')?.classList.contains('open'),{timeout:5000});
  for(const href of ['/planner.html','/weather.html','/guides.html']){
    if(!(await mobile.locator(`header.topbar nav a[href="${href}"]`).count()))throw new Error(`mobile nav missing ${href}`);
  }
});

await check('shared crosswind link prefills, calculates, and has one set of share controls',async()=>{
  await gotoRetry(desktop,'/calculators/crosswind/?runway=350&windDir=320&windSpeed=18');
  await desktop.waitForSelector('#windSpeed');
  await desktop.waitForTimeout(800);
  if(await desktop.locator('#runway').inputValue()!=='350')throw new Error('runway query value not applied');
  if(await desktop.locator('#windDir').inputValue()!=='320')throw new Error('wind query value not applied');
  await desktop.locator('[data-calculate]').click();
  await desktop.waitForTimeout(200);
  const out=(await desktop.locator('#out0').textContent())?.trim();
  if(!out||out==='—'||!out.includes('kt'))throw new Error('crosswind result missing');
  if(await desktop.locator('[data-pd-copy-link]').count()!==1)throw new Error('duplicate or missing copy-link control');
  if(await desktop.locator('[data-pd-share-card]').count()!==1)throw new Error('share-card control missing');
});

await check('weather API and UI both return a usable KGFK result',async()=>{
  const api=await requestRetry('/api/weather?station=KGFK',{attempts:3,timeout:20000,maxRedirects:20});
  const type=(api.headers()['content-type']||'').toLowerCase();
  if(!type.includes('json'))throw new Error(`weather API returned unexpected content type ${type||'(missing)'}`);
  const payload=await api.json().catch(()=>null);
  if(!payload||typeof payload!=='object')throw new Error('weather API did not return JSON data');
  await gotoRetry(desktop,'/weather.html');
  await desktop.locator('#station').fill('KGFK');
  await desktop.locator('#weatherForm button[type="submit"]').click();
  await desktop.waitForFunction(()=>{
    const status=document.querySelector('#weatherStatus')?.textContent||'';
    const output=document.querySelector('#weatherOutput')?.textContent||'';
    return !/Fetching|Loading/i.test(status+output)&&/KGFK|METAR|No current products/i.test(status+output);
  },{timeout:20000});
  const text=(await desktop.locator('#weatherStatus').innerText())+' '+(await desktop.locator('#weatherOutput').innerText());
  if(/Weather retrieval failed|Weather could not be loaded/i.test(text))throw new Error(text.slice(0,400));
});

await check('aircraft profile saves locally',async()=>{
  await gotoRetry(desktop,'/aircraft.html');
  await desktop.evaluate(()=>{localStorage.removeItem('pd-aircraft');localStorage.removeItem('pd-aircraft-active')});
  await desktop.reload({waitUntil:'domcontentloaded',timeout:30000});
  await desktop.waitForFunction(()=>document.querySelector('#aircraftForm')&&document.querySelector('#aircraftList'),{timeout:10000});
  await desktop.locator('[name="name"]').fill('PilotDesk E2E Test');
  await desktop.locator('[name="type"]').fill('TEST');
  await desktop.locator('[name="fuelBurn"]').fill('10');
  await desktop.locator('#aircraftForm').evaluate(form=>form.requestSubmit());
  await desktop.waitForFunction(()=>document.querySelector('#aircraftList')?.textContent?.includes('PilotDesk E2E Test'),{timeout:8000});
  const saved=await desktop.evaluate(()=>JSON.parse(localStorage.getItem('pd-aircraft')||'[]'));
  if(!Array.isArray(saved)||!saved.some(x=>x?.name==='PilotDesk E2E Test'))throw new Error('profile did not persist in localStorage');
});

await check('weight and balance builder renders and calculates',async()=>{
  await gotoRetry(desktop,'/calculators/weight-balance-builder/',{attempts:3,timeout:30000});
  await desktop.waitForSelector('#wbRows',{timeout:12000});
  await desktop.waitForFunction(()=>document.querySelectorAll('.wb-data').length>0,{timeout:10000});
  await desktop.waitForFunction(()=>{
    const t=document.querySelector('#wbW')?.textContent?.trim();
    return t&&t!=='—';
  },{timeout:10000});
});

await check('every canonical sitemap URL is live and structurally usable',async()=>{
  const mapResponse=await requestRetry('/sitemap.xml');
  const xml=await mapResponse.text();
  const urls=[...xml.matchAll(/<loc>(https:\/\/www\.pilot-desk\.com[^<]+)<\/loc>/g)].map(m=>m[1].replaceAll('&amp;','&'));
  if(urls.length<160)throw new Error(`only ${urls.length} canonical URLs found`);
  if(new Set(urls).size!==urls.length)throw new Error('duplicate canonical URLs in sitemap');
  if(urls.some(u=>u.includes('pilot-seo-priority')))throw new Error('retired SEO-named guide remains in sitemap');
  if(!urls.includes(base+'/guides/popular-aviation-tools.html'))throw new Error('popular aviation tools page missing from sitemap');
  const issues=[];
  const inspect=async url=>{
    let r,last;
    for(let n=0;n<2;n++){
      try{r=await desktop.request.get(url,{timeout:12000,maxRedirects:20});if(r.ok())break;last=new Error(`HTTP ${r.status()}`)}catch(e){last=e}
      await sleep(250*(n+1));
    }
    if(!r?.ok()){issues.push(`${url} ${last?.message||'request failed'}`);return}
    const body=await r.text();
    if(body.length<80){issues.push(`${url} returned an unexpectedly small body`);return}
    const type=(r.headers()['content-type']||'').toLowerCase();
    if(type.includes('text/html')){
      if(!/<title>[^<]+<\/title>/i.test(body))issues.push(`${url} missing title`);
      if(!/<h1(?:\s|>)/i.test(body))issues.push(`${url} missing H1`);
      const canonical=(body.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i)||body.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["']canonical["']/i)||[])[1];
      if(!canonical||!canonical.startsWith(base+'/'))issues.push(`${url} missing valid PilotDesk canonical`);
    }
  };
  const concurrency=18;
  for(let i=0;i<urls.length;i+=concurrency)await Promise.all(urls.slice(i,i+concurrency).map(inspect));
  if(issues.length)throw new Error(`${issues.length} crawl issue(s): ${issues.slice(0,12).join(' | ')}`);
  console.log(`Checked ${urls.length} canonical production URLs.`);
});

await check('training, long-tail guides, sources, privacy and sitemaps are live',async()=>{
  const paths=['/flight-training.html','/training/private-pilot.html','/training/instrument-rating.html','/training/commercial-pilot.html','/training/multiengine.html','/training/cfi.html','/guides/crosswind-component-chart.html','/guides/avgas-weight-per-gallon.html','/guides/three-degree-descent-rate-chart.html','/guides/cessna-172-glide-distance.html','/guides/seminole-vmc-study.html','/guides/popular-aviation-tools.html','/sources.html','/legal/privacy.html','/sitemap.xml','/sitemap-growth.xml','/sitemap-retention.xml'];
  for(let i=0;i<paths.length;i+=8)await Promise.all(paths.slice(i,i+8).map(p=>requestRetry(p)));
});

await check('retired SEO-named guide permanently redirects to the public guide',async()=>{
  const r=await desktop.request.get(base+'/guides/pilot-seo-priority.html',{timeout:15000,maxRedirects:0});
  if(![301,308].includes(r.status()))throw new Error(`expected permanent redirect, got HTTP ${r.status()}`);
  const location=r.headers()['location']||'';
  if(!location.includes('/guides/popular-aviation-tools.html'))throw new Error(`unexpected redirect location: ${location||'(missing)'}`);
});

await check('popular aviation tools page has a self canonical',async()=>{
  const r=await requestRetry('/guides/popular-aviation-tools.html');
  const body=await r.text();
  if(!body.includes('<link rel="canonical" href="https://www.pilot-desk.com/guides/popular-aviation-tools.html"')&&!body.includes('<link href="https://www.pilot-desk.com/guides/popular-aviation-tools.html" rel="canonical"'))throw new Error('self canonical missing');
  if(!/Popular Aviation Calculators &amp; Pilot References|Popular Aviation Calculators & Pilot References/.test(body))throw new Error('unexpected H1');
});

await browser.close();
if(failures.length){
  console.error(`\n${failures.length} live E2E failure(s):`);
  failures.forEach(x=>console.error(' - '+x));
  process.exit(1);
}
console.log('\nPilotDesk live production E2E checks passed.');
