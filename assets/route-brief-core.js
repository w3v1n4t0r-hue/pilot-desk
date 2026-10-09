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
function forecastHtml(taf,reference){
 const C=typeof module==='object'&&module.exports?require('./route-review-core.js'):window.PilotDeskDepartureReview;
 if(!C)return '';
 if(reference==null)return '<p class="rp-brief-warning">Set UTC departure and build the route to select a forecast period.</p>';
 const selected=C.selectTaf(taf,reference);
 const row=(g,label)=>'<div class="rp-forecast-period"><div class="rp-brief-wx-heading"><b>'+esc(label)+'</b><strong data-cat="'+esc(g.category)+'">'+esc(g.category)+'</strong></div><p>'+esc(g.windDir==='VRB'?'Wind variable':g.windDir!=null?'Wind '+g.windDir+'° true':'Wind unavailable')+' · '+esc(g.windSpeed??'—')+' kt'+(g.gust!=null?' gust '+esc(g.gust):'')+'</p><p>Visibility '+esc(String(g.visib)==='6+'?'>6':/^P/.test(String(g.visib))?'>'+String(g.visib).slice(1):/^M/.test(String(g.visib))?'<'+String(g.visib).slice(1):g.visibility??'unavailable')+(g.visibility!=null?' SM':'')+' · Ceiling '+esc(g.ceiling==null?'not reported':g.ceiling+' ft AGL')+(g.wx?' · '+esc(g.wx):'')+'</p><p class="rp-brief-meta">Period '+esc(stamp(g.timeFrom))+' to '+esc(stamp(g.timeTo))+'</p></div>';
 return '<section class="rp-selected-forecast"><h4>TAF at planned time · '+esc(stamp(reference))+'</h4>'+(selected.prevailing?row(selected.prevailing,'Prevailing'):'')+selected.groups.map(g=>row(g,(g.fcstChange||'Conditional')+(g.probability?' '+g.probability+'%':''))).join('')+(selected.reason?'<p class="rp-brief-warning">'+esc(selected.reason)+'</p>':'')+'</section>';
}
const notamCache=new Map(),notamPending=new Map();
function requestNotams(id,force=false){
 id=stationId(id);if(!id)return Promise.reject(Error('Invalid airport identifier.'));
 const cached=notamCache.get(id);if(!force&&cached&&Date.now()-cached.at<120000)return cached.error?Promise.reject(cached.error):Promise.resolve(cached.value);
 if(notamPending.has(id))return notamPending.get(id);
 const task=(async()=>{try{const response=await fetch('/api/notams?station='+encodeURIComponent(id),{signal:AbortSignal.timeout(14000)}),value=await response.json();if(!response.ok){const e=Error(value.error||'NOTAM request failed.');e.payload=value;throw e;}notamCache.set(id,{value,at:Date.now()});return value;}catch(error){notamCache.set(id,{error,at:Date.now()});throw error;}finally{notamPending.delete(id);if(notamCache.size>100)notamCache.delete(notamCache.keys().next().value);}})();
 notamPending.set(id,task);return task;
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
 return head+forecastHtml(t,reference)+metar+taf+(reference==null?'<p class="rp-brief-meta">Planned time unavailable; compare forecast validity manually.</p>':'<p class="rp-brief-meta">Planned '+(role==='Departure'?'departure':'arrival')+' '+esc(stamp(reference))+'</p>')+'<p class="rp-brief-meta">'+esc(result.source||'Weather source unavailable')+' · Retrieved '+esc(stamp(result.fetchedAt))+'</p>'+partial+'<a href="/weather.html?station='+encodeURIComponent(id)+'">Open airport weather</a></section>';
}
function notamHtml(p,j,start=null,end=null){
 const head='<details class="rp-brief-section" data-brief-detail="notam-'+esc(p.id)+'"><summary>'+esc(p.role+' · '+p.id)+' NOTAMs'+(!j?' · loading':!j.error&&j.configured!==false?' · '+Number(j.count||0):' · unavailable')+'</summary>';
 if(!j)return head+'<p>Loading airport notices…</p></details>';
 if(j.error||j.configured===false)return head+'<p class="rp-brief-warning">NOTAMs unavailable. '+(j.configured===false?'Automatic FAA NOTAM feed is not configured. ':'')+'No absence of notices is implied.</p><a href="https://notams.aim.faa.gov/notamSearch/" target="_blank" rel="noopener">Check FAA NOTAM Search</a></details>';
 const rows=(j.notams||[]).map(n=>'<div class="rp-notam-item"><p class="rp-brief-meta">'+esc(start!=null&&end!=null?(typeof module==='object'&&module.exports?require('./route-review-core.js'):window.PilotDeskDepartureReview).noticeStatus(n,start,end):'FLIGHT TIME UNAVAILABLE')+'</p><b>'+esc([n.category||'NOTAM',n.number].filter(Boolean).join(' · '))+'</b><p class="rp-brief-meta">Effective '+esc(stamp(n.effectiveStart))+' to '+esc(stamp(n.effectiveEnd))+'</p><p class="rp-brief-raw">'+esc(n.text||'Notice text unavailable.')+'</p></div>').join('');
 return head+'<p class="rp-brief-meta">FAA · Retrieved '+esc(stamp(j.fetchedAt))+'</p>'+(j.partial?'<p class="rp-brief-warning">This response is partial; additional notices may exist.</p>':'')+(rows||'<p>No notices returned by this request. Confirm coverage at the source.</p>')+'<a href="https://notams.aim.faa.gov/notamSearch/" target="_blank" rel="noopener">Check FAA NOTAM Search</a></details>';
}
const layerCache=new Map(),layerPending=new Map();
function requestLayer(product,bbox,force=false){
 if(product==='airsigmet')product='sigmet';
 const url=product==='tfr'?'/api/tfrs?bbox='+encodeURIComponent(bbox):'/api/aviation-layers?product='+encodeURIComponent(product)+'&bbox='+encodeURIComponent(bbox)+(product==='gairmet'?'&forecasts=all':'');
 const old=layerCache.get(url);if(!force&&old&&Date.now()-old.at<60000)return Promise.resolve(old.value);
 if(layerPending.has(url))return layerPending.get(url);
 const task=(async()=>{try{const r=await fetch(url,{cache:'no-store',signal:AbortSignal.timeout(16000)}),value=await r.json();if(!r.ok)throw Error(value.error||'Aviation feed unavailable.');if(!Array.isArray(value.geojson?.features))throw Error('Aviation feed returned unreadable geometry.');layerCache.set(url,{at:Date.now(),value});if(layerCache.size>50)layerCache.delete(layerCache.keys().next().value);return value;}finally{layerPending.delete(url);}})();layerPending.set(url,task);return task;
}
function pointSegDistanceNm(p,a,b){
 const lat=(p[1]+a[1]+b[1])/3*Math.PI/180,xy=c=>[c[0]*Math.cos(lat)*60,c[1]*60],P=xy(p),A=xy(a),B=xy(b),dx=B[0]-A[0],dy=B[1]-A[1],l=dx*dx+dy*dy,t=l?Math.max(0,Math.min(1,((P[0]-A[0])*dx+(P[1]-A[1])*dy)/l)):0;
 return Math.hypot(P[0]-A[0]-t*dx,P[1]-A[1]-t*dy);
}
function pointInRing(p,ring){let inside=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){const a=ring[i],b=ring[j];if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])inside=!inside;}return inside;}
function segmentsIntersect(a,b,c,d){
 const orient=(p,q,r)=>(q[0]-p[0])*(r[1]-p[1])-(q[1]-p[1])*(r[0]-p[0]),o=[orient(a,b,c),orient(a,b,d),orient(c,d,a),orient(c,d,b)],on=(p,q,r)=>r[0]>=Math.min(p[0],q[0])&&r[0]<=Math.max(p[0],q[0])&&r[1]>=Math.min(p[1],q[1])&&r[1]<=Math.max(p[1],q[1]);
 return o[0]*o[1]<0&&o[2]*o[3]<0||Math.abs(o[0])<1e-9&&on(a,b,c)||Math.abs(o[1])<1e-9&&on(a,b,d)||Math.abs(o[2])<1e-9&&on(c,d,a)||Math.abs(o[3])<1e-9&&on(c,d,b);
}
function relationToRoute(feature,points){
 const route=points.map(p=>[Number(p.lon),Number(p.lat)]),g=feature?.geometry;
 if(route.length<2||!g)return{intersects:false,distanceNm:Infinity,unknown:true};
 const polygons=g.type==='Polygon'?[g.coordinates]:g.type==='MultiPolygon'?g.coordinates:[],lines=polygons.flat();
 if(g.type==='LineString')lines.push(g.coordinates);if(g.type==='MultiLineString')lines.push(...g.coordinates);
 if(g.type==='Point')lines.push([g.coordinates]);
 if(!lines.length||lines.some(line=>!Array.isArray(line)||line.some(c=>!Array.isArray(c)||c.length<2||!Number.isFinite(c[0])||!Number.isFinite(c[1]))))return{intersects:false,distanceNm:Infinity,unknown:true};
 for(const polygon of polygons)if(route.some(p=>pointInRing(p,polygon[0])&&!polygon.slice(1).some(hole=>pointInRing(p,hole))))return{intersects:true,distanceNm:0};
 let min=Infinity;
 for(const line of lines)for(let i=0;i<route.length-1;i++){
  for(const v of line)min=Math.min(min,pointSegDistanceNm(v,route[i],route[i+1]));
  for(let j=0;j<line.length-1;j++){
   if(segmentsIntersect(route[i],route[i+1],line[j],line[j+1]))return{intersects:true,distanceNm:0};
   min=Math.min(min,pointSegDistanceNm(route[i],line[j],line[j+1]),pointSegDistanceNm(route[i+1],line[j],line[j+1]));
  }
 }
 return{intersects:min<.01,distanceNm:min};
}
function advisoryTiming(key,p,start,end){
 if(key==='pirep')return 'OBSERVATION · '+stamp(p.obsTime??p.observationTime)+' · not a departure forecast';
 if(key==='gairmet'){const time=dateValue(p.validTime)?.getTime();return 'FORECAST SNAPSHOT · '+stamp(p.validTime)+(start==null||end==null?' · FLIGHT TIME UNAVAILABLE':time==null?' · TIME UNVERIFIED':time<start?' · before departure':time>end?' · after arrival':' · in flight window');}
 if(key==='tfr')return 'TIME UNVERIFIED · FAA effective dates '+String(p.effectiveStart||'unavailable')+' to '+String(p.effectiveEnd||'unavailable')+' · confirm exact times at FAA';
 const from=dateValue(p.validTimeFrom??p.timeFrom)?.getTime(),to=dateValue(p.validTimeTo??p.expireTime??p.timeTo)?.getTime();
 return (start==null||end==null?'FLIGHT TIME UNAVAILABLE':from==null||to==null||to<=from?'TIME UNVERIFIED':from<=end&&to>start?'FLIGHT WINDOW':'OUTSIDE FLIGHT WINDOW')+' · valid '+stamp(from)+' to '+stamp(to);
}
function advisoryHtml(key,items,status,retrieved,start=null,end=null){
 const name={tfr:'TFRs',sigmet:'SIGMETs',airsigmet:'SIGMETs',gairmet:'G-AIRMETs',pirep:'PIREPs / AIREPs',cwa:'Center weather advisories'}[key]||key;
 const rows=items.map(x=>{const p=x.feature.properties||{},id=p.notamId||p.NOTAM_KEY||p.seriesId||p.tag||p.icaoId||name;
 const raw=p.rawSigmet||p.rawAirSigmet||p.cwaText||p.rawOb||p.rawText||p.raw||p.description||p.dueTo||p.due_to||p.hazard||'Review the complete product at the source.';
 const relationship=x.relation.unknown?'geometry unavailable':x.relation.intersects?'intersects route':x.relation.distanceNm.toFixed(1)+' NM from route';
 const height=(key==='sigmet'||key==='airsigmet'||key==='cwa')&&(p.base!=null||p.top!=null)?' · '+String(p.base??'unknown')+'–'+String(p.top??'unknown')+' ft MSL':key==='pirep'&&(p.fltlvl!=null||p.fltLvl!=null)?' · reported FL '+String(p.fltlvl??p.fltLvl):key==='gairmet'?' · altitude limits: review AWC product':'';
 const detail=key==='tfr'?'<a href="https://tfr.faa.gov/" target="_blank" rel="noopener">Review FAA TFR details</a>':'';
 return '<div class="rp-notam-item"><b>'+esc([id,p.hazard||p.airepType||''].filter(Boolean).join(' · '))+' · '+esc(relationship)+'</b><p class="rp-brief-meta">'+esc(advisoryTiming(key,p,start,end)+height)+'</p><p class="rp-brief-raw">'+esc(raw)+'</p>'+detail+'</div>';}).join('');
 const available=status==='available'||status==='partial';
 return '<details class="rp-brief-section" data-brief-detail="advisory-'+esc(key)+'"><summary>'+esc(name)+' · '+(available?items.length+' route items'+(status==='partial'?' · partial':''):esc(status||'not loaded'))+'</summary><p class="rp-brief-meta">'+(available?(key==='tfr'?'FAA':'AWC')+' · Retrieved '+esc(stamp(retrieved||null)):esc(status==='loading'?'Loading route area…':'Coverage unavailable. No clear-route conclusion is available.'))+'</p>'+(status==='partial'?'<p class="rp-brief-warning">Some forecast snapshots or results are missing. Coverage is incomplete.</p>':'')+rows+(available&&!items.length?'<p>No route/near-route geometry detected in this retrieved dataset. This does not establish complete coverage at the planned time.</p>':'')+'</details>';
}
return{requestLayer,relationToRoute,advisoryTiming,forecastHtml,requestNotams,dateValue,stamp,stationId,isAirport,airportCandidates,planningKey,tafStatus,weatherHtml,notamHtml,advisoryHtml};
});
