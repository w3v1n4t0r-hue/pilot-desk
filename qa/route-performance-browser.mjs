import {createRequire} from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),{chromium}=require('playwright');
const root=process.cwd(),browser=await chromium.launch({headless:true});
try{
const page=await browser.newPage({viewport:{width:1365,height:900}}),errors=[];
page.on('pageerror',error=>errors.push(error.message));
await page.route('**/*',async route=>{
 const url=new URL(route.request().url());
 if(url.hostname==='unpkg.com'){const cached=url.pathname.endsWith('.js')?process.env.PILOTDESK_LEAFLET_JS:process.env.PILOTDESK_LEAFLET_CSS;return cached?route.fulfill({path:cached}):route.continue();}
 if(url.pathname.startsWith('/api/')){
  let status=200,body={geojson:{type:'FeatureCollection',features:[]}};
  if(url.pathname.includes('notams')){status=503;body={error:'Test fixture unavailable',configured:true}}
  if(url.pathname.includes('weather'))body={station:url.searchParams.get('station'),metar:{fltCat:'VFR',rawOb:'Test fixture METAR',obsTime:Math.floor(Date.now()/1000)}};
  if(url.pathname.includes('procedures'))body={procedures:[]};
  return route.fulfill({status,contentType:'application/json',body:JSON.stringify(body)});
 }
 if(url.hostname!=='pd.test')return route.abort();
 const file=path.join(root,url.pathname==='/'?'index.html':url.pathname);
 if(!fs.existsSync(file))return route.fulfill({status:404,body:''});
 return route.fulfill({path:file,contentType:file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':file.endsWith('.html')?'text/html':undefined});
});
await page.goto('https://pd.test/route-planner.html');
await page.fill('#rpRoute','AAAA,47,-97 BBBB,48,-97');await page.click('#rpBuild');
await page.waitForFunction(()=>window.pdNavlogResult?.legs.length===1);console.log('PASS route build');
assert((await page.textContent('#rpFuelResults')).includes('Enter reserve minutes'));
await page.fill('#rpReserveMinutes','45');await page.fill('#rpFuelOnboard','40');await page.fill('#rpTaxiFuel','1');await page.fill('#rpAlternateFuel','3');await page.fill('#rpExtraFuel','2');await page.fill('#rpDepartureUtc','2026-09-30T23:30');
assert((await page.textContent('#rpFuelResults')).includes('Total planned fuel'));
await page.fill('#rpFuelOnboard','1');assert((await page.textContent('#rpFuelResults')).includes('below the entered plan'));
await page.fill('#rpFuelOnboard','');assert((await page.textContent('#rpFuelResults')).includes('Enter usable fuel on board'));
await page.fill('#rpFuelOnboard','40');
await page.locator('.rp-leg-planning summary').click();await page.locator('[data-leg-field="tas"]').first().fill('90');
await page.waitForFunction(()=>window.pdNavlogResult?.legs[0].tas===90);console.log('PASS per-leg TAS');
console.log('PASS fuel ledger');await page.click('#rpSaveFlight');await page.waitForFunction(()=>new URL(location.href).searchParams.has('flight'),null,{timeout:5000}).catch(async e=>{console.log(await page.textContent('#rpStatus'),errors);throw e});
const id=await page.evaluate(()=>new URL(location.href).searchParams.get('flight'));
const saved=await page.evaluate(id=>window.PilotDeskFlights.get(id),id);
assert.equal(saved.planning.reserveMinutes,'45');assert.equal(Object.values(saved.planning.legOverrides)[0].tas,'90');
console.log('PASS save');await page.reload();await page.waitForFunction(()=>window.pdNavlogResult?.legs[0].tas===90);console.log('PASS per-leg TAS');
assert.equal(await page.inputValue('#rpFuelOnboard'),'40');assert.equal(await page.inputValue('#rpReserveMinutes'),'45');
for(const width of [320,360,375,390,414,430,768,1365,1920]){
 await page.setViewportSize({width,height:900});
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Page overflow at '+width);
}
await page.setViewportSize({width:390,height:844});await page.screenshot({path:'/tmp/pilotdesk-performance-mobile.png',fullPage:true});
const expectedFuel=await page.evaluate(()=>window.PilotDeskRoutePerformance.getFuelPlan(window.pdNavlogResult).required.toFixed(1));
await page.goto('https://pd.test/flight-brief.html?id='+encodeURIComponent(id));await page.waitForFunction(()=>document.getElementById('briefContent')?.textContent.includes('Fuel & arrival plan'));assert((await page.textContent('#briefContent')).includes(expectedFuel+' US gal'));
assert.deepEqual(errors,[]);
console.log('Browser checks passed: fuel shortage/unknown fuel, leg TAS, saved-plan reopen, nine widths, no runtime errors. Live APIs used controlled fixtures.');
}finally{await browser.close()}
