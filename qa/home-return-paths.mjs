import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync('assets/home-desk.js','utf8');
class Element{
 constructor(){this.children=[];this.dataset={};this.hidden=true;this.textContent='';}
 append(...children){this.children.push(...children);}
 replaceChildren(){this.children=[];}
 addEventListener(){}
}
function home(values={},blocked=false){
 const storage=new Map(Object.entries(values)),events={},section=new Element(),host=new Element();
 vm.runInNewContext(source,{location:{pathname:'/'},localStorage:{getItem(key){if(blocked)throw Error('Storage blocked');return storage.get(key)||null}},document:{getElementById:id=>id==='pdHomeDesk'?section:id==='pdHomeDeskItems'?host:null,createElement:()=>new Element()},window:{addEventListener:(name,fn)=>{events[name]=fn}},Date,URLSearchParams});
 return {storage,events,section,host,cards:()=>host.children};
}
let h=home({},true);assert.equal(h.section.hidden,true,'storage denial must leave the homepage usable');
h=home({'pd-training-goal':'constructor','pd-written-track':'constructor','pd-saved-flights':'{bad json','pd-favorites':'{}'});
assert.equal(h.cards().length,0,'malformed storage and inherited object keys cannot become saved work');
h=home({'pd-training-goal':'cfi','pd-written-track':'ira','pd-saved-flights':JSON.stringify([{id:'old',updatedAt:'2026-01-01T00:00:00Z'},{id:'new',updatedAt:'2026-10-14T00:00:00Z'}]),'pd-favorites':JSON.stringify([{path:'//outside.example',title:'bad'},{path:'/\\outside.example',title:'bad'},{path:'/calculators/crosswind/',title:'Crosswind'}])});
assert.equal(h.section.hidden,false);
assert(h.cards().some(x=>x.href==='/training/cfi.html'));
assert(h.cards().some(x=>x.href==='/written-prep.html?track=ira'));
assert(h.cards().some(x=>x.href==='/route-planner.html?flight=new'),'latest ISO-dated flight wins');
assert(h.cards().some(x=>x.href==='/calculators/crosswind/'));
assert(!h.cards().some(x=>x.href.includes('outside.example')),'saved links cannot leave PilotDesk');
h.storage.set('pd-training-goal','multi');h.events.storage();
assert(h.cards().some(x=>x.href==='/training/multiengine.html'),'another tab updates the study shortcut');
h.storage.delete('pd-training-goal');h.storage.delete('pd-written-track');h.storage.delete('pd-saved-flights');h.storage.delete('pd-favorites');h.events.pageshow();
assert.equal(h.section.hidden,true,'restored history must discard removed work');
const today=new Date().toISOString().slice(0,10);
h.storage.set('pd-daily-local-history',JSON.stringify([{date:today,score:2,max:3}]));h.events.pageshow();
assert.equal(h.cards()[0].children[1].textContent,'Review today’s questions');
console.log('Homepage return paths passed: study choices, latest flight, safe links, malformed/blocked storage, cross-tab changes, restored pages, and Daily review.');
