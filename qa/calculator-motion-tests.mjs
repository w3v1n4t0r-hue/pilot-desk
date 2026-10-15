import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {diagramModel,vector,shortestAngle,DIAGRAM_KEYS,NM_FT,formatDuration} from '../src/scripts/calculator-motion-model.mjs';
const source=fs.readFileSync('assets/site.js','utf8');
function formula(key,values){
 const fields=Object.fromEntries(Object.entries(values).map(([id,value])=>[id,{value:String(value)}]));
 for(let i=0;i<3;i++)fields['out'+i]={textContent:''};
 const ctx={document:{getElementById:id=>fields[id]},window:{},console};
 vm.runInNewContext(source.slice(0,source.indexOf('function resultText()'))+';globalThis.calculators=F;',ctx);
 ctx.calculators[key]();return [0,1,2].map(i=>fields['out'+i].textContent);
}
const number=text=>Number(String(text).replaceAll(',','').match(/[+-]?\d+(?:\.\d+)?/)?.[0]);
const near=(a,b,tolerance=.06)=>assert(Math.abs(a-b)<=tolerance,`${a} != ${b}`);
for(let runway=0;runway<=360;runway+=45){
 const values={runway,windDir:355,windSpeed:24,gustSpeed:36},m=diagramModel('crosswind',values),out=formula('crosswind',values);
 near(Math.abs(m.cross),number(out[0]));near(Math.abs(m.head),number(out[1]));near(m.cross*m.cross+m.head*m.head,24*24,1e-6);
}
for(const course of [0,90,180,270,359])for(const windDir of [0,60,180,270,355]){
 const values={course,tas:120,windDir,windSpeed:23},m=diagramModel('windTriangle',values),out=formula('windTriangle',values);
 near(m.heading,number(out[0]));near(m.gs,number(out[1]));
 const actual=vector(m.gs,course);near(m.ground[0],actual[0],1e-6);near(m.ground[1],actual[1],1e-6);
}
assert.equal(diagramModel('windTriangle',{course:0,tas:50,windDir:90,windSpeed:80}),null);
assert.equal(diagramModel('windTriangle',{course:0,tas:50,windDir:0,windSpeed:80}),null);
near(shortestAngle(359,1),361);near(shortestAngle(1,359),-1);
for(const gs of [60,120,180]){
 const m=diagramModel('threeDegree',{gs});near(m.height/m.distance/NM_FT,Math.tan(3*Math.PI/180),1e-10);
 near(m.height/m.minutes,number(formula('threeDegree',{gs})[0]),.51);
}
const descent=diagramModel('tod',{altitude:6000,gradient:300,gs:120});near(descent.distance,20);near(descent.minutes,10);
const glide=diagramModel('glide',{alt:3000,ratio:10});near(glide.distance,number(formula('glide',{alt:3000,ratio:10})[0]),.051);
const climb=diagramModel('obstacleGradient',{obstacle:600,margin:200,distance:4});near(climb.height,800);near(climb.height/climb.distance,number(formula('obstacleGradient',{obstacle:600,margin:200,distance:4})[0]));
for(const bank of [10,30,60]){
 const m=diagramModel('turnRadius',{tas:120,bank}),out=formula('turnRadius',{tas:120,bank});near(m.radius,number(out[0]),.006);near(m.rate,number(out[2]),.006);
 const b=diagramModel('loadFactor',{bank});near(b.factor,number(formula('loadFactor',{bank})[0]),.006);
}
const fuel=diagramModel('fuelRequired',{fuel:10,burn:8,time:2,reserve:45});near(fuel.trip,16);near(fuel.reserve,6);near(fuel.remaining,-12);assert(fuel.remaining<0,'shortfall must not be drawn as spare fuel');
for(const pa of [0,5000,12000]){
 const v={pa,oat:30},m=diagramModel('densityAltitude',v);near(m.second,number(formula('densityAltitude',v)[0]),.51);
}
assert.equal(diagramModel('cloudBase',{temp:10,dew:15}),null);
assert.equal(diagramModel('turnRadius',{tas:100,bank:0}),null);
assert.equal(diagramModel('tod',{altitude:6000,gradient:0,gs:120}),null);
assert.equal(diagramModel('densityAltitude',{pa:NaN,oat:20}),null);
assert.equal(diagramModel('unknown',{}),null);assert.equal(DIAGRAM_KEYS.size,27);
const manifest=fs.readFileSync('dist/assets/offline-precache.js','utf8');
assert(manifest.includes('calculator-motion-runtime')&&manifest.includes('calculator-motion.css'),'animation runtime and styles must be available offline');
const runtime=fs.readFileSync('src/scripts/calculator-motion.js','utf8');
assert(runtime.includes("DIAGRAM_KEYS.has(key)"),'invalid initial inputs must still mount a correctable diagram');
assert(runtime.includes("svg.toggleAttribute('hidden',!m)"),'invalid models must clear the graphic');
assert(runtime.includes('reduced.matches')&&runtime.includes('pagehide'));
assert(fs.statSync('dist/assets/calculator-motion-runtime.js').size<140*1024,'optional runtime stays within its route-specific budget');
console.log('Calculator diagrams passed: vector closure, north crossing, wind feasibility, profile rates, turns, fuel shortfalls, altitude models and offline release assets.');

// Exercise the actual transition driver with OS/app preferences and hidden pages.
// Browser-independent DOM nodes keep this focused on animation decisions.
const runtimeCode=runtime.replace(/^import .*;\n/gm,'');
const state={osReduced:true,appReduced:false,hidden:false,calls:0};
const documentStub={documentElement:{classList:{contains:()=>state.appReduced}},get hidden(){return state.hidden},readyState:'complete',addEventListener(){},removeEventListener(){}};
const node={attributes:{},setAttribute(k,v){this.attributes[k]=v}};
const media={get matches(){return state.osReduced},addEventListener(){},removeEventListener(){}};
const context={document:documentStub,window:{addEventListener(){}},navigator:{},location:{pathname:'/route-planner.html'},matchMedia:()=>media,
 animate:(from,to,options)=>{state.calls++;options.onUpdate?.(to);return {finished:Promise.resolve(),complete(){},stop(){}}},
 aircraftPlan:'',aircraftProfile:'',runway:'',compass:'',windVector:'',seat:'',baggage:'',obstacle:'',fuelSegments:'',press(){throw new Error('Chart page must not register calculator gestures')},hover(){},DIAGRAM_KEYS,shortestAngle};
vm.runInNewContext(runtimeCode+';globalThis.driver=animateTargets;',context);
context.driver([[node,{tx:10,ty:20,angle:359}]]);assert.equal(state.calls,0);assert(node.attributes.transform.includes('translate(10 20)'));
state.osReduced=false;state.appReduced=true;context.driver([[node,{tx:20,ty:25,angle:1}]]);assert.equal(state.calls,0);assert(node.attributes.transform.includes('rotate(361)'));
state.appReduced=false;state.hidden=true;context.driver([[node,{tx:30,ty:30}]]);assert.equal(state.calls,0);
state.hidden=false;context.driver([[node,{tx:40,ty:40}]]);assert.equal(state.calls,1);
console.log('Motion driver passed: OS preference, saved PilotDesk preference, hidden-page settling, shortest angles and chart isolation.');

for(const v of [{distance:180,speed:120,time:1.5},{distance:90,speed:100,time:2}]){const m=diagramModel('tsd',v),out=formula('tsd',v);m.lanes.forEach((lane,i)=>near(lane.answer,number(out[i]),i===0?.006:.051));near(m.seconds,v.distance/v.speed*3600);}
for(const v of [{gs:120,seconds:60},{gs:90,seconds:90},{gs:120,seconds:0}]){const m=diagramModel('holdDistance',v);near(m.lanes[0].distance,number(formula('holdDistance',v)[0]),.006);near(m.seconds,v.seconds);}
for(const alt of [-1000,0,8000]){const v={cas:110,alt},m=diagramModel('tasApprox',v);near(m.tas,number(formula('tasApprox',v)[0]),.051);}
assert.equal(diagramModel('tsd',{distance:180,speed:0,time:1}),null);
assert.equal(diagramModel('tsd',{distance:180,speed:120,time:0}),null);
assert.equal(diagramModel('holdDistance',{gs:120,seconds:-1}),null);
assert.equal(diagramModel('tasApprox',{cas:NaN,alt:8000}),null);
console.log('Additional diagrams passed: independent TSD results, straight-leg timing, TAS estimate and invalid inputs.');

const wbSource=fs.readFileSync('assets/weight-balance.js','utf8');
const wbContext={envelope:[[30,1000],[50,1000],[50,2500]],rows:[],n:v=>Number(v)};
vm.createContext(wbContext);
vm.runInContext(wbSource.match(/function fuelChangePoint[^\n]+/)[0]+'\n'+wbSource.match(/function canReplayFuel[^\n]+/)[0],wbContext);
const dep={ok:true,W:2000,M:80000},landing={ok:true,W:1800,M:68000};
wbContext.rows=[{name:'Pilot',dep:'180',ldg:'180'},{name:'Fuel',dep:'300',ldg:'100'}];
assert(wbContext.canReplayFuel(dep,landing));
near(wbContext.fuelChangePoint(dep,landing,.5).weight,1900);
near(wbContext.fuelChangePoint(dep,landing,.5).cg,74000/1900,1e-9);
assert(Math.abs(wbContext.fuelChangePoint(dep,landing,.5).cg-(dep.M/dep.W+landing.M/landing.W)/2)>.01,'CG follows moment/weight, not a straight screen interpolation');
wbContext.rows[0].ldg='0';assert(!wbContext.canReplayFuel(dep,landing),'a passenger change cannot be called fuel burn');
wbContext.rows[0].ldg='180';wbContext.envelope=[];assert(!wbContext.canReplayFuel(dep,landing),'replay requires an entered envelope');
console.log('Weight-and-balance replay passed: moment/weight interpolation, fuel-only gating and entered-envelope requirement.');

assert.equal(formatDuration(90/105*3600),'00:51:26');
assert.equal(formatDuration(5400),'01:30:00');
assert.equal(formatDuration(59.6),'00:01:00');
assert.equal(formatDuration(3599.6),'01:00:00');
assert.equal(formatDuration(86401),'24:00:01');
assert.equal(formatDuration(22.5,true),'0:23');
assert.equal(formatDuration(5400,true),'1:30:00');
assert.equal(formatDuration(NaN),'—');
assert.equal(formatDuration(-1),'—');
console.log('Exact-time displays passed: non-integer journeys, second rounding/carry and durations beyond 24 hours.');
