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
const B=createRequire(import.meta.url)('../assets/route-brief-core.js');
const intersects=(a,b,c,d)=>B.relationToRoute({geometry:{type:'LineString',coordinates:[[c.x,c.y],[d.x,d.y]]}},[{lon:a.x,lat:a.y},{lon:b.x,lat:b.y}]).intersects;
assert.equal(intersects({x:0,y:0},{x:1,y:0},{x:2,y:0},{x:3,y:0}),false);
assert.equal(intersects({x:0,y:0},{x:3,y:0},{x:2,y:0},{x:4,y:0}),true);
assert.equal(intersects({x:0,y:0},{x:2,y:2},{x:0,y:2},{x:2,y:0}),true);
console.log('Map density checks passed: all group members retained, highest priority shown, zoom separation, full-route bounds, and segment intersections.');

// Actual advisory requests use route bounds and ignore obsolete responses.
const advisorySource=source.slice(source.indexOf('  async function loadRouteAdvisory('),source.indexOf('  function alternateReview('));
let complete,requestUrl='';
const advisoryContext={window:{PilotDeskMapDensity:D},RP:{getPoints:()=>[{lat:47,lon:-97},{lat:49,lon:-94}]},routeContextSeq:1,briefStatus:{},briefData:{},briefTime:{},renderBrief:()=>{},B:{requestLayer:async(key,bbox)=>{requestUrl='?bbox='+bbox;return await new Promise(resolve=>complete=resolve);}}};
vm.createContext(advisoryContext);vm.runInContext(advisorySource,advisoryContext);
const request=vm.runInContext("loadRouteAdvisory('tfr',1)",advisoryContext);
assert.match(decodeURIComponent(requestUrl),/bbox=46.000,-98.000,50.000,-93.000/);
advisoryContext.routeContextSeq=2;complete({geojson:{features:[polygon]}});await request;
assert.equal(advisoryContext.briefData.tfr,undefined);
advisoryContext.B.requestLayer=async()=>{throw Error('Test outage');};await vm.runInContext("loadRouteAdvisory('tfr',2)",advisoryContext);assert.equal(advisoryContext.briefStatus.tfr,'unavailable');
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
const zoomContext={PRO_LAYERS:new Set(['pirep','gairmet','airsigmet','cwa']),hasFeature:()=>true,endpointFor:()=>'/airports',MIN_ZOOM:{airports:6},map:{getZoom:()=>zoom},setLayerStatus:()=>{},groups:{airports:{clearLayers:()=>cleared++}},data:{},lastFetch:{},dataTime:{},dataPending:{},fetchSeq:{},dataStatus:{},dataBounds:{},AbortController,metarBoundsString:()=> '0,0,1,1',weatherBoundsContain:()=>false,getBoundsString:()=> 'test',fetchJson:()=>new Promise(resolve=>resolveZoomRequest=resolve),state:{enabled:{airports:true}},renderGeoLayer:()=>rendered++,renderBrief:()=>{},Date};
vm.createContext(zoomContext);vm.runInContext(ensureSource,zoomContext);
const pendingZoom=vm.runInContext("ensureData('airports',false)",zoomContext);
zoom=4;await vm.runInContext("ensureData('airports',false)",zoomContext);
resolveZoomRequest({geojson:{features:[]}});await pendingZoom;
assert.equal(rendered,0);assert.equal(cleared,1);
console.log('Zoom-out race passed: obsolete airport response cannot restore hidden symbols.');

// Weather refresh retains marker identity and the true station coordinates.
const weatherRender=source.slice(source.indexOf('  function renderGeoLayer('),source.indexOf('  function refreshVectorStyles('));
const displayed=new Set(),created=[];
const weatherContext={PRO_LAYERS:new Set(['pirep','gairmet','airsigmet','cwa']),hasFeature:()=>true,weatherMarkers:new Map(),ensureGroup:()=>({hasLayer:m=>displayed.has(m),addLayer:m=>displayed.add(m),removeLayer:m=>displayed.delete(m)}),map:{getZoom:()=>4},window:{PilotDeskChartSymbols:{metarCategory:()=> 'VFR'}},esc:String,field:(p,names)=>names.map(n=>p[n]).find(Boolean)||'',state:{},styleFor:()=>({}),popupFor:(_key,f)=>f.properties.rawOb,pointFor:(_key,f,ll)=>{const m={ll,bindPopup(fn){this.popup=fn},bindTooltip(){},setStyle(){},setRadius(){},setTooltipContent(){},isPopupOpen:()=>true,setPopupContent(fn){this.popup=fn}};created.push(m);return m;},L:{latLng:(lat,lng)=>({lat,lng})}};
vm.createContext(weatherContext);vm.runInContext(weatherRender,weatherContext);
weatherContext.observations={type:'FeatureCollection',features:[point(-97,48,0),point(-96,47,1)]};
vm.runInContext("renderGeoLayer('metar',observations)",weatherContext);
assert.equal(created.length,2);assert.deepEqual(created.map(m=>[m.ll.lng,m.ll.lat]),[[-97,48],[-96,47]]);
weatherContext.observations.features[0].properties.rawOb='Updated report';
vm.runInContext("renderGeoLayer('metar',observations)",weatherContext);
assert.equal(created.length,2);assert.equal(created[0].popup(),'Updated report');
weatherContext.observations.features.pop();vm.runInContext("renderGeoLayer('metar',observations)",weatherContext);assert.equal(displayed.size,1);
console.log('Weather coordinates and marker identity retained through report refresh; removed stations cleared.');

// Legacy preferences cannot restore duplicate airport boxes, while METARs stay enabled.
const settingsCode=source.slice(source.indexOf('  const DEFAULTS='),source.indexOf('  const briefData='));
const settingsContext={PRO_LAYERS:new Set(['pirep','gairmet','airsigmet','cwa']),hasFeature:()=>false,localStorage:{getItem:()=>JSON.stringify({enabled:{airports:true,metar:true,radar:true}})}};
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
// Returning to cached coverage cancels a pending request for a different viewport.
zoomContext.endpointFor=()=>'/metar-outside';zoomContext.dataBounds.metar=[47.69,-97.43,48.20,-96.92];
zoomContext.getBoundsString=()=> '48.3,-97.18,48.4,-97.17';
zoomContext.fetchJson=(_url,controller)=>{oldSignal=controller.signal;return new Promise(resolve=>finishOld=resolve);};
const outsideRequest=vm.runInContext("ensureData('metar',false)",zoomContext);
zoomContext.getBoundsString=()=> '47.94,-97.18,47.95,-97.17';
await vm.runInContext("ensureData('metar',false)",zoomContext);assert.equal(oldSignal.aborted,true);
finishOld({geojson:{features:[{wrongRegion:true}]}});await outsideRequest;
assert.equal(zoomContext.data.metar.features.length,0);
console.log('Returning to cached coverage cannot restore another region’s pending weather.');
assert.equal(vm.runInContext('weatherBoundsContain([20,-130,55,-60],[47.94,-97.18,47.95,-97.17])',zoomContext),false);
console.log('National weather results cannot replace a local station query.');

// Terminal briefing preserves source times, identifies partial products, and checks forecast coverage.

const symbols=createRequire(import.meta.url)('../assets/chart-symbols.js');
const now=Date.parse('2026-10-04T03:00:00Z');
assert.equal(B.stamp('1791082800'),'2026-10-04 03:00 UTC');
assert.equal(B.dateValue(null),null);assert.equal(B.dateValue('garbage'),null);
const wx={source:'AWC',fetchedAt:'2026-10-04T03:00:00Z',metar:{rawOb:'KGFK 040253Z 27010KT 10SM CLR',obsTime:'2026-10-04T02:53:00Z',fltCat:'VFR'},taf:{issueTime:'2026-10-04T02:00:00Z',validTimeFrom:1791079200,validTimeTo:1791090000,rawTAF:'TAF KGFK 040200Z 0402/0405 27010KT P6SM SKC'}};
const html=B.weatherHtml('Departure','KGFK',wx,now,symbols,now);
assert.match(html,/7 min ago/);assert.match(html,/TAF KGFK/);assert.match(html,/270°T 10 kt/);assert.match(html,/Issued 2026-10-04 02:00 UTC/);
assert.doesNotMatch(html,/Forecast does not cover/);
assert.match(B.weatherHtml('Destination','KGFK',wx,Date.parse('2026-10-04T06:00Z'),symbols,now),/Forecast does not cover the planned time/);
assert.match(B.weatherHtml('Alternate','KFAR',{taf:wx.taf},null,symbols,now),/METAR unavailable/);
assert.match(B.weatherHtml('Departure','KGFK',{metar:{rawOb:'OLD',obsTime:now/1000-8000}},null,symbols,now),/Observation time needs review/);
assert.match(B.weatherHtml('Departure','KGFK',{metar:{rawOb:'<script>bad<\/script>'}},null,symbols,now),/&lt;script&gt;/);
assert.match(B.weatherHtml('Departure','',null,null,symbols,now),/no airport weather lookup/);
assert.match(B.tafStatus({issueTime:now/1000,validTimeFrom:now/1000-7200,validTimeTo:now/1000-3600},now,now).notes.join(' '),/validity has ended/);
const points=[{id:'KGFK',type:'PA',lat:48,lon:-97},...Array.from({length:10},(_,i)=>({id:'KA'+String(i).padStart(2,'0'),type:'PA'})),{id:'KFAR',type:'PA',lat:47,lon:-97}];
assert.deepEqual(B.airportCandidates(points,'KMSP').slice(0,3).map(p=>p.id),['KGFK','KFAR','KMSP']);
assert.equal(B.airportCandidates([{id:'PT01',source:'manual'},{id:'FIXA',type:'EA'}],'').length,0);
assert.equal(B.airportCandidates([{id:'KGFK',type:'PA'},{id:'KGFK',type:'PA'}],'KGFK').length,1);
assert.notEqual(B.planningKey(points,{departureUtc:'2026-10-04T03:00'}),B.planningKey(points,{departureUtc:'2026-10-04T04:00'}));
assert.equal(B.planningKey(points,{onboard:10}),B.planningKey(points,{onboard:20}));
assert.match(B.notamHtml({id:'KGFK',role:'Departure'},{error:'outage'}),/No absence of notices is implied/);
assert.match(B.notamHtml({id:'KGFK',role:'Departure'},{count:1,notams:[{text:'<b>RWY CLSD</b>',number:'1'}]}),/&lt;b&gt;RWY CLSD/);
// An alternate request started for a previous plan cannot overwrite the new brief.
const weatherSource=source.slice(source.indexOf('  async function loadBriefWeather('),source.indexOf('  function relationToRoute('));
let finishWeather;const wxCalls=[];
const weatherBriefContext={B,RP:{getPoints:()=>points,getWeather:(id,force)=>{wxCalls.push({id,force});return new Promise(resolve=>{if(id==='KMSP')finishWeather=resolve;else resolve(wx);});}},window:{PilotDeskRoutePerformance:{getSettings:()=>({alternateAirport:'KMSP'})}},routeContextSeq:1,briefWx:{dep:null,dst:null,alt:null},renderBrief:()=>{}};
vm.createContext(weatherBriefContext);vm.runInContext(weatherSource,weatherBriefContext);
const oldBrief=vm.runInContext('loadBriefWeather(1)',weatherBriefContext);assert.deepEqual(wxCalls.map(p=>p.id),['KGFK','KFAR','KMSP']);assert.ok(wxCalls.every(p=>p.force));
weatherBriefContext.routeContextSeq=2;finishWeather(wx);await oldBrief;assert.equal(weatherBriefContext.briefWx.alt,null);
console.log('Route briefing tests passed: METAR/TAF source times, stale and missing products, forecast validity, airport coverage priority, manual-point exclusion, safe text, and obsolete alternate responses.');
