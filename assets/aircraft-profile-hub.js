(()=>{'use strict';
if(location.pathname!=='/aircraft.html'||window.__pilotDeskAircraftHub)return;
window.__pilotDeskAircraftHub=true;
const $=(s,r=document)=>r.querySelector(s);
const read=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(d))}catch{return d}};
const text=(tag,value,cls='')=>{const el=document.createElement(tag);if(cls)el.className=cls;el.textContent=value;return el};
function profiles(){const a=read('pd-aircraft',[]);return Array.isArray(a)?a:[]}
function training(){const a=read('pd-training-library-v2',[]);return Array.isArray(a)?a:[]}
function active(){const a=profiles(),id=localStorage.getItem('pd-aircraft-active');return a.find(x=>x.id===id)||a[0]||null}
function has(v){return String(v??'').trim()!==''}
function coverage(p){
 const rows=String(p.wbStations||'').split(/\r?\n/).filter(x=>x.trim()).length;
 const checks=[
  ['Route defaults',has(p.cruiseTas)&&has(p.fuelBurn),'Cruise TAS + fuel burn'],
  ['Fuel planning',has(p.usableFuel)&&has(p.reserveMinutes),'Usable fuel + reserve'],
  ['Weight & balance',has(p.emptyWeight)&&has(p.emptyArm)&&rows>0,'Empty weight/arm + stations'],
  ['CG envelope',has(p.wbEnvelope),'Envelope boundary'],
  ['Home airport',has(p.homeAirport),'Airport identifier'],
  ['Source note',has(p.sourceNote),'POH/AFM or W&B revision note']
 ];
 return {checks,count:checks.filter(x=>x[1]).length,rows}
}
function link(label,href,primary=false){
 const a=document.createElement('a');a.href=href;a.textContent=label;a.className=primary?'pd-btn':'pd-btn secondary';return a
}
function render(){
 const host=$('#pdAircraftActiveContent'),empty=$('#pdAircraftActiveEmpty');if(!host||!empty)return;
 const p=active();
 if(!p){host.hidden=true;empty.hidden=false;return}
 if(localStorage.getItem('pd-aircraft-active')!==p.id)localStorage.setItem('pd-aircraft-active',p.id);
 empty.hidden=true;host.hidden=false;host.replaceChildren();
 const cov=coverage(p),sets=training().filter(x=>x.aircraftId===p.id);
 const head=document.createElement('div');head.className='pd-aircraft-active-head';
 const ident=document.createElement('div');ident.append(text('small','ACTIVE AIRCRAFT','eyebrow'),text('h2',p.name||'Aircraft'),text('p',[p.type,p.homeAirport].filter(Boolean).join(' · ')||'Aircraft profile'));
 const controls=document.createElement('div');controls.className='pd-aircraft-active-controls';
 const score=document.createElement('div');score.className='pd-aircraft-coverage';score.append(text('b',cov.count+'/6'),text('span','profile fields covered'));controls.append(score);
 const all=profiles();if(all.length>1){const select=document.createElement('select');select.setAttribute('aria-label','Active aircraft');for(const x of all){const o=document.createElement('option');o.value=x.id;o.textContent=x.name||x.type||'Aircraft';o.selected=x.id===p.id;select.append(o)}select.addEventListener('change',()=>{localStorage.setItem('pd-aircraft-active',select.value);document.dispatchEvent(new CustomEvent('pilotdesk:aircraft-changed',{detail:{id:select.value,action:'active'}}));window.pdTrack?.('Aircraft Active Changed',{source:'aircraft_hub'});render()});controls.append(select)}
 head.append(ident,controls);host.append(head);

 const metrics=document.createElement('div');metrics.className='pd-aircraft-active-metrics';
 const metricData=[
  ['Cruise TAS',has(p.cruiseTas)?p.cruiseTas+' kt':'—'],
  ['Fuel burn',has(p.fuelBurn)?p.fuelBurn+' GPH':'—'],
  ['Usable fuel',has(p.usableFuel)?p.usableFuel+' gal':'—'],
  ['Reserve',has(p.reserveMinutes)?p.reserveMinutes+' min':'—'],
  ['W&B stations',String(cov.rows)],
  ['Training sets',String(sets.length)]
 ];
 for(const [label,value] of metricData){const d=document.createElement('div');d.append(text('small',label),text('b',value));metrics.append(d)}
 host.append(metrics);

 const coverageGrid=document.createElement('div');coverageGrid.className='pd-aircraft-coverage-grid';
 for(const [label,ok,detail] of cov.checks){const d=document.createElement('div');d.className='pd-aircraft-coverage-item '+(ok?'complete':'missing');const state=text('span',ok?'SAVED':'MISSING');d.append(state,text('b',label),text('small',detail));coverageGrid.append(d)}
 host.append(coverageGrid);

 const actions=document.createElement('div');actions.className='pd-actions pd-aircraft-active-actions';
 actions.append(
  link('Start a flight','/flights.html?aircraft='+encodeURIComponent(p.id),true),
  link('Route Planner','/route-planner.html?aircraft='+encodeURIComponent(p.id)),
  link('Weight & Balance','/weight-balance.html?aircraft='+encodeURIComponent(p.id)),
  link('Checklist Trainer','/checklist-trainer.html?aircraft='+encodeURIComponent(p.id)),
  link('POH Chart Studio','/poh-chart-studio.html?aircraft='+encodeURIComponent(p.id))
 );
 const edit=document.createElement('button');edit.type='button';edit.className='pd-btn secondary';edit.textContent='Edit active profile';edit.addEventListener('click',()=>{$('[data-edit="'+CSS.escape(p.id)+'"]')?.click();window.pdTrack?.('Aircraft Profile Action',{action:'edit_active'})});actions.append(edit);
 if(p.homeAirport){
  actions.append(link(p.homeAirport+' weather','/weather.html?station='+encodeURIComponent(p.homeAirport)),link('Airport page','/airport.html?id='+encodeURIComponent(p.homeAirport)));
 }
 host.append(actions);
 actions.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>window.pdTrack?.('Aircraft Profile Action',{action:(a.textContent||'').toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'')})));
 const note=document.createElement('p');note.className='fine pd-aircraft-coverage-note';note.textContent='Profile coverage only shows which convenience fields are saved. It does not verify that any value is current, approved, or applicable to this aircraft today.';
 host.append(note);
}
function init(){
 render();
 const list=$('#aircraftList');if(list)new MutationObserver(render).observe(list,{childList:true,subtree:true});
 document.addEventListener('pilotdesk:aircraft-changed',render);
 window.addEventListener('storage',e=>{if(['pd-aircraft','pd-aircraft-active','pd-training-library-v2'].includes(e.key))render()});
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init,{once:true}):init();
})();