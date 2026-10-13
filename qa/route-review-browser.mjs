import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const base=process.env.PILOTDESK_BASE_URL||'http://127.0.0.1:4173';
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({serviceWorkers:'block'});
const errors=[];
try{
 const page=await context.newPage();
 page.on('pageerror',e=>errors.push(e.message));
 // Provider outage is deliberate; no external calls or real account/email writes.
 await page.route('**/api/navigation-lookup?pdLookup=route-review-briefing',r=>r.fulfill({status:503,contentType:'application/json',body:JSON.stringify({error:'Provider unavailable in this test.'})}));
 await page.route('https://esm.sh/**',r=>r.fulfill({contentType:'text/javascript',body:'export const createClient=()=>({auth:{getSession:async()=>({data:{session:null}}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}})}});'}));
 for(const width of [320,360,375,390,414,430,768,1280,1920]){
  await page.setViewportSize({width,height:900});
  await page.goto(base+'/route-review.html');
  await page.waitForFunction(()=>window.__pilotDeskAppBootstrap&&document.querySelector('#route-title').textContent.includes('KGFK'));
  const state=await page.evaluate(()=>{
   const map=document.querySelector('#map'),rect=map.getBoundingClientRect(),pixels=map.getContext('2d').getImageData(0,0,map.width,map.height).data;
   const colors=new Set();for(let i=0;i<pixels.length;i+=400)colors.add(pixels[i]+','+pixels[i+1]+','+pixels[i+2]);
   const footer=document.querySelector('footer').getBoundingClientRect(),main=document.querySelector('main').getBoundingClientRect();
   return {overflow:document.documentElement.scrollWidth>innerWidth,headers:document.querySelectorAll('header.topbar').length,mapWidth:rect.width,mapHeight:rect.height,colors:colors.size,footerBelow:footer.top>=main.bottom-1};
  });
  assert.equal(state.overflow,false,`${width}px overflow`);assert.equal(state.headers,1);assert(state.mapWidth>200&&state.mapHeight>200);assert(state.colors>5,`${width}px map must be drawn`);assert(state.footerBelow,`${width}px footer must not cover workspace`);
  await page.locator('#saved-btn').click();await page.locator('#modal-close').click();
  await page.locator('#tab-briefing').click();await page.locator('#navlog-btn').click();await page.locator('#modal-close').click();
  await page.locator('#fetch-briefing-btn').click();await page.locator('#briefing-status').filter({hasText:'Provider unavailable in this test.'}).waitFor();
  await page.locator('#layers-btn').click();if(await page.locator('#layer-panel').isVisible())await page.locator('#close-layers').click();
  if(width<800){await page.locator('[data-menu]').click();await page.locator('.pd-nav-button').filter({hasText:'Tools'}).click();await page.keyboard.press('Escape');}
  console.log(`PASS ${width}px shell, rendered map, footer, review controls, navlog, provider outage and navigation`);
 }
 const flight={route:'KGFK KMOT',points:[{id:'KGFK',lat:47.95,lon:-97.18,type:'PA',source:'airport'},{id:'KMOT',lat:48.26,lon:-101.28,type:'PA',source:'airport'}],tas:135,burn:11,planning:{departureUtc:'2026-10-13T18:00Z',onboard:55,phases:{cruiseAltitude:7000}}};
 await page.goto(base+'/route-review.html#flight='+encodeURIComponent(JSON.stringify(flight)));
 await page.waitForFunction(()=>document.querySelector('#tas').value==='135');
 assert.equal(await page.locator('#etd').inputValue(),'2026-10-13T18:00');assert.equal(await page.locator('#fuel-onboard').inputValue(),'55');assert.equal(await page.locator('#fuel-burn').inputValue(),'11');assert.equal(await page.locator('#route-title').textContent(),'KGFK → KMOT');
  await page.evaluate(()=>{navigator.clipboard.writeText=async text=>{window.__copiedRoute=text;}});
  await page.locator('#tab-route').click();await page.locator('#import-route-btn').click();await page.locator('#copy-handoff-btn').click();
  const carried=await page.evaluate(()=>window.__copiedRoute);
  const imported=JSON.parse(new URLSearchParams(new URL(carried).hash.slice(1)).get('flight'));
  assert.equal(imported.points[0].lat,47.95);assert.equal(imported.points[0].lon,-97.18);
  await page.locator('#modal-close').click();
 assert.deepEqual(errors,[]);console.log('PASS planner handoff preserves route, UTC departure, TAS and fuel inputs; no page errors');
}finally{await context.close();await browser.close();}
