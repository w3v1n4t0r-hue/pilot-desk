import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
const {chromium}=createRequire(import.meta.url)(process.env.PILOTDESK_PLAYWRIGHT||'playwright');

const base=(process.env.PILOTDESK_BASE_URL||'https://www.pilot-desk.com').replace(/\/$/,'');
const browser=await chromium.launch({headless:true,...(process.env.PILOTDESK_BROWSER_PATH?{executablePath:process.env.PILOTDESK_BROWSER_PATH}:{})});
const hardTimeout=setTimeout(()=>{console.error('Live E2E exceeded its ten-minute deadline.');process.exit(1)},600000);
hardTimeout.unref();
const makeDesktop=async()=>{const p=await browser.newPage({viewport:{width:1365,height:900}});p.setDefaultTimeout(15000);p.setDefaultNavigationTimeout(30000);return p};
let desktop=await makeDesktop();
const mobile=await browser.newPage({viewport:{width:390,height:844},isMobile:true});
mobile.setDefaultTimeout(15000);mobile.setDefaultNavigationTimeout(30000);
const failures=[];
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const check=async(name,fn)=>{if(process.env.PILOTDESK_E2E_MATCH&&!new RegExp(process.env.PILOTDESK_E2E_MATCH).test(name))return;try{await fn();console.log('PASS',name)}catch(e){failures.push(`${name}: ${e.message}`);console.error('FAIL',name,e.message)}};

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

await check('homepage search finds and opens the private pilot study hub',async()=>{
  await gotoRetry(desktop,'/');
  await desktop.waitForSelector('.brand',{state:'visible',timeout:12000});
  const input=desktop.getByRole('searchbox',{name:'Search PilotDesk'});
  await input.waitFor({state:'visible'});
  if(!(await desktop.locator('a[href="/weather.html"]').count()))throw new Error('Weather link missing');
  await input.fill('private pilot');
  await desktop.locator('.pd-search-results a[href="/training/private-pilot.html"]').waitFor({state:'visible'});
  await input.press('Enter');
  await desktop.waitForURL('**/training/private-pilot.html');
  if(!(await desktop.locator('h1').innerText()).includes('Private'))throw new Error('Search did not open the private pilot study hub');
});

await check('mobile navigation opens and exposes core destinations',async()=>{
  await gotoRetry(mobile,'/');
  await mobile.getByRole('button',{name:'Open navigation',exact:true}).click();
  for(const [section,href] of [['Plan','/route-planner.html'],['Weather','/weather.html'],['Learn','/guides.html']]){
    await mobile.getByRole('button',{name:section,exact:true}).click();
    await mobile.locator(`header.topbar nav a[href="${href}"]`).waitFor({state:'visible'});
  }
  await mobile.locator('header.topbar nav a[href="/guides.html"]').click();
  await mobile.waitForURL('**/guides.html');
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

// Start the persistence checks on a fresh renderer so a third-party/live-weather
// browser failure cannot poison the rest of the production run.
await desktop.close();
desktop=await makeDesktop();

await check('aircraft profile saves locally',async()=>{
  await gotoRetry(desktop,'/aircraft.html');
  await desktop.evaluate(()=>{localStorage.removeItem('pd-aircraft');localStorage.removeItem('pd-aircraft-active')});
  await desktop.reload({waitUntil:'domcontentloaded',timeout:30000});
  await desktop.locator('#aircraftList .pd-empty-state').waitFor({state:'visible'});
  await desktop.locator('[name="name"]').fill('PilotDesk E2E Test');
  await desktop.locator('[name="type"]').fill('TEST');
  await desktop.locator('[name="fuelBurn"]').fill('10');
  await desktop.getByRole('button',{name:'Save aircraft',exact:true}).click();
  await desktop.waitForFunction(()=>document.querySelector('#aircraftList')?.textContent?.includes('PilotDesk E2E Test'),{timeout:8000});
  const saved=await desktop.evaluate(()=>JSON.parse(localStorage.getItem('pd-aircraft')||'[]'));
  if(!Array.isArray(saved)||!saved.some(x=>x?.name==='PilotDesk E2E Test'))throw new Error('profile did not persist in localStorage');
  await desktop.reload({waitUntil:'domcontentloaded'});
  await desktop.locator('#aircraftList h3').filter({hasText:'PilotDesk E2E Test'}).waitFor();
});

await check('weight and balance builder renders and calculates',async()=>{
  await gotoRetry(desktop,'/calculators/weight-balance-builder/',{attempts:3,timeout:30000});
  await desktop.locator('#wbAdvancedStations > summary').click();
  await desktop.locator('#wbRows .wb-data').first().waitFor({state:'visible'});
  // Explicit synthetic arithmetic fixture, never an approved aircraft profile.
  const loading=[[1500,1500,40],[180,180,37],[0,0,80],[120,60,100],[0,0,50]];
  for(const [i,values] of loading.entries())for(const [j,key] of ['dep','ldg','arm'].entries())
    await desktop.locator('#wbRows .wb-data').nth(i).locator(`[data-k="${key}"]`).fill(String(values[j]));
  await desktop.waitForFunction(()=>document.querySelector('#wbDepW')?.textContent?.includes('1,800'));
  const cg=await desktop.locator('#wbDepCG').innerText();
  if(!cg.includes('43.70'))throw new Error('Unexpected departure CG for synthetic fixture: '+cg);
});

await check('every canonical sitemap URL is live and structurally usable',async()=>{
  const mapResponse=await requestRetry('/sitemap.xml');
  const xml=await mapResponse.text();
  const urls=[...xml.matchAll(/<loc>(https:\/\/www\.pilot-desk\.com[^<]+)<\/loc>/g)].map(m=>m[1].replaceAll('&amp;','&'));
  const expected=[...readFileSync(new URL('../sitemap.xml',import.meta.url),'utf8').matchAll(/<loc>(https:\/\/www\.pilot-desk\.com[^<]+)<\/loc>/g)].map(m=>m[1].replaceAll('&amp;','&'));
  const missing=expected.filter(u=>!urls.includes(u)),unexpected=urls.filter(u=>!expected.includes(u));
  if(missing.length||unexpected.length)throw new Error(`Sitemap differs from committed public routes: missing ${missing.join(', ')||'none'}; unexpected ${unexpected.join(', ')||'none'}`);
  if(new Set(urls).size!==urls.length)throw new Error('duplicate canonical URLs in sitemap');
  if(urls.some(u=>u.includes('pilot-seo-priority')))throw new Error('retired SEO-named guide remains in sitemap');
  if(urls.some(u=>u.endsWith('/guides/popular-aviation-tools.html')||u.endsWith('/faa-sample-questions.html')))throw new Error('noindex reference/directory page remains in sitemap');
  const issues=[];
  const inspect=async url=>{
    let r,last;
    for(let n=0;n<2;n++){
      try{r=await desktop.request.get(base+new URL(url).pathname,{timeout:12000,maxRedirects:20});if(r.ok())break;last=new Error(`HTTP ${r.status()}`)}catch(e){last=e}
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
      if(canonical!==url)issues.push(`${url} missing matching canonical`);
      if(/<meta\b(?=[^>]*name=["']robots["'])(?=[^>]*content=["'][^"']*\bnoindex\b)[^>]*>/i.test(body))issues.push(`${url} is noindex but listed in sitemap`);
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

await check('retired SEO-named guide permanently redirects to the canonical tools directory',async()=>{
  const r=await desktop.request.get(base+'/guides/pilot-seo-priority.html',{timeout:15000,maxRedirects:0});
  if(![301,308].includes(r.status()))throw new Error(`expected permanent redirect, got HTTP ${r.status()}`);
  const location=r.headers()['location']||'';
  if(!location||new URL(location,base).href!==base+'/tools.html')throw new Error(`unexpected redirect location: ${location||'(missing)'}`);
  const destination=await requestRetry('/tools.html');
  const body=await destination.text();
  if(!/<h1(?:\s|>)/i.test(body)||!/<link\b(?=[^>]*\brel=["']canonical["'])(?=[^>]*\bhref=["']https:\/\/www\.pilot-desk\.com\/tools\.html["'])[^>]*>/i.test(body))throw new Error('tools directory is missing its heading or canonical destination');
});

await check('popular aviation tools page has a self canonical',async()=>{
  const r=await requestRetry('/guides/popular-aviation-tools.html');
  const body=await r.text();
  if(!body.includes('<link rel="canonical" href="https://www.pilot-desk.com/guides/popular-aviation-tools.html"')&&!body.includes('<link href="https://www.pilot-desk.com/guides/popular-aviation-tools.html" rel="canonical"'))throw new Error('self canonical missing');
  if(!/Popular Aviation Calculators &amp; Pilot References|Popular Aviation Calculators & Pilot References/.test(body))throw new Error('unexpected H1');
});

await browser.close();
clearTimeout(hardTimeout);
if(failures.length){
  console.error(`\n${failures.length} live E2E failure(s):`);
  failures.forEach(x=>console.error(' - '+x));
  process.exit(1);
}
console.log('\nPilotDesk live production E2E checks passed.');
