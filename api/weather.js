'use strict';
const BASE='https://aviationweather.gov/api/data/';
const UA='PilotDesk/2.1 (+https://www.pilot-desk.com)';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function first(j){return Array.isArray(j)?(j[0]||null):(j||null)}
async function query(product,ids,{timeout=9000,retries=1}={}){
  let last={ok:false,error:'No response'};
  for(let attempt=0;attempt<=retries;attempt++){
    const c=new AbortController(),timer=setTimeout(()=>c.abort(),timeout),started=Date.now();
    try{
      const r=await fetch(`${BASE}${product}?ids=${encodeURIComponent(ids)}&format=json`,{headers:{Accept:'application/json','User-Agent':UA},signal:c.signal});
      if(r.status===204)return{ok:true,data:null,status:204,ms:Date.now()-started};
      const text=await r.text();
      if(!r.ok){last={ok:false,status:r.status,error:(text||`AWC returned ${r.status}`).slice(0,240),ms:Date.now()-started};if((r.status===429||r.status>=500)&&attempt<retries){await sleep(250*(attempt+1));continue}return last}
      let j;try{j=JSON.parse(text)}catch{return{ok:false,status:r.status,error:'AWC returned an unreadable JSON response.',ms:Date.now()-started}}
      return{ok:true,data:first(j),status:r.status,ms:Date.now()-started};
    }catch(e){last={ok:false,error:e?.name==='AbortError'?'Aviation Weather Center request timed out.':'Aviation Weather Center request failed.',ms:Date.now()-started};if(attempt<retries){await sleep(250*(attempt+1));continue}return last}
    finally{clearTimeout(timer)}
  }
  return last;
}
function cleanStation(v){return String(v||'').trim().toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,4)}
async function bundle(station){
  const [metar,taf,airport,stationinfo]=await Promise.all([
    query('metar',station),query('taf',station),query('airport',station),query('stationinfo',station)
  ]);
  return{station,metar,taf,airport,stationinfo};
}
function hasUseful(b){return Boolean(b.metar.data||b.taf.data||b.airport.data||b.stationinfo.data)}
module.exports=async function handler(req,res){
  res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('X-Robots-Tag','noindex');
  if(req.method!=='GET'){res.setHeader('Allow','GET');res.setHeader('Cache-Control','no-store');return res.status(405).json({error:'Method not allowed'})}
  const requested=cleanStation(req.query?.station);
  if(!/^[A-Z0-9]{3,4}$/.test(requested)){res.setHeader('Cache-Control','no-store');return res.status(400).json({error:'Enter a valid 3- or 4-character station identifier.'})}
  const started=Date.now();let b=await bundle(requested),resolved=requested;
  if(!hasUseful(b)&&/^[A-Z]{3}$/.test(requested)){const prefixed='K'+requested,alt=await bundle(prefixed);if(hasUseful(alt)){b=alt;resolved=prefixed}}
  const parts=[['METAR',b.metar],['TAF',b.taf],['Airport',b.airport],['Station',b.stationinfo]];
  const errors=parts.filter(([,x])=>!x.ok).map(([source,x])=>({source,message:x.error,status:x.status||null}));
  const allFailed=parts.every(([,x])=>!x.ok),nothing=!hasUseful(b);
  res.setHeader('Server-Timing',`awc;dur=${Date.now()-started}`);
  if(allFailed){res.setHeader('Cache-Control','no-store');return res.status(502).json({error:'Aviation Weather Center is temporarily unavailable to PilotDesk.',station:requested,resolvedStation:resolved,fetchedAt:new Date().toISOString(),errors})}
  if(nothing){res.setHeader('Cache-Control','public, s-maxage=30, stale-while-revalidate=30');return res.status(200).json({station:requested,resolvedStation:resolved,fetchedAt:new Date().toISOString(),metar:null,taf:null,airport:null,stationInfo:null,errors,source:'U.S. Aviation Weather Center',sourceUrl:'https://aviationweather.gov/'})}
  res.setHeader('Cache-Control','public, s-maxage=45, stale-while-revalidate=60');
  return res.status(200).json({station:requested,resolvedStation:resolved,fetchedAt:new Date().toISOString(),metar:b.metar.ok?b.metar.data:null,taf:b.taf.ok?b.taf.data:null,airport:b.airport.ok?b.airport.data:(b.stationinfo.ok?b.stationinfo.data:null),stationInfo:b.stationinfo.ok?b.stationinfo.data:null,errors,sourceStatus:Object.fromEntries(parts.map(([name,x])=>[name,{ok:x.ok,status:x.status||null,ms:x.ms||null}])),source:'U.S. Aviation Weather Center',sourceUrl:'https://aviationweather.gov/'})
};
