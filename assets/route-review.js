(()=>{
'use strict';
const $=id=>document.getElementById(id),C=window.PilotDeskDepartureReview;
let staged=[],weather=new Map(),notices=new Map(),loadedKey='',sequence=0,loading=false;
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const rp=()=>window.PilotDeskRoutePlanner,perf=()=>window.PilotDeskRoutePerformance,B=()=>window.PilotDeskRouteBrief;
const key=()=>B().planningKey(rp()?.getPoints()||[],perf()?.getSettings()||{});
function windowTimes(){const departure=C.timestamp(($('rpDepartureUtc').value||'')+'Z'),nav=window.pdNavlogResult;return{departure,arrival:departure!=null&&nav?departure+nav.totalHours*3600000:null};}
function render(){
 const points=rp()?.getPoints()||[],s=perf()?.getSettings()||{},times=windowTimes(),airports=B().airportCandidates(points,s.alternateAirport),nav=window.pdNavlogResult;
 $('rpReviewWindBasis').textContent=s.forecast?'Navlog wind basis: forecast winds aloft, with any entered leg overrides. See the wind source and fuel ledger below.':'Navlog wind basis: entered winds. No forecast winds are applied.';
 $('rpDepartureWeather').innerHTML=loadedKey===key()&&nav?airports.slice(0,8).map(p=>{const index=points.findIndex(q=>q.id===p.id),planned=p.role==='Departure'?times.departure:p.role==='Alternate'?null:times.departure!=null&&index>0?times.departure+nav.legs[index-1].cumTime*3600000:times.arrival;return B().weatherHtml(p.role,p.id,weather.get(p.id)||{error:'Weather unavailable'},planned,window.PilotDeskChartSymbols);}).join(''):'';
 const imported=s.importedNotams||[];
 $('rpDepartureNotams').innerHTML=(loadedKey===key()?airports.slice(0,8).map(p=>B().notamHtml(p,notices.get(p.id)||{error:'NOTAMs unavailable'},times.departure,times.arrival)).join(''):'')+(imported.length?'<section class="rp-brief-section"><h4>Imported notices · '+imported.length+'</h4><p class="rp-brief-warning">Imported text. Freshness and complete coverage are not verified.</p>'+imported.map(n=>'<details class="rp-imported-notice"><summary>'+esc(n.location||'Airport unspecified')+' · '+esc(n.number)+' · '+esc(times.departure!=null&&times.arrival!=null?C.noticeStatus(n,times.departure,times.arrival):'FLIGHT TIME UNAVAILABLE')+'</summary><p class="rp-brief-meta">Effective '+esc(B().stamp(n.effectiveStart))+' to '+esc(B().stamp(n.effectiveEnd))+'</p><p class="rp-brief-raw">'+esc(n.text)+'</p></details>').join('')+'</section>':'');
}
function invalidate(){sequence++;loadedKey='';weather.clear();notices.clear();$('rpDepartureReviewStatus').textContent='Plan changed. Load the review again for the current route and departure.';render();}
async function review(applyWinds){
 if(loading)return;
 if(!window.pdNavlogResult){if(applyWinds&&perf()?.getSettings().forecast)perf().clearForecast();await rp()?.rebuild();}
 let points=rp()?.getPoints()||[],time=windowTimes();
 if(points.length<2||time.departure==null){$('rpDepartureReviewStatus').textContent='Build a valid route and enter a valid UTC departure first.';return;}
 if(applyWinds&&!Number(perf().getSettings().phases?.cruiseAltitude)){$('rpDepartureReviewStatus').textContent='Enter cruise altitude under Aircraft performance & forecast winds first.';return;}
 loading=true;$('rpLoadDepartureReview').disabled=true;$('rpRefreshAirportReview').disabled=true;$('rpDepartureReviewStatus').textContent='Loading departure forecasts, winds and notices…';
 try{
  let applied=true;if(applyWinds)applied=await perf().loadWinds();
  points=rp().getPoints();if(!window.pdNavlogResult||points.length<2){$('rpDepartureReviewStatus').textContent='Navlog unavailable. Review the route or wind error above, then reload.';return;}
  const seq=++sequence,expected=key(),airports=B().airportCandidates(points,perf().getSettings().alternateAirport).slice(0,8);weather.clear();notices.clear();loadedKey=expected;
  await Promise.all(airports.map(async p=>{const [w,n]=await Promise.all([rp().getWeather(p.id,true),B().requestNotams(p.id,true).catch(e=>({...e.payload,error:e.message}))]);if(seq!==sequence||expected!==key())return;weather.set(p.id,w);notices.set(p.id,n);}));
  if(seq!==sequence||expected!==key())return;
  const failed=airports.some(p=>notices.get(p.id)?.error||notices.get(p.id)?.configured===false),limited=B().airportCandidates(points,perf().getSettings().alternateAirport).length>8;
  $('rpDepartureReviewStatus').textContent=(applyWinds&&!applied?'Forecast winds were not applied: '+$('rpWindsStatus').textContent+' The wind basis below describes the current navlog. ':'')+(failed?'Airport data loaded; automatic NOTAM coverage is unavailable or incomplete. Import notices or check FAA NOTAM Search. ':'Airport data loaded. Review source times and forecast coverage.')+(limited?' Airport review is limited to eight airports, including departure, destination and alternate.':'')+(!airports.length?' This route has no airport points; manual coordinates do not identify airports.':'');render();
 }catch(e){$('rpDepartureReviewStatus').textContent='Review could not load. '+e.message;}finally{loading=false;$('rpLoadDepartureReview').disabled=false;$('rpRefreshAirportReview').disabled=false;}
}
async function readFile(input,target,status){try{const file=input.files?.[0];if(!file)return;if(file.size>1_000_000)throw Error('Select a file smaller than 1 MB.');target.value=await file.text();status.textContent='File loaded. Review it, then import.';}catch(e){status.textContent=e.message;}}
function init(){
 if(!$('rpDepartureReview')||!C)return;
 $('rpParseImport').addEventListener('click',()=>{try{staged=C.routeImport($('rpImportRouteText').value);$('rpImportChoice').innerHTML=staged.map((f,i)=>'<option value="'+i+'">'+esc(f.name+' · '+f.route)+'</option>').join('');$('rpImportChoices').hidden=false;$('rpImportStatus').textContent=staged.length+' route'+(staged.length===1?'':'s')+' ready. Choose a route to use.';}catch(e){staged=[];$('rpImportChoices').hidden=true;$('rpImportStatus').textContent=e.message;}});
 $('rpImportRouteText').addEventListener('input',()=>{staged=[];$('rpImportChoices').hidden=true;});
 $('rpImportRouteFile').addEventListener('change',async e=>{staged=[];$('rpImportChoices').hidden=true;await readFile(e.target,$('rpImportRouteText'),$('rpImportStatus'));});
 $('rpApplyImport').addEventListener('click',()=>{const f=staged[Number($('rpImportChoice').value)];if(!f)return;try{for(const [k,v]of Object.entries(f.inputs))$('rp'+({tas:'Tas',burn:'Burn',windDir:'WindDir',windSpeed:'WindSpeed',variation:'Variation'}[k])).value=v;if(f.aircraftId&&[...$('rpAircraft').options].some(o=>o.value===f.aircraftId))$('rpAircraft').value=f.aircraftId;perf().setSettings(f.hasPlanning?f.planning:{...perf().getSettings(),...f.planning,phases:perf().getSettings().phases,importedNotams:[]});document.dispatchEvent(new CustomEvent('pilotdesk:route-imported'));rp().setRoute(f.route);document.dispatchEvent(new CustomEvent('pilotdesk:planning-changed'));$('rpImportStatus').textContent=f.name+' imported. Resolving route and rebuilding the navlog. Save it as a new flight when ready.';}catch(e){$('rpImportStatus').textContent='Import could not apply. '+e.message;}});
 $('rpExportRoute').addEventListener('click',()=>{const route=$('rpRoute').value.trim();if(!route){$('rpImportStatus').textContent='Enter a route before exporting.';return;}const data={name:route,route,aircraftId:$('rpAircraft')?.value||'',planning:{...perf().getSettings(),forecast:null},...Object.fromEntries([['tas','rpTas'],['burn','rpBurn'],['windDir','rpWindDir'],['windSpeed','rpWindSpeed'],['variation','rpVariation']].map(([k,id])=>[k,Number($(id).value)]))},url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='pilotdesk-route.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);$('rpImportStatus').textContent='Route and planning inputs exported. Live forecasts are fetched again after import.';});
 $('rpImportNotamFile').addEventListener('change',e=>readFile(e.target,$('rpImportNotamText'),$('rpNotamImportStatus')));
 $('rpApplyNotams').addEventListener('click',()=>{try{const items=C.notamImport($('rpImportNotamText').value);perf().setImportedNotams(items);$('rpNotamImportStatus').textContent=items.length+' imported notices. Save the flight to keep them with the plan.';render();}catch(e){$('rpNotamImportStatus').textContent=e.message;}});
 $('rpClearImportedNotams').addEventListener('click',()=>{perf().setImportedNotams([]);$('rpNotamImportStatus').textContent='Imported notices cleared.';render();});
 $('rpLoadDepartureReview').addEventListener('click',()=>review(true));$('rpRefreshAirportReview').addEventListener('click',()=>review(false));
 document.addEventListener('pilotdesk:route-invalidated',invalidate);document.addEventListener('pilotdesk:route-built',render);document.addEventListener('pilotdesk:performance-updated',render);document.addEventListener('pilotdesk:planning-changed',()=>{if(loadedKey&&loadedKey!==key())invalidate();else render();});render();
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init,{once:true}):init();
})();
