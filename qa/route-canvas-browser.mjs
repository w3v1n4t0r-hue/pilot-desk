import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{chromium}=require('playwright');
const root=path.resolve(process.env.PILOTDESK_TEST_ROOT||'.');
const browser=await chromium.launch({headless:true,...(process.env.PILOTDESK_BROWSER_PATH?{executablePath:process.env.PILOTDESK_BROWSER_PATH}:{})});
try{
  const page=await browser.newPage({viewport:{width:1365,height:900}}),errors=[];
  await page.addInitScript(()=>localStorage.setItem('pd-aircraft',JSON.stringify([{id:'qa-aircraft',name:'Test aircraft',cruiseTas:105,fuelBurn:8}])));
  page.on('pageerror',error=>errors.push(error.stack||error.message));
  await page.route('**/*',route=>{
    const url=new URL(route.request().url());
    if(url.hostname==='unpkg.com')return route.fulfill({path:url.pathname.endsWith('.js')?process.env.PILOTDESK_LEAFLET_JS:process.env.PILOTDESK_LEAFLET_CSS});
    if(url.hostname!=='pd.test')return route.abort();
    if(url.pathname.startsWith('/api/'))return route.fulfill({status:503,contentType:'application/json',body:'{"error":"Test feed unavailable"}'});
    const file=path.resolve(root,'.'+url.pathname);
    if(!file.startsWith(root+path.sep)||!fs.existsSync(file))return route.fulfill({status:404,body:''});
    return route.fulfill({path:file,contentType:/\.(?:mjs|js)$/.test(file)?'application/javascript':file.endsWith('.json')?'application/json':file.endsWith('.css')?'text/css':file.endsWith('.html')?'text/html':undefined});
  });
  await page.goto('https://pd.test/route-planner.html');
  await page.locator('body.rp-canvas-ready').waitFor();
  async function geometry(){return page.evaluate(()=>{const b=document.getElementById('rpMap').getBoundingClientRect();return {x:b.x,y:b.y,width:b.width,height:b.height,bottom:b.bottom,outerWidth:innerWidth,outerHeight:innerHeight,scrollWidth:document.documentElement.scrollWidth,scrollHeight:document.documentElement.scrollHeight}})}
  let g=await geometry();assert.equal(g.x,0);assert.equal(g.width,g.outerWidth);assert.ok(Math.abs(g.bottom-g.outerHeight)<2);assert.ok(g.height>=g.outerHeight-110);assert.ok(g.scrollHeight<=g.outerHeight+1);
  await page.locator('#rpEditorToggle').click();assert.equal(await page.locator('#rpCanvasDrawer').isVisible(),true);
  await page.locator('#rpAircraft').waitFor();assert.equal(await page.locator('.rp-plan-settings #rpAircraft').count(),1);
  await page.locator('#rpAircraft').selectOption('qa-aircraft');assert.equal(await page.locator('#rpTas').inputValue(),'105');assert.equal(await page.locator('#rpBurn').inputValue(),'8');
  for(const id of ['rpTas','rpBurn','rpPhase_cruiseAltitude','rpDepartureUtc'])assert.equal(await page.locator('.rp-plan-settings #'+id).count(),1);
  await page.locator('#rpDepartureUtc').fill('2026-10-15T15:00');
  async function dropdownGeometry(){const box=await page.locator('#rpCanvasDrawer').boundingBox(),chart=await geometry();assert.ok(box.y+box.height<=chart.y+1,'Dropdown must push the chart below it');assert.ok(box.height<=340,'Dropdown is bounded');assert.ok(chart.height>100,'Chart remains usable');assert.ok(Math.abs(chart.bottom-chart.outerHeight)<2,'Opened dropdown leaves the full chart visible');assert.ok(Math.abs(box.x+box.width/2-chart.outerWidth/2)<2,'Dropdown is centered')}
  await dropdownGeometry();
  await page.locator('#rpRoute').fill('A,47.95,-97.18 B,46.88,-96.79');await page.locator('#rpBuild').click();
  await page.waitForFunction(()=>window.PilotDeskRoutePlanner.getPoints().length===2);
  assert.notEqual(await page.locator('#rpSummaryDistance').textContent(),'— NM');
  await page.waitForFunction(()=>document.getElementById('rpSummaryEta').textContent!=='—');
  const expectedEta=await page.evaluate(()=>new Date(Date.parse('2026-10-15T15:00Z')+window.pdNavlogResult.totalHours*3600000).toISOString().slice(11,16)+'Z');assert.equal(await page.locator('#rpSummaryEta').textContent(),expectedEta);
  const totalsBox=await page.locator('.rp-plan-totals').boundingBox(),routeBox=await page.locator('#rpRoute').boundingBox();assert.ok(totalsBox.y>routeBox.y,'Totals form a separate bottom strip');
  await page.locator('#rpReverse').click();await page.waitForFunction(()=>window.PilotDeskRoutePlanner.getPoints()[0]?.id==='B');
  await page.locator('#rpUndo').click();await page.waitForFunction(()=>window.PilotDeskRoutePlanner.getPoints()[0]?.id==='A');
  await page.locator('#rpRedo').click();await page.waitForFunction(()=>window.PilotDeskRoutePlanner.getPoints()[0]?.id==='B');
  await page.locator('#rpUndo').click();await page.waitForFunction(()=>window.PilotDeskRoutePlanner.getPoints()[0]?.id==='A');
  for(const view of ['navlog','performance','weather','navigation','procedures','offline','sources','route']){await page.locator('#rpCanvasView').selectOption(view);assert.equal(await page.locator('[data-view="'+view+'"]').isVisible(),true);assert.ok((await geometry()).scrollHeight<=900);await dropdownGeometry()}
  await page.locator('#rpCanvasView').selectOption('navlog');assert.match(await page.locator('#rpNavlog').textContent(),/A|B/);
  await page.keyboard.press('Escape');assert.equal(await page.locator('#rpCanvasDrawer').isVisible(),false);assert.equal(await page.locator('#rpEditorToggle').evaluate(el=>el===document.activeElement),true);
  await page.locator('#rpPublicLayersToggle').click();await page.locator('[data-public-layer]').first().waitFor();assert.equal(await page.locator('[data-public-layer]').count(),51);
  await page.locator('#rpPublicSearch').fill('temperature');assert.equal(await page.locator('[data-public-layer]').count(),1);await page.keyboard.press('Escape');
  await page.locator('#rpEditorToggle').focus();await page.keyboard.press('ArrowDown');assert.equal(await page.locator('#rpRouteEditor').isVisible(),true);await page.locator('#rpMap').click({position:{x:150,y:80}});assert.equal(await page.locator('#rpCanvasDrawer').isVisible(),false);
  await page.locator('#rpLayersToggle').click();assert.equal(await page.locator('#rpLayersPanel').isVisible(),true);await page.keyboard.press('Escape');
  for(const width of [320,360,390,430,768,1365,1920]){await page.setViewportSize({width,height:900});g=await geometry();assert.ok(g.scrollWidth<=width+1,'Horizontal page overflow at '+width);assert.ok(g.scrollHeight<=900,'Vertical page overflow at '+width);assert.equal(g.x,0);assert.ok(Math.abs(g.width-width)<2);assert.ok(Math.abs(g.bottom-900)<2);assert.ok(g.height>=790,'Map loses space at '+width);await page.locator('#rpEditorToggle').click();const box=await page.locator('#rpCanvasDrawer').boundingBox();assert.ok(box.x>=0&&box.x+box.width<=width+1);assert.ok(box.y>=0&&box.y+box.height<=901);await dropdownGeometry();if(process.env.PILOTDESK_SCREENSHOT_DIR&&[390,1365].includes(width))await page.screenshot({path:path.join(process.env.PILOTDESK_SCREENSHOT_DIR,'route-dropdown-open-'+width+'.png')});await page.keyboard.press('Escape');if(process.env.PILOTDESK_SCREENSHOT_DIR&&[390,1365].includes(width)){await page.screenshot({path:path.join(process.env.PILOTDESK_SCREENSHOT_DIR,'route-canvas-'+width+'.png')})}}
  for(const size of [{width:390,height:640},{width:844,height:390}]){await page.setViewportSize(size);g=await geometry();assert.ok(g.scrollHeight<=size.height+1);assert.ok(Math.abs(g.bottom-size.height)<2);await page.locator('#rpEditorToggle').click();await page.locator('#rpCanvasView').selectOption('performance');await dropdownGeometry();await page.locator('[data-view="performance"]').evaluate(el=>{el.scrollTop=el.scrollHeight});assert.equal(await page.evaluate(()=>scrollY),0);await page.keyboard.press('Escape')}
  await page.setViewportSize({width:1365,height:900});await page.locator('#rpFullscreen').click();await page.waitForTimeout(100);g=await geometry();assert.ok(g.height>840);await page.locator('#rpFullscreen').click();
  await page.emulateMedia({media:'print'});assert.equal(await page.locator('#rpNavlog').isVisible(),true);await page.emulateMedia({media:'screen'});
  await page.addInitScript(()=>Object.defineProperty(window,'devicePixelRatio',{value:3}));await page.reload();await page.locator('body.rp-canvas-ready').waitFor();
  const chartDetail=await page.evaluate(()=>{const layers=[];window.PilotDeskRoutePlanner.getMap().eachLayer(l=>{if(l._url?.includes('/VFR_Sectional/MapServer/tile/'))layers.push({size:l.getTileSize().x,offset:l.options.zoomOffset,max:l.options.maxNativeZoom,opacity:l.options.opacity})});return layers});
  assert.deepEqual(chartDetail,[{size:64,offset:2,max:10,opacity:1}]);
  assert.deepEqual(errors,[]);
  console.log('Canvas checks passed: full-width/full-height chart, no page scroll, route build/navlog, nine planning views, 51 public controls, native layers, Escape/focus and seven viewport widths.');
}finally{await browser.close()}

