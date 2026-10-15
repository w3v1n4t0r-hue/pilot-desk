import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {stationLabel,number,airportCategory,airspaceBelow,navLevel,hazardMatches,safeBounds,faaQueryUrl} from '../assets/public-layer-core.mjs';
import {supported,sourceDescription} from '../assets/public-layers.mjs';
const require=createRequire(import.meta.url);
assert.equal(number(null),null);assert.equal(number(''),null);assert.equal(number(false),null);assert.equal(number(0),0);
assert.equal(stationLabel({temp:0,dewp:-2},'dewpointspread'),'2°C');
assert.equal(stationLabel({temp:null},'temperature'),null);
assert.equal(stationLabel({ceil:26},'ceiling'),'2600ft AGL');
assert.equal(stationLabel({visib:'6+'},'visibility'),'6+SM');
assert.equal(stationLabel({wspd:0,wdir:0},'surfacewind'),'000° 0kt');
assert.equal(stationLabel({wspd:null},'surfacewind'),null);
assert.equal(airportCategory({TYPE_CODE:'HP',PRIVATEUSE:0}),'heli');
assert.equal(airportCategory({TYPE_CODE:'AD',PRIVATEUSE:1}),'privateAP');
assert.equal(airspaceBelow({LOWER_VAL:200,LOWER_UOM:'FL',LOWER_CODE:'STD'},18000),false);
assert.equal(airspaceBelow({LOWER_VAL:20000,LOWER_UOM:'FT',LOWER_CODE:'AGL'},18000),true);
assert.equal(navLevel({US_HIGH:1},'high'),true);assert.equal(navLevel({US_HIGH:1},'low'),false);
assert.equal(hazardMatches({hazard:'TURB',base:24000,top:38000},['airSigmets/lowturb']),false);
assert.equal(hazardMatches({hazard:'TURB',base:24000,top:38000},['airSigmets/highturb']),true);
assert.equal(hazardMatches({hazard:'TURB'},['airSigmets/highturb']),false);
assert.equal(safeBounds({getWest:()=>179,getEast:()=>181,getSouth:()=>0,getNorth:()=>1}),null);
assert.equal(supported('traffic',true),false);assert.match(sourceDescription('traffic',true),/provider/);
assert.equal(supported('wxStations','temperature'),true);assert.equal(supported('wxImagery','icing_global'),false);
async function call(handler,query,method='GET'){const result={headers:{}};const res={setHeader(k,v){result.headers[k]=v},status(s){result.status=s;return this},json(j){result.body=j;return this}};await handler({method,query},res);return result}
const original=globalThis.fetch;
try{
  let requested=[];
  globalThis.fetch=async(url,options)=>{requested.push(String(url));if(String(url).includes('/query?'))return {ok:true,json:async()=>({type:'FeatureCollection',features:[],exceededTransferLimit:true})};return {ok:true,json:async()=>({editingInfo:{dataLastEditDate:Date.parse('2026-10-01T00:00:00Z')}})}};
  const map=require('../server/public-map.cjs');
  assert.equal((await call(map,{product:'http://evil',bbox:'47,-98,48,-97'})).status,400);
  assert.equal((await call(map,{product:'airports',bbox:'47,,-97,48'})).status,400);
  assert.equal((await call(map,{product:'airports',bbox:'20,-120,50,-60'})).status,400);
  const response=await call(map,{product:'airports',bbox:'47,-98,48,-97'});assert.equal(response.status,200);assert.equal(response.body.possiblyTruncated,true);assert.equal(response.body.sourceUpdatedAt,'2026-10-01T00:00:00.000Z');assert.equal(requested.length,2);
  await call(map,{product:'airports',bbox:'47,-98,48,-97'});assert.equal(requested.length,2);
  requested=[];
  globalThis.fetch=async url=>{requested.push(String(url));await new Promise(resolve=>setTimeout(resolve,5));return String(url).includes('/query?')?{ok:true,json:async()=>({type:'FeatureCollection',features:[]})}:{ok:false,status:503}};
  const duplicate=await Promise.all([call(map,{product:'sua',bbox:'46,-99,49,-96'}),call(map,{product:'sua',bbox:'46,-99,49,-96'})]);
  assert.equal(requested.length,2,'Concurrent views share one geometry request and one metadata request');
  assert.ok(duplicate.every(r=>r.status===200&&r.body.sourceUpdatedAt===null),'Metadata outage must not discard valid geometry');
  const aviation=require('../api/aviation-layers.js');assert.equal((await call(aviation,{adapter:'faa',product:'airports',bbox:'47,-98,48,-97'})).status,200);assert.equal((await call(aviation,{adapter:'constructor'})).status,400);
  const imagery=require('../server/public-imagery.cjs');globalThis.fetch=async()=>({ok:true,text:async()=>'<Layer><Name>conus_bref_qcd</Name><Dimension name="time" default="2026-10-14T20:00:00Z"></Dimension></Layer>'});const meta=await call(imagery,{product:'radar_lowest_tilt'});assert.equal(meta.status,200);assert.equal(meta.body.frameTime,'2026-10-14T20:00:00.000Z');assert.equal((await call(imagery,{product:'unlisted'})).status,400);
  const cultural=require('../server/public-cultural.cjs');assert.equal((await call(cultural,{product:'major_roads',bbox:'47,-98,48,-97'})).status,400);globalThis.fetch=async(url,options)=>{assert.equal(url,'https://overpass-api.de/api/interpreter');assert.match(options.body.get('data'),/out geom 500/);return {ok:true,json:async()=>({elements:[{type:'node',id:1,lat:47.95,lon:-97.19,tags:{place:'town',name:'Test'}}],osm3s:{timestamp_osm_base:'2026-10-14T20:00:00Z'}})}};const places=await call(cultural,{product:'place_labels',bbox:'47.94,-97.20,47.96,-97.18'});assert.equal(places.status,200);assert.equal(places.body.geojson.features.length,1);
  globalThis.fetch=async()=>({ok:false,status:503});assert.equal((await call(map,{product:'mtr',bbox:'47,-98,48,-97'})).status,502);
  assert.equal((await call(map,{},'POST')).status,405);
}finally{globalThis.fetch=original}
console.log('Public layer checks passed: missing values, units, airport types, altitude references, hazard bands, level filters, dateline bounds, provider allowlists, metadata times, partial results, caching and outages.');

// Actual FAA ATS routes use LEVEL_, while NAVAIDs/fixes use chart membership flags.
for(const level of ['low','high'])assert.equal(navLevel({LEVEL_:'B'},level),true);
assert.equal(navLevel({LEVEL_:'U'},'high'),true);assert.equal(navLevel({LEVEL_:'U'},'low'),false);
assert.equal(navLevel({LEVEL_:'L'},'low'),true);assert.equal(navLevel({LEVEL_:'L'},'high'),false);
assert.ok(!/verify current charts/i.test(sourceDescription('aero/suaMoa',true)));

const direct=new URL(faaQueryUrl('airways',[46,-99,49,-96]));assert.equal(direct.hostname,'services6.arcgis.com');assert.ok(direct.pathname.endsWith('/ATS_Route/FeatureServer/0/query'));assert.equal(direct.searchParams.get('geometry'),'-99,46,-96,49');assert.equal(direct.searchParams.get('resultRecordCount'),'2000');assert.throws(()=>faaQueryUrl('constructor',[46,-99,49,-96]));assert.throws(()=>faaQueryUrl('airways',[20,-120,50,-60]),/Zoom in/);

const G=require('../server/wind-grid.cjs');
const stations=[{station:'A',lat:48,lon:-98,direction:350,speed:20,temperature:0},{station:'B',lat:48,lon:-96,direction:10,speed:20,temperature:10}];
const blended=G.interpolate(stations,{lat:48,lon:-97});assert.ok(blended.direction<1||blended.direction>359);assert.ok(blended.speed>19&&blended.speed<20);assert.equal(blended.temperature,5);assert.deepEqual(blended.sources,['A','B']);assert.equal(G.interpolate(stations,{lat:30,lon:-80}),null);
const exact=G.interpolate(stations,{lat:48,lon:-98});assert.equal(exact.interpolated,false);assert.equal(exact.speed,20);
const winds=G.grid(stations,[47.99,-97.01,48.01,-96.99],6000);assert.equal(winds.length,9);assert.ok(winds.every(f=>f.properties.altitude===6000&&f.properties.interpolated));
console.log('Wind grid checks passed: vector interpolation, north crossing, exact station, range limit and close-up coverage.');
