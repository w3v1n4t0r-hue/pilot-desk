import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{chromium}=require('playwright');
const root=path.resolve(process.env.PILOTDESK_TEST_ROOT||'.');
const catalog=JSON.parse(fs.readFileSync(path.join(root,'assets/layer-catalog.json')));
assert.equal(catalog.length,51);assert.equal(new Set(catalog.map(d=>d.id)).size,51);
assert.equal(catalog.some(d=>d.id==='traffic'||d.id==='fuelPrices'||d.id==='jepp'),false);
assert.deepEqual(catalog.find(d=>d.id==='chart').options.map(o=>o.id),['us/vfr','us/ifrlow','us/ifrhigh']);
const browser=await chromium.launch({headless:true,...(process.env.PILOTDESK_BROWSER_PATH?{executablePath:process.env.PILOTDESK_BROWSER_PATH}:{})});
try{
  const page=await browser.newPage({viewport:{width:1365,height:900}}),errors=[],requests=[];
  page.on('pageerror',error=>errors.push(error.message));
  page.on('request',request=>requests.push(request.url()));
  await page.route('**/*',route=>{
    const url=new URL(route.request().url());
    if(url.hostname==='unpkg.com')return route.fulfill({path:url.pathname.endsWith('.js')?process.env.PILOTDESK_LEAFLET_JS:process.env.PILOTDESK_LEAFLET_CSS});
    if(url.hostname!=='pd.test')return route.abort();
    if(url.pathname==='/api/aviation-layers'&&url.searchParams.get('product')==='metar')return route.fulfill({contentType:'application/json',body:JSON.stringify({source:'AWC test fixture',fetchedAt:new Date().toISOString(),geojson:{type:'FeatureCollection',features:[{type:'Feature',geometry:{type:'Point',coordinates:[-97.19218,47.95269]},properties:{site:'Station fixture',temp:8,dewp:4,wdir:180,wspd:12,ceil:26,visib:'6+',cover:'OVC',fltcat:'MVFR',obsTime:new Date().toISOString()}}]}})});
    if(url.pathname==='/api/aviation-layers'&&url.searchParams.get('adapter')==='faa')return route.fulfill({contentType:'application/json',body:JSON.stringify({source:'FAA test fixture',fetchedAt:new Date().toISOString(),geojson:{type:'FeatureCollection',features:[{type:'Feature',geometry:{type:'Point',coordinates:[-97.19218,47.95269]},properties:{NAME:'Heliport fixture',IDENT:'TESTHP',TYPE_CODE:'HP',PRIVATEUSE:0}}]}})});
    if(url.pathname==='/api/aviation-layers'&&url.searchParams.get('adapter')==='imagery')return route.fulfill({contentType:'application/json',body:JSON.stringify({frameTime:new Date().toISOString()})});
    if(url.pathname.startsWith('/api/'))return route.fulfill({status:503,contentType:'application/json',body:'{"error":"Test feed unavailable"}'});
    const file=path.resolve(root,'.'+url.pathname);
    if(!file.startsWith(root+path.sep)||!fs.existsSync(file))return route.fulfill({status:404,body:''});
    return route.fulfill({path:file,contentType:file.endsWith('.js')||file.endsWith('.mjs')?'application/javascript':file.endsWith('.json')?'application/json':file.endsWith('.css')?'text/css':file.endsWith('.html')?'text/html':undefined});
  });
  await page.goto('https://pd.test/layer-test.html');
  await page.locator('.control').first().waitFor();
  assert.equal(await page.locator('.control').count(),51);
  assert.equal(await page.locator('[data-control="traffic"]').count(),0);
  await page.waitForFunction(()=>document.getElementById('map-status').textContent.startsWith('PilotDesk map connected'));
  const control=id=>page.locator('[data-control="'+id+'"]');
  for(const def of catalog){if(def.options.length)assert.deepEqual(await control(def.id).locator('option').evaluateAll(els=>els.slice(1).map(el=>el.value)),def.options.map(o=>o.id))}
  await control('chart').selectOption('us/ifrlow');
  const frame=page.frameLocator('#planner');
  assert.ok(await frame.locator('#rpMap').evaluate(el=>el.clientHeight>=180));
  assert.equal(await frame.locator('.topbar').isVisible(),false);
  assert.equal(await frame.locator('#rpEditorToggle').textContent(),'Full planner ↗');
  assert.equal(await frame.locator('#rpChartLayer').inputValue(),'low');
  await control('wxStations').selectOption('category');
  await frame.locator('.pd-public-marker span').first().waitFor();
  assert.equal(await frame.locator('[data-layer="metar"]').isChecked(),false);
  const labels={category:'MVFR',surfacewind:'180° 12kt',dewpointspread:'4°C',temperature:'8°C',visibility:'6+SM',ceiling:'2600ft AGL',coverage:'OVC'};
  for(const [mode,label] of Object.entries(labels)){await control('wxStations').selectOption(mode);await page.waitForFunction(value=>document.getElementById('planner').contentDocument.querySelector('.pd-public-marker span')?.textContent===value,label)}
  for(let i=0;i<4;i++)await frame.locator('.leaflet-control-zoom-in').click();
  await control('aero/heli').check();await page.waitForFunction(()=>[...document.getElementById('planner').contentDocument.querySelectorAll('.pd-public-marker span')].some(el=>el.textContent==='TESTHP'));
  await control('aero/heli').uncheck();
  await control('wxImagery').selectOption('radar_lowest_tilt');await page.waitForFunction(()=>document.querySelector('[data-source-status="wxImagery"]').textContent.startsWith('Unavailable or partial'));assert.ok(requests.some(url=>url.includes('conus_bref_qcd')&&new URL(url).searchParams.has('time')));await control('wxImagery').selectOption('');
  await control('obstacles').check();
  assert.match(await page.locator('#map-status').textContent(),/0 selected controls awaiting data/);
  await page.locator('#search').fill('radar');assert.equal(await page.locator('.control').count(),1);
  await page.locator('#search').fill('');await page.locator('#selected-only').check();assert.equal(await page.locator('.control').count(),3);
  await page.evaluate(()=>{const old=JSON.parse(localStorage.getItem('pd-layer-test-v1'));localStorage.setItem('pd-layer-test-v1',JSON.stringify({...old,traffic:true,fuelPrices:'jet',wxImagery:'icing_global'}))});
  await page.reload();await page.locator('.control').first().waitFor();assert.equal(await control('obstacles').isChecked(),true);assert.equal(await control('chart').inputValue(),'us/ifrlow');
  for(const width of [320,360,390,760,1365]){await page.setViewportSize({width,height:900});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Overflow at '+width)}
  await page.evaluate(()=>{const original=URL.createObjectURL.bind(URL);URL.createObjectURL=blob=>{window.reviewExport=blob;return original(blob)}});
  const download=page.waitForEvent('download');await page.locator('#export').click();const result=await download;assert.equal(result.suggestedFilename(),'pilotdesk-layer-review.json');const exported=JSON.parse(await page.evaluate(()=>window.reviewExport.text()));assert.equal(exported.selection.obstacles,true);assert.equal(exported.selection.traffic,undefined);assert.equal(exported.selection.fuelPrices,undefined);assert.equal(exported.selection.wxImagery,undefined);
  await page.locator('#reset').click();assert.equal(await control('obstacles').isChecked(),false);assert.equal(await control('chart').inputValue(),'');
  await page.locator('#search').fill('nonexistent');assert.equal(await page.locator('#empty').isVisible(),true);
  assert.deepEqual(errors,[]);
  assert.ok(requests.every(url=>!url.includes('/map/api/')));
  console.log('Passed: 51 supported controls, retired controls/options absent, station modes and FAA rendering, source failure status, persistence, search, export, reset, five viewport widths, no page errors.');
}finally{await browser.close()}
