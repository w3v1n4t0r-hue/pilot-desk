import assert from 'node:assert/strict';
import fs from 'node:fs';
const html=fs.readFileSync(new URL('../route-review.html',import.meta.url),'utf8');
const decode=s=>s.replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'");
const canvasOps=[];
const context=new Proxy({},{get:(_,name)=>(...args)=>canvasOps.push({name,args}),set:()=>true});
class Element {
 constructor(tag='div',attrs={}){this.tagName=tag.toUpperCase();this.attrs=attrs;this.dataset={};this.listeners={};this.style={};this.children=[];this.disabled='disabled'in attrs;this.checked='checked'in attrs;this.hidden='hidden'in attrs;this.value=attrs.value||'';this.textContent='';this._html='';this.classes=new Set((attrs.class||'').split(' '));this.classList={add:x=>this.classes.add(x),remove:x=>this.classes.delete(x),contains:x=>this.classes.has(x),toggle:(x,on)=>{if(on)this.classes.add(x);else this.classes.delete(x);}};for(const [k,v]of Object.entries(attrs))if(k.startsWith('data-'))this.dataset[k.slice(5).replace(/-([a-z])/g,(_,s)=>s.toUpperCase())]=decode(v);}
 set innerHTML(v){this._html=v;this.children=parse(v);for(const e of this.children)e.parent=this;}
 get innerHTML(){return this._html;}
 addEventListener(type,cb){(this.listeners[type]??=[]).push(cb);}
 async emit(type,props={}){const e={type,target:this,preventDefault(){this.prevented=true;},...props};for(const fn of this.listeners[type]||[])await fn(e);return e;}
 async click(){if(this.disabled)return;await this.emit('click');await document.emit('click',{target:this});}
 setAttribute(k,v){this.attrs[k]=v;}
 getAttribute(k){return this.attrs[k];}
 closest(selector){if(selector==='button')return this.tagName==='BUTTON'?this:this.parent?.closest(selector);if(selector.startsWith('.'))return this.classes.has(selector.slice(1))?this:this.parent?.closest(selector);return null;}
 querySelector(selector){return this.querySelectorAll(selector)[0];}
 querySelectorAll(selector){const all=this.children.flatMap(e=>[e,...e.children]);if(selector==='button:not(:disabled)')return all.filter(e=>e.tagName==='BUTTON'&&!e.disabled);if(selector==='input')return all.filter(e=>e.tagName==='INPUT');if(selector==='button')return all.filter(e=>e.tagName==='BUTTON');return [];}
 getBoundingClientRect(){return {left:0,top:0,right:1050,bottom:500,width:1050,height:500};}
 getContext(){return context;}
 setPointerCapture(){}
 focus(){document.activeElement=this;}
 select(){}
 showModal(){this.open=true;}
 close(){this.open=false;}
 append(e){e.parent=this;this.children.push(e);}
 remove(){}
}
function parse(text){return [...text.matchAll(/<([a-z][a-z0-9-]*)\b([^>]*)>/gi)].map(([,tag,attr])=>{const attrs={};for(const m of attr.matchAll(/([\w-]+)(?:="([^"]*)"|='([^']*)'|=([^\s>]+))?/g))attrs[m[1]]=m[2]??m[3]??m[4]??'';return new Element(tag,attrs);});}
class Document extends Element {
 constructor(){super();this.nodes=parse(html);this.ids=Object.fromEntries(this.nodes.filter(e=>e.attrs.id).map(e=>[e.attrs.id,e]));this.body=new Element('body');}
 getElementById(id){if(!this.ids[id]){const all=this.nodes.flatMap(n=>[n,...n.children]);this.ids[id]=all.find(n=>n.attrs.id===id);}assert(this.ids[id],`Missing actual HTML element: ${id}`);return this.ids[id];}
 createElement(tag){return new Element(tag);}
 querySelectorAll(selector){const name=selector.match(/^\[data-([^\]]+)\]$/)?.[1];return name?this.nodes.filter(e=>`data-${name}`in e.attrs):[];}
}
const records=new Map();globalThis.localStorage={getItem:k=>records.get(k)||null,setItem:(k,v)=>records.set(k,v)};
globalThis.window={devicePixelRatio:2,addEventListener(){}};globalThis.location={hash:'',href:'https://private.example/',pathname:'/',search:''};globalThis.history={replaceState(){}};
globalThis.document=new Document();globalThis.ResizeObserver=class{observe(){}};
const frames=[];globalThis.requestAnimationFrame=cb=>{frames.push(cb);return frames.length;};
const realSetTimeout=globalThis.setTimeout;globalThis.setTimeout=()=>1;globalThis.clearTimeout=()=>{};
Object.defineProperty(globalThis,'navigator',{value:{clipboard:{writeText:async s=>globalThis.copied=s}},configurable:true});
let downloaded=false;document.body.append=e=>{downloaded=e.tagName==='A';};
await import('../assets/route-review-workspace/app.mjs');
const $=id=>document.getElementById(id);
const dynamic=(id,key,value)=>$(id).children.find(e=>e.dataset[key]===value);
const flush=()=>{let n=0;while(frames.length&&n++<20)frames.shift()();};
let checks=0;async function test(name,fn){await fn();checks++;console.log(`PASS ${name}`);}
await test('Initial route renders into shipped HTML and canvas',()=>{flush();assert($('route-title').innerHTML.includes('KGFK'));assert.equal($('total-nm').textContent,264);assert(canvasOps.some(x=>x.name==='drawImage'));assert(canvasOps.some(x=>x.name==='arc'));assert.equal($('layer-count').textContent,7);});
await test('Search and Enter add a valid regional airport',async()=>{$('airport-search').value='KGGW';await $('airport-search').emit('input');assert($('airport-results').innerHTML.includes('KGGW'));await $('airport-search').emit('keydown',{key:'Enter'});assert($('route-title').innerHTML.endsWith('KGGW'));});
await test('Duplicate airport cannot be added again',async()=>{const before=$('route-title').innerHTML;$('airport-search').value='KGGW';await $('airport-search').emit('keydown',{key:'Enter'});assert.equal($('route-title').innerHTML,before);});
await test('Route reversal preserves distance and reverses departure',async()=>{const before=$('total-nm').textContent;await $('reverse-btn').click();assert($('route-title').innerHTML.startsWith('KGGW'));assert.equal($('total-nm').textContent,before);});
await test('Route stop removal changes route',async()=>{await dynamic('route-stops','remove','KGGW').click();assert(!$('route-title').innerHTML.includes('KGGW'));});
await test('Clicking route airport opens weather details',async()=>{await dynamic('route-stops','airport','KXWA').click();assert.equal($('detail-panel').hidden,false);assert($('detail-panel').innerHTML.includes('Non-towered'));assert($('detail-panel').innerHTML.includes('DEMO KXWA'));});
await test('Destination selection replaces final airport and avoids duplicates',async()=>{$('airport-search').value='KGGW';await $('airport-search').emit('keydown',{key:'Enter'});await dynamic('route-stops','airport','KMOT').click();await dynamic('detail-panel','dest','KMOT').click();assert($('route-title').innerHTML.endsWith('KMOT'));assert.equal(($('route-title').innerHTML.match(/KMOT/g)||[]).length,1);});
await test('Sample route selection rebuilds route',async()=>{$('examples').value='0';await $('examples').emit('change');assert($('route-title').innerHTML.endsWith('KXWA'));assert.equal($('total-nm').textContent,264);});
await test('Cruise altitude removes icing and low-level restriction',async()=>{$('altitude').value='18000';await $('altitude').emit('change');assert(!$('review-chips').innerHTML.includes('tfr-minot'));assert(!$('review-chips').innerHTML.includes('ga-ice'));$('altitude').value='7000';await $('altitude').emit('change');assert($('review-chips').innerHTML.includes('tfr-minot'));});
await test('Briefing timeline expires restriction and resets correctly',async()=>{$('time').value='21';await $('time').emit('input');assert.equal($('time-label').textContent,'21:00Z');assert(!$('review-chips').innerHTML.includes('tfr-minot'));await $('reset-time').click();assert($('review-chips').innerHTML.includes('tfr-minot'));});
await test('Hidden map layer does not remove route review items',async()=>{const checkbox=document.querySelectorAll('[data-layer]').find(e=>e.dataset.layer==='tfr'),before=$('review-chips').innerHTML;checkbox.checked=false;await checkbox.emit('change');assert.equal($('layer-count').textContent,6);assert.equal($('review-chips').innerHTML,before);checkbox.checked=true;await checkbox.emit('change');});
await test('Weather tab and keyboard navigation work',async()=>{await $('review-open').click();assert.equal($('weather-panel').hidden,false);assert.equal($('route-panel').hidden,true);await $('tab-weather').emit('keydown',{key:'ArrowRight'});assert.equal($('notes-panel').hidden,false);assert.equal(document.activeElement,$('tab-notes'));});
await test('Review chip opens advisory details',async()=>{await dynamic('review-chips','feature','ga-ice').click();assert($('detail-panel').innerHTML.includes('Zulu'));assert($('detail-panel').innerHTML.includes('Closest to route'));});
await test('True airspeed is bounded and updates estimated time',async()=>{$('tas').value='240';await $('tas').emit('change');assert.equal($('total-time').textContent,'1:06');$('tas').value='0';await $('tas').emit('change');assert.equal($('tas').value,120);$('tas').value='900';await $('tas').emit('change');assert.equal($('tas').value,500);$('tas').value='120';await $('tas').emit('change');});
await test('Save persists route and notes on this device',async()=>{$('notes').value='Check icing and Minot restriction.';await $('notes').emit('input');await $('save-btn').click();const saved=JSON.parse(records.get('pilotdesk-route-review-routes-v1'));assert.equal(saved[0].notes,'Check icing and Minot restriction.');assert.deepEqual(saved[0].ids,['KGFK','KMOT','KXWA']);assert.equal($('saved-count').textContent,1);});
await test('Opening saved route restores settings and notes',async()=>{$('examples').value='1';await $('examples').emit('change');await $('saved-btn').click();const load=$('modal-body').children.find(e=>e.dataset.load);await load.click();assert($('route-title').innerHTML.includes('KGFK'));assert.equal($('notes').value,'Check icing and Minot restriction.');assert.equal($('modal').open,false);});
await test('Copy route writes expected ICAO sequence',async()=>{await $('copy-btn').click();assert.equal(globalThis.copied,'KGFK KMOT KXWA');});
await test('Download generates review artifact',async()=>{await $('download-btn').click();assert(downloaded);});
await test('Legend modal opens and closes',async()=>{await $('data-btn').click();assert.equal($('modal').open,true);assert($('modal-body').innerHTML.includes('synthetic'));await $('modal-close').click();assert.equal($('modal').open,false);});
await test('All stops can be removed and empty route can recover',async()=>{for(const id of ['KGFK','KMOT','KXWA'])await dynamic('route-stops','remove',id).click();assert.equal($('save-btn').disabled,true);assert.equal($('total-nm').textContent,'—');$('airport-search').value='KFAR';await $('airport-search').emit('keydown',{key:'Enter'});assert.equal($('route-title').innerHTML,'KFAR');assert.equal($('save-btn').disabled,true);});
const {RouteMap}=await import('../assets/route-review-workspace/map.mjs');const {airports}=await import('../assets/route-review-workspace/data.mjs');const testCanvas=new Element('canvas'),m=new RouteMap(testCanvas,()=>{},()=>{});m.setData({route:airports.filter(a=>['KGFK','KMOT','KXWA'].includes(a.id))});m.fit();flush();
await test('Focal zoom preserves cursor geographic position',()=>{const before=m.world(320,250);m.zoom(1.35,320,250);const after=m.world(320,250);assert(Math.abs(before.lat-after.lat)<1e-9);assert(Math.abs(before.lon-after.lon)<1e-9);});
await test('Pointer drag pans and pointer cancellation releases drag',async()=>{const before=m.center.x;await testCanvas.emit('pointerdown',{button:0,pointerId:1,clientX:300,clientY:200});await testCanvas.emit('pointermove',{pointerId:1,clientX:340,clientY:200});assert(m.center.x<before);await testCanvas.emit('pointercancel',{pointerId:1,clientX:340,clientY:200});assert.equal(m.drag,null);assert.equal(m.pointers.size,0);});
await test('Wheel zoom and keyboard controls change map view',async()=>{const before=m.scale;const e=await testCanvas.emit('wheel',{deltaY:-100,clientX:300,clientY:200});assert(m.scale>before&&e.prevented);const cx=m.center.x;await testCanvas.emit('keydown',{key:'ArrowRight'});assert(m.center.x>cx);});
await test('Frame requests coalesce; no idle animation is scheduled',()=>{flush();assert.equal(frames.length,0);m.request();m.request();m.request();assert.equal(frames.length,1);flush();assert.equal(frames.length,0);});
await test('Map hit testing detects airport markers',()=>{m.draw();const p=m.screen(airports.find(a=>a.id==='KGFK'));assert.equal(m.hit(p).id,'KGFK');});
await test('Pinch gesture changes scale',async()=>{await testCanvas.emit('pointerdown',{button:0,pointerId:1,clientX:300,clientY:200});await testCanvas.emit('pointerdown',{button:0,pointerId:2,clientX:400,clientY:200});const before=m.scale;await testCanvas.emit('pointermove',{pointerId:2,clientX:430,clientY:200});assert(m.scale>before);await testCanvas.emit('pointerup',{pointerId:1,clientX:300,clientY:200});await testCanvas.emit('pointerup',{pointerId:2,clientX:430,clientY:200});});
await test('PilotDesk import dialog transfers route, ETD, TAS and fuel fields',async()=>{await $('import-route-btn').click();$('route-import-text').value=JSON.stringify({route:'KGFK KMOT KXWA',tas:135,burn:11,planning:{departureUtc:'2026-10-09T18:00Z',onboard:55,reserveMinutes:60,phases:{cruiseAltitude:7000}}});await $('route-import-run').click();assert.equal($('modal').open,false);assert.equal($('briefing-panel').hidden,false);assert.equal($('etd').value,'2026-10-09T18:00');assert.equal(Number($('tas').value),135);assert.equal(Number($('fuel-burn').value),11);assert($('route-title').innerHTML.endsWith('KXWA'));});
await test('Departure time changes recalculate ETA and preserve UTC labeling',async()=>{$('etd').value='2026-10-09T19:00';await $('etd').emit('change');assert($('briefing-etd').textContent.includes('19:00Z'));assert($('calculation-summary').innerHTML.includes('Destination ETA'));});
await test('Forecast winds mode blocks calculation when no forecast is loaded',async()=>{$('wind-mode').value='forecast';await $('wind-mode').emit('change');assert($('calculation-summary').innerHTML.includes('Forecast winds unavailable'));assert.equal($('navlog-btn').disabled,true);assert.equal($('total-time').textContent,'—');});
await test('Provider briefing supplies airport forecasts, calculated ETA and explicit NOTAM gap',async()=>{const original=globalThis.fetch;globalThis.fetch=async()=>Response.json({fetchedAt:'2026-10-09T17:00Z',metars:{rows:[{icaoId:'KGFK',obsTime:1791565200,rawOb:'KGFK OBS'}]},tafs:{rows:[{icaoId:'KGFK',validTimeFrom:1791568800,validTimeTo:1791590400,issueTime:1791565200,rawTAF:'TAF KGFK',fcsts:[{timeFrom:1791568800,timeTo:1791590400,visib:'6+',clouds:[],wdir:180,wspd:10}]}]},winds:{data:{start:1791565200000,end:1791594000000,source:'Test winds',legs:[{direction:300,speed:15},{direction:300,speed:15}]}},notams:[{station:'KGFK',configured:false,error:'FAA credentials not configured',notams:[]}]});try{await $('fetch-briefing-btn').click();assert($('forecast-airports').innerHTML.includes('Raw TAF'));assert($('calculation-summary').innerHTML.includes('Destination ETA'));assert($('notam-list').innerHTML.includes('No absence of notices is implied'));assert.equal($('total-basis').textContent,'ALOFT WIND');}finally{globalThis.fetch=original;}});
await test('Changing route invalidates the loaded forecast instead of reusing it',async()=>{await $('reverse-btn').click();assert($('briefing-status').textContent.includes('Reload provider data'));assert($('calculation-summary').innerHTML.includes('Forecast winds unavailable'));});
await test('Imported NOTAM text appears with unverified timing and original text',async()=>{await $('import-notams-btn').click();$('notam-import-text').value='KGFK RWY 17R/35L CLSD';await $('notam-import-run').click();assert($('notam-list').innerHTML.includes('KGFK RWY 17R/35L CLSD'));assert($('notam-list').innerHTML.includes('TIME UNVERIFIED'));assert($('notam-list').innerHTML.includes('IMPORTED'));});
await test('A provider wind-coverage error leaves calculations blocked after a fetch',async()=>{const original=globalThis.fetch;globalThis.fetch=async()=>Response.json({fetchedAt:'2026-10-09T17:00Z',metars:{rows:[]},tafs:{rows:[]},winds:{data:null,error:'No available bulletin covers the full planned flight.'},notams:[]});try{await $('fetch-briefing-btn').click();assert.equal($('wind-mode').value,'forecast');assert.equal($('navlog-btn').disabled,true);assert.equal($('total-time').textContent,'—');assert($('briefing-status').textContent.includes('No available bulletin'));}finally{globalThis.fetch=original;}});
globalThis.setTimeout=realSetTimeout;
console.log(`${checks} interaction checks passed using the shipped modules. Browser visual QA is not included.`);
