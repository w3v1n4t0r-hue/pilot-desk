import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import fs from 'node:fs';
import vm from 'node:vm';
const D=createRequire(import.meta.url)('../assets/map-density.js');
const point=(x,y,priority)=>({type:'Feature',geometry:{type:'Point',coordinates:[x,y]},properties:{priority}});
const reports=[point(1,1,0),point(2,2,3),point(100,100,1)];
const groups=D.group(reports,c=>({x:c[0],y:c[1]}),40,f=>f.properties.priority);
assert.equal(groups.length,2);assert.equal(groups[0].feature,reports[1]);
assert.equal(groups.flatMap(g=>g.members).length,3);
assert.equal(D.group(reports,c=>({x:c[0]*100,y:c[1]*100}),40).length,3);
const polygon={geometry:{type:'Polygon',coordinates:[]}};
assert.equal(D.group([polygon],()=>{throw Error('Nonpoints must not project');},40)[0].feature,polygon);
assert.equal(D.routeBounds([{lat:47,lon:-97},{lat:49,lon:-94}]),'46.000,-98.000,50.000,-93.000');
assert.equal(D.routeBounds([{lat:0,lon:179},{lat:1,lon:-179}]),null);
assert.equal(D.routeBounds([{lat:91,lon:0},{lat:1,lon:1}]),null);
// Verify the actual route intersection helper does not flag separated collinear edges.
const source=fs.readFileSync('assets/efb-layers.js','utf8');
const helpers=source.slice(source.indexOf('  function orient('),source.indexOf('  function pointInRing('));
const intersects=vm.runInNewContext(helpers+';intersects');
assert.equal(intersects({x:0,y:0},{x:1,y:0},{x:2,y:0},{x:3,y:0}),false);
assert.equal(intersects({x:0,y:0},{x:3,y:0},{x:2,y:0},{x:4,y:0}),true);
assert.equal(intersects({x:0,y:0},{x:2,y:2},{x:0,y:2},{x:2,y:0}),true);
console.log('Map density checks passed: all group members retained, highest priority shown, zoom separation, full-route bounds, and segment intersections.');

// Actual advisory requests use route bounds and ignore obsolete responses.
const advisorySource=source.slice(source.indexOf('  async function loadRouteAdvisory('),source.indexOf('  function alternateReview('));
let complete,requestUrl='';
const advisoryContext={window:{PilotDeskMapDensity:D},RP:{getPoints:()=>[{lat:47,lon:-97},{lat:49,lon:-94}]},routeContextSeq:1,briefStatus:{},briefData:{},briefTime:{},fetchJson:async url=>{requestUrl=url;return await new Promise(resolve=>complete=resolve);}};
vm.createContext(advisoryContext);vm.runInContext(advisorySource,advisoryContext);
const request=vm.runInContext("loadRouteAdvisory('tfr',1)",advisoryContext);
assert.match(decodeURIComponent(requestUrl),/bbox=46.000,-98.000,50.000,-93.000/);
advisoryContext.routeContextSeq=2;complete({geojson:{features:[polygon]}});await request;
assert.equal(advisoryContext.briefData.tfr,undefined);
advisoryContext.fetchJson=async()=>{throw Error('Test outage');};await vm.runInContext("loadRouteAdvisory('tfr',2)",advisoryContext);assert.equal(advisoryContext.briefStatus.tfr,'unavailable');
console.log('Route coverage checks passed: route bounds used, obsolete responses ignored, and outages identified.');

const airportDensity = (await import('../assets/map-density.js')).default;
assert.equal(airportDensity.publicAirport({properties:{PRIVATEUSE:0,TYPE_CODE:'AD'}}),true);
assert.equal(airportDensity.publicAirport({properties:{PRIVATEUSE:'0',TYPE_CODE:'AD'}}),true);
assert.equal(airportDensity.publicAirport({properties:{PRIVATEUSE:1,TYPE_CODE:'AD'}}),false);
assert.equal(airportDensity.publicAirport({properties:{PRIVATEUSE:0,TYPE_CODE:'HP'}}),false);
assert.equal(airportDensity.publicAirport({properties:{TYPE_CODE:'AD'}}),false);
console.log('Public-use airport filtering passed');

const faaSource=fs.readFileSync('api/faa-map-features.js','utf8');
const faaContext=vm.createContext({module:{exports:{}},AbortController,setTimeout,clearTimeout,URLSearchParams,fetch:async url=>{assert.ok(url.includes('ids=KGFK%2CKHCO%2CKXXX'));return {ok:true,status:200,json:async()=>[{icaoId:'KGFK',source:'FAA',tower:'T'},{icaoId:'KHCO',source:'FAA',tower:null}]};}});
vm.runInContext(faaSource,faaContext);
const towerFeatures={features:['KGFK','KHCO','KXXX'].map(ICAO_ID=>({properties:{ICAO_ID}}))};
await faaContext.addTowerStatus(towerFeatures);
assert.deepEqual(towerFeatures.features.map(f=>f.properties.towerStatus),['towered','non-towered','unknown']);
faaContext.fetch=async()=>{throw Error('upstream outage');};
await faaContext.addTowerStatus(towerFeatures);
assert.ok(towerFeatures.features.every(f=>f.properties.towerStatus==='unknown'));
console.log('Tower lookup join and unavailable-data fallback passed');

// Reproduce a zoom-out while an airport request is still in flight.
const ensureSource=source.slice(source.indexOf('  async function ensureData('),source.indexOf('  function toggleLayer('));
let resolveZoomRequest,zoom=8,rendered=0,cleared=0;
const zoomContext={endpointFor:()=>'/airports',MIN_ZOOM:{airports:6},map:{getZoom:()=>zoom},setLayerStatus:()=>{},groups:{airports:{clearLayers:()=>cleared++}},data:{},lastFetch:{},dataTime:{},dataPending:{},fetchSeq:{},dataStatus:{},dataBounds:{},AbortController,metarBoundsString:()=> '0,0,1,1',weatherBoundsContain:()=>false,getBoundsString:()=> 'test',fetchJson:()=>new Promise(resolve=>resolveZoomRequest=resolve),state:{enabled:{airports:true}},renderGeoLayer:()=>rendered++,renderBrief:()=>{},Date};
vm.createContext(zoomContext);vm.runInContext(ensureSource,zoomContext);
const pendingZoom=vm.runInContext("ensureData('airports',false)",zoomContext);
zoom=4;await vm.runInContext("ensureData('airports',false)",zoomContext);
resolveZoomRequest({geojson:{features:[]}});await pendingZoom;
assert.equal(rendered,0);assert.equal(cleared,1);
console.log('Zoom-out race passed: obsolete airport response cannot restore hidden symbols.');

// Weather observations retain their real coordinates even at national scale.
const weatherRender=source.slice(source.indexOf('  function renderGeoLayer('),source.indexOf('  function refreshVectorStyles('));
let weatherDisplayed;
const weatherContext={ensureGroup:()=>({clearLayers(){}}),map:{getZoom:()=>4},window:{PilotDeskMapDensity:{group(){throw Error('Weather must not cluster');}}},state:{},paneFor:()=> 'weather',styleFor:()=>({}),pointFor:()=>({}),popupFor:()=>'',L:{geoJSON:(features)=>{weatherDisplayed=features;return {addTo(){}};}}};
vm.createContext(weatherContext);vm.runInContext(weatherRender,weatherContext);
weatherContext.observations={type:'FeatureCollection',features:reports};
vm.runInContext("renderGeoLayer('metar',observations)",weatherContext);
assert.equal(weatherDisplayed.features.length,reports.length);
assert.deepEqual(weatherDisplayed.features.map(f=>f.geometry.coordinates),reports.map(f=>f.geometry.coordinates));
assert.ok(weatherDisplayed.features.every(f=>f.properties._pdMembers===null));
console.log('Weather station coordinates retained without clustering at national zoom.');

// Legacy preferences cannot restore duplicate airport boxes, while METARs stay enabled.
const settingsCode=source.slice(source.indexOf('  const DEFAULTS='),source.indexOf('  const briefData='));
const settingsContext={localStorage:{getItem:()=>JSON.stringify({enabled:{airports:true,metar:true,radar:true}})}};
vm.createContext(settingsContext);
assert.equal(vm.runInContext(settingsCode+';state.enabled.airports',settingsContext),false);
assert.equal(vm.runInContext('state.enabled.metar',settingsContext),true);
assert.equal(vm.runInContext('state.enabled.radar',settingsContext),true);

// Airport close-ups fetch neighboring reporting stations without moving weather dots.
const boundsCode=source.slice(source.indexOf('  function metarBoundsString('),source.indexOf('  function paneFor('));
let queryBounds={south:47.939,west:-97.181,north:47.945,east:-97.175};
const boundsContext={map:{getBounds:()=>({getSouth:()=>queryBounds.south,getWest:()=>queryBounds.west,getNorth:()=>queryBounds.north,getEast:()=>queryBounds.east})},getBoundsString:()=>Object.values(queryBounds).join(','),AWC:new Set(['metar','pirep']),FAA:new Set(['airports','fixes'])};
vm.createContext(boundsContext);vm.runInContext(boundsCode,boundsContext);
assert.equal(vm.runInContext("endpointFor('airports')",boundsContext),null);
assert.match(decodeURIComponent(vm.runInContext("endpointFor('metar')",boundsContext)),/bbox=47.692,-97.428,48.192,-96.928/);
assert.match(decodeURIComponent(vm.runInContext("endpointFor('pirep')",boundsContext)),/bbox=47.939,-97.181,47.945,-97.175/);
queryBounds={south:20,west:-130,north:55,east:-60};
assert.equal(vm.runInContext('metarBoundsString()',boundsContext),'20.000,-130.000,55.000,-60.000');
console.log('Close-up weather bounds and legacy airport overlay removal passed.');

// Zoom changes resize existing canvas weather markers instead of recreating them.
const resizeCode=source.slice(source.indexOf('  function resizeWeatherDots('),source.indexOf('  function refreshVectorStyles('));
let radiusChanges=[],detailZoom=6;
const weatherMarkers=[{setRadius:r=>radiusChanges.push(r)},{setRadius:r=>radiusChanges.push(r)}];
const resizeContext={map:{getZoom:()=>detailZoom},groups:{metar:{eachLayer:fn=>fn({eachLayer:fn=>weatherMarkers.forEach(fn)})}}};
vm.createContext(resizeContext);vm.runInContext(resizeCode,resizeContext);
vm.runInContext('resizeWeatherDots()',resizeContext);assert.deepEqual(radiusChanges,[4,4]);
detailZoom=14;radiusChanges=[];vm.runInContext('resizeWeatherDots()',resizeContext);assert.deepEqual(radiusChanges,[6,6]);
console.log('Close-up weather marker resize preserves existing layers.');

// Close-up pan/zoom reuses only contained, recent weather; refresh and age force a request.
const containCode=source.slice(source.indexOf('  function weatherBoundsContain('),source.indexOf('  function endpointFor('));
vm.runInContext(containCode,zoomContext);
zoom=12;let weatherRequests=0;
zoomContext.MIN_ZOOM.metar=3;zoomContext.state.enabled.metar=true;
zoomContext.endpointFor=()=>'/metar';zoomContext.getBoundsString=()=> '47.94,-97.18,47.95,-97.17';
zoomContext.metarBoundsString=()=> '47.69,-97.43,48.20,-96.92';
zoomContext.data.metar={features:[]};zoomContext.dataBounds.metar=[47.69,-97.43,48.20,-96.92];zoomContext.dataTime.metar=Date.now();zoomContext.lastFetch.metar='/previous';
zoomContext.fetchJson=async()=>{weatherRequests++;return {geojson:{features:[]}};};
await vm.runInContext("ensureData('metar',false)",zoomContext);assert.equal(weatherRequests,0);
zoomContext.getBoundsString=()=> '48.3,-97.18,48.4,-97.17';
await vm.runInContext("ensureData('metar',false)",zoomContext);assert.equal(weatherRequests,1);
zoomContext.dataTime.metar=Date.now()-61000;
await vm.runInContext("ensureData('metar',false)",zoomContext);assert.equal(weatherRequests,2);
delete zoomContext.lastFetch.metar;
await vm.runInContext("ensureData('metar',false)",zoomContext);assert.equal(weatherRequests,3);
let oldSignal,finishOld;
zoomContext.fetchJson=(_url,controller)=>{oldSignal=controller.signal;return new Promise(resolve=>finishOld=resolve);};
delete zoomContext.lastFetch.metar;
const oldWeather=vm.runInContext("ensureData('metar',false)",zoomContext);
zoomContext.endpointFor=()=>'/metar-next';zoomContext.fetchJson=async()=>({geojson:{features:[]}});
await vm.runInContext("ensureData('metar',false)",zoomContext);assert.equal(oldSignal.aborted,true);
finishOld({geojson:{features:[{obsolete:true}]}});await oldWeather;
assert.equal(zoomContext.data.metar.features.length,0);
console.log('Contained weather reuse, freshness, manual refresh, and obsolete-request cancellation passed.');
