import { chromium } from 'playwright';

const base=(process.env.PILOTDESK_BASE_URL||'https://www.pilot-desk.com').replace(/\/$/,'');
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true});
const failures=[];
const check=async(name,fn)=>{try{await fn();console.log('PASS',name)}catch(e){failures.push(`${name}: ${e.message}`);console.error('FAIL',name,e.message)}};

await check('homepage loads and enhanced navigation appears',async()=>{
  const r=await page.goto(base+'/',{waitUntil:'domcontentloaded',timeout:30000});
  if(!r?.ok())throw new Error(`HTTP ${r?.status()}`);
  await page.waitForSelector('.brand',{timeout:10000});
  await page.waitForSelector('#pdStartHere',{timeout:10000});
  if(!(await page.locator('a[href="/weather.html"]').count()))throw new Error('Weather link missing');
});

await check('shared crosswind link prefills and calculates',async()=>{
  const r=await page.goto(base+'/calculators/crosswind/?runway=350&windDir=320&windSpeed=18',{waitUntil:'domcontentloaded',timeout:30000});
  if(!r?.ok())throw new Error(`HTTP ${r?.status()}`);
  await page.waitForSelector('#windSpeed');
  await page.waitForTimeout(800);
  if(await page.locator('#runway').inputValue()!=='350')throw new Error('runway query value not applied');
  if(await page.locator('#windDir').inputValue()!=='320')throw new Error('wind query value not applied');
  await page.locator('[data-calculate]').click();
  await page.waitForTimeout(200);
  const out=(await page.locator('#out0').textContent())?.trim();
  if(!out||out==='—'||!out.includes('kt'))throw new Error('crosswind result missing');
});

await check('weather lookup reaches PilotDesk weather API',async()=>{
  await page.goto(base+'/weather.html',{waitUntil:'domcontentloaded',timeout:30000});
  await page.locator('#station').fill('KGFK');
  const responsePromise=page.waitForResponse(r=>r.url().includes('/api/weather?station=KGFK'),{timeout:15000});
  await page.locator('#weatherForm button[type="submit"]').click();
  const response=await responsePromise;
  const body=await response.text();
  if(!response.ok())throw new Error(`weather API HTTP ${response.status()}: ${body.slice(0,300)}`);
  await page.waitForFunction(()=>{
    const status=document.querySelector('#weatherStatus')?.textContent||'';
    const output=document.querySelector('#weatherOutput')?.textContent||'';
    return !/Fetching|Loading/i.test(status+output) && /KGFK|METAR|No current products/i.test(status+output);
  },{timeout:10000});
  const text=(await page.locator('#weatherStatus').innerText())+' '+(await page.locator('#weatherOutput').innerText());
  if(/Weather retrieval failed|Weather could not be loaded/i.test(text))throw new Error(text.slice(0,400));
  if(!/KGFK|METAR/i.test(text))throw new Error('weather response did not render');
});

await check('aircraft profile saves locally',async()=>{
  await page.goto(base+'/aircraft.html',{waitUntil:'domcontentloaded',timeout:30000});
  await page.evaluate(()=>{localStorage.removeItem('pd-aircraft');localStorage.removeItem('pd-aircraft-active')});
  await page.reload({waitUntil:'domcontentloaded'});
  await page.locator('[name="name"]').fill('PilotDesk E2E Test');
  await page.locator('[name="type"]').fill('TEST');
  await page.locator('[name="fuelBurn"]').fill('10');
  await page.locator('#aircraftForm button[type="submit"]').click();
  await page.waitForTimeout(250);
  if(!/PilotDesk E2E Test/.test(await page.locator('#aircraftList').innerText()))throw new Error('saved profile not rendered');
});

await check('weight and balance builder renders and calculates',async()=>{
  const r=await page.goto(base+'/calculators/weight-balance-builder/',{waitUntil:'domcontentloaded',timeout:30000});
  if(!r?.ok())throw new Error(`HTTP ${r?.status()}`);
  await page.waitForSelector('#wbRows');
  await page.waitForTimeout(500);
  if(!(await page.locator('.wb-data').count()))throw new Error('no W&B rows rendered');
  const total=(await page.locator('#wbW').textContent())?.trim();
  if(!total||total==='—')throw new Error('W&B total did not calculate');
});

await check('guide, sources, privacy and sitemap are live',async()=>{
  for(const p of ['/guides.html','/guides/climb-gradient.html','/sources.html','/legal/privacy.html','/sitemap.xml']){
    const r=await page.request.get(base+p,{timeout:30000});
    if(!r.ok())throw new Error(`${p} returned ${r.status()}`);
  }
});

await browser.close();
if(failures.length){console.error(`\n${failures.length} live E2E failure(s):`);failures.forEach(x=>console.error(' - '+x));process.exit(1)}
console.log('\nPilotDesk live production E2E checks passed.');
