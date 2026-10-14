import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{chromium}=require('playwright');
const root=path.resolve(process.env.PILOTDESK_TEST_ROOT||'.');
const catalog=JSON.parse(fs.readFileSync(path.join(root,'assets/layer-catalog.json')));
assert.equal(catalog.length,75);assert.equal(new Set(catalog.map(d=>d.id)).size,75);
const browser=await chromium.launch({headless:true,...(process.env.PILOTDESK_BROWSER_PATH?{executablePath:process.env.PILOTDESK_BROWSER_PATH}:{})});
try{
  const page=await browser.newPage({viewport:{width:1365,height:900}}),errors=[],requests=[];
  page.on('pageerror',error=>errors.push(error.message));
  page.on('request',request=>requests.push(request.url()));
  await page.route('**/*',route=>{
    const url=new URL(route.request().url());
    if(url.hostname==='unpkg.com')return route.fulfill({path:url.pathname.endsWith('.js')?process.env.PILOTDESK_LEAFLET_JS:process.env.PILOTDESK_LEAFLET_CSS});
    if(url.hostname!=='pd.test')return route.abort();
    if(url.pathname.startsWith('/api/'))return route.fulfill({status:503,contentType:'application/json',body:'{"error":"Test feed unavailable"}'});
    const file=path.resolve(root,'.'+url.pathname);
    if(!file.startsWith(root+path.sep)||!fs.existsSync(file))return route.fulfill({status:404,body:''});
    return route.fulfill({path:file,contentType:file.endsWith('.js')?'application/javascript':file.endsWith('.json')?'application/json':file.endsWith('.css')?'text/css':file.endsWith('.html')?'text/html':undefined});
  });
  await page.goto('https://pd.test/layer-test.html');
  await page.locator('.control').first().waitFor();
  assert.equal(await page.locator('.control').count(),75);
  await page.waitForFunction(()=>document.getElementById('map-status').textContent.startsWith('PilotDesk map connected'));
  const control=id=>page.locator('[data-control="'+id+'"]');
  for(const def of catalog){if(def.options.length)assert.deepEqual(await control(def.id).locator('option').evaluateAll(els=>els.slice(1).map(el=>el.value)),def.options.map(o=>o.id))}
  await control('chart').selectOption('us/ifrlow');
  const frame=page.frameLocator('#planner');
  assert.equal(await frame.locator('#rpChartLayer').inputValue(),'low');
  await control('wxStations').selectOption('category');
  assert.equal(await frame.locator('[data-layer="metar"]').isChecked(),true);
  await control('traffic').check();
  assert.match(await page.locator('#map-status').textContent(),/1 selected controls awaiting data/);
  await page.locator('#search').fill('radar');assert.equal(await page.locator('.control').count(),2);
  await page.locator('#search').fill('');await page.locator('#selected-only').check();assert.equal(await page.locator('.control').count(),3);
  await page.reload();await page.locator('.control').first().waitFor();assert.equal(await control('traffic').isChecked(),true);assert.equal(await control('chart').inputValue(),'us/ifrlow');
  for(const width of [320,360,390,760,1365]){await page.setViewportSize({width,height:900});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Overflow at '+width)}
  await page.evaluate(()=>{const original=URL.createObjectURL.bind(URL);URL.createObjectURL=blob=>{window.reviewExport=blob;return original(blob)}});
  const download=page.waitForEvent('download');await page.locator('#export').click();const result=await download;assert.equal(result.suggestedFilename(),'pilotdesk-layer-review.json');const exported=JSON.parse(await page.evaluate(()=>window.reviewExport.text()));assert.equal(exported.selection.traffic,true);
  await page.locator('#reset').click();assert.equal(await control('traffic').isChecked(),false);assert.equal(await control('chart').inputValue(),'');
  await page.locator('#search').fill('nonexistent');assert.equal(await page.locator('#empty').isVisible(),true);
  assert.deepEqual(errors,[]);
  assert.ok(requests.every(url=>!url.includes('/map/api/')));
  console.log('Passed: 75 controls, every option, connected charts/METARs, pending status, persistence, search, export, reset, five viewport widths, no page errors.');
}finally{await browser.close()}
