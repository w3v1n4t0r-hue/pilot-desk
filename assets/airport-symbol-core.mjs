const finite=value=>typeof value==='number'&&Number.isFinite(value);
export function runwayGeometry(airport){
 const runways=(airport.runways||[]).filter(r=>r.ends?.length===2&&!/^H/i.test(r.id));
 const cos=Math.cos(airport.lat*Math.PI/180),segments=[];
 for(const runway of runways){const [a,b]=runway.ends;if(![a.latitude,a.longitude,b.latitude,b.longitude].every(finite))continue;
  const line=[(a.longitude-airport.lon)*cos,-(a.latitude-airport.lat),(b.longitude-airport.lon)*cos,-(b.latitude-airport.lat)];
  if(Math.hypot(line[2]-line[0],line[3]-line[1])>0)segments.push(line);
 }
 if(!segments.length)return [];
 const xs=segments.flatMap(r=>[r[0],r[2]]),ys=segments.flatMap(r=>[r[1],r[3]]),cx=(Math.min(...xs)+Math.max(...xs))/2,cy=(Math.min(...ys)+Math.max(...ys))/2;
 const scale=17/Math.max(Math.max(...xs)-Math.min(...xs),Math.max(...ys)-Math.min(...ys));
 return segments.map(r=>r.map((v,i)=>Math.round((12+(v-(i%2?cy:cx))*scale)*10)/10));
}
export function symbolRecord(a){return {id:a.id,lat:a.lat,lon:a.lon,type:a.type,use:a.use,status:a.status,tower:(a.frequencies||[]).some(f=>/^LCL(?:\/|\s|$)|^TWR(?:\/|\s|$)/.test(f.service)),length:Math.max(0,...(a.runways||[]).map(r=>r.lengthFt||0)),lines:runwayGeometry(a)}};
export function symbolSvg(a){
 const color=a.tower?'#39b8f2':'#df40d9';
 const base='<circle cx="12" cy="12" r="9.2" fill="'+color+'" stroke="#17212a" stroke-width="1.1"/>';
 let shape;
 if(['CI','CP'].includes(a.status))shape='<path d="M6 6l12 12M18 6L6 18" stroke="#17212a" stroke-width="3"/>';
 else if(a.type==='H')shape='<path d="M8 6v12m8-12v12M8 12h8" stroke="white" stroke-width="2"/>';
 else if(a.type==='B')shape='<path d="M12 4v12m-5-5h10M5 14q7 9 14 0M9 19l3 2 3-2" fill="none" stroke="white" stroke-width="1.5"/>';
 else if(a.use==='PR')shape='<text x="12" y="16.5" text-anchor="middle" fill="white" font-family="Arial,sans-serif" font-size="13" font-weight="700">R</text>';
 else if(a.lines?.length){const lines=a.lines.map(r=>'<path d="M'+r[0]+' '+r[1]+'L'+r[2]+' '+r[3]+'"/>').join('');shape='<g fill="none" stroke="#17212a" stroke-width="3.5" stroke-linecap="square">'+lines+'</g><g fill="none" stroke="white" stroke-width="1.5" stroke-linecap="square">'+lines+'</g>';}
 else shape='<circle cx="12" cy="12" r="5.5" fill="none" stroke="white" stroke-width="1.4"/>';
 return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">'+base+shape+'</svg>';
}
export function visibleAirports(records,bounds,zoom,ids=['aero']){
 if(zoom<5||!ids.length)return [];
 const selected=new Set(ids);
 return records.filter(a=>{
  if(a.lat<bounds.south||a.lat>bounds.north||a.lon<bounds.west||a.lon>bounds.east)return false;
  const category=a.use==='PR'?'privateAP':a.type==='H'?'heli':a.type==='B'?'seaplane':a.type==='A'?'airports':'other';
  return (selected.has('aero')||selected.has('aero/'+category))&&(zoom>=10||a.use!=='PR'&&a.type==='A');
 }).sort((a,b)=>Number(b.tower)-Number(a.tower)||b.length-a.length||a.id.localeCompare(b.id));
}
