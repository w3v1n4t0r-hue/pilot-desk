import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {createPublicLayers} from '../assets/public-layers.mjs';
const pause=()=>new Promise(r=>setTimeout(r,220));
const original=globalThis.fetch,handlers={},layers=new Set(),panes={},created=[];let requests=0;
function tile(url,options){const node={url,options,events:{},on(name,fn){this.events[name]=fn;return this},addTo(){layers.add(this);return this}};created.push(node);return node}
const map={removeLayer:l=>layers.delete(l),getPane:n=>panes[n],createPane:n=>panes[n]={style:{}},getBounds:()=>({getSouth:()=>47,getNorth:()=>48,getWest:()=>-98,getEast:()=>-97}),on:(n,f)=>handlers[n]=f,off:()=>{}};
const tileLayer=Object.assign(tile,{wms:tile});
const win={L:{tileLayer},PilotDeskRoutePlanner:{getMap:()=>map},document:{addEventListener(){},removeEventListener(){}},sessionStorage:{getItem(){return null}}};
let engine;
try{
 globalThis.fetch=async()=>{requests++;return {ok:true,json:async()=>({frameTime:new Date().toISOString()})}};
 engine=createPublicLayers(win,()=>{});
 const selection={map:'aerial',wxImagery:'radarcomp'};engine.sync(selection);await pause();assert.equal(created.length,2);assert.equal(requests,1);
 const [base,radar]=created;
 engine.sync({...selection,pireps:true,chart:'us/vfr'});await pause();assert.equal(created.length,2,'Native-only controls must not rebuild public layers');
 handlers.moveend();await new Promise(r=>setTimeout(r,550));assert.equal(created.length,2,'Map movement retains tile layer identity');assert.equal(requests,1,'Map movement does not re-fetch unchanged imagery metadata');
 radar.events.load();assert.match(engine.status('wxImagery'),/^Available/,'Retained tile callbacks remain active after movement');
 engine.sync({...selection,map:'street'});await pause();assert.equal(created.length,3);assert.ok(!layers.has(base));assert.ok(layers.has(radar));assert.equal(requests,1);
 engine.sync({map:'street'});await pause();assert.ok(!layers.has(radar));assert.equal(layers.size,1);
 engine.dispose();engine=null;assert.equal(layers.size,0);
 const require=createRequire(import.meta.url),imagery=require('../server/public-imagery.cjs');requests=0;
 globalThis.fetch=async()=>{requests++;await new Promise(r=>setTimeout(r,10));return {ok:true,text:async()=>'<Layer><Name>global_visible_imagery_mosaic</Name><Dimension name="time" default="2026-10-15T20:00:00Z"/></Layer><Layer><Name>global_longwave_imagery_mosaic</Name><Dimension name="time" default="2026-10-15T20:00:00Z"/></Layer>'}};
 async function call(product){let body,status;await imagery({method:'GET',query:{product}},{setHeader(){},status(v){status=v;return this},json(v){body=v}});return {status,body}}
 const results=await Promise.all([call('satellite'),call('satelliteir')]);assert.equal(requests,1,'Concurrent products share provider capabilities request');assert.ok(results.every(r=>r.status===200&&r.body.frameTime==='2026-10-15T20:00:00.000Z'));
 console.log('Layer performance passed: unchanged tile identity, zero repeat metadata requests on movement/native controls, replacement/removal, retained callbacks, disposal, and concurrent provider request coalescing.');
}finally{engine?.dispose();globalThis.fetch=original}
