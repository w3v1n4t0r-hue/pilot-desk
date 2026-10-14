import {createRequire} from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),{chromium}=require('playwright');
const root=path.resolve(process.env.PILOTDESK_TEST_ROOT||'.');
const browser=await chromium.launch({headless:true,...(process.env.PILOTDESK_BROWSER_PATH?{executablePath:process.env.PILOTDESK_BROWSER_PATH}:{})});
try{
  const context=await browser.newContext({viewport:{width:1365,height:900}});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.route('**/*',async route=>{
    const url=new URL(route.request().url());
    if(url.hostname==='unpkg.com'){
      const file=url.pathname.endsWith('.js')?process.env.PILOTDESK_LEAFLET_JS:process.env.PILOTDESK_LEAFLET_CSS;
      return file?route.fulfill({path:file}):route.continue();
    }
    if(url.hostname!=='pd.test')return route.abort();
    if(url.pathname.startsWith('/api/'))return route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({error:'QA fixture: data unavailable'})});
    const file=path.resolve(root,'.'+url.pathname);
    if(!file.startsWith(root+path.sep)||!fs.existsSync(file))return route.fulfill({status:404,body:''});
    return route.fulfill({path:file,contentType:file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':file.endsWith('.html')?'text/html':undefined});
  });
  await page.goto('https://pd.test/route-planner.html#map=-97.19218/47.95269/13/low');
  await page.waitForSelector('#rpCopyMapView');
  await page.waitForSelector('#rpLayersToggle');
  const getView=()=>page.evaluate(()=>{const RP=window.PilotDeskRoutePlanner,m=RP.getMap();return {lat:m.getCenter().lat,lon:m.getCenter().lng,zoom:m.getZoom(),chart:RP.getChart()};});
  let view=await getView();assert.ok(Math.abs(view.lat-47.95269)<.0001);assert.equal(view.zoom,13);assert.equal(view.chart,'low');
  await page.locator('#rpLayersToggle').click();
  await page.locator('#rpLayerSearch').fill('navaids');
  assert.equal(await page.locator('#rpLayersPanel .rp-layer-row:visible').count(),1);
  await page.locator('[data-layer="navaids"]').check();
  await page.locator('#rpLayerSearch').fill('does not exist');
  assert.equal(await page.locator('#rpLayerEmpty').isVisible(),true);
  await page.locator('#rpLayerSearch').fill('');
  await page.locator('#rpEnabledOnly').check();
  assert.equal(await page.locator('#rpLayersPanel .rp-layer-row:visible input:not(:checked)').count(),0);
  assert.equal(await page.locator('#rpLayersPanel .rp-layer-row:visible input:checked').count(),4);
  assert.match(await page.locator('#rpLayersToggle').textContent(),/4$/);
  await page.locator('[data-layer="navaids"]').uncheck();
  assert.equal(await page.locator('#rpLayersPanel .rp-layer-row:visible input:checked').count(),3);
  await page.locator('#rpEnabledOnly').uncheck();
  assert.equal(await page.locator('[data-layer="pirep"]').isDisabled(),true);
  await page.locator('input[name="rpEfbBase"][value="high"]').check();
  assert.equal((await getView()).chart,'high');
  assert.match(page.url(),/\/high$/);
  await page.locator('input[name="rpEfbBase"][value="terminal"]').check();
  await page.locator('input[name="rpEfbBase"][value="auto"]').check();
  await page.evaluate(()=>window.PilotDeskRoutePlanner.getMap().setZoom(7,{animate:false}));
  assert.equal((await getView()).chart,'sectional');
  assert.equal(await page.locator('input[name="rpEfbBase"][value="auto"]').isChecked(),true);
  await page.locator('input[name="rpEfbBase"][value="high"]').check();
  assert.deepEqual(errors,[]);
  await page.keyboard.press('Escape');
  await page.locator('#rpLayersPanel').waitFor({state:'hidden'});
  assert.equal(await page.locator('#rpLayersPanel').isVisible(),false);
  assert.equal(await page.locator('#rpLayersToggle').evaluate(el=>el===document.activeElement),true);
  // Clipboard rejection must leave a selectable map-only link, without flight IDs.
  await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:()=>Promise.reject(Error('Denied'))}}));
  await page.locator('#rpCopyMapView').click();
  assert.equal(await page.locator('.rp-map-link-fallback').isVisible(),true);
  assert.match(await page.locator('.rp-map-link-fallback input').inputValue(),/^https:\/\/pd.test\/route-planner.html#map=/);
  await page.evaluate(()=>{
    history.replaceState(history.state,'',location.pathname+'?flight=private-flight-id'+location.hash);
    Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>window.copiedMapURL=text}});
  });
  await page.locator('#rpCopyMapView').click();
  assert.equal(await page.locator('.rp-map-link-fallback').isVisible(),false);
  assert.equal(await page.evaluate(()=>window.copiedMapURL.includes('private-flight-id')),false);
  assert.match(await page.locator('#rpMapLinkStatus').textContent(),/copied/);
  await page.evaluate(()=>window.PilotDeskRoutePlanner.getMap().setView([40,-100],7,{animate:false}));
  await page.reload();await page.waitForSelector('#rpCopyMapView');
  view=await getView();assert.ok(Math.abs(view.lat-40)<.01);assert.equal(view.zoom,7);assert.equal(view.chart,'high');
  await page.goto('https://pd.test/route-planner.html');await page.waitForSelector('#rpCopyMapView');
  assert.equal((await getView()).zoom,7);
  await page.evaluate(()=>location.hash='map=-110/45/8/sectional');
  await page.waitForFunction(()=>window.PilotDeskRoutePlanner.getMap().getZoom()===8);
  assert.equal((await getView()).chart,'sectional');
  await page.evaluate(()=>location.hash='rpPerformance');
  await page.evaluate(()=>window.PilotDeskRoutePlanner.getMap().setView([41,-101],6,{animate:false}));
  assert.equal(new URL(page.url()).hash,'#rpPerformance');
  for(const width of [320,360,375,390,414,430,768,1365,1920]){
    await page.setViewportSize({width,height:900});
    await page.locator('#rpLayersToggle').click();
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Horizontal overflow at '+width);
    const box=await page.locator('#rpLayersPanel').boundingBox();assert.ok(box.width<=width&&box.x>=0,'Layer panel outside viewport at '+width);
    assert.ok(await page.locator('#rpLayersPanel').evaluate(panel=>{
      const p=panel.getBoundingClientRect(),z=document.querySelector('.leaflet-control-zoom').getBoundingClientRect();
      const left=Math.max(p.left,z.left),right=Math.min(p.right,z.right),top=Math.max(p.top,z.top),bottom=Math.min(p.bottom,z.bottom);
      return left>=right||top>=bottom||panel.contains(document.elementFromPoint((left+right)/2,(top+bottom)/2));
    }),'Zoom buttons overlap the layer panel at '+width);
    if(process.env.PILOTDESK_SCREENSHOT_DIR&&[390,1365].includes(width)){
      await page.locator('#rpLayersPanel').screenshot({path:path.join(process.env.PILOTDESK_SCREENSHOT_DIR,'layers-'+width+'.png')});
    }
    await page.keyboard.press('Escape');
    await page.locator('#rpLayersPanel').waitFor({state:'hidden'});
  }
  assert.deepEqual(errors,[]);
  console.log('Browser checks passed: linked/restored views, chart changes, hash navigation, section anchors, layer search/filter/count, free entitlement, copy fallback, unavailable API handling and nine viewport widths.');
}finally{await browser.close();}
