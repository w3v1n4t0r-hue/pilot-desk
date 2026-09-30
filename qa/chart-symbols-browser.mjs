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
  const product=url.searchParams.get('product');const feature=(lon,lat,properties)=>({type:'Feature',geometry:{type:'Point',coordinates:[lon,lat]},properties});
  if(product==='pirep')body={geojson:{type:'FeatureCollection',features:[feature(-97.3,47.7,{rawOb:'TEST UUA /FL080 /TB SEV /IC MOD RIME /WX TSRA',fltlvl:80}),feature(-97.1,47.6,{rawOb:'TEST UA /TB NEG'}),feature(-97,47.5,{rawOb:'TEST UA /SK BKN040'})]}};
  if(['airports','navaids','fixes','obstacle'].includes(product))body={geojson:{type:'FeatureCollection',features:[feature(-97.4+['airports','navaids','fixes','obstacle'].indexOf(product)*.15,47.4,{IDENT:product,TYPE:product==='navaids'?'NDB':'',rawOb:''})]}};
  if(url.pathname.includes('winds-aloft')){const request=JSON.parse(route.request().postData()),departure=Date.parse(request.departureUtc);body={source:'QA forecast fixture',altitude:request.altitude,fetchedAt:new Date().toISOString(),baseAt:departure-3600000,start:departure-3600000,end:departure+12*3600000,legs:request.points.slice(1).map(()=>({direction:180,speed:10,station:'FIX',stationDistanceNm:20}))};}
  return route.fulfill({status,contentType:'application/json',body:JSON.stringify(body)});
 }
 if(url.hostname!=='pd.test')return route.abort();
 const file=path.join(root,url.pathname==='/'?'index.html':url.pathname);
 if(!fs.existsSync(file))return route.fulfill({status:404,body:''});
 return route.fulfill({path:file,contentType:file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':file.endsWith('.html')?'text/html':undefined});
});
await page.addInitScript(()=>localStorage.setItem('pd-efb-layers',JSON.stringify({enabled:{radar:false,metar:false,pirep:true,airports:true,navaids:true,fixes:true,obstacles:true,tfr:false,notams:false}})));
await page.goto('https://pd.test/route-planner.html');
await page.waitForFunction(()=>window.PilotDeskRoutePlanner?.getMap());
await page.evaluate(()=>window.PilotDeskRoutePlanner.getMap().setView([47.6,-97.2],9));
await page.waitForSelector('.rp-pirep-symbol');
await page.waitForFunction(()=>document.querySelectorAll('.rp-pirep-symbol').length===3);
assert.equal(await page.locator('[data-condition="turbulence"]').count(),2);
assert.equal(await page.locator('[data-condition="icing"]').count(),1);
assert.equal(await page.locator('[data-condition="thunderstorm"]').count(),1);
assert.equal(await page.locator('.rp-pirep-urgent').count(),1);
assert.ok(await page.locator('.rp-map-symbol svg').count()>=7);
assert.ok(await page.evaluate(()=>[...document.querySelectorAll('.rp-map-symbol')].every(el=>getComputedStyle(el).backgroundColor==='rgba(0, 0, 0, 0)')));
const urgent=page.locator('.rp-pirep-symbol').filter({has:page.locator('.rp-pirep-urgent')});await urgent.click();
await page.waitForSelector('.leaflet-popup-content');const popup=await page.textContent('.leaflet-popup-content');assert.ok(popup.includes('FL080'));assert.ok(popup.includes('Turbulence: severe'));assert.ok(popup.includes('Icing: moderate'));
await page.keyboard.press('Escape');
await page.locator('#rpMap').screenshot({path:'/tmp/pilotdesk-chart-symbols.png'});
for(const width of [320,390,768,1365]){await page.setViewportSize({width,height:900});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Overflow at '+width);}
await page.locator('.rp-layers-toggle').click();await page.locator('#rpEfbVectorOpacity').evaluate(el=>el.value='50');await page.locator('#rpEfbVectorOpacity').dispatchEvent('input');
assert.equal(await page.locator('.rp-pirep-symbol').first().evaluate(el=>getComputedStyle(el).opacity),'0.5');
assert.deepEqual(errors,[]);console.log('Browser chart checks passed: multi-hazard/negative/cloud PIREPs, SVG navigation, popup altitude/intensity, opacity, four widths and no runtime errors.');
}finally{await browser.close()}
