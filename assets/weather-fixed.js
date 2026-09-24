(()=>{
'use strict';
const $=s=>document.querySelector(s),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=v=>{const n=Number(v);return Number.isFinite(n)?n:null};
const FAV_KEY='pd-favorite-airports';
function dateValue(v){if(v==null||v==='')return null;const d=new Date((typeof v==='number'&&v<1e12)?v*1000:v);return Number.isFinite(d.getTime())?d:null}
function zulu(v){const d=dateValue(v);if(!d)return null;const p=n=>String(n).padStart(2,'0');return `${d.getUTCFullYear()}-${p(d.getUTCMonth()+1)}-${p(d.getUTCDate())} ${p(d.getUTCHours())}:${p(d.getUTCMinutes())}Z`}
function ageMinutes(v){const d=dateValue(v);if(!d)return null;return Math.max(0,(Date.now()-d.getTime())/60000)}
function favorites(){try{const x=JSON.parse(localStorage.getItem(FAV_KEY)||'[]');return Array.isArray(x)?x:[]}catch{return[]}}
function saveFavorites(v){try{localStorage.setItem(FAV_KEY,JSON.stringify(v.slice(0,20)))}catch{}}
function renderFavorites(){
 const host=$('#weatherFavorites');if(!host)return;const a=favorites();
 const section=host.closest('.wx-favorites');if(section)section.hidden=!a.length;
 if(!a.length){host.innerHTML='<div class="pd-empty">No favorite airports yet. Load a station below and save it here.</div>';return}
 host.innerHTML=a.map(x=>`<button class="wx-favorite" type="button" data-weather-favorite="${esc(x.id)}"><span><b>${esc(x.id)}</b><small>${esc(x.name||'Saved airport')}</small></span><em>LOAD FRESH</em></button>`).join('');
}
function toggleFavorite(id,name){
 let a=favorites(),exists=a.some(x=>x.id===id);
 a=exists?a.filter(x=>x.id!==id):[{id,name,at:Date.now()},...a.filter(x=>x.id!==id)];
 saveFavorites(a);renderFavorites();return !exists;
}
function runways(ap){const out=[];const add=(id,len)=>{String(id||'').toUpperCase().split(/[\/-]/).forEach(x=>{const m=x.match(/^(\d{1,2})([LCR])?$/);if(!m)return;const n=Number(m[1]);if(n<1||n>36)return;const key=m[1].padStart(2,'0')+(m[2]||'');if(!out.some(r=>r.id===key))out.push({id:key,heading:n===36?360:n*10,length:num(len)})})};const visit=(o,d=0)=>{if(!o||typeof o!=='object'||d>4)return;if(Array.isArray(o)){o.forEach(v=>visit(v,d+1));return}for(const [k,v] of Object.entries(o)){if(v&&typeof v==='object')visit(v,d+1);if(typeof v==='string'&&/(rwy|runway|ident)/i.test(k))add(v,o.length??o.len??o.rwyLen??o.runwayLength)}};visit(ap);return out.slice(0,20).sort((a,b)=>a.heading-b.heading)}
function comp(r,wd,ws,gust){const rel=(wd-r.heading)*Math.PI/180,calc=s=>({x:s*Math.sin(rel),h:s*Math.cos(rel)}),a=calc(ws),g=gust==null?null:calc(gust),side=x=>Math.abs(x)<.05?'':x>0?'from right':'from left';return `<article class="wx-runway"><div><b>RWY ${esc(r.id)}</b><small>${r.length?`${Math.round(r.length).toLocaleString()} ft · `:''}approx ${String(r.heading).padStart(3,'0')}° magnetic</small></div><div><small>Head/tail</small><b>${Math.abs(a.h).toFixed(0)} kt ${a.h>=0?'headwind':'tailwind'}</b></div><div><small>Crosswind</small><b>${Math.abs(a.x).toFixed(0)} kt ${esc(side(a.x))}</b></div>${g?`<div><small>Gust xwind</small><b>${Math.abs(g.x).toFixed(0)} kt ${esc(side(g.x))}</b></div>`:''}</article>`}
function compData(r,wd,ws){const rel=(wd-r.heading)*Math.PI/180;return{x:ws*Math.sin(rel),h:ws*Math.cos(rel)}}
function runwayScreen(rw,wd,ws){if(wd==null||ws==null||!rw.length)return null;return rw.map(r=>({r,...compData(r,wd,ws)})).sort((a,b)=>(Math.abs(a.x)+(a.h<0?50:0))-(Math.abs(b.x)+(b.h<0?50:0)))[0]||null}
function cloudGroups(met){
 if(Array.isArray(met?.clouds)&&met.clouds.length)return met.clouds.map(c=>{const cover=String(c.cover??c.skyCover??'').toUpperCase(),base=num(c.base??c.baseFt??c.base_feet_agl);return{cover,base}}).filter(x=>x.cover);
 const raw=String(met?.rawOb||''),out=[];for(const m of raw.matchAll(/\b(FEW|SCT|BKN|OVC|VV)(\d{3}|\/\/\/)/g))out.push({cover:m[1],base:m[2]==='///'?null:Number(m[2])*100});return out;
}
function ceilingText(met){const c=cloudGroups(met).filter(x=>['BKN','OVC','VV'].includes(x.cover)&&x.base!=null).sort((a,b)=>a.base-b.base)[0];return c?`${c.cover} ${Math.round(c.base).toLocaleString()} ft AGL`:'No ceiling decoded'}
function cloudsText(met){const a=cloudGroups(met);return a.length?a.map(x=>`${x.cover} ${x.base==null?'///':Math.round(x.base).toLocaleString()+' ft'}`).join(' · '):'No cloud layers decoded'}
function stamp(label,value,missing){return `<span class="wx-time-stamp${value?'':' is-missing'}"><small>${esc(label)}</small><b>${esc(value||missing||'TIME UNAVAILABLE')}</b></span>`}
function briefRow(label,value,timeLabel,timeValue){return `<div class="wx-brief-row"><small>${esc(label)}</small><b>${esc(value??'—')}</b>${stamp(timeLabel,timeValue)}</div>`}
function renderFlightStops(){
 const host=$('#pdWeatherFlightStops');if(!host)return;const params=new URLSearchParams(location.search),id=params.get('flight')||localStorage.getItem('pd-active-flight');if(!id){host.hidden=true;host.innerHTML='';return}
 try{const all=JSON.parse(localStorage.getItem('pd-saved-flights')||'[]'),f=Array.isArray(all)?all.find(x=>x.id===id):null,parts=String(f?.route||'').trim().split(/\s+/).filter(Boolean);if(!f||parts.length<2){host.hidden=true;return}host.hidden=false;host.innerHTML='<div><small>ACTIVE FLIGHT WEATHER</small><b>'+esc(f.name||parts.join(' → '))+'</b></div><div class="pd-weather-stop-links">'+parts.slice(0,10).map((p,i)=>'<a href="/weather.html?station='+encodeURIComponent(p)+'&flight='+encodeURIComponent(f.id)+'"'+(String(params.get('station')||'').toUpperCase()===p.toUpperCase()?' aria-current="page"':'')+'><span>'+(i===0?'DEP':i===parts.length-1?'DEST':'ENR')+'</span><b>'+esc(p)+'</b></a>').join('')+'</div>'}catch{host.hidden=true}
}
function status(text,state=''){const e=$('#weatherStatus');if(e){e.textContent=text;e.dataset.state=state}}
function shortSource(s){return /backup|NOAA\/NWS/i.test(s)?'AWC + NOAA/NWS':/Aviation Weather Center/i.test(s)?'AWC':s||'Weather source'}
async function lookup(id){
 const form=$('#weatherForm'),out=$('#weatherOutput'),btn=form.querySelector('button[type=submit]');
 if(!navigator.onLine){status('Offline — current weather cannot be retrieved','error');out.innerHTML='<div class="pd-empty">Reconnect to retrieve aviation weather. PilotDesk will not show an old weather report as current.</div>';return}
 btn.disabled=true;btn.textContent='Loading…';status('Requesting current weather…','loading');out.innerHTML='<div class="wx-skeleton">Requesting METAR, TAF, and airport data…</div>';
 try{
  const r=await fetch('/api/weather?station='+encodeURIComponent(id),{headers:{Accept:'application/json'},cache:'no-store'}),j=await r.json().catch(()=>({}));
  if(!r.ok)throw new Error(j.error||`Weather service returned ${r.status}`);
  const station=j.resolvedStation||j.station||id,met=j.metar,taf=j.taf,ap=j.airport||j.stationInfo,source=j.source||'U.S. Aviation Weather Center',sourceShort=shortSource(source);
  if(!met&&!taf&&!ap){status(`${station}: no current products returned`,'warn');out.innerHTML='<div class="pd-empty">No METAR, TAF, or station information was returned for this identifier. No older report is being substituted.</div>';return}
  const wd=num(met?.wdir),ws=num(met?.wspd),wg=num(met?.wgst),alt=num(met?.altim),elevM=num(met?.elev??ap?.elev),elevFt=elevM==null?null:elevM*3.28084,altInHg=alt==null?null:alt*0.0295299830714,paApprox=elevFt!=null&&altInHg!=null?elevFt+(29.92-altInHg)*1000:null;
  const obsRaw=met?.obsTime??met?.reportTime,obsZulu=zulu(obsRaw),obsAge=ageMinutes(obsRaw),obsUnknown=Boolean(met&&!obsZulu),obsStale=obsAge!=null&&obsAge>90;
  const retrievedZulu=zulu(j.fetchedAt)||zulu(Date.now());
  const tafIssueRaw=taf?.issueTime??taf?.bulletinTime,tafZulu=zulu(tafIssueRaw),tafIssueAge=ageMinutes(tafIssueRaw),tafUnknown=Boolean(taf&&!tafZulu),tafFromRaw=taf?.validTimeFrom??taf?.validFrom??taf?.fcstTimeFrom,tafToRaw=taf?.validTimeTo??taf?.validTo??taf?.fcstTimeTo,tafFrom=dateValue(tafFromRaw),tafTo=dateValue(tafToRaw),tafOlder=tafIssueAge!=null&&tafIssueAge>720,tafExpired=tafTo?Date.now()>tafTo.getTime():false,tafNotStarted=tafFrom?Date.now()<tafFrom.getTime():false,tafWarn=Boolean(taf&&(tafOlder||tafExpired||tafNotStarted||tafUnknown)),tafValidity=(tafFrom||tafTo)?`${tafFrom?zulu(tafFrom):'—'} to ${tafTo?zulu(tafTo):'—'}`:'Not provided by source';
  const rw=runways(ap),partial=(j.errors||[]).map(e=>e.source).join(','),warnState=obsStale||obsUnknown||tafWarn||Boolean(partial);
  status(`${station} · retrieved ${retrievedZulu||'time unavailable'} · ${sourceShort}${obsStale?` · METAR ${Math.round(obsAge)} min old`:''}${obsUnknown?' · METAR time unavailable':''}${tafExpired?' · TAF validity ended':''}${tafOlder?` · TAF issued ${Math.round(tafIssueAge/60)} hr ago`:''}${tafUnknown?' · TAF issue time unavailable':''}${j.fallbackUsed?' · backup source active':''}${partial?` · partial: ${partial}`:''}`,warnState?'warn':'live');
  const q=new URLSearchParams();if(wd!=null)q.set('windDir',wd);if(ws!=null)q.set('windSpeed',ws);if(met?.temp!=null)q.set('oat',met.temp);
  const screen=runwayScreen(rw,wd,ws),crossQ=new URLSearchParams(q);if(screen)crossQ.set('runway',screen.r.heading);
  const daQ=new URLSearchParams();if(paApprox!=null)daQ.set('pa',Math.round(paApprox));if(met?.temp!=null)daQ.set('oat',met.temp);
  const flightId=new URLSearchParams(location.search).get('flight')||localStorage.getItem('pd-active-flight')||'',flight=flightId?(()=>{try{const a=JSON.parse(localStorage.getItem('pd-saved-flights')||'[]');return Array.isArray(a)?a.find(x=>x.id===flightId):null}catch{return null}})():null;
  const name=ap?.name||met?.name||'Airport weather',isFav=favorites().some(x=>x.id===station);
  const obsWarning=obsStale?`<div class="safety-strip"><strong>Older observation.</strong> The returned METAR is about ${Math.round(obsAge)} minutes old. Verify current conditions at the source before using it for flight planning.</div>`:obsUnknown?'<div class="safety-strip"><strong>Observation time unavailable.</strong> PilotDesk cannot establish the age of this METAR. Do not treat it as current without checking the source.</div>':'';
  const tafWarning=tafWarn?`<div class="safety-strip"><strong>Check TAF currency.</strong> ${tafExpired?'The returned TAF validity period appears to have ended. ':''}${tafNotStarted?'The returned TAF validity period has not started yet. ':''}${tafOlder?`The TAF issue time is about ${Math.round(tafIssueAge/60)} hours old. `:''}${tafUnknown?'The TAF issue time was unavailable. ':''}Verify the latest forecast at the source before flight planning.</div>`:'';
  const windText=met?(met.wdir==='VRB'?'VRB':met.wdir!=null?String(met.wdir).padStart(3,'0')+'°':'—')+' '+(met.wspd??'—')+' kt'+(met.wgst?` G${met.wgst}`:''):'—';
  const tempText=met?.temp!=null?`${met.temp}°C / ${met.dewp??'—'}°C`:'—';
  const altText=alt!=null?`${(alt*0.0295299830714).toFixed(2)} inHg`:'—';
  const decoded=`${briefRow('Flight category',met?.fltCat||'—','OBSERVED',obsZulu)}${briefRow('Wind',windText,'OBSERVED',obsZulu)}${briefRow('Visibility',met?.visib!=null?`${met.visib} SM`:'—','OBSERVED',obsZulu)}${briefRow('Ceiling',ceilingText(met),'OBSERVED',obsZulu)}${briefRow('Clouds',cloudsText(met),'OBSERVED',obsZulu)}${briefRow('Weather',met?.wxString||'No weather phenomena decoded','OBSERVED',obsZulu)}${briefRow('Temperature / dew point',tempText,'OBSERVED',obsZulu)}${briefRow('Altimeter',altText,'OBSERVED',obsZulu)}`;
  out.innerHTML=`<section class="wx-summary">
    <div class="wx-title"><div><span class="badge">${esc(met?.fltCat||'WEATHER')}</span><h2>${esc(station)}</h2><p>${esc(name)}</p></div><div class="wx-summary-source"><span class="pd-source-chip">${esc(source)}</span>${stamp('RETRIEVED',retrievedZulu)}</div></div>
    ${obsWarning}${tafWarning}
    <div class="wx-brief-strip"><div><small>WIND</small><b>${esc(windText)}</b></div><div><small>VIS</small><b>${met?.visib!=null?esc(met.visib)+' SM':'—'}</b></div><div><small>CEILING</small><b>${esc(ceilingText(met))}</b></div><div><small>ALTIMETER</small><b>${esc(altText)}</b></div></div>
    <div class="wx-summary-actions"><button class="utility-btn" type="button" id="weatherRefresh">Refresh from source</button><button class="utility-btn" type="button" id="weatherFavorite">${isFav?'Remove favorite':'Save favorite'}</button><a class="utility-btn" href="/airport.html?id=${encodeURIComponent(station)}">Airport</a></div>
  </section>
  <section class="wx-raw-grid">
    <article class="wx-block wx-product"><div class="wx-product-head"><div><span class="eyebrow">RAW OBSERVATION</span><h2>METAR</h2></div>${stamp('OBSERVED',obsZulu,'OBS TIME UNAVAILABLE')}</div><div class="pd-raw">${esc(met?.rawOb||'No METAR returned.')}</div><p class="fine">${obsAge!=null?`${Math.round(obsAge)} min old · `:''}Retrieved ${esc(retrievedZulu||'time unavailable')}.</p></article>
    <article class="wx-block wx-product"><div class="wx-product-head"><div><span class="eyebrow">RAW FORECAST</span><h2>TAF</h2></div>${stamp('ISSUED',tafZulu,'ISSUE TIME UNAVAILABLE')}</div><div class="pd-raw">${esc(taf?.rawTAF||'No TAF returned for this station.')}</div><p class="fine">Validity: ${esc(tafValidity)} · Retrieved ${esc(retrievedZulu||'time unavailable')}.</p></article>
  </section>
  <section class="wx-block wx-decoded"><div class="pd-card-head"><div><span class="eyebrow">DECODED METAR</span><h2>Conditions</h2><p>Each line is tied to the METAR observation time shown at right.</p></div>${stamp('OBSERVED',obsZulu,'OBS TIME UNAVAILABLE')}</div><div class="wx-brief-table">${decoded}</div></section>
  ${wd!=null&&ws!=null&&rw.length?`<section class="wx-block"><div class="pd-card-head"><div><span class="eyebrow">DERIVED FROM METAR WIND</span><h2>Runway wind components</h2><p>Calculated from the reported wind and runway-number heading approximation.</p></div>${stamp('METAR OBS',obsZulu,'OBS TIME UNAVAILABLE')}</div><div class="wx-runways">${rw.map(x=>comp(x,wd,ws,wg)).join('')}</div><p class="fine">Verify current published runway headings and all applicable aircraft, operator, and pilot limits.</p></section>`:''}
  <section class="wx-block pd-weather-decisions"><div class="pd-card-head"><div><h2>Carry weather into the plan</h2><p>Use the same station data for the next planning check without retyping it.</p></div>${stamp('BASED ON METAR',obsZulu,'OBS TIME UNAVAILABLE')}</div><div class="pd-weather-decision-grid">
  <article><small>RUNWAY WIND</small><h3>${screen?`RWY ${esc(screen.r.id)} orientation screen`:'Runway component setup'}</h3><p>${screen?`Approx. ${Math.abs(screen.x).toFixed(0)} kt crosswind and ${Math.abs(screen.h).toFixed(0)} kt ${screen.h>=0?'headwind':'tailwind'} using runway-number heading.`:'Runway data or steady wind was unavailable.'}</p>${screen?`<a class="pd-btn secondary" data-weather-handoff="crosswind" href="/calculators/crosswind/?${crossQ}">Open crosswind setup →</a>`:''}<small class="pd-weather-caution">METAR winds are true; runway numbers are magnetic approximations. Reconcile references and verify the published runway heading before operational use.</small></article>
  <article><small>PERFORMANCE</small><h3>Density-altitude setup</h3><p>${paApprox!=null&&met?.temp!=null?`Approx. pressure altitude ${Math.round(paApprox).toLocaleString()} ft from station elevation + altimeter, with OAT ${esc(met.temp)}°C.`:'Use pressure altitude and OAT from current verified data.'}</p><a class="pd-btn secondary" data-weather-handoff="density-altitude" href="${paApprox!=null&&met?.temp!=null?'/calculators/density-altitude/?'+daQ:'/calculators/pressure-altitude/'}">${paApprox!=null?'Open density altitude':'Find pressure altitude'} →</a><small class="pd-weather-caution">The pressure-altitude handoff is a convenience estimate; use approved aircraft performance data for takeoff, climb, and landing.</small></article>
  <article><small>ACTIVE FLIGHT</small><h3>${flight?esc(flight.name||'Saved flight'):'No saved flight attached'}</h3><p>${flight?'This weather lookup is attached to the seven-step flight workflow.':'Start or save a flight to carry weather into loading, math, procedures, and review.'}</p><a class="pd-btn secondary" data-weather-handoff="flight" href="${flight?'/weight-balance.html?flight='+encodeURIComponent(flight.id)+(flight.aircraftId?'&aircraft='+encodeURIComponent(flight.aircraftId):''):'/flights.html?route='+encodeURIComponent(station+' ')}">${flight?'Continue to loading':'Start a saved flight'} →</a></article>
  <article><small>VERIFY</small><h3>Airport + official source</h3><p>Check airport details, procedures, report times, and the full official weather picture before the flight.</p><div class="pd-actions"><a class="pd-btn secondary" data-weather-handoff="airport" href="/airport.html?id=${encodeURIComponent(station)}">Airport</a><a class="pd-btn secondary" data-weather-handoff="procedures" href="/procedures.html?ident=${encodeURIComponent(station)}${flight?'&flight='+encodeURIComponent(flight.id):''}">Procedures</a><a class="pd-btn secondary" data-weather-handoff="awc" target="_blank" rel="noopener" href="https://aviationweather.gov/">AWC ↗</a></div></article>
  </div></section>
  <p class="fine">Supplemental planning display only. Weather products were requested with cache bypass and are labeled with their source times. Verify the complete current weather picture through official sources before flight.</p>`;
  $('#weatherRefresh')?.addEventListener('click',()=>lookup(station));
  $('#weatherFavorite')?.addEventListener('click',e=>{const nowSaved=toggleFavorite(station,name);e.currentTarget.textContent=nowSaved?'Remove favorite':'Save favorite';window.pdTrack?.('Weather Favorite',{action:nowSaved?'saved':'removed',station})});
  const nextUrl=new URL(location.href);nextUrl.pathname='/weather.html';nextUrl.search='';nextUrl.searchParams.set('station',station);if(flightId)nextUrl.searchParams.set('flight',flightId);history.replaceState(null,'',nextUrl.pathname+'?'+nextUrl.searchParams.toString());localStorage.setItem('pd-last-airport',station);
  window.__pdLastWeather={station,data:j,retrievedZulu,obsZulu,tafZulu};
  document.dispatchEvent(new CustomEvent('pilotdesk:weatherloaded',{detail:{station,stale:obsStale||obsUnknown||tafWarn,fallback:Boolean(j.fallbackUsed),hasRunwayContext:Boolean(screen),hasDensityAltitudeSetup:paApprox!=null&&met?.temp!=null}}))
 }catch(e){
  console.error(e);status('Weather retrieval failed','error');out.innerHTML=`<div class="wx-error"><h2>Weather could not be loaded</h2><p>${esc(e.message||'Try again in a moment.')}</p><div class="pd-actions"><button class="pd-btn secondary" id="weatherRetry" type="button">Retry</button><a class="pd-btn secondary" target="_blank" rel="noopener" href="https://aviationweather.gov/data/metar/">Open AWC METAR/TAF</a></div></div>`;$('#weatherRetry')?.addEventListener('click',()=>lookup(id))
 }finally{btn.disabled=false;btn.textContent='Load weather'}
}
function submit(e){e.preventDefault();e.stopImmediatePropagation();const id=String(new FormData(e.currentTarget).get('station')||'').trim().toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,4);if(!/^[A-Z0-9]{3,4}$/.test(id))return status('Enter a valid 3- or 4-character station identifier.','error');lookup(id)}
function init(){
 const f=$('#weatherForm');if(!f)return;renderFavorites();f.addEventListener('submit',submit,true);
 $('#weatherFavorites')?.addEventListener('click',e=>{const b=e.target.closest('[data-weather-favorite]');if(!b)return;const id=b.dataset.weatherFavorite;f.elements.station.value=id;lookup(id);window.pdTrack?.('Weather Favorite',{action:'opened',station:id})});
 $('#weatherOutput')?.addEventListener('click',e=>{const a=e.target.closest('[data-weather-handoff]');if(a)window.pdTrack?.('Weather Planning Handoff',{action:a.dataset.weatherHandoff||'unknown',hasActiveFlight:(new URLSearchParams(location.search).get('flight')||localStorage.getItem('pd-active-flight'))?'yes':'no'})});
 renderFlightStops();
 const params=new URLSearchParams(location.search),flightId=params.get('flight');let flightStation='';
 if(flightId){try{const flights=JSON.parse(localStorage.getItem('pd-saved-flights')||'[]'),flight=Array.isArray(flights)?flights.find(x=>x.id===flightId):null,parts=String(flight?.route||'').trim().split(/\s+/).filter(Boolean);flightStation=parts.at(-1)||''}catch{}}
 const id=String(params.get('station')||flightStation||localStorage.getItem('pd-last-airport')||'').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,4);if(id)f.elements.station.value=id;if(params.get('station')||flightStation)lookup(id);
 window.addEventListener('online',()=>status('Online — ready to request current weather','live'));window.addEventListener('offline',()=>status('Offline — current weather cannot be retrieved','error'))
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init,{once:true}):init();
})();
