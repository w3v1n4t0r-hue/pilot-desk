(()=>{
'use strict';
if(!['/','/index.html'].includes(location.pathname))return;
const wind=document.getElementById('pdHomeWind');
if(wind){
  const update=()=>{
    const speed=Number(wind.value);
    document.getElementById('pdHomeWindValue').textContent=speed+' kt';
    document.getElementById('pdHomeCross').textContent=(speed*Math.sin(Math.PI/6)).toFixed(1)+' kt';
    document.getElementById('pdHomeHead').textContent=(speed*Math.cos(Math.PI/6)).toFixed(1)+' kt';
    document.getElementById('pdHomeWindLink').href='/calculators/crosswind/?runway=350&windDir=320&windSpeed='+speed;
  };
  wind.addEventListener('input',update);update();
}
const section=document.getElementById('pdHomeDesk');
const host=document.getElementById('pdHomeDeskItems');
if(!section||!host)return;

const get=key=>{try{return localStorage.getItem(key)||''}catch{return''}};
const read=(key,fallback=[])=>{try{return JSON.parse(get(key)||JSON.stringify(fallback))??fallback}catch{return fallback}};
const timestamp=value=>{const n=Number(value);if(Number.isFinite(n)&&n>0)return n;const d=Date.parse(value);return Number.isFinite(d)?d:0};
const text=value=>String(value??'').trim();
function renderDesk(){
const items=[];
const seen=new Set();

function add(item){
  if(!item?.href||!/^\/(?!\/)/.test(item.href)||/[\\\u0000-\u0020]/.test(item.href)||seen.has(item.href))return;
  seen.add(item.href);
  items.push(item);
}

// Read only saved choices; no network request or inferred readiness score.
const goals={ppl:['Private Pilot','/training/private-pilot.html'],ira:['Instrument Rating','/training/instrument-rating.html'],cpl:['Commercial Pilot','/training/commercial-pilot.html'],multi:['Multi-Engine','/training/multiengine.html'],cfi:['CFI','/training/cfi.html'],cfii:['CFII','/training/cfii.html'],atp:['ATP','/training/atp.html']};
const goalKey=get('pd-training-goal');
const goal=Object.hasOwn(goals,goalKey)?goals[goalKey]:null;
if(goal)add({kind:'STUDY GOAL',title:goal[0],detail:'Return to the rating you chose on this device.',href:goal[1],action:'Continue studying'});
const track=get('pd-written-track');
const tracks={ppl:'Private Pilot',ira:'Instrument',cpl:'Commercial',cfi:'CFI',cfii:'CFII',foi:'Fundamentals of Instruction',atp:'ATP'};
if(Object.hasOwn(tracks,track))add({kind:'WRITTEN PREP',title:tracks[track]+' practice',detail:'Open your selected track. Sign in to load saved progress.',href:'/written-prep.html?track='+encodeURIComponent(track),action:'Open Written Prep'});
const history=read('pd-daily-local-history',[]);
if(Array.isArray(history)&&history.some(x=>x&&/^\d{4}-\d{2}-\d{2}$/.test(x.date))){
 const today=new Date().toISOString().slice(0,10),done=history.some(x=>x?.date===today);
 add({kind:'DAILY QUESTIONS',title:done?'Review today’s questions':'Today’s three questions',detail:done?'Completed on this device. Review the explanations.':'A short aviation review. No account needed.',href:'/daily/',action:done?'Review Daily':'Open Daily'});
}

const flights=read('pd-saved-flights',[]);
if(Array.isArray(flights)&&flights.length){
  const latest=[...flights].sort((a,b)=>timestamp(b?.updatedAt||b?.createdAt)-timestamp(a?.updatedAt||a?.createdAt))[0];
  const title=text(latest?.name)||text(latest?.route)||'Saved flight';
  const route=text(latest?.route);
  add({kind:'LATEST FLIGHT',title,detail:route&&route!==title?route:'Continue the saved route and planning work.',href:latest?.id?'/route-planner.html?flight='+encodeURIComponent(latest.id):'/flights.html',action:'Resume flight'});
}

const aircraft=read('pd-aircraft',[]);
const activeId=get('pd-aircraft-active');
const active=Array.isArray(aircraft)?aircraft.find(x=>String(x?.id||'')===activeId):null;
if(active){
  const name=text(active.name)||text(active.tailNumber)||text(active.tail_number)||text(active.type)||'Active aircraft';
  const details=[
    text(active.type)||text(active.makeModel)||text(active.make_model),
    Number(active.cruiseTas)>0?Number(active.cruiseTas)+' kt cruise':'',
    Number(active.fuelBurn)>0?Number(active.fuelBurn)+' gal/hr':''
  ].filter(Boolean).join(' · ');
  add({kind:'ACTIVE AIRCRAFT',title:name,detail:details||'Open the aircraft profile and planning values.',href:'/aircraft.html',action:'Open aircraft'});
}

const favorites=read('pd-favorites',[]);
if(Array.isArray(favorites)&&favorites.length){
  for(const favorite of favorites.filter(x=>x?.path).slice(0,4))add({kind:'PINNED TOOL',title:text(favorite.title)||'Pinned tool',detail:'Saved on this device.',href:favorite.path,action:'Open tool'});
}

const recent=read('pd-recent',[]);
if(Array.isArray(recent)&&recent.length){
  for(const recentTool of recent.filter(x=>x?.path&&!seen.has(x.path)).slice(0,4))add({kind:'RECENT TOOL',title:text(recentTool.title)||'Recent tool',detail:'Recently opened on this device.',href:recentTool.path,action:'Use again'});
}

host.replaceChildren();
for(const item of items.slice(0,6)){
  const a=document.createElement('a');
  a.className='pd-home-desk-item';
  a.href=item.href;
  a.dataset.pdHomeDesk=item.kind;
  const small=document.createElement('small');small.textContent=item.kind;
  const strong=document.createElement('strong');strong.textContent=item.title;
  const span=document.createElement('span');span.textContent=item.detail;
  const em=document.createElement('em');em.textContent=item.action+' →';
  a.append(small,strong,span,em);
  host.append(a);
}
section.hidden=items.length===0;
}
renderDesk();
// Refresh restored history pages and changes made in another tab.
window.addEventListener('pageshow',renderDesk);
window.addEventListener('storage',renderDesk);
const search=document.getElementById('pdHomeSearch');
if(search&&!search.dataset.pdBound){
  search.dataset.pdBound='1';
  search.addEventListener('click',event=>{
    const input=document.querySelector('.pd-site-search input');
    if(input){event.stopPropagation();document.dispatchEvent(new CustomEvent('pilotdesk:open-search'));input.select?.();window.pdTrack?.('Home Search Focus',{})}
  });
}
section.addEventListener('click',event=>{
  const a=event.target.closest('[data-pd-home-desk]');
  if(a)window.pdTrack?.('Home Desk Open',{item:a.dataset.pdHomeDesk||'unknown'});
});
})();
