// Executes shipped controllers with a small DOM fixture. This does not replace visual browser QA.
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),N=require('../assets/navlog-core.js');
class Element extends EventTarget{constructor(value=''){super();this.value=value;this.checked=false;this.hidden=false;this.disabled=false;this.innerHTML='';this.textContent='';this.options=[];this.dataset={};}append(){}click(){this.dispatchEvent(new Event('click'));}}
const elements=new Map(),html=fs.readFileSync('route-planner.html','utf8');
for(const m of html.matchAll(/<(?:input|select|textarea|button|div|p|section)[^>]*id="([^"]+)"[^>]*>/g))elements.set(m[1],new Element(m[0].match(/value="([^"]*)"/)?.[1]||''));
for(const id of ['rpSaveFlight','pdFlightState','pdReviewFlight'])elements.set(id,new Element());
const $=id=>elements.get(id)||elements.set(id,new Element()).get(id),doc=new EventTarget();doc.readyState='complete';doc.getElementById=$;doc.querySelector=s=>s.startsWith('#')?$(s.slice(1)):$('panel');doc.createElement=()=>new Element();
const data=new Map(),localStorage={getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)};
const location={href:'https://pd.test/route-planner.html',search:''},history={replaceState(a,b,u){location.href=String(u);location.search=new URL(u).search;}};
class CustomEvent extends Event{constructor(type,o={}){super(type);this.detail=o.detail;}}
const points=[{id:'KGFK',lat:47.95,lon:-97.17,type:'PA',source:'airport'},{id:'KDVL',lat:48.11,lon:-98.91,type:'PA',source:'airport'}];
const win={};let routePoints=[],weatherGate=null,windsFail=false;
const context=vm.createContext({window:win,document:doc,Event,CustomEvent,localStorage,location,history,URL,Blob,Date,AbortSignal,setTimeout,clearTimeout,crypto:{randomUUID:()=>String(Math.random())},fetch:async(url,opt)=>{
 if(url.includes('winds-aloft')){if(windsFail)return{ok:false,json:async()=>({error:'Forecast window unavailable'})};const req=JSON.parse(opt.body),start=Date.parse(req.departureUtc);return{ok:true,json:async()=>({source:'TEST WIND FIXTURE',altitude:req.altitude,routeKey:'',fetchedAt:new Date().toISOString(),baseAt:start-3600000,start:start-3600000,end:start+12*3600000,legs:[{direction:270,speed:20,station:'GFK',stationDistanceNm:10}]})};}
 return{ok:false,json:async()=>({configured:false,error:'FAA feed unconfigured'})};
}});
const run=file=>vm.runInContext(fs.readFileSync('assets/'+file,'utf8'),context,{filename:file});
run('route-review-core.js');run('route-brief-core.js');win.PilotDeskNavlog=N;
function rebuild(){win.pdNavlogResult=N.plannedBuild(routePoints,{tas:Number($('rpTas').value),burn:Number($('rpBurn').value),windFrom:Number($('rpWindDir').value),windSpeed:Number($('rpWindSpeed').value),variation:0},win.PilotDeskRoutePerformance?.getSettings());doc.dispatchEvent(new CustomEvent('pilotdesk:route-built'));return Promise.resolve();}
win.PilotDeskRoutePlanner={getPoints:()=>routePoints,getLegs:()=>win.pdNavlogResult?.legs||[],invalidate(){win.pdNavlogResult=null;doc.dispatchEvent(new CustomEvent('pilotdesk:route-invalidated'));},rebuild,setRoute(route){$('rpRoute').value=route;routePoints=points;this.invalidate();return rebuild();},getWeather:async id=>{if(weatherGate)await weatherGate;const start=Date.parse($('rpDepartureUtc').value+'Z');return{source:'TEST TAF FIXTURE',fetchedAt:new Date().toISOString(),metar:{fltCat:'VFR',obsTime:Date.now()/1000},taf:{issueTime:Date.now()/1000,validTimeFrom:(start-3600000)/1000,validTimeTo:(start+12*3600000)/1000,fcsts:[{timeFrom:(start-3600000)/1000,timeTo:(start+12*3600000)/1000,wdir:270,wspd:10,visib:'P6',clouds:[]}]}};}};
run('route-performance.js');run('route-review.js');
const flush=async()=>{for(let i=0;i<8;i++)await new Promise(r=>setTimeout(r,0));};
$('rpImportRouteText').value=JSON.stringify({route:'KGFK DCT KDVL',tas:125,burn:9.5,planning:{departureUtc:'2026-10-09T18:00',onboard:40,taxi:1,alternate:2,extra:0,reserveMinutes:45,reserveBurn:8,phases:{cruiseAltitude:7000}}});
$('rpParseImport').click();assert.equal($('rpImportChoices').hidden,false);$('rpImportChoice').value='0';$('rpApplyImport').click();await flush();
assert.equal($('rpRoute').value,'KGFK KDVL');assert.equal($('rpTas').value,125);assert.equal($('rpDepartureUtc').value,'2026-10-09T18:00');assert.equal(win.pdNavlogResult.legs.length,1);
$('rpLoadDepartureReview').click();await flush();assert($('rpDepartureWeather').innerHTML.includes('TAF at planned time'));assert($('rpDepartureNotams').innerHTML.includes('Automatic FAA NOTAM feed is not configured'));assert($('rpReviewWindBasis').textContent.includes('forecast winds'));assert.equal(win.pdNavlogResult.legs[0].windSpeed,20);assert($('rpLoadDepartureReview').disabled===false);
$('rpImportNotamText').value=JSON.stringify([{number:'TEST',location:'KGFK',text:'TEST ONLY RWY CLSD',effectiveStart:'2026-10-09T17:00Z',effectiveEnd:'2026-10-09T20:00Z'}]);$('rpApplyNotams').click();assert($('rpDepartureNotams').innerHTML.includes('FLIGHT WINDOW'));assert.equal(win.PilotDeskRoutePerformance.getSettings().importedNotams.length,1);
const saved=JSON.parse(JSON.stringify(win.PilotDeskRoutePerformance.getSettings()));win.PilotDeskRoutePerformance.setSettings(saved);assert.equal(win.PilotDeskRoutePerformance.getSettings().reserveBurn,'8');assert.equal(win.PilotDeskRoutePerformance.getSettings().importedNotams.length,1);
$('rpDepartureUtc').value='2026-10-09T22:00';doc.dispatchEvent(new CustomEvent('pilotdesk:planning-changed'));assert.equal($('rpDepartureWeather').innerHTML,'');assert($('rpDepartureNotams').innerHTML.includes('OUTSIDE FLIGHT WINDOW'));
// A response for a changed plan must never replace the current empty review.
let release;weatherGate=new Promise(r=>release=r);$('rpRefreshAirportReview').click();await flush();win.PilotDeskRoutePlanner.invalidate();release();await flush();assert.equal($('rpDepartureWeather').innerHTML,'');weatherGate=null;
win.PilotDeskRoutePerformance.setSettings({...saved,forecast:null});await rebuild();windsFail=true;$('rpLoadDepartureReview').click();await flush();assert($('rpDepartureReviewStatus').textContent.includes('Forecast winds were not applied'));assert($('rpReviewWindBasis').textContent.includes('entered winds'));
$('rpClearImportedNotams').click();assert.equal(win.PilotDeskRoutePerformance.getSettings().importedNotams.length,0);
$('rpImportRouteText').value='invalid';$('rpParseImport').click();assert.equal($('rpImportChoices').hidden,true);
console.log('Shipped controller checks passed: import/apply, ETD and fuel/phase settings, forecast application, source errors, imported notices, draft roundtrip, time changes, stale-response rejection, failed winds, and invalid import.');
