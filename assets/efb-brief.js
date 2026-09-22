(()=>{
'use strict';
if(window.__pilotDeskEfbBrief)return;window.__pilotDeskEfbBrief=true;
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const read=(k,d=[])=>{try{const v=JSON.parse(localStorage.getItem(k)||JSON.stringify(d));return v??d}catch{return d}};
const timeLabel=v=>{const d=new Date((typeof v==='number'&&v<1e12)?v*1000:v);return Number.isFinite(d.getTime())?d.toLocaleString(undefined,{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}):'time unavailable'};

function activeAircraft(){
 const list=read('pd-aircraft',[]),id=localStorage.getItem('pd-aircraft-active');
 return Array.isArray(list)?list.find(x=>x.id===id)||null:null;
}

function routePlanner(){
 if(location.pathname!=='/route-planner.html')return;
 const grid=$('.rp-grid');if(!grid||$('#rpLiveSummary'))return;
 const summary=document.createElement('section');summary.className='rp-live-summary';summary.id='rpLiveSummary';summary.setAttribute('aria-label','Current route totals');
 summary.innerHTML='<div class="rp-live-route"><small>ROUTE</small><b id="rpLiveRoute">Not built</b></div><div><small>DISTANCE</small><b id="rpLiveDistance">— NM</b></div><div><small>ETE</small><b id="rpLiveEte">— MIN</b></div><div><small>PLANNED FUEL</small><b id="rpLiveFuel">— GAL</b></div>';
 grid.before(summary);
 const wx=document.createElement('div');wx.className='rp-route-weather-strip';wx.id='rpRouteWeatherStrip';wx.hidden=true;summary.after(wx);

 const panel=$('.rp-grid > .rp-panel:not(.rp-map-card)');
 const tas=$('#rpTas');
 if(panel&&tas){
   const saved=document.createElement('section');saved.className='rp-saved-routes';saved.id='rpSavedRoutesQuick';
   tas.closest('label')?.insertAdjacentElement('beforebegin',saved);
   renderSavedRoutes(saved);
   saved.addEventListener('click',e=>{
     const b=e.target.closest('[data-duplicate-flight]');if(!b)return;
     const store=window.PilotDeskFlights,src=store?.get?.(b.dataset.duplicateFlight);if(!src)return;
     const id=crypto?.randomUUID?.()||('fl'+Date.now()),copy={...src,id,name:(src.name||'Flight')+' copy',lastReviewedAt:null,createdAt:Date.now(),updatedAt:Date.now()};
     store.upsert(copy);try{localStorage.removeItem('pd-flight-progress:'+id);localStorage.setItem('pd-active-flight',id)}catch{}
     location.assign('/route-planner.html?flight='+encodeURIComponent(id));
   });
 }
 const input=$('#rpRoute');
 const routeText=()=>String(input?.value||'').trim().split(/\s+/).filter(Boolean).map(x=>x.split(',')[0]).join(' → ')||'Not built';
 const setRoute=()=>{const el=$('#rpLiveRoute');if(el)el.textContent=routeText()};
 input?.addEventListener('input',setRoute);setRoute();

 async function renderWeather(){
   const tokens=String(input?.value||'').trim().split(/\s+/).filter(Boolean).map(x=>x.split(',')[0].toUpperCase()).filter(x=>/^[A-Z0-9]{3,4}$/.test(x));
   const ids=[...new Set(tokens)].slice(0,8);if(!ids.length){wx.hidden=true;wx.innerHTML='';return}
   wx.hidden=false;wx.innerHTML='<span><small>ROUTE WEATHER</small><b>Retrieving current station reports…</b><em>Times will be shown with each report</em></span>';
   const data=await Promise.all(ids.map(async id=>{try{const r=await fetch('/api/weather?station='+encodeURIComponent(id),{cache:'no-store',headers:{Accept:'application/json'}}),j=await r.json();if(!r.ok)throw new Error();return{id:j.resolvedStation||id,metar:j.metar}}catch{return{id,metar:null}}}));
   wx.innerHTML=data.map(x=>{const t=x.metar?.obsTime??x.metar?.reportTime,cat=x.metar?.fltCat||'—';return '<a href="/weather.html?station='+encodeURIComponent(x.id)+'"><small>'+esc(x.id)+' · '+esc(cat)+'</small><b>'+esc(x.metar?.rawOb?'METAR AVAILABLE':'NO METAR')+'</b><em>'+(t?'AS OF '+esc(timeLabel(t)):'OBSERVATION TIME UNAVAILABLE')+'</em></a>'}).join('');
 }
 function update(e){
   const r=e?.detail||window.pdNavlogResult;if(!r)return;
   $('#rpLiveDistance').textContent=Number.isFinite(r.totalDistance)?r.totalDistance.toFixed(1)+' NM':'— NM';
   $('#rpLiveEte').textContent=Number.isFinite(r.totalHours)?Math.round(r.totalHours*60)+' MIN':'— MIN';
   $('#rpLiveFuel').textContent=Number.isFinite(r.totalFuel)?r.totalFuel.toFixed(1)+' GAL':'— GAL';
   setRoute();void renderWeather();
 }
 document.addEventListener('pilotdesk:route-built',update);
 if(window.pdNavlogResult)update({detail:window.pdNavlogResult});
}
function renderSavedRoutes(host){
 const all=window.PilotDeskFlights?.list?.()||read('pd-saved-flights',[]);
 if(!Array.isArray(all)||!all.length){host.innerHTML='<header>SAVED ROUTES</header><div class="rp-saved-route"><div><b>No saved routes yet</b><small>Save the current flight to reuse it here.</small></div><div class="rp-saved-route-actions"><a href="/flights.html">Flights</a></div></div>';return}
 const rows=[...all].sort((a,b)=>Number(b.updatedAt||0)-Number(a.updatedAt||0)).slice(0,4);
 host.innerHTML='<header>SAVED ROUTES · REUSE WITHOUT REBUILDING</header>'+rows.map(f=>'<div class="rp-saved-route"><div><b>'+esc(f.name||'Saved flight')+'</b><small>'+esc(String(f.route||'').replace(/\s+/g,' → '))+'</small></div><div class="rp-saved-route-actions"><a href="/route-planner.html?flight='+encodeURIComponent(f.id)+'">Open</a><button type="button" data-duplicate-flight="'+esc(f.id)+'">Duplicate</button></div></div>').join('');
}

function planningContext(){
 if(!['/airport.html','/aircraft.html'].includes(location.pathname))return;
 const ac=activeAircraft();if(!ac)return;
 const main=$('main'),anchor=location.pathname==='/airport.html'?$('.pd-panel'):$('.pd-flight-hero');
 if(!main||!anchor||$('#pdPlanningConnection'))return;
 const box=document.createElement('section');box.className='pd-context-connection';box.id='pdPlanningConnection';
 const label=[ac.tailNumber,ac.type].filter(Boolean).join(' · ');
 box.innerHTML='<div><small>ACTIVE AIRCRAFT</small><b>'+esc(ac.name||label||'Aircraft profile')+(label?' · '+esc(label):'')+'</b></div><a href="/route-planner.html?aircraft='+encodeURIComponent(ac.id)+'">Use in Route Planner →</a>';
 anchor.insertAdjacentElement(location.pathname==='/airport.html'?'beforebegin':'afterend',box);
}

function accountRecent(){
 if(location.pathname!=='/account.html')return;
 const render=()=>{
  const user=window.PilotDeskSession?.user;if(!user?.id)return;
  const dash=$('#pdAccountDashboard');if(!dash||$('#pdAccountRecent'))return;
  const recent=read('pd-recent',[]).slice(0,3),calcs=read('pd-saved-calculations:'+user.id,[]).slice(0,2),flights=read('pd-saved-flights',[]).slice(0,2);
  const items=[
   ...calcs.map(x=>({label:'CALCULATION',title:x.title||'Saved calculation',href:x.url||x.path||'/tools.html',at:x.savedAt})),
   ...flights.map(x=>({label:'FLIGHT',title:x.name||x.route||'Saved flight',href:'/flight-brief.html?id='+encodeURIComponent(x.id),at:x.updatedAt})),
   ...recent.map(x=>({label:'RECENT TOOL',title:x.title||'Calculator',href:x.path||'/tools.html',at:x.at}))
  ].filter(x=>x.href).sort((a,b)=>Number(b.at||0)-Number(a.at||0)).slice(0,5);
  if(!items.length)return;
  const section=document.createElement('section');section.className='pd-account-recent-strip';section.id='pdAccountRecent';section.setAttribute('aria-label','Recent PilotDesk activity');
  section.innerHTML=items.map(x=>'<a href="'+esc(x.href)+'"><span><small>'+esc(x.label)+'</small><b>'+esc(x.title)+'</b></span><small>'+esc(x.at?timeLabel(x.at):'This device')+'</small></a>').join('');
  const grid=$('#pdAccountDashboardGrid');grid?.insertAdjacentElement('afterend',section);
 };
 document.addEventListener('pilotdesk:auth-state',render);setTimeout(render,900);
}

function init(){routePlanner();planningContext();accountRecent()}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init,{once:true}):init();
})();
