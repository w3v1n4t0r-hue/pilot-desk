(()=>{'use strict';
const $=s=>document.querySelector(s),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const KEY='pd-saved-flights',AC_KEY='pd-aircraft',STEPS=['aircraft','route','weather','loading','math','procedures','review'];
function rawFlights(){try{const x=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(x)?x:[]}catch{return[]}}
function flights(){return window.PilotDeskFlights?.list?.()||rawFlights()}
function saveFlights(v){if(window.PilotDeskFlights?.write)window.PilotDeskFlights.write(v);else{localStorage.setItem(KEY,JSON.stringify(v));document.dispatchEvent(new CustomEvent('pilotdesk:flights-changed'))}}
function aircraft(){try{const x=JSON.parse(localStorage.getItem(AC_KEY)||'[]');return Array.isArray(x)?x:[]}catch{return[]}}
function activeAircraft(){const a=aircraft(),id=localStorage.getItem('pd-aircraft-active');return a.find(x=>x.id===id)||a[0]||null}
function uid(){return crypto?.randomUUID?.()||('fl'+Date.now().toString(36)+Math.random().toString(36).slice(2))}
function dateText(v){if(!v)return'No date set';const d=new Date(v+'T12:00:00');return Number.isFinite(d.getTime())?d.toLocaleDateString(undefined,{year:'numeric',month:'short',day:'numeric'}):v}
function timeText(v){if(!v)return'Never reviewed';const d=new Date(Number(v));return Number.isFinite(d.getTime())?'Reviewed '+d.toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'}):'Never reviewed'}
function tomorrow(){const d=new Date();d.setDate(d.getDate()+1);const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0');return `${y}-${m}-${day}`}
function progress(f){try{return JSON.parse(localStorage.getItem('pd-flight-progress:'+f.id)||'{}')||{}}catch{return{}}}
function progressState(f){
 const p=progress(f),parts=String(f.route||'').trim().split(/\s+/).filter(Boolean);
 const done={aircraft:Boolean(f.aircraftId),route:parts.length>=2,weather:Boolean(p.weather),loading:Boolean(p.loading),math:Boolean(p.math),procedures:Boolean(p.procedures),review:Boolean(f.lastReviewedAt||p.review)};
 const count=STEPS.filter(k=>done[k]).length,next=STEPS.find(k=>!done[k])||'review';
 return{done,count,next,percent:Math.round(count/STEPS.length*100),parts};
}
function resumeHref(f){
 const s=progressState(f),dst=s.parts.at(-1)||'',q=new URLSearchParams();
 if(s.next==='aircraft')return '/aircraft.html?flight='+encodeURIComponent(f.id);
 if(s.next==='review')return '/flight-brief.html?id='+encodeURIComponent(f.id);
 q.set('flight',f.id);
 if(s.next==='weather'&&dst)q.set('station',dst);
 if(s.next==='procedures'&&dst)q.set('ident',dst);
 if(s.next==='loading'&&f.aircraftId)q.set('aircraft',f.aircraftId);
 return ({route:'/route-planner.html',weather:'/weather.html',loading:'/weight-balance.html',math:'/flight-planning-workspace.html',procedures:'/procedures.html'}[s.next]||'/route-planner.html')+'?'+q;
}
function setActive(f){try{localStorage.setItem('pd-active-flight',f.id);if(f.aircraftId)localStorage.setItem('pd-aircraft-active',f.aircraftId)}catch{}}
function formData(){
 const f=$('#flightForm'),d=Object.fromEntries(new FormData(f));d.name=String(d.name||'').trim();d.route=String(d.route||'').trim().toUpperCase().replace(/\s+/g,' ');d.notes=String(d.notes||'').trim();d.aircraftId=String(d.aircraftId||'');
 for(const k of ['tas','burn','windDir','windSpeed','variation']){const raw=String(d[k]??'').trim();d[k]=raw===''?'':Number(raw);if(raw!==''&&!Number.isFinite(d[k]))return{error:`Check ${k}.`}}
 if(d.route.split(/\s+/).filter(Boolean).length<2)return{error:'Enter at least a departure and destination.'};
 if(d.tas!==''&&d.tas<=0)return{error:'Planning TAS must be greater than zero.'};
 if(d.burn!==''&&d.burn<0)return{error:'Fuel burn cannot be negative.'};
 if(d.windDir!==''&&(d.windDir<0||d.windDir>360))return{error:'Wind direction must be 0–360°.'};
 if(d.windSpeed!==''&&d.windSpeed<0)return{error:'Wind speed cannot be negative.'};
 return{data:d}
}
function fillAircraft(id,force=false){const p=aircraft().find(x=>x.id===id);if(!p)return;const tas=p.cruiseTas??p.tas??'',burn=p.fuelBurn??'';if((force||!$('#flightTas').value)&&tas!=='')$('#flightTas').value=tas;if((force||!$('#flightBurn').value)&&burn!=='')$('#flightBurn').value=burn}
function populateAircraft(){const sel=$('#flightAircraft'),a=aircraft(),active=activeAircraft();sel.innerHTML='<option value="">No aircraft selected</option>'+a.map(x=>`<option value="${esc(x.id)}">${esc(x.name||x.type||'Aircraft')}</option>`).join('');if(active){sel.value=active.id;fillAircraft(active.id,false)}}
function reviewState(f){if(!f.lastReviewedAt)return{label:'NOT REVIEWED',cls:'unreviewed',detail:'Open the brief when you are ready to review current endpoint context.'};if(Number(f.updatedAt||0)>Number(f.lastReviewedAt||0))return{label:'CHANGED SINCE REVIEW',cls:'changed',detail:timeText(f.lastReviewedAt)};return{label:'REVIEWED',cls:'reviewed',detail:timeText(f.lastReviewedAt)}}
function renderResume(all){
 const host=$('#pdSavedFlightResume');if(!host)return;const id=localStorage.getItem('pd-active-flight'),f=all.find(x=>x.id===id)||all[0];
 if(!f){host.hidden=true;host.replaceChildren();return}
 const s=progressState(f),ac=aircraft().find(x=>x.id===f.aircraftId);host.hidden=false;
 host.innerHTML=`<div><small>RESUME PLANNING</small><h2>${esc(f.name||'Saved flight')}</h2><p>${esc(s.parts.join(' → ')||'Route not set')} · ${esc(ac?.name||'No aircraft')} · ${s.count}/7 steps</p></div><div class="pd-saved-flight-resume-progress"><span><i style="width:${s.percent}%"></i></span><b>${s.percent}%</b></div><a class="pd-btn" data-resume="${esc(f.id)}" href="${esc(resumeHref(f))}">Continue with ${esc(s.next==='math'?'Fuel & math':s.next.charAt(0).toUpperCase()+s.next.slice(1))} →</a>`;
}
function render(){
 const host=$('#savedFlights'),acs=aircraft(),q=String($('#flightSearch')?.value||'').trim().toLowerCase(),sort=$('#flightSort')?.value||'updated';
 let a=flights().filter(f=>{if(!q)return true;const ac=acs.find(x=>x.id===f.aircraftId);return `${f.name||''} ${f.route||''} ${f.notes||''} ${ac?.name||''} ${ac?.type||''}`.toLowerCase().includes(q)});
 if(sort==='date')a.sort((x,y)=>String(x.date||'9999-99-99').localeCompare(String(y.date||'9999-99-99'))||Number(y.updatedAt||0)-Number(x.updatedAt||0));
 else if(sort==='progress')a.sort((x,y)=>progressState(y).count-progressState(x).count||Number(y.updatedAt||0)-Number(x.updatedAt||0));
 else a.sort((x,y)=>Number(y.updatedAt||0)-Number(x.updatedAt||0));
 const total=flights().length;$('#flightCount').textContent=`${total} saved flight${total===1?'':'s'} · stored only on this device.`;
 renderResume(flights());
 if(!a.length){host.innerHTML=`<div class="pd-empty-state"><h3>${total?'No flights match that search':'No saved flights yet'}</h3><p>${total?'Try another name, route, or aircraft.':'Save a route here or from Route Planner, then reuse it as a connected planning workflow.'}</p></div>`;return}
 host.innerHTML=a.map(f=>{const ac=acs.find(x=>x.id===f.aircraftId),route=esc(f.route||'—'),s=progressState(f),rv=reviewState(f),active=localStorage.getItem('pd-active-flight')===f.id;return `<article class="pd-flight-card pd-saved-flight-card${active?' is-active':''}">
 <header><div><div class="pd-saved-flight-eyebrow">${active?'<span>ACTIVE</span>':''}<span class="pd-review-state ${rv.cls}">${rv.label}</span></div><h3>${esc(f.name||'Saved flight')}</h3><div class="route">${route}</div><div class="pd-flight-meta"><span>${esc(dateText(f.date))}</span><span>${esc(ac?.name||'No aircraft')}</span>${f.tas!==''&&f.tas!=null?`<span>${esc(f.tas)} kt TAS</span>`:''}${f.burn!==''&&f.burn!=null?`<span>${esc(f.burn)} GPH</span>`:''}</div></div><div class="pd-actions"><a class="pd-btn" data-resume="${esc(f.id)}" href="${esc(resumeHref(f))}">Resume planning</a><a class="pd-btn secondary" data-review="${esc(f.id)}" href="/flight-brief.html?id=${encodeURIComponent(f.id)}">Review brief</a></div></header>
 <div class="pd-saved-flight-progress"><div><span>Planning progress</span><b>${s.count}/7</b></div><span class="pd-saved-flight-bar"><i style="width:${s.percent}%"></i></span><small>Next: ${esc(s.next==='math'?'Fuel & math':s.next.charAt(0).toUpperCase()+s.next.slice(1))} · ${esc(rv.detail)}</small></div>
 ${f.notes?`<p class="pd-saved-flight-notes">${esc(f.notes)}</p>`:''}
 <div class="pd-actions pd-saved-flight-actions"><a class="pd-btn secondary" data-load="${esc(f.id)}" href="/route-planner.html?flight=${encodeURIComponent(f.id)}">Route Planner</a><button class="pd-btn secondary" type="button" data-tomorrow="${esc(f.id)}">Copy for tomorrow</button><button class="pd-btn secondary" type="button" data-dup="${esc(f.id)}">Duplicate & edit</button><button class="pd-btn secondary" type="button" data-edit="${esc(f.id)}">Edit</button><button class="pd-btn secondary" type="button" data-del="${esc(f.id)}">Delete</button></div></article>`}).join('')
}
function reset(){const f=$('#flightForm');f.reset();$('#flightId').value='';populateAircraft();const active=activeAircraft();if(active){$('#flightAircraft').value=active.id;fillAircraft(active.id,true)}$('#flightWindDir').value='270';$('#flightWindSpeed').value='20';$('#flightVariation').value='0';$('#flightFormTitle').textContent='Save a flight'}
function plannerIntoForm(){try{const p=JSON.parse(localStorage.getItem('pd-route-last')||'null');if(!p?.route)return false;$('#flightRoute').value=p.route;$('#flightTas').value=p.tas??'';$('#flightBurn').value=p.burn??'';$('#flightWindDir').value=p.wd??270;$('#flightWindSpeed').value=p.ws??20;$('#flightVariation').value=p.variation??0;$('#flightName').value=`${String(p.route).trim().split(/\s+/)[0]||''} to ${String(p.route).trim().split(/\s+/).at(-1)||''}`;return true}catch{return false}}
function edit(id){const f=flights().find(x=>x.id===id);if(!f)return;$('#flightId').value=f.id;for(const [k,v] of Object.entries(f)){const el=$('#flightForm').elements[k];if(el)el.value=v??''}$('#flightFormTitle').textContent='Edit saved flight';scrollTo({top:0,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'})}
function duplicate(f,forTomorrow=false){
 const id=uid(),copy={...f,id,name:forTomorrow?(f.name||'Flight'): `${f.name||'Flight'} copy`,date:forTomorrow?tomorrow():f.date,lastReviewedAt:null,createdAt:Date.now(),updatedAt:Date.now()};
 delete copy.reviewedAt;saveFlights([copy,...flights().filter(x=>x.id!==id)]);localStorage.removeItem('pd-flight-progress:'+id);setActive(copy);window.pdTrack?.('Saved Flight Reused',{mode:forTomorrow?'tomorrow':'duplicate'});render();if(!forTomorrow)edit(copy.id);return copy
}
function init(){
 const p=new URLSearchParams(location.search),requestedAircraft=p.get('aircraft');if(requestedAircraft&&aircraft().some(x=>x.id===requestedAircraft))localStorage.setItem('pd-aircraft-active',requestedAircraft);
 populateAircraft();render();const route=p.get('route');if(route){$('#flightRoute').value=route.toUpperCase();const parts=route.trim().split(/\s+/);$('#flightName').value=parts.length>1?`${parts[0]} to ${parts.at(-1)}`:`Flight from ${parts[0]||''}`}
 $('#flightAircraft').addEventListener('change',e=>fillAircraft(e.target.value,true));
 $('#flightImportPlanner').addEventListener('click',()=>{$('#flightStatus').textContent=plannerIntoForm()?'Loaded the most recent Route Planner inputs.':'No recent Route Planner route is stored on this device.'});
 $('#flightForm').addEventListener('submit',e=>{e.preventDefault();const v=formData();if(v.error){$('#flightStatus').textContent=v.error;return}let a=flights(),id=$('#flightId').value||uid(),old=a.find(x=>x.id===id),obj={...(old||{}),...v.data,id,updatedAt:Date.now(),createdAt:old?.createdAt||Date.now()};a=[obj,...a.filter(x=>x.id!==id)];saveFlights(a);setActive(obj);$('#flightStatus').textContent='Flight saved locally and set active.';window.pdTrack?.('Saved Flight Action',{action:old?'updated':'created'});render();reset()});
 $('#flightReset').addEventListener('click',reset);
 $('#flightSearch')?.addEventListener('input',render);$('#flightSort')?.addEventListener('change',render);
 $('#pdSavedFlightResume')?.addEventListener('click',e=>{const a=e.target.closest('[data-resume]');if(a){const f=flights().find(x=>x.id===a.dataset.resume);if(f)setActive(f);window.pdTrack?.('Saved Flight Resume',{source:'resume_card'})}});
 $('#savedFlights').addEventListener('click',e=>{
  const a=e.target.closest('a[data-resume],a[data-review],a[data-load]');if(a){const id=a.dataset.resume||a.dataset.review||a.dataset.load,f=flights().find(x=>x.id===id);if(f)setActive(f);window.pdTrack?.('Saved Flight Resume',{source:a.dataset.review?'brief':a.dataset.load?'planner':'card'});return}
  const b=e.target.closest('button');if(!b)return;const id=b.dataset.tomorrow||b.dataset.dup||b.dataset.edit||b.dataset.del;if(!id)return;if(b.dataset.edit)return edit(id);
  const all=flights(),f=all.find(x=>x.id===id);if(!f)return;
  if(b.dataset.tomorrow)return duplicate(f,true);if(b.dataset.dup)return duplicate(f,false);
  if(b.dataset.del&&confirm(`Delete ${f.name||'this saved flight'}?`)){saveFlights(all.filter(x=>x.id!==id));localStorage.removeItem('pd-flight-progress:'+id);if(localStorage.getItem('pd-active-flight')===id)localStorage.removeItem('pd-active-flight');window.pdTrack?.('Saved Flight Action',{action:'deleted'});render()}
 });
 document.addEventListener('pilotdesk:flights-changed',render);
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init,{once:true}):init();
})();