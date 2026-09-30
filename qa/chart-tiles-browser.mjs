import {createRequire} from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const {chromium}=createRequire(import.meta.url)('playwright'),root=process.cwd();
const browser=await chromium.launch({headless:true,...(process.env.HTTPS_PROXY?{proxy:{server:process.env.HTTPS_PROXY}}:{})});
try{
 const page=await browser.newPage({ignoreHTTPSErrors:true,viewport:{width:1365,height:900},deviceScaleFactor:2});
 const errors=[],requests=[];
 await page.addInitScript(()=>{window.pdChartLongTasks=[];new PerformanceObserver(list=>window.pdChartLongTasks.push(...list.getEntries().map(e=>e.duration))).observe({type:'longtask',buffered:true})});
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',async route=>{
  const u=new URL(route.request().url());
  if(u.hostname==='unpkg.com')return route.fulfill({path:u.pathname.endsWith('.js')?process.env.PILOTDESK_LEAFLET_JS:process.env.PILOTDESK_LEAFLET_CSS});
  if(u.hostname==='tiles.arcgis.com'||u.hostname==='services.arcgisonline.com'){requests.push(u.href);const fixture=process.env.PILOTDESK_CHART_TILE_FIXTURE;if(fixture)return route.fulfill({path:fixture,contentType:'image/jpeg'});return route.continue();}
  if(u.pathname.startsWith('/api/'))return route.fulfill({contentType:'application/json',body:JSON.stringify({geojson:{type:'FeatureCollection',features:[]}})});
  if(u.hostname!=='pd.test')return route.abort();
  const file=path.join(root,u.pathname==='/'?'index.html':u.pathname);
  return fs.existsSync(file)?route.fulfill({path:file,contentType:file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':file.endsWith('.html')?'text/html':undefined}):route.fulfill({status:404,body:''});
 });
 await page.addInitScript(()=>localStorage.setItem('pd-efb-layers',JSON.stringify({baseMode:'sectional',enabled:{radar:false,metar:false,pirep:false,airports:false,navaids:false,fixes:false,obstacles:false,tfr:false,notams:false}})));
 await page.goto('https://pd.test/route-planner.html');
 await page.waitForFunction(()=>window.PilotDeskRoutePlanner?.getMap());
 await page.waitForFunction(()=>document.querySelectorAll('.leaflet-tile-loaded').length>0);
 assert.equal(requests.filter(x=>x.includes('tiles.arcgis.com')).length,0,'Wide overview must not fan out to thousands of FAA tiles');
 assert.ok(requests.length<50,'Overview tile requests bounded');
 const layers=()=>page.evaluate(()=>{const a=[];window.PilotDeskRoutePlanner.getMap().eachLayer(l=>{if(l._url)a.push({url:l._url,options:{tileSize:l.options.tileSize,zoomOffset:l.options.zoomOffset,minZoom:l.options.minZoom,maxNativeZoom:l.options.maxNativeZoom},tiles:Object.keys(l._tiles||{}).length})});return a});
 for(const [key,center,zoom,maxSource] of [['sectional',[47.95,-97.18],11,12],['terminal',[44.9,-93.2],11,12],['low',[47.95,-97.18],11,12],['high',[47.95,-97.18],8,9]]){
  await page.evaluate(({key,center,zoom})=>{const P=window.PilotDeskRoutePlanner;P.setChart(key);P.getMap().setView(center,zoom,{animate:false})},{key,center,zoom});
  await page.waitForFunction(()=>[...document.querySelectorAll('.leaflet-tile-loaded')].some(t=>t.src.includes('tiles.arcgis.com')));
  const current=(await layers()).find(l=>l.url.includes('tiles.arcgis.com'));
  assert.equal(current.options.tileSize,128);assert.equal(current.options.maxNativeZoom+current.options.zoomOffset,maxSource);assert.ok(current.tiles<=160,'Retained chart tiles bounded');
  if(key==='sectional'){await page.locator('#rpMap').screenshot({path:'/tmp/pd-sharp-sectional.png'});await page.evaluate(()=>window.PilotDeskRoutePlanner.getMap().setZoom(14,{animate:false}));await page.waitForFunction(()=>document.querySelector('#rpMapStatus').textContent.includes('full source detail'));}
 }
 const sourceMax={VFR_Sectional:12,VFR_Terminal:12,IFR_AreaLow:12,IFR_High:9},sourceMin={VFR_Sectional:8,VFR_Terminal:10,IFR_AreaLow:7,IFR_High:5};
 for(const url of requests){const m=url.match(/services\/(VFR_Sectional|VFR_Terminal|IFR_AreaLow|IFR_High)\/MapServer\/tile\/(\d+)/);if(m){assert.ok(Number(m[2])<=sourceMax[m[1]]);assert.ok(Number(m[2])>=sourceMin[m[1]])}}
 await page.evaluate(()=>{const P=window.PilotDeskRoutePlanner;P.setChart('sectional');P.getMap().setView([47.95,-97.18],11,{animate:false});for(let i=0;i<20;i++)P.getMap().panBy([4,0],{animate:false})});
 const bounded=(await layers()).find(l=>l.url.includes('tiles.arcgis.com'));assert.ok(bounded.tiles<180,'Repeated pans retain a bounded tile set');
 for(const width of [320,390,768,1365]){await page.setViewportSize({width,height:900});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));}
 await page.evaluate(()=>{Object.defineProperty(navigator,'deviceMemory',{configurable:true,value:2});window.PilotDeskRoutePlanner.setChart('sectional')});
 const constrained=(await layers()).find(l=>l.url.includes('tiles.arcgis.com'));assert.equal(constrained.options.tileSize,256);
 await page.evaluate(()=>window.PilotDeskRoutePlanner.getMap().eachLayer(l=>{if(l._url?.includes('tiles.arcgis.com')){l.fire('tileerror');l.fire('load')}}));
 assert.ok((await page.textContent('#rpMapStatus')).includes('unavailable'),'Failed tiles must not be reported live');
 const longestTask=await page.evaluate(()=>Math.max(0,...window.pdChartLongTasks));assert.ok(longestTask<500,'Chart interaction froze the main thread');
 assert.deepEqual(errors,[]);
 console.log(JSON.stringify({result:'Chart browser checks passed',tileDelivery:process.env.PILOTDESK_CHART_TILE_FIXTURE?'Recorded FAA tile fixture':'Live upstream',requests:requests.length,longestTaskMs:Math.round(longestTask),retainedAfterPans:bounded.tiles,checks:'FAA image decoding, all four charts, overview request bounds, source zoom limits, overzoom, panning, mobile widths, no runtime errors'}));
}finally{await browser.close()}
