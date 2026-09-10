'use strict';
const AWC='https://aviationweather.gov/api/data/';
const NOAA='https://tgftp.nws.noaa.gov/data/';
const UA='PilotDesk/2.3 (+https://www.pilot-desk.com)';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const first=j=>Array.isArray(j)?(j[0]||null):(j||null);
const cleanStation=v=>String(v||'').trim().toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,4);

async function awc(product,ids,{timeout=7500,retries=0}={}){
  let last={ok:false,error:'No response'};
  for(let attempt=0;attempt<=retries;attempt++){
    const c=new AbortController(),timer=setTimeout(()=>c.abort(),timeout),started=Date.now();
    try{
      const r=await fetch(`${AWC}${product}?ids=${encodeURIComponent(ids)}&format=json`,{headers:{Accept:'application/json','User-Agent':UA},signal:c.signal});
      if(r.status===204)return{ok:true,data:null,status:204,ms:Date.now()-started};
      const text=await r.text();
      if(!r.ok){
        last={ok:false,status:r.status,error:(text||`AWC returned ${r.status}`).slice(0,240),ms:Date.now()-started};
        if((r.status===429||r.status>=500)&&attempt<retries){await sleep(250*(attempt+1));continue}
        return last;
      }
      let j;try{j=JSON.parse(text)}catch{return{ok:false,status:r.status,error:'AWC returned an unreadable JSON response.',ms:Date.now()-started}}
      return{ok:true,data:first(j),status:r.status,ms:Date.now()-started};
    }catch(e){
      last={ok:false,error:e?.name==='AbortError'?'Aviation Weather Center request timed out.':'Aviation Weather Center request failed.',ms:Date.now()-started};
      if(attempt<retries){await sleep(250*(attempt+1));continue}
      return last;
    }finally{clearTimeout(timer)}
  }
  return last;
}

async function textFetch(url,{timeout=6500}={}){
  const c=new AbortController(),timer=setTimeout(()=>c.abort(),timeout),started=Date.now();
  try{
    const r=await fetch(url,{headers:{Accept:'text/plain,*/*;q=.5','User-Agent':UA},signal:c.signal});
    const text=await r.text();
    if(!r.ok)return{ok:false,status:r.status,error:`NOAA/NWS returned ${r.status}.`,ms:Date.now()-started};
    if(!text.trim())return{ok:true,data:null,status:r.status,ms:Date.now()-started};
    return{ok:true,data:text,status:r.status,ms:Date.now()-started};
  }catch(e){
    return{ok:false,error:e?.name==='AbortError'?'NOAA/NWS request timed out.':'NOAA/NWS request failed.',ms:Date.now()-started};
  }finally{clearTimeout(timer)}
}

function reportText(text){
  const lines=String(text||'').replace(/\r/g,'').split('\n').map(x=>x.trimEnd()).filter(x=>x.trim());
  const stamp=/^\d{4}\/\d{2}\/\d{2}\s+\d{2}:\d{2}$/.test(lines[0]||'')?lines.shift().trim():null;
  return{stamp,raw:lines.join(' ').replace(/\s+/g,' ').trim()};
}
function signed(v){if(!v)return null;const n=Number(String(v).replace(/^M/,''));return Number.isFinite(n)?(String(v).startsWith('M')?-n:n):null}
function visibility(raw){
  const m=raw.match(/\b(P6|M?\d+\/\d+|\d+(?:\s+\d+\/\d+)?)SM\b/);
  return m?m[1]:null;
}
function visibilityNumber(v){
  if(!v)return null;if(v==='P6')return 6.1;
  if(/^M/.test(v))v=v.slice(1);
  if(v.includes(' ')){const [whole,frac]=v.split(' ');const [a,b]=frac.split('/').map(Number);return Number(whole)+(b?a/b:0)}
  if(v.includes('/')){const [a,b]=v.split('/').map(Number);return b?a/b:null}
  const n=Number(v);return Number.isFinite(n)?n:null;
}
function flightCategory(raw,vis){
  let ceiling=null;for(const m of raw.matchAll(/\b(?:BKN|OVC|VV)(\d{3})\b/g)){const ft=Number(m[1])*100;if(ceiling===null||ft<ceiling)ceiling=ft}
  const v=visibilityNumber(vis);
  if((ceiling!==null&&ceiling<500)||(v!==null&&v<1))return'LIFR';
  if((ceiling!==null&&ceiling<1000)||(v!==null&&v<3))return'IFR';
  if((ceiling!==null&&ceiling<=3000)||(v!==null&&v<=5))return'MVFR';
  return'VFR';
}
function parseMetar(text,fallbackId){
  const {stamp,raw}=reportText(text);if(!raw)return null;
  const station=(raw.match(/^(?:METAR\s+|SPECI\s+)?([A-Z0-9]{4})\b/)||[])[1]||fallbackId;
  const wind=raw.match(/\b(VRB|\d{3})(\d{2,3})(?:G(\d{2,3}))?KT\b/),td=raw.match(/\b(M?\d{2})\/(M?\d{2})\b/),a=raw.match(/\bA(\d{4})\b/),q=raw.match(/\bQ(\d{4})\b/),vis=visibility(raw);
  let altim=null;if(q)altim=Number(q[1]);else if(a)altim=(Number(a[1])/100)/0.0295299830714;
  const obsTime=stamp?Date.parse(stamp.replace(' ','T')+'Z')/1000:null;
  return{icaoId:station,rawOb:raw,wdir:wind?(wind[1]==='VRB'?'VRB':Number(wind[1])):null,wspd:wind?Number(wind[2]):null,wgst:wind?.[3]?Number(wind[3]):null,visib:vis,temp:td?signed(td[1]):null,dewp:td?signed(td[2]):null,altim:Number.isFinite(altim)?altim:null,obsTime:Number.isFinite(obsTime)?obsTime:null,fltCat:flightCategory(raw,vis)};
}
function parseTaf(text,fallbackId){
  const {stamp,raw}=reportText(text);if(!raw)return null;
  const station=(raw.match(/^(?:TAF(?:\s+(?:AMD|COR))?\s+)?([A-Z0-9]{4})\b/)||[])[1]||fallbackId;
  const issueTime=stamp?Date.parse(stamp.replace(' ','T')+'Z')/1000:null;
  return{icaoId:station,rawTAF:raw,issueTime:Number.isFinite(issueTime)?issueTime:null};
}
function noaaId(requested){return /^[A-Z]{3}$/.test(requested)?'K'+requested:requested}
async function noaaProduct(kind,requested){
  const id=noaaId(requested),path=kind==='metar'?'observations/metar/stations':'forecasts/taf/stations';
  const url=`${NOAA}${path}/${encodeURIComponent(id)}.TXT`,r=await textFetch(url);
  return{...r,data:r.ok&&r.data?(kind==='metar'?parseMetar(r.data,id):parseTaf(r.data,id)):null,url,id};
}

module.exports=async function handler(req,res){
  res.setHeader('Content-Type','application/json; charset=utf-8');
  res.setHeader('X-Robots-Tag','noindex');
  if(req.method!=='GET'){res.setHeader('Allow','GET');res.setHeader('Cache-Control','no-store');return res.status(405).json({error:'Method not allowed'})}
  const requested=cleanStation(req.query?.station);
  if(!/^[A-Z0-9]{3,4}$/.test(requested)){res.setHeader('Cache-Control','no-store');return res.status(400).json({error:'Enter a valid 3- or 4-character station identifier.'})}

  const started=Date.now();
  const [metarA,tafA]=await Promise.all([awc('metar',requested,{retries:1}),awc('taf',requested)]);
  let metar=metarA.data||null,taf=tafA.data||null,resolved=metar?.icaoId||taf?.icaoId||requested;
  const errors=[];
  if(!metarA.ok)errors.push({source:'AWC METAR',message:metarA.error,status:metarA.status||null});
  if(!tafA.ok)errors.push({source:'AWC TAF',message:tafA.error,status:tafA.status||null});

  let metarN=null,tafN=null,fallbackUsed=false;
  if(!metar||!taf){
    const jobs=[];
    if(!metar)jobs.push(noaaProduct('metar',requested).then(x=>{metarN=x;if(x.data){metar=x.data;resolved=x.id;fallbackUsed=true}else if(!x.ok)errors.push({source:'NOAA/NWS METAR',message:x.error,status:x.status||null})}));
    if(!taf)jobs.push(noaaProduct('taf',requested).then(x=>{tafN=x;if(x.data){taf=x.data;resolved=resolved===requested?x.id:resolved;fallbackUsed=true}else if(!x.ok&&x.status!==404)errors.push({source:'NOAA/NWS TAF',message:x.error,status:x.status||null})}));
    await Promise.all(jobs);
  }

  let airport=null,stationInfo=null,airportA=null,stationA=null;
  if(metarA.data||tafA.data){
    airportA=await awc('airport',resolved,{timeout:5500});
    airport=airportA.data||null;
    if(!airportA.ok){
      stationA=await awc('stationinfo',resolved,{timeout:5500});stationInfo=stationA.data||null;
      if(!stationA.ok)errors.push({source:'AWC station metadata',message:stationA.error,status:stationA.status||null});
    }
  }

  res.setHeader('Server-Timing',`weather;dur=${Date.now()-started}`);
  if(!metar&&!taf&&!airport&&!stationInfo){
    const upstreamUnavailable=[metarA,tafA,metarN,tafN].filter(Boolean).some(x=>!x.ok&&x.status!==404&&x.status!==204);
    res.setHeader('Cache-Control',upstreamUnavailable?'no-store':'public, s-maxage=30, stale-while-revalidate=30');
    if(upstreamUnavailable)return res.status(502).json({error:'Live aviation weather sources are temporarily unavailable.',station:requested,resolvedStation:resolved,fetchedAt:new Date().toISOString(),errors});
    return res.status(200).json({station:requested,resolvedStation:resolved,fetchedAt:new Date().toISOString(),metar:null,taf:null,airport:null,stationInfo:null,errors,source:'Aviation Weather Center + NOAA/NWS',sourceUrl:'https://aviationweather.gov/'});
  }

  const source=fallbackUsed?(metarA.data||tafA.data?'Aviation Weather Center + NOAA/NWS backup':'NOAA/NWS aviation text feed'):'U.S. Aviation Weather Center';
  res.setHeader('Cache-Control','public, s-maxage=60, stale-while-revalidate=300');
  return res.status(200).json({
    station:requested,resolvedStation:resolved,fetchedAt:new Date().toISOString(),metar,taf,airport,stationInfo,errors,
    sourceStatus:{
      awcMetar:{ok:metarA.ok,status:metarA.status||null,ms:metarA.ms||null},awcTaf:{ok:tafA.ok,status:tafA.status||null,ms:tafA.ms||null},
      noaaMetar:metarN?{ok:metarN.ok,status:metarN.status||null,ms:metarN.ms||null}:null,noaaTaf:tafN?{ok:tafN.ok,status:tafN.status||null,ms:tafN.ms||null}:null,
      airport:airportA?{ok:airportA.ok,status:airportA.status||null,ms:airportA.ms||null}:null,stationInfo:stationA?{ok:stationA.ok,status:stationA.status||null,ms:stationA.ms||null}:null
    },fallbackUsed,source,sourceUrl:fallbackUsed?'https://tgftp.nws.noaa.gov/data/':'https://aviationweather.gov/'
  });
};
