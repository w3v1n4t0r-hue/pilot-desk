import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{chromium}=require('playwright');
const root=path.resolve(process.env.PILOTDESK_TEST_ROOT||'.');
const browser=await chromium.launch({headless:true,...(process.env.PILOTDESK_BROWSER_PATH?{executablePath:process.env.PILOTDESK_BROWSER_PATH}:{})});
try{
  const page=await browser.newPage({viewport:{width:1365,height:900}}),errors=[];let directFAA=0,faaProxy=0;
  await page.addInitScript(()=>localStorage.setItem('pd-aircraft',JSON.stringify([{id:'qa-aircraft',name:'Test aircraft',cruiseTas:105,fuelBurn:8}])));
  page.on('pageerror',error=>errors.push(error.stack||error.message));
  await page.route('**/*',route=>{
    const url=new URL(route.request().url());
    if(url.hostname==='unpkg.com')return route.fulfill({path:url.pathname.endsWith('.js')?process.env.PILOTDESK_LEAFLET_JS:process.env.PILOTDESK_LEAFLET_CSS});
    if(url.hostname==='services6.arcgis.com'||url.pathname==='/api/aviation-layers'&&url.searchParams.get('adapter')==='faa'){
      const feature=(properties,geometry={type:'LineString',coordinates:[[-98,39],[-97,40]]})=>({type:'Feature',geometry,properties});
      const direct=url.hostname==='services6.arcgis.com';if(direct)directFAA++;else faaProxy++;const service=url.pathname.split('/')[5],product=direct?({ATS_Route:'airways',Boundary_Airspace:'boundaries',Special_Use_Airspace:'sua',Class_Airspace:'airspace',US_Airport:'airports'}[service]):url.searchParams.get('product'),features=product==='airways'?[feature({IDENT:'J101',LEVEL_:'U'}),feature({IDENT:'V101',LEVEL_:'L'})]:product==='boundaries'?[feature({TYPE_CODE:'TRSA'})]:product==='sua'?[feature({NAME:'Fixture MOA',TYPE_CODE:'MOA'})]:[];
      if(direct&&product==='airports')return route.fulfill({headers:{'access-control-allow-origin':'*'},contentType:'application/json',body:JSON.stringify({error:{code:429}})});
      return route.fulfill({headers:{'access-control-allow-origin':'*'},contentType:'application/json',body:JSON.stringify(direct?{type:'FeatureCollection',features}:{geojson:{type:'FeatureCollection',features}})});
    }
    if(url.hostname!=='pd.test')return route.abort();
    if(url.pathname.startsWith('/api/'))return route.fulfill({status:503,contentType:'application/json',body:'{"error":"Test feed unavailable"}'});
    const file=path.resolve(root,'.'+url.pathname);
    if(!file.startsWith(root+path.sep)||!fs.existsSync(file))return route.fulfill({status:404,body:''});
    return route.fulfill({path:file,contentType:/\.(?:mjs|js)$/.test(file)?'application/javascript':file.endsWith('.json')?'application/json':file.endsWith('.css')?'text/css':file.endsWith('.html')?'text/html':undefined});
  });

  await page.goto('https://pd.test/route-planner.html#map=-97.2/47.9/9/sectional');
  await page.locator('body.rp-canvas-ready').waitFor();await page.locator('#rpAircraft').waitFor({state:'attached'});
  await page.waitForFunction(()=>document.querySelector('#rpLayersPanel')?.dataset.unified==='1');
  assert.deepEqual(await page.locator('.rp-canvas-controls').evaluate(el=>[...el.children].map(n=>n.querySelector('select')?.id||n.id)),['rpChartLayer','rpLayersToggle','rpBriefToggle','rpFullscreen']);
  assert.equal(await page.locator('#rpPublicLayersToggle').count(),0);assert.equal(await page.locator('#rpCopyMapView').count(),0);
  await page.locator('#rpEditorToggle').click();
  const bar=()=>page.locator('#rpCanvasDrawer').evaluate(el=>({height:el.clientHeight,width:el.clientWidth,scroll:el.scrollHeight>el.clientHeight+1||el.scrollWidth>el.clientWidth+1}));
  assert.ok((await bar()).height<=96);assert.equal((await bar()).scroll,false);
  assert.equal(await page.locator('.rp-plan-settings #rpAircraft').count(),1);assert.equal(await page.locator('.rp-plan-settings #rpPowerSetting').count(),1);assert.equal(await page.locator('.rp-plan-settings #rpPhase_cruiseAltitude').count(),1);assert.equal(await page.locator('.rp-plan-settings #rpDepartureUtc').count(),1);
  assert.equal(await page.locator('.rp-canvas-head #rpMeasure').count(),1);
  await page.locator('#rpAircraft').selectOption('qa-aircraft');assert.equal(await page.locator('#rpTas').inputValue(),'105');
  await page.locator('#rpPowerSetting').fill('65%');await page.locator('#rpDepartureUtc').fill('2026-10-15T15:00');
  await page.locator('#rpRoute').fill('A,47.9,-97.2 B,47.2,-96.8');await page.locator('#rpBuild').click();await page.waitForFunction(()=>window.pdNavlogResult?.totalDistance>0);
  assert.equal(await page.evaluate(()=>window.PilotDeskRoutePerformance.getSettings().powerSetting),'65%');assert.match(await page.locator('#rpSummaryEta').textContent(),/^\d\d:\d\dZ$/);
  await page.locator('#rpRouteActions').selectOption('rpReverse');await page.waitForFunction(()=>window.PilotDeskRoutePlanner.getPoints()[0]?.id==='B');await page.locator('#rpRouteActions').selectOption('rpUndo');await page.waitForFunction(()=>window.PilotDeskRoutePlanner.getPoints()[0]?.id==='A');
  for(const tool of ['tools','navlog','performance','weather','navigation','procedures','offline','sources']){await page.locator('#rpCanvasView').selectOption(tool);assert.equal(await page.locator('#rpPlanningTool').evaluate(el=>el.open),true);assert.equal(await page.locator('[data-view="'+tool+'"]').isVisible(),true,tool);await page.getByRole('button',{name:'Close planning tool',exact:true}).click();assert.equal((await bar()).scroll,false)}
  await page.locator('#rpLayersToggle').click();await page.getByRole('tab',{name:'Charts & layers'}).waitFor();
  assert.equal(await page.locator('#rpPublicSearch').count(),0);
  assert.equal(await page.locator('#rpLayerCharts>section').count(),2);
  assert.equal(await page.locator('#rpLayerCharts>section').nth(1).locator('input').first().getAttribute('aria-label'),'METARs');
  assert.equal(await page.locator('#rpRadarOpacity').count(),0);
  assert.equal(await page.locator('#rpLayersPanel input[type=range]:visible').count(),0);
  await page.getByRole('checkbox',{name:'Airways',exact:true}).check();await page.waitForFunction(()=>document.querySelector('[data-source-status="aero/airways"]')?.closest('[data-active]').dataset.active==='true');
  await page.getByRole('tab',{name:'Map settings'}).click();await page.getByLabel('Navigation level',{exact:true}).selectOption('high');
  await page.getByRole('tab',{name:'Charts & layers'}).click();
  await page.locator('[data-close-layers]').click();await page.locator('#rpLayersPanel').waitFor({state:'hidden'});
  for(const width of [320,390,768,1024,1365,1920]){await page.setViewportSize({width,height:900});assert.equal((await bar()).scroll,false,'No planning bar scrolling at '+width);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1&&document.documentElement.scrollHeight<=innerHeight+1));if(width>=1024)assert.ok((await bar()).height<=96);if(process.env.PILOTDESK_SCREENSHOT_DIR&&[390,1365].includes(width)){await page.waitForTimeout(650);await page.screenshot({path:path.join(process.env.PILOTDESK_SCREENSHOT_DIR,'flight-bar-'+width+'.png')})}}
  await page.setViewportSize({width:1365,height:900});await page.keyboard.press('Escape');assert.equal(await page.locator('#rpCanvasDrawer').isVisible(),false);
  assert.ok(directFAA>0);assert.deepEqual(errors,[]);
  console.log('Compact planner passed: 96px three-part desktop bar, no bar/page scrolling at six widths, aircraft and power persistence, route actions, ETA, all tool dialogs, four-control toolbar, unified layers and free PIREPs.');
}finally{await browser.close()}
