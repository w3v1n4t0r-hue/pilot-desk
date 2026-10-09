(()=>{
'use strict';
const $=id=>document.getElementById(id),C=window.PilotDeskDepartureReview;
let staged=[],weather=new Map(),notices=new Map(),advisories=new Map(),loadedKey='',sequence=0,loading=false,autoTimer=0,autoAttempt='',windAttempt='';
const PRODUCTS=['sigmet','gairmet','pirep','cwa','tfr'];
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const rp=()=>window.PilotDeskRoutePlanner,perf=()=>window.PilotDeskRoutePerformance,B=()=>window.PilotDeskRouteBrief;
const key=()=>B().planningKey(rp()?.getPoints()||[],perf()?.getSettings()||{})+'|'+(perf()?.getSettings().phases?.cruiseAltitude||'');
const inputKey=()=>JSON.stringify([$('rpRoute').value,$('rpDepartureUtc').value,perf()?.getSettings().phases?.cruiseAltitude,perf()?.getSettings().alternateAirport,$('rpTas').value,$('rpBurn').value,$('rpWindDir').value,$('rpWindSpeed').value]);
function windowTimes(){const departure=C.timestamp(($('rpDepartureUtc').value||'')+'Z'),nav=window.pdNavlogResult;return{departure,arrival:departure!=null&&nav?departure+nav.totalHours*3600000:null};}
function replaceContents(host,html){const open=new Set([...(host.querySelectorAll?.('[data-brief-detail][open]')||[])].map(el=>el.dataset.briefDetail));host.innerHTML=html;host.querySelectorAll?.('[data-brief-detail]').forEach(el=>{el.open=open.has(el.dataset.briefDetail);});}
function render(){
 const points=rp()?.getPoints()||[],s=perf()?.getSettings()||{},times=windowTimes(),airports=B().airportCandidates(points,s.alternateAirport),nav=window.pdNavlogResult,ready=loadedKey===key()&&nav;
 $('rpReviewWindBasis').textContent=s.forecast?'Navlog wind basis: '+s.forecast.source+' · '+s.forecast.altitude+' ft MSL · valid '+B().stamp(s.forecast.start)+' to '+B().stamp(s.forecast.end)+' · retrieved '+B().stamp(s.forecast.fetchedAt)+'. Entered leg winds override the forecast.':'Navlog wind basis: entered winds. No forecast winds are applied.';
 replaceContents($('rpDepartureWeather'),ready?airports.slice(0,8).map(p=>{const index=points.findIndex(q=>q.id===p.id),planned=p.role==='Departure'?times.departure:p.role==='Alternate'?null:times.departure!=null&&index>0?times.departure+nav.legs[index-1].cumTime*3600000:times.arrival;return B().weatherHtml(p.role,p.id,weather.get(p.id)||{error:'Weather unavailable'},planned,window.PilotDeskChartSymbols);}).join(''):'');
 const imported=s.importedNotams||[];
 replaceContents($('rpDepartureNotams'),(ready?airports.slice(0,8).map(p=>B().notamHtml(p,notices.get(p.id),times.departure,times.arrival)).join(''):'')+(imported.length?'<section class="rp-brief-section"><h4>Imported notices · '+imported.length+'</h4><p class="rp-brief-warning">Imported text. Freshness and complete coverage are not verified.</p>'+imported.map(n=>'<details class="rp-imported-notice"><summary>'+esc(n.location||'Airport unspecified')+' · '+esc(n.number)+' · '+esc(times.departure!=null&&times.arrival!=null?C.noticeStatus(n,times.departure,times.arrival):'FLIGHT TIME UNAVAILABLE')+'</summary><p class="rp-brief-meta">Effective '+esc(B().stamp(n.effectiveStart))+' to '+esc(B().stamp(n.effectiveEnd))+'</p><p class="rp-brief-raw">'+esc(n.text)+'</p></details>').join('')+'</section>':''));
 replaceContents($('rpDepartureAdvisories'),ready?PRODUCTS.map(product=>{const data=advisories.get(product)||{status:'loading'},items=(data.geojson?.features||[]).map(feature=>({feature,relation:B().relationToRoute(feature,points)})).filter(x=>x.relation.unknown||x.relation.intersects||x.relation.distanceNm<=(product==='pirep'?25:10));return B().advisoryHtml(product,items,data.status,data.fetchedAt,times.departure,times.arrival);}).join(''):'');
 $('rpReviewCoverage').textContent=ready?'Flight window: '+B().stamp(times.departure)+' to '+B().stamp(times.arrival)+'. Advisories within 10 NM; PIREPs within 25 NM, reported in the past 3 hours. G-AIRMETs show available 0–12 hour snapshots. Latest warnings may not cover a future departure. Horizontal proximity does not check altitude or route legality.':'';
}
function scheduleAuto(){clearTimeout(autoTimer);autoTimer=setTimeout(()=>{const signature=inputKey();if(loading)return;if(signature===autoAttempt||loadedKey===key()&&window.pdNavlogResult)return;if($('rpRoute').value.trim().split(/\s+/).length<2||windowTimes().departure==null)return;autoAttempt=signature;const windsKey=JSON.stringify([$('rpRoute').value,$('rpDepartureUtc').value,perf()?.getSettings().phases?.cruiseAltitude]);const apply=Number(perf()?.getSettings().phases?.cruiseAltitude)>0&&windsKey!==windAttempt;if(apply)windAttempt=windsKey;void review(apply,false);},900);}
function invalidate(){sequence++;$('rpDepartureReviewStatus').textContent='Plan changed. Automatic review will update after the navlog rebuilds.';render();scheduleAuto();}
async function review(applyWinds,force=true){
 if(loading)return;
 clearTimeout(autoTimer);const initialInput=inputKey();autoAttempt=initialInput;
 loading=true;$('rpLoadDepartureReview').disabled=true;$('rpRefreshAirportReview').disabled=true;$('rpDepartureReviewStatus').textContent='Loading AWC weather and route advisories, FAA TFRs and airport notices…';
 try{
  if(!window.pdNavlogResult){if(perf()?.getSettings().forecast)perf().clearForecast();await rp()?.rebuild();}
  let points=rp()?.getPoints()||[],time=windowTimes();
  if(inputKey()!==initialInput)return;
  if(points.length<2||time.departure==null||!window.pdNavlogResult){$('rpDepartureReviewStatus').textContent='Build a valid route and enter a valid UTC departure first.';return;}
  let applied=true;
  if(applyWinds){if(!Number(perf().getSettings().phases?.cruiseAltitude)){$('rpDepartureReviewStatus').textContent='Enter cruise altitude under Aircraft performance & forecast winds first.';return;}applied=await perf().loadWinds();}
  if(inputKey()!==initialInput)return;
  points=rp().getPoints();if(!window.pdNavlogResult||points.length<2){$('rpDepartureReviewStatus').textContent='Navlog unavailable. Review the route or wind error above, then refresh.';return;}
  const seq=++sequence,expected=key(),airports=B().airportCandidates(points,perf().getSettings().alternateAirport).slice(0,8),bbox=window.PilotDeskMapDensity.routeBounds(points),current=()=>seq===sequence&&expected===key();
  weather.clear();notices.clear();advisories.clear();loadedKey=expected;render();
  await Promise.all([
   ...airports.map(async p=>{const [w,n]=await Promise.all([rp().getWeather(p.id,force).catch(e=>({error:e.message})),B().requestNotams(p.id,force).catch(e=>({...e.payload,error:e.message}))]);if(!current())return;weather.set(p.id,w);notices.set(p.id,n);render();}),
   ...PRODUCTS.map(async product=>{try{if(!bbox)throw Error('Unsupported route area');const data=await B().requestLayer(product,bbox,force);if(!current())return;advisories.set(product,{...data,status:data.partial||data.possiblyTruncated?'partial':'available'});}catch(e){if(!current())return;advisories.set(product,{status:'unavailable',error:e.message});}render();})
  ]);
  if(!current())return;
  const failed=airports.some(p=>notices.get(p.id)?.error||notices.get(p.id)?.configured===false||notices.get(p.id)?.partial),missing=PRODUCTS.filter(p=>advisories.get(p)?.status!=='available'),limited=B().airportCandidates(points,perf().getSettings().alternateAirport).length>8;
  $('rpDepartureReviewStatus').textContent=(applyWinds&&!applied?'Forecast winds were not applied: '+$('rpWindsStatus').textContent+' ':'')+'Automatic review updated. '+(airports.some(p=>!weather.get(p.id)?.metar||!weather.get(p.id)?.taf?.fcsts?.length)?'Airport METAR or decoded forecast coverage is incomplete. ':'')+(missing.length?'Unavailable or partial route feeds: '+missing.join(', ')+'. ':'AWC advisories and FAA TFR data retrieved. ')+(failed?'Automatic NOTAM coverage is unavailable or incomplete. Check FAA NOTAM Search. ':'')+(limited?'Airport coverage limited to eight airports. ':'')+(!airports.length?'This route has no identified airport points. ':'')+'Review the source and product times below.';render();
 }catch(e){$('rpDepartureReviewStatus').textContent='Review could not load. '+e.message;}finally{loading=false;$('rpLoadDepartureReview').disabled=false;$('rpRefreshAirportReview').disabled=false;if(inputKey()!==initialInput)scheduleAuto();}
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
 document.addEventListener('pilotdesk:route-invalidated',invalidate);document.addEventListener('pilotdesk:route-built',()=>{render();scheduleAuto();});document.addEventListener('pilotdesk:performance-updated',render);document.addEventListener('pilotdesk:planning-changed',()=>{if(loadedKey&&loadedKey!==key())invalidate();else render();scheduleAuto();});render();scheduleAuto();
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init,{once:true}):init();
})();
