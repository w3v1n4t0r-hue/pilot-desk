import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import fs from 'node:fs';
const T=createRequire(import.meta.url)('../assets/chart-tiles.js');
for(const chart of Object.values(T.charts)){
 for(const env of [{width:800,height:600},{width:390,height:600},{width:3840,height:2160},{memory:2},{connection:{saveData:true}},{connection:{effectiveType:'2g'}}]){
  const o=T.options(chart,env),offset=o.zoomOffset;
  assert.equal(o.tileSize,offset?128:256);
  assert.equal(o.minZoom+offset,chart.minNativeZoom);
  assert.equal(o.maxNativeZoom+offset,chart.maxNativeZoom);
  // Every source request stays within the real cache, including overzoom.
  for(let view=o.minZoom;view<=14;view++)assert.ok(Math.min(view,o.maxNativeZoom)+offset<=chart.maxNativeZoom);
  assert.equal(o.keepBuffer,1);assert.equal(o.updateWhenIdle,true);assert.equal(o.updateWhenZooming,false);
 }
}
assert.equal(T.options(T.charts.sectional,{width:800,height:600}).tileSize,128);
for(const env of [{width:3840,height:2160},{memory:2},{connection:{saveData:true}},{connection:{effectiveType:'slow-2g'}}])assert.equal(T.options(T.charts.sectional,env).tileSize,256);
const html=fs.readFileSync('route-planner.html','utf8');
assert.ok(html.indexOf('/assets/chart-tiles.js')<html.indexOf('/assets/route-planner.js'));
console.log('Chart tile checks passed: source limits, sharp density, constrained-device fallback, bounded buffering and script order.');

// Georeferenced overviews persist beneath detailed tiles without recreating images on every zoom.
const {default:vm}=await import('node:vm');
const planner=fs.readFileSync('assets/route-planner.js','utf8');
const overviewCode=planner.slice(planner.indexOf('function syncOverview(){'),planner.indexOf('async function loadChartOverview'));
let selected='sectional',created=0,removed=0,status='';
const bounds=[[23,-126],[51,-65]];
const context={map:{hasLayer:()=>false,removeLayer:()=>removed++,getZoom:()=>4},tile:{options:{minZoom:7}},overview:{addTo(){}},chartOverview:null,overviewKey:null,overviewManifest:{sectional:{url:'/sectional.webp',bounds,generatedAt:'2026-10-03',sourceUpdated:'Source edition'},low:{url:'/low.webp',bounds,generatedAt:'2026-10-03'}},localStorage:{getItem:()=>selected},L:{imageOverlay:(url,b,o)=>{assert.equal(b,bounds);assert.equal(o.pane,'pdChartOverviewPane');created++;return {addTo:()=>({})};}},$:()=>null,CHARTS:{sectional:{label:'Sectional'},low:{label:'Low'}},setMapStatus:s=>status=s};
vm.createContext(context);vm.runInContext(overviewCode,context);
vm.runInContext('syncOverview();syncOverview()',context);
assert.equal(created,1);assert.match(status,/generated 2026-10-03/);
selected='low';vm.runInContext('syncOverview()',context);
assert.equal(created,2);assert.equal(removed,1);
console.log('Chart overview bounds, persistent layers, date labeling and chart switching passed.');

assert.ok(planner.includes("geographicPane.style.zIndex='180'"));
assert.ok(planner.includes("overviewPane.style.zIndex='190'"));
assert.ok(planner.includes("pane:'pdGeographicPane'"));
