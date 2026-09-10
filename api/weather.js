'use strict';

const AWC='https://aviationweather.gov/api/data/';
const NOAA='https://tgftp.nws.noaa.gov/data/';
const UA='PilotDesk/3.0 (+https://www.pilot-desk.com)';
const first=j=>Array.isArray(j)?(j[0]||null):(j||null);
const cleanStation=v=>String(v||'').trim().toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,4);
const upstreamId=v=>/^[A-Z]{3}$/.test(v)?'K'+v:v;

async function fetchJson(url,timeout=2800){
  const c=new AbortController();
  const timer=setTimeout(()=>c.abort(),timeout);
  const started=Date.now();
  try{
    const r=await fetch(url,{headers:{Accept:'application/json','User-Agent':UA},signal:c.signal,cache:'no-store'});
    if(r.status===204)return{ok:true,data:null,status:204,ms:Date.now()-started};
    const text=await r.text();
    if(!r.ok)return{ok:false,data:null,status:r.status,error:(text||`HTTP ${r.status}`).slice(0,180),ms:Date.now()-started};
    try{return{ok:true,data:first(JSON.parse(text)),status:r.status,ms:Date.now()-started}}
    catch{return{ok:false,data:null,status:r.status,error:'Unreadable JSON response.',ms:Date.now()-started}}
  }catch(e){
    return{ok:false,data:null,status:null,error:e?.name==='AbortError'?'Request timed out.':'Request failed.',ms:Date.now()-started};
  }finally{clearTimeout(timer)}
}

async function fetchText(url,timeout=3200){
  const c=new AbortController();
  const timer=setTimeout(()=>c.abort(),timeout);
  const started=Date.now();
  try{
    const r=await fetch(url,{headers:{Accept:'text/plain,*/*;q=.5','User-Agent':UA},signal:c.signal,cache:'no-store'});
    const text=await r.text();
    if(!r.ok)return{ok:false,data:null,status:r.status,error:`HTTP ${r.status}`,ms:Date.now()-started};
    return{ok:true,data:text.trim()?text:null,status:r.status,ms:Date.now()-started};
  }catch(e){
    return{ok:false,data:null,status:null,error:e?.name==='AbortError'?'Request timed out.':'Request failed.',ms:Date.now()-started};
  }finally{clearTimeout(timer)}
}

function reportText(text){
  const lines=String(text||'').replace(/\r/g,'').split('\n').map(x=>x.trim()).filter(Boolean);
  const stamp=/^\d{4}\/\d{2}\/\d{2}\s+\d{2}:\d{2}$/.test(lines[0]||'')?lines.shift():null;
  return{stamp,raw:lines.join(' ').replace(/\s+/g,' ').trim()};
}
function signed(v){
  if(!v)return null;
  const n=Number(String(v).replace(/^M/,''));
  return Number.isFinite(n)?(String(v).startsWith('M')?-n:n):null;
}
function visibility(raw){
  const m=raw.match(/\b(P6|M?\d+\/\d+|\d+(?:\s+\d+\/\d+)?)SM\b/);
  return m?m[1]:null;
}
function visibilityNumber(v){
  if(!v)return null;
  if(v==='P6')return 6.1;
  if(/^M/.test(v))v=v.slice(1);
  if(v.includes(' ')){
    const [whole,frac]=v.split(' '),[a,b]=frac.split('/').map(Number);
    return Number(whole)+(b?a/b:0);
  }
  if(v.includes('/')){
    const [a,b]=v.split('/').map(Number);
    return b?a/b:null;
  }
  const n=Number(v);
  return Number.isFinite(n)?n:null;
}
function flightCategory(raw,vis){
  let ceiling=null;
  for(const m of raw.matchAll(/\b(?:BKN|OVC|VV)(\d{3})\b/g)){
    const ft=Number(m[1])*100;
    if(ceiling===null||ft<ceiling)ceiling=ft;
  }
  const v=visibilityNumber(vis);
  if((ceiling!==null&&ceiling<500)||(v!==null&&v<1))return'LIFR';
  if((ceiling!==null&&ceiling<1000)||(v!==null&&v<3))return'IFR';
  if((ceiling!==null&&ceiling<=3000)||(v!==null&&v<=5))return'MVFR';
  return'VFR';
}
function parseMetar(text,id){
  const {stamp,raw}=reportText(text);
  if(!raw)return null;
  const station=(raw.match(/^(?:METAR\s+|SPECI\s+)?([A-Z0-9]{4})\b/)||[])[1]||id;
  const wind=raw.match(/\b(VRB|\d{3})(\d{2,3})(?:G(\d{2,3}))?KT\b/);
  const td=raw.match(/\b(M?\d{2})\/(M?\d{2})\b/);
  const a=raw.match(/\bA(\d{4})\b/),q=raw.match(/\bQ(\d{4})\b/),vis=visibility(raw);
  let altim=null;
  if(q)altim=Number(q[1]);
  else if(a)altim=(Number(a[1])/100)/0.0295299830714;
  const obsTime=stamp?Date.parse(stamp.replace(' ','T')+'Z')/1000:null;
  return{
    icaoId:station,rawOb:raw,
    wdir:wind?(wind[1]==='VRB'?'VRB':Number(wind[1])):null,
    wspd:wind?Number(wind[2]):null,wgst:wind?.[3]?Number(wind[3]):null,
    visib:vis,temp:td?signed(td[1]):null,dewp:td?signed(td[2]):null,
    altim:Number.isFinite(altim)?altim:null,
    obsTime:Number.isFinite(obsTime)?obsTime:null,
    fltCat:flightCategory(raw,vis)
  };
}
function parseTaf(text,id){
  const {stamp,raw}=reportText(text);
  if(!raw)return null;
  const station=(raw.match(/^(?:TAF(?:\s+(?:AMD|COR))?\s+)?([A-Z0-9]{4})\b/)||[])[1]||id;
  const issueTime=stamp?Date.parse(stamp.replace(' ','T')+'Z')/1000:null;
  return{icaoId:station,rawTAF:raw,issueTime:Number.isFinite(issueTime)?issueTime:null};
}

module.exports=async function handler(req,res){
  res.setHeader('Content-Type','application/json; charset=utf-8');
  res.setHeader('X-Robots-Tag','noindex');
  res.setHeader('X-PilotDesk-Weather','3.0');
  if(req.method!=='GET'){
    res.setHeader('Allow','GET');
    res.setHeader('Cache-Control','no-store');
    return res.status(405).json({error:'Method not allowed'});
  }

  const requested=cleanStation(req.query?.station);
  if(!/^[A-Z0-9]{3,4}$/.test(requested)){
    res.setHeader('Cache-Control','no-store');
    return res.status(400).json({error:'Enter a valid 3- or 4-character station identifier.'});
  }

  const id=upstreamId(requested);
  const started=Date.now();
  const [awcMetar,awcTaf,awcAirport,noaaMetar,noaaTaf]=await Promise.all([
    fetchJson(`${AWC}metar?ids=${encodeURIComponent(id)}&format=json`,2800),
    fetchJson(`${AWC}taf?ids=${encodeURIComponent(id)}&format=json`,2800),
    fetchJson(`${AWC}airport?ids=${encodeURIComponent(id)}&format=json`,2400),
    fetchText(`${NOAA}observations/metar/stations/${encodeURIComponent(id)}.TXT`,3200),
    fetchText(`${NOAA}forecasts/taf/stations/${encodeURIComponent(id)}.TXT`,3200)
  ]);

  const metar=awcMetar.data||parseMetar(noaaMetar.data,id);
  const taf=awcTaf.data||parseTaf(noaaTaf.data,id);
  const airport=awcAirport.data||null;
  const fallbackUsed=Boolean((!awcMetar.data&&metar)||(!awcTaf.data&&taf));
  const errors=[];

  for(const [source,r] of [
    ['AWC METAR',awcMetar],['AWC TAF',awcTaf],['AWC airport',awcAirport],
    ['NOAA/NWS METAR',noaaMetar],['NOAA/NWS TAF',noaaTaf]
  ]){
    if(!r.ok&&r.status!==404&&r.status!==204)errors.push({source,message:r.error,status:r.status||null});
  }

  const resolved=metar?.icaoId||taf?.icaoId||id;
  const fetchedAt=new Date().toISOString();
  const source=fallbackUsed?(awcMetar.data||awcTaf.data?'Aviation Weather Center + NOAA/NWS backup':'NOAA/NWS aviation text feed'):'U.S. Aviation Weather Center';

  res.setHeader('Server-Timing',`weather;dur=${Date.now()-started}`);
  res.setHeader('Cache-Control','public, s-maxage=75, stale-while-revalidate=300');

  if(!metar&&!taf&&!airport){
    const allUnavailable=[awcMetar,awcTaf,noaaMetar,noaaTaf].every(r=>!r.ok||!r.data);
    return res.status(allUnavailable?502:200).json({
      error:allUnavailable?'Live aviation weather sources did not answer in time.':undefined,
      station:requested,resolvedStation:resolved,fetchedAt,
      metar:null,taf:null,airport:null,stationInfo:null,errors,
      source:'Aviation Weather Center + NOAA/NWS'
    });
  }

  return res.status(200).json({
    station:requested,resolvedStation:resolved,fetchedAt,
    metar,taf,airport,stationInfo:null,errors,fallbackUsed,source,
    sourceUrl:fallbackUsed?'https://tgftp.nws.noaa.gov/data/':'https://aviationweather.gov/',
    sourceStatus:{
      awcMetar:{ok:awcMetar.ok,status:awcMetar.status||null,ms:awcMetar.ms||null},
      awcTaf:{ok:awcTaf.ok,status:awcTaf.status||null,ms:awcTaf.ms||null},
      awcAirport:{ok:awcAirport.ok,status:awcAirport.status||null,ms:awcAirport.ms||null},
      noaaMetar:{ok:noaaMetar.ok,status:noaaMetar.status||null,ms:noaaMetar.ms||null},
      noaaTaf:{ok:noaaTaf.ok,status:noaaTaf.status||null,ms:noaaTaf.ms||null}
    }
  });
};
