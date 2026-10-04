import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const read=p=>fs.readFileSync(p,'utf8');
let billing={isPro:false,isSchool:false};
const context={window:{PilotDeskBilling:{ready:Promise.resolve(),snapshot:()=>billing}},document:{dispatchEvent(){}},CustomEvent:class{},URL,location:{origin:'https://www.pilot-desk.com'}};
vm.runInNewContext(read('assets/pro-access.js'),context);
const access=context.window.PilotDeskProAccess;
for(const feature of ['routeBrief','advancedWeather','fullOral']){
 assert.equal(access.isEnabled(feature),false);
 assert.equal(await access.canUseFeature(feature),false);
 billing={isPro:true,isSchool:false};assert.equal(access.isEnabled(feature),true);assert.equal(await access.canUseFeature(feature),true);
 billing={isPro:true,isSchool:true};assert.equal(access.isEnabled(feature),true);
 billing={isPro:true,error:'subscription lookup failed'};assert.equal(access.isEnabled(feature),true,'Retain already verified access during a lookup outage');assert.equal(await access.canUseFeature(feature),true);
 billing={isPro:false,error:'subscription lookup failed'};assert.equal(access.isEnabled(feature),false,'An unverified account must not gain access during an outage');assert.equal(await access.canUseFeature(feature),false);
 billing={isPro:false};
}
assert.equal(access.isEnabled('unknown'),false);
assert.equal(await access.canCreate('savedFlights',2),true);
assert.equal(await access.canCreate('savedFlights',3),false);
const efb=read('assets/efb-layers.js');
let paid=false,loads=0,clears=0,aborts=0,renders=0;
const input={checked:true},group={addTo(){return this},clearLayers(){clears++}};
const layerContext={PRO_LAYERS:new Set(['pirep','gairmet','airsigmet','cwa']),hasFeature:()=>paid,state:{enabled:{}},panel:{querySelector:()=>input},ensureGroup:()=>group,map:{hasLayer:()=>false,removeLayer(){}},data:{},fetchSeq:{},dataPending:{},ensureData:()=>{loads++},radarControls:{hidden:true},refreshRadar:()=>{loads++},removeRadar(){},renderBrief:()=>{renders++}};
vm.runInNewContext(efb.slice(efb.indexOf('function toggleLayer'),efb.indexOf('function field')),layerContext);
for(const key of layerContext.PRO_LAYERS){
 layerContext.toggleLayer(key,true);assert.equal(loads,0);assert.equal(layerContext.state.enabled[key],false);
 paid=true;layerContext.toggleLayer(key,true);assert.equal(loads,1);loads=0;
 layerContext.dataPending[key]={controller:{abort(){aborts++}}};paid=false;layerContext.toggleLayer(key,false);
}
assert.equal(clears,4);assert.equal(aborts,4);
layerContext.toggleLayer('radar',true);assert.equal(loads,1,'Free radar must still load');
vm.runInNewContext(efb.slice(efb.indexOf('async function ensureData'),efb.indexOf('function toggleLayer')),layerContext);
for(const key of layerContext.PRO_LAYERS)assert.equal(await layerContext.ensureData(key,true),null,'Refresh and saved settings must not bypass access');
vm.runInNewContext(efb.slice(efb.indexOf('async function loadRouteContext'),efb.indexOf('function showLeg')),layerContext);
await layerContext.loadRouteContext();assert.ok(renders>0,'Free route brief must render its feature preview without fetching');
assert.match(efb,/pilotdesk:billing',syncProAccess/,'Logout and plan changes must update controls');
assert.match(efb,/renderGeoLayer\(key,geojson\)\{\s+if\(PRO_LAYERS/,'Old responses must not render paid overlays');
const pricing=read('pricing.html');
for(const word of ['PRO · FLIGHT PLANNING','PRO · CHECKRIDE PREP','Try two subjects free','Basic charts, METAR dots, radar and the navlog stay free.'])assert.ok(pricing.includes(word),word);
const lab=read('assets/checkride-lab.js');
for(const fn of ['function start(){','function submitAnswer(answer){','function downloadPacket(withResults=false){'])assert.ok(lab.includes(fn+"\n if(!window.PilotDeskProAccess?.isEnabled('fullOral'))"),'Checkride action must check access: '+fn);
console.log('Pro feature tests passed: Free, Pro, School, lookup failure, upgrade/downgrade, refresh bypass, free radar and preview boundaries.');
