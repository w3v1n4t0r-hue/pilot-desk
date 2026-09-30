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
