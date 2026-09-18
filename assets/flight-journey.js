(()=>{'use strict';
if(window.__pilotDeskFlightJourney)return;window.__pilotDeskFlightJourney=true;
const path=location.pathname;
const STEPS=[
 ['/aircraft.html','Aircraft','aircraft'],
 ['/route-planner.html','Route','route'],
 ['/weather.html','Weather','weather'],
 ['/weight-balance.html','Loading','loading'],
 ['/flight-planning-workspace.html','Fuel & math','math'],
 ['/procedures.html','Procedures','procedures'],
 ['/flight-brief.html','Review','review']
];
if(!STEPS.some(([p])=>p===path))return;
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const read=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(d))}catch{return d}};
const save=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch{}};
const params=new URLSearchParams(location.search);
const list=()=>{const x=read('pd-saved-flights',[]);return Array.isArray(x)?x:[]};
function idFromContext(){return params.get('flight')||params.get('id')||localStorage.getItem('pd-active-flight')||''}
function flight(){const id=idFromContext();return list().find(x=>x.id===id)||null}
function aircraftName(f){if(!f?.aircraftId)return'';return read('pd-aircraft',[]).find(x=>x.id===f.aircraftId)?.name||''}
function routeParts(f){return String(f?.route||'').trim().split(/\s+/).filter(Boolean)}
function progressKey(f){return f?.id?'pd-flight-progress:'+f.id:''}
function progress(f){return f?.id?read(progressKey(f),{}):{}}
function mark(f,key){if(!f?.id||!key)return;const p=progress(f);p[key]=Date.now();save(progressKey(f),p)}
function targetFor(step,f){
 const [base,,key]=step;if(!f)return base;
 const q=new URLSearchParams(),parts=routeParts(f),dst=parts.at(-1)||'';
 if(key==='review')return base+'?id='+encodeURIComponent(f.id);
 q.set('flight',f.id);
 if(key==='weather'&&dst)q.set('station',dst);
 if(key==='procedures'&&dst)q.set('ident',dst);
 if(key==='loading'&&f.aircraftId)q.set('aircraft',f.aircraftId);
 return base+'?'+q.toString();
}
function stateFor(f,key){
 const p=progress(f),parts=routeParts(f);
 if(key==='aircraft')return Boolean(f?.aircraftId);
 if(key==='route')return parts.length>=2;
 return Boolean(p[key]);
}
function render(){
 const main=$('main');if(!main)return;
 $$('.pd-flight-nav,.pd-flight-journey,.pd-flight-context[data-pd-old-flight-context]').forEach(x=>x.remove());
 const f=flight(),current=STEPS.findIndex(([p])=>p===path),parts=routeParts(f),dst=parts.at(-1)||'',ac=aircraftName(f);
 if(f){try{localStorage.setItem('pd-active-flight',f.id);if(f.aircraftId)localStorage.setItem('pd-aircraft-active',f.aircraftId)}catch{}}
 if(f&&current>=0)mark(f,STEPS[current][2]);
 const wrap=document.createElement('section');wrap.className='pd-flight-journey';wrap.setAttribute('aria-label','Flight planning workflow');
 const top=document.createElement('div');top.className='pd-flight-journey-head';
 if(f){
  top.innerHTML='<div><small>ACTIVE FLIGHT</small><b></b><span></span></div><div class="pd-flight-journey-actions"></div>';
  top.querySelector('b').textContent=f.name||parts.join(' → ')||'Saved flight';
  top.querySelector('span').textContent=[parts.length?parts.join(' → '):'Route not set',ac||'No aircraft selected','saved on this device'].join(' · ');
  const actions=top.querySelector('.pd-flight-journey-actions'),all=document.createElement('a');all.href='/flights.html';all.textContent='Saved flights';actions.append(all);
 }else{
  top.innerHTML='<div><small>FLIGHT WORKFLOW</small><b>Start a connected flight plan</b><span>Save a route in Route Planner to carry one flight through every step.</span></div><div class="pd-flight-journey-actions"><a href="/route-planner.html">Start in Route Planner →</a></div>';
 }
 const nav=document.createElement('nav');nav.className='pd-flight-journey-steps';nav.setAttribute('aria-label','Flight planning steps');
 STEPS.forEach((step,i)=>{
  const a=document.createElement('a');a.href=targetFor(step,f);a.dataset.step=step[2];
  if(i===current)a.setAttribute('aria-current','step');
  if(f&&stateFor(f,step[2]))a.classList.add('visited');
  const n=document.createElement('i');n.textContent=String(i+1).padStart(2,'0');
  const label=document.createElement('span');label.textContent=step[1];
  a.append(n,label);nav.append(a);
 });
 wrap.append(top,nav);
 if(f&&current>=0&&current<STEPS.length-1){
  const next=STEPS[current+1],bar=document.createElement('div');bar.className='pd-flight-journey-next';
  const copy=document.createElement('span');copy.textContent='Next: '+next[1]+(next[2]==='weather'&&dst?' at '+dst:'');
  const a=document.createElement('a');a.href=targetFor(next,f);a.textContent='Continue →';a.dataset.pdFlightContinue=next[2];
  bar.append(copy,a);wrap.append(bar);
 }
 const anchor=$('.pd-flight-hero,.wx-hero,.calc-hero,.pd-page-hero',main)||main.firstElementChild;
 if(anchor)anchor.insertAdjacentElement('afterend',wrap);else main.prepend(wrap);
 wrap.addEventListener('click',e=>{const a=e.target.closest('a[data-step],a[data-pd-flight-continue]');if(!a)return;window.pdTrack?.('Flight Workflow Step',{step:a.dataset.step||a.dataset.pdFlightContinue||'unknown',hasSavedFlight:f?'yes':'no'})});
}
function signal(key){const f=flight();if(!f)return;mark(f,key);render()}
document.addEventListener('pilotdesk:weatherloaded',()=>signal('weather'));
document.addEventListener('pilotdesk:route-built',()=>signal('route'));
document.addEventListener('pilotdesk:wb-calculated',()=>signal('loading'));
document.addEventListener('pilotdesk:flight-math-calculated',()=>signal('math'));
document.addEventListener('pilotdesk:proceduresloaded',()=>signal('procedures'));
document.addEventListener('pilotdesk:briefready',()=>signal('review'));
document.addEventListener('pilotdesk:flights-changed',render);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',render,{once:true});else render();
})();