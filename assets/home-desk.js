(()=>{
'use strict';
if(!['/','/index.html'].includes(location.pathname))return;
const section=document.getElementById('pdHomeDesk');
const host=document.getElementById('pdHomeDeskItems');
if(!section||!host)return;

const read=(key,fallback=[])=>{try{const value=JSON.parse(localStorage.getItem(key)||JSON.stringify(fallback));return value??fallback}catch{return fallback}};
const text=value=>String(value??'').trim();
const items=[];
const seen=new Set();

function add(item){
  if(!item?.href||seen.has(item.href))return;
  seen.add(item.href);
  items.push(item);
}

const aircraft=read('pd-aircraft',[]);
const activeId=localStorage.getItem('pd-aircraft-active')||'';
const active=Array.isArray(aircraft)?aircraft.find(x=>String(x?.id||'')===activeId):null;
if(active){
  const name=text(active.name)||text(active.tailNumber)||text(active.tail_number)||text(active.type)||'Active aircraft';
  const details=[
    text(active.type)||text(active.makeModel)||text(active.make_model),
    Number(active.cruiseTas)>0?Number(active.cruiseTas)+' kt cruise':'',
    Number(active.fuelBurn)>0?Number(active.fuelBurn)+' GPH':''
  ].filter(Boolean).join(' · ');
  add({kind:'ACTIVE AIRCRAFT',title:name,detail:details||'Open the aircraft profile and planning values.',href:'/aircraft.html',action:'Open aircraft'});
}

const flights=read('pd-saved-flights',[]);
if(Array.isArray(flights)&&flights.length){
  const latest=[...flights].sort((a,b)=>Number(b?.updatedAt||b?.createdAt||0)-Number(a?.updatedAt||a?.createdAt||0))[0];
  const title=text(latest?.name)||text(latest?.route)||'Saved flight';
  const route=text(latest?.route);
  add({kind:'LATEST FLIGHT',title,detail:route&&route!==title?route:'Continue the saved route and planning work.',href:'/route-planner.html?flight='+encodeURIComponent(latest?.id||''),action:'Resume flight'});
}

const favorites=read('pd-favorites',[]);
if(Array.isArray(favorites)&&favorites.length){
  const favorite=favorites.find(x=>x?.path);
  if(favorite)add({kind:'PINNED TOOL',title:text(favorite.title)||'Pinned calculator',detail:'One of your saved calculator shortcuts.',href:favorite.path,action:'Open tool'});
}

const recent=read('pd-recent',[]);
if(Array.isArray(recent)&&recent.length){
  const recentTool=recent.find(x=>x?.path&&!seen.has(x.path));
  if(recentTool)add({kind:'RECENT TOOL',title:text(recentTool.title)||'Recent calculator',detail:'The last calculator you opened on this device.',href:recentTool.path,action:'Use again'});
}

if(!items.length)return;
host.replaceChildren();
for(const item of items.slice(0,4)){
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
section.hidden=false;
section.addEventListener('click',event=>{
  const a=event.target.closest('[data-pd-home-desk]');
  if(a)window.pdTrack?.('Home Desk Open',{item:a.dataset.pdHomeDesk||'unknown'});
});
})();