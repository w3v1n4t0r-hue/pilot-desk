(()=>{
'use strict';
if(window.__PDFlightPlanningShell)return;window.__PDFlightPlanningShell=true;
const path=location.pathname,$=(s,r=document)=>r.querySelector(s);
const PAGES=new Set(['/route-planner.html','/airport.html','/procedures.html','/aircraft.html','/flights.html','/flight-brief.html','/planner.html']);
if(!PAGES.has(path))return;
const read=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(d))}catch{return d}};
const flights=()=>{const v=window.PilotDeskFlights?.list?.()||read('pd-saved-flights',[]);return Array.isArray(v)?v:[]};
const aircraft=()=>{const v=read('pd-aircraft',[]);return Array.isArray(v)?v:[]};
const params=new URLSearchParams(location.search);
function requestedFlightId(){
  if(path==='/flight-brief.html')return params.get('id')||params.get('flight')||localStorage.getItem('pd-active-flight')||'';
  return params.get('flight')||params.get('active')||localStorage.getItem('pd-active-flight')||'';
}
function activeFlight(){const id=requestedFlightId(),all=flights();return all.find(f=>f.id===id)||null}
function routeParts(f){return String(f?.route||'').trim().split(/\s+/).filter(Boolean)}
function hrefs(f){
  const id=f?.id||'',parts=routeParts(f),dst=parts.at(-1)||'';
  return [
    ['/route-planner.html',id?'/route-planner.html?flight='+encodeURIComponent(id):'/route-planner.html','Route'],
    ['/airport.html',id?'/airport.html?flight='+encodeURIComponent(id)+(dst?'&id='+encodeURIComponent(dst):''):'/airport.html','Airport'],
    ['/procedures.html',id?'/procedures.html?flight='+encodeURIComponent(id)+(dst?'&ident='+encodeURIComponent(dst):''):'/procedures.html','Procedures'],
    ['/aircraft.html',id?'/aircraft.html?flight='+encodeURIComponent(id):'/aircraft.html','Aircraft'],
    ['/flights.html','/flights.html','Saved Flights'],
    ['/flight-brief.html',id?'/flight-brief.html?id='+encodeURIComponent(id):'/flight-brief.html','Flight Brief']
  ];
}
function ensureSubnav(f){
  const main=$('main');if(!main)return;
  let nav=$('.pd-flight-subnav',main);
  if(!nav){nav=document.createElement('nav');nav.className='pd-flight-subnav';nav.setAttribute('aria-label','Flight planning tools');const hero=$('.pd-flight-hero,.pd-page-hero,.calc-hero',main);(hero||main.firstElementChild)?.insertAdjacentElement('afterend',nav)}
  nav.replaceChildren();
  for(const [p,href,label] of hrefs(f)){const a=document.createElement('a');a.href=href;a.textContent=label;if(path===p)a.setAttribute('aria-current','page');nav.append(a)}
}
function ensureContext(f){
  const main=$('main');if(!main)return;
  let box=$('#pdFlightPlanningContext');
  if(!f){box?.remove();return}
  const parts=routeParts(f),ac=aircraft().find(x=>x.id===f.aircraftId);
  if(!box){box=document.createElement('section');box.id='pdFlightPlanningContext';box.className='pd-planning-context';const nav=$('.pd-flight-subnav',main);(nav||$('.pd-flight-hero,.pd-page-hero',main))?.insertAdjacentElement('afterend',box)}
  box.innerHTML='<div><small>ACTIVE FLIGHT</small><b></b><span></span></div><a href="/flights.html">Change flight</a>';
  box.querySelector('b').textContent=f.name||parts.join(' → ')||'Saved flight';
  box.querySelector('span').textContent=[parts.length?parts.join(' → '):'Route not set',ac?.name||'No aircraft selected'].join(' · ');
  try{localStorage.setItem('pd-active-flight',f.id);if(f.aircraftId)localStorage.setItem('pd-aircraft-active',f.aircraftId)}catch{}
}
function render(){const f=activeFlight();ensureSubnav(f);ensureContext(f)}
document.addEventListener('pilotdesk:flights-changed',render);
document.addEventListener('pilotdesk:aircraft-changed',render);
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',render,{once:true}):render();
})();