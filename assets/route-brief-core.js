(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.PilotDeskRouteBrief=factory();})(typeof window==='object'?window:this,function(){
'use strict';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function dateValue(v){
 if(v==null||v==='')return null;
 const numeric=typeof v==='number'||/^\d+(?:\.\d+)?$/.test(String(v));
 const n=Number(v),d=new Date(numeric?(n<1e12?n*1000:n):v);
 return Number.isFinite(d.getTime())?d:null;
}
function stamp(v){const d=dateValue(v);return d?d.toISOString().slice(0,16).replace('T',' ')+' UTC':'Time unavailable';}
function stationId(v){const id=String(v||'').trim().toUpperCase();return /^[A-Z]{3}$/.test(id)?'K'+id:/^[A-Z0-9]{3,4}$/.test(id)?id:'';}
function isAirport(p){return p?.type==='PA'||p?.source==='airport';}
function airportCandidates(points,alternate){
 const rows=[],seen=new Set(),add=(p,role)=>{const id=stationId(p?.id);if(!id||seen.has(id))return;seen.add(id);rows.push({...p,id,role});};
 if(isAirport(points[0]))add(points[0],'Departure');
 if(isAirport(points.at(-1)))add(points.at(-1),'Destination');
 if(stationId(alternate))add({id:alternate},'Alternate');
 for(const p of points)if(isAirport(p))add(p,'Route airport');
 return rows;
}
function planningKey(points,settings={}){return JSON.stringify([points.map(p=>[p.id,p.lat,p.lon,p.type,p.source]),settings.departureUtc||'',String(settings.alternateAirport||'').trim().toUpperCase()]);}
function tafStatus(taf,reference=null,now=Date.now()){
 const issue=dateValue(taf?.issueTime??taf?.bulletinTime),from=dateValue(taf?.validTimeFrom??taf?.validFrom??taf?.fcstTimeFrom),to=dateValue(taf?.validTimeTo??taf?.validTo??taf?.fcstTimeTo),notes=[];
 if(!issue)notes.push('Issue time unavailable.');else if(now-issue.getTime()>12*3600000)notes.push('Issued more than 12 hours ago; verify the latest forecast.');
 if(!from||!to||to<=from)notes.push('Forecast validity unavailable.');
 else{if(now>=to.getTime())notes.push('Forecast validity has ended.');if(reference!=null&&(reference<from.getTime()||reference>=to.getTime()))notes.push('Forecast does not cover the planned time.');}
 return{issue,from,to,notes};
}
function weatherHtml(role,id,result,reference,symbols,now=Date.now()){
 const title=role+' weather'+(id?' · '+id:'');
 const head='<section class="rp-brief-section rp-brief-weather"><h3>'+esc(title)+'</h3>';
 if(!id)return head+'<p>Manual or navigation waypoint: no airport weather lookup.</p></section>';
 if(!result)return head+'<p>Loading METAR and TAF…</p></section>';
 const m=result.metar,t=result.taf,obs=dateValue(m?.obsTime??m?.reportTime),cat=symbols?.metarCategory(m||{})||m?.fltCat||'Unknown';
 const age=obs?Math.max(0,Math.floor((now-obs.getTime())/60000)):null;
 const warn=m&&(!obs||age>=120||obs.getTime()>now+300000);
 const metar=m?'<div class="rp-brief-wx-heading"><b>METAR</b><strong data-cat="'+esc(cat)+'">'+esc(cat)+'</strong></div><p class="rp-brief-meta">Observed '+esc(obs?stamp(obs):'time unavailable')+(age===null?'':' · '+age+' min ago')+'</p>'+(warn?'<p class="rp-brief-warning">Observation time needs review. Verify current conditions.</p>':'')+'<dl class="rp-brief-readouts">'+Object.entries(symbols?.metarDetails(m)||{}).map(([label,value])=>'<div><dt>'+esc(label)+'</dt><dd>'+esc(value)+'</dd></div>').join('')+'</dl><details data-brief-detail="'+esc(role)+'-metar"><summary>Raw METAR</summary><p class="rp-brief-raw">'+esc(m.rawOb||m.raw_text||'Raw report unavailable.')+'</p></details>':'<p class="rp-brief-warning">METAR unavailable. No current observation was returned.</p>';
 let taf='<p class="rp-brief-warning">TAF unavailable. No forecast was returned for this airport.</p>';
 if(t){const status=tafStatus(t,reference,now);taf='<details data-brief-detail="'+esc(role)+'-taf"><summary>TAF</summary><p class="rp-brief-meta">Issued '+esc(status.issue?stamp(status.issue):'time unavailable')+'</p><p class="rp-brief-meta">Valid '+esc(status.from?stamp(status.from):'time unavailable')+' to '+esc(status.to?stamp(status.to):'time unavailable')+'</p><p class="rp-brief-raw">'+esc(t.rawTAF||t.raw_text||'Raw forecast unavailable.')+'</p></details>'+status.notes.map(note=>'<p class="rp-brief-warning">'+esc(note)+'</p>').join('');}
 const partial=result.errors?.length?'<p class="rp-brief-meta">Some weather sources did not respond. Review the returned products.</p>':'';
 return head+metar+taf+(reference==null?'<p class="rp-brief-meta">Planned time unavailable; compare forecast validity manually.</p>':'<p class="rp-brief-meta">Planned '+(role==='Departure'?'departure':'arrival')+' '+esc(stamp(reference))+'</p>')+'<p class="rp-brief-meta">'+esc(result.source||'Weather source unavailable')+' · Retrieved '+esc(stamp(result.fetchedAt))+'</p>'+partial+'<a href="/weather.html?station='+encodeURIComponent(id)+'">Open airport weather</a></section>';
}
function notamHtml(p,j){
 const head='<details class="rp-brief-section" data-brief-detail="notam-'+esc(p.id)+'"><summary>'+esc(p.role+' · '+p.id)+' NOTAMs'+(!j?' · loading':!j.error&&j.configured!==false?' · '+Number(j.count||0):' · unavailable')+'</summary>';
 if(!j)return head+'<p>Loading airport notices…</p></details>';
 if(j.error||j.configured===false)return head+'<p class="rp-brief-warning">NOTAMs unavailable. No absence of notices is implied.</p><a href="https://notams.aim.faa.gov/notamSearch/" target="_blank" rel="noopener">Check FAA NOTAM Search</a></details>';
 const rows=(j.notams||[]).map(n=>'<div class="rp-notam-item"><b>'+esc([n.category||'NOTAM',n.number].filter(Boolean).join(' · '))+'</b><p class="rp-brief-meta">Effective '+esc(stamp(n.effectiveStart))+' to '+esc(stamp(n.effectiveEnd))+'</p><p class="rp-brief-raw">'+esc(n.text||'Notice text unavailable.')+'</p></div>').join('');
 return head+'<p class="rp-brief-meta">FAA · Retrieved '+esc(stamp(j.fetchedAt))+'</p>'+(rows||'<p>No notices returned by this request. Confirm coverage at the source.</p>')+'<a href="https://notams.aim.faa.gov/notamSearch/" target="_blank" rel="noopener">Check FAA NOTAM Search</a></details>';
}
function advisoryHtml(key,items,status,retrieved){
 const name={tfr:'TFRs',airsigmet:'SIGMETs',gairmet:'G-AIRMETs',cwa:'Center weather advisories'}[key]||key;
 const rows=items.map(x=>{const p=x.feature.properties||{},id=p.notamId||p.NOTAM_KEY||p.seriesId||p.hazard||p.hazardType||name;
 const raw=p.rawAirSigmet||p.rawOb||p.rawText||p.raw||p.description||p.hazard||'Review the complete product at the source.';
 const timing=key==='tfr'?'FAA effective dates '+String(p.effectiveStart||'unavailable')+' to '+String(p.effectiveEnd||'unavailable')+'; confirm exact active times.':'Valid '+stamp(p.validTimeFrom??p.validTime??p.timeFrom)+' to '+stamp(p.validTimeTo??p.expireTime??p.timeTo);
 return '<div class="rp-notam-item"><b>'+esc(id)+' · '+esc(x.relation.intersects?'intersects route':x.relation.distanceNm.toFixed(1)+' NM from route')+'</b><p class="rp-brief-meta">'+esc(timing)+'</p><p class="rp-brief-raw">'+esc(raw)+'</p></div>';}).join('');
 return '<details class="rp-brief-section" data-brief-detail="advisory-'+esc(key)+'"><summary>'+esc(name)+' · '+(status==='available'?items.length+' route items':esc(status||'not loaded'))+'</summary><p class="rp-brief-meta">'+(status==='available'?'Retrieved '+esc(stamp(retrieved||null)):esc(status==='loading'?'Loading route area…':'Coverage unavailable. No clear-route conclusion is available.'))+'</p>'+rows+(status==='available'&&!items.length?'<p>No route/near-route geometry detected in this retrieved dataset. Effective times and altitude still require review.</p>':'')+'</details>';
}
return{dateValue,stamp,stationId,isAirport,airportCandidates,planningKey,tafStatus,weatherHtml,notamHtml,advisoryHtml};
});
