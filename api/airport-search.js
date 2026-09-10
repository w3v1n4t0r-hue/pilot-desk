'use strict';

const STATIONS='https://aviationweather.gov/data/cache/stations.cache.json.gz';
const UA='PilotDesk/3.1 (+https://www.pilot-desk.com)';
let memory={at:0,rows:null};

function clean(v){return String(v||'').trim().replace(/\s+/g,' ').slice(0,80)}
function idOf(o){return String(o?.icaoId??o?.icao??o?.ident??o?.stationId??o?.id??o?.faaId??'').trim().toUpperCase()}
function num(v){const n=Number(v);return Number.isFinite(n)?n:null}
function rowFrom(v){
  if(!v||typeof v!=='object')return null;
  const p=v.type==='Feature'?{...(v.properties||{}),geometry:v.geometry}:v;
  const coords=p?.geometry?.coordinates;
  const id=idOf(p);
  if(!id)return null;
  const name=String(p.site??p.name??p.stationName??p.location??p.city??id).trim();
  const state=String(p.state??p.stateCode??p.region??'').trim();
  const country=String(p.country??p.countryCode??'').trim();
  const lat=num(p.lat??p.latitude??p.latDec??p.latitudeDecimal??(Array.isArray(coords)?coords[1]:null));
  const lon=num(p.lon??p.longitude??p.lonDec??p.longitudeDecimal??(Array.isArray(coords)?coords[0]:null));
  const elev=num(p.elev??p.elevation??p.elevM??p.elevationM);
  return{id,name,state,country,lat,lon,elev};
}
function rowsFrom(j){
  const base=Array.isArray(j)?j:Array.isArray(j?.features)?j.features:Array.isArray(j?.stations)?j.stations:Array.isArray(j?.data)?j.data:Object.values(j||{});
  return base.map(rowFrom).filter(Boolean);
}
async function load(){
  if(memory.rows&&Date.now()-memory.at<12*3600e3)return memory.rows;
  const c=new AbortController(),t=setTimeout(()=>c.abort(),8000);
  try{
    const r=await fetch(STATIONS,{headers:{Accept:'application/json','User-Agent':UA},signal:c.signal,cache:'no-store'});
    if(!r.ok)throw new Error(`Station index returned ${r.status}`);
    const rows=rowsFrom(await r.json());
    if(!rows.length)throw new Error('Station index was empty');
    memory={at:Date.now(),rows};
    return rows;
  }finally{clearTimeout(t)}
}
function score(q,r){
  const qq=q.toUpperCase(),id=r.id.toUpperCase(),text=`${r.name} ${r.state} ${r.country}`.toUpperCase();
  let s=0;
  if(id===qq)s+=1200;
  if(qq.length===3&&id===`K${qq}`)s+=1150;
  if(id.startsWith(qq))s+=650;
  if(id.endsWith(qq))s+=500;
  if(text===qq)s+=500;
  if(text.startsWith(qq))s+=360;
  if(text.includes(qq))s+=220;
  for(const token of qq.split(/\s+/).filter(Boolean))if(text.includes(token))s+=60;
  return s;
}
module.exports=async function handler(req,res){
  res.setHeader('Content-Type','application/json; charset=utf-8');
  res.setHeader('X-Robots-Tag','noindex');
  if(req.method!=='GET'){res.setHeader('Allow','GET');res.setHeader('Cache-Control','no-store');return res.status(405).json({error:'Method not allowed'})}
  const q=clean(req.query?.q);
  if(q.length<2){res.setHeader('Cache-Control','no-store');return res.status(400).json({error:'Enter at least two characters.'})}
  try{
    const rows=await load();
    const seen=new Set();
    const matches=rows.map(r=>({r,s:score(q,r)})).filter(x=>x.s>0).sort((a,b)=>b.s-a.s||a.r.id.localeCompare(b.r.id)).map(x=>x.r).filter(r=>{if(seen.has(r.id))return false;seen.add(r.id);return true}).slice(0,12);
    if(!matches.length&&/^[A-Za-z0-9]{3,4}$/.test(q)){
      const raw=q.toUpperCase();
      matches.push({id:raw.length===3?`K${raw}`:raw,name:raw.length===3?`Try ${raw} as a U.S. airport identifier`:'Try this station identifier',state:'',country:'',lat:null,lon:null,elev:null,synthetic:true});
    }
    res.setHeader('Cache-Control','public, s-maxage=21600, stale-while-revalidate=86400');
    return res.status(200).json({query:q,results:matches,source:'U.S. Aviation Weather Center station index',fetchedAt:new Date().toISOString()});
  }catch(e){
    const raw=q.toUpperCase();
    const fallback=/^[A-Z0-9]{3,4}$/.test(raw)?[{id:raw.length===3?`K${raw}`:raw,name:'Identifier lookup',synthetic:true}]:[];
    res.setHeader('Cache-Control','no-store');
    return res.status(fallback.length?200:502).json({query:q,results:fallback,warning:'Airport name search is temporarily unavailable. Identifier lookup still works.',error:fallback.length?undefined:'Airport search source is temporarily unavailable.'});
  }
};
