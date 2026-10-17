import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';

const api=vm.createContext({module:{exports:{}},Date});
vm.runInContext(fs.readFileSync('api/weather.js','utf8'),api);
const report=body=>api.parseMetar('2026/10/16 18:00\nKJFK 161800Z 18010KT '+body+' 18/15 A2992','KJFK');
test('NOAA categories retain convective ceilings and metric visibility',()=>{
  assert.equal(report('10SM BKN005CB').fltCat,'IFR');
  assert.equal(report('10SM OVC003TCU').fltCat,'LIFR');
  assert.equal(report('0800 FG NSC').fltCat,'LIFR');
  assert.equal(report('0000 FG VV001').fltCat,'LIFR');
  assert.equal(report('9999 SCT040').fltCat,'VFR');
  assert.equal(report('CAVOK').fltCat,'VFR');
  assert.equal(report('10SM VV///').fltCat,'UNKNOWN');
  assert.equal(report('CLR').fltCat,'UNKNOWN');
  assert.equal(report('1 1/2SM BKN020').fltCat,'IFR');
});

function weather(){
  const pending=[],saved=new Map(),events=[];
  const out={innerHTML:'',dataset:{}},button={},status={dataset:{}},form={querySelector:()=>button};
  const context=vm.createContext({
    document:{readyState:'loading',addEventListener(){},querySelector:s=>({'#weatherForm':form,'#weatherOutput':out,'#weatherStatus':status}[s]||null),dispatchEvent:e=>events.push(e)},
    window:{},navigator:{onLine:true},URL,URLSearchParams,
    location:{search:'',href:'https://pd.test/weather.html'},history:{replaceState(){}},
    localStorage:{getItem:()=>null,setItem:(k,v)=>saved.set(k,v)},
    CustomEvent:class{constructor(type,options){this.type=type;this.detail=options.detail;}},console,
    fetch:url=>new Promise((resolve,reject)=>pending.push({url,resolve,reject}))
  });
  const source=fs.readFileSync('assets/weather-fixed.js','utf8').replace("document.readyState==='loading'?", "window.lookup=lookup;document.readyState==='loading'?");
  vm.runInContext(source,context);
  const respond=(index,station,metar={})=>pending[index].resolve({ok:true,json:async()=>({station,metar:{icaoId:station,obsTime:1792173600,...metar},airport:{name:station},fetchedAt:'2026-10-16T18:01:00Z'})});
  return {context,pending,out,button,status,saved,events,respond,lookup:context.window.lookup};
}
test('null weather fields stay unavailable and cannot seed performance',async()=>{
  const w=weather(),p=w.lookup('KJFK');
  w.respond(0,'KJFK',{wdir:null,wspd:null,altim:null,elev:0,temp:15,clouds:[{cover:'BKN',base:null}]});await p;
  assert.doesNotMatch(w.out.innerHTML,/0\.00 inHg|pa=29920|BKN 0 ft|Runway wind components/);
  assert.match(w.out.innerHTML,/BKN \/\/\//);
  assert.doesNotMatch(w.out.innerHTML,/href="\/calculators\/density-altitude\/\?/);
  assert.equal(w.events.at(-1).detail.hasDensityAltitudeSetup,false);
});
test('zero elevation and real pressure still provide a valid performance handoff',async()=>{
  const w=weather(),p=w.lookup('KJFK');w.respond(0,'KJFK',{wdir:0,wspd:0,altim:1013.207489068212,elev:0,temp:0});await p;
  assert.match(w.out.innerHTML,/30\.?0?0? inHg|29\.92 inHg/);
  assert.match(w.out.innerHTML,/href="\/calculators\/density-altitude\/\?pa=0&amp;oat=0|href="\/calculators\/density-altitude\/\?pa=0&oat=0/);
  assert.equal(w.events.at(-1).detail.hasDensityAltitudeSetup,true);
});
test('latest selection owns results, history, events and loading state',async()=>{
  const w=weather(),first=w.lookup('KJFK'),second=w.lookup('KBOS');
  w.respond(0,'KJFK');await first;
  assert.equal(w.button.disabled,true,'older completion cannot end newer loading state');
  assert.equal(w.context.window.__pdLastWeather??null,null);
  w.respond(1,'KBOS');await second;
  assert.equal(w.context.window.__pdLastWeather.station,'KBOS');
  assert.equal(w.saved.get('pd-last-airport'),'KBOS');
  assert.deepEqual(w.events.map(e=>e.detail.station),['KBOS']);
  assert.equal(w.button.disabled,false);
});
test('older success cannot replace a completed newer selection',async()=>{
  const w=weather(),first=w.lookup('KJFK'),second=w.lookup('KBOS');
  w.respond(1,'KBOS');await second;w.respond(0,'KJFK');await first;
  assert.equal(w.context.window.__pdLastWeather.station,'KBOS');assert.match(w.out.innerHTML,/<h2>KBOS<\/h2>/);
});
test('late nearby-station enhancements cannot attach to a different lookup',async()=>{
  const pending=[],inserted=[];
  let station='KJFK';
  const host={dataset:{weatherRevision:'1'},querySelector:selector=>selector==='.wx-summary h2'?{textContent:station}:selector==='.wx-raw-grid'?{insertAdjacentElement:(_where,section)=>inserted.push(section.innerHTML)}:null};
  const context=vm.createContext({document:{readyState:'loading',addEventListener(){},createElement:()=>({})},window:{__pdLastWeather:{station,data:{metar:{lat:40,lon:-74},taf:{rawTAF:'TAF KJFK'}}}},location:{search:''},URLSearchParams,AbortController,setTimeout,clearTimeout,console,fetch:()=>new Promise(resolve=>pending.push(resolve))});
  const source=fs.readFileSync('assets/weather-extra.js','utf8').replace('function scan(){','window.enhance=enhance;function scan(){');
  vm.runInContext(source,context);
  const old=context.window.enhance(station,host);
  station='KBOS';host.dataset.weatherRevision='2';
  context.window.__pdLastWeather={station,data:{metar:{lat:42,lon:-71},taf:{rawTAF:'TAF KBOS'}}};
  const current=context.window.enhance(station,host);
  pending[1]({ok:true,json:async()=>({results:[]})});await current;
  pending[0]({ok:true,json:async()=>({results:[]})});await old;
  assert.equal(inserted.length,1);assert.match(inserted[0],/TAF KBOS/);assert.doesNotMatch(inserted[0],/TAF KJFK/);
});
