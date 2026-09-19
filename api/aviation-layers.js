'use strict';

const AWC='https://aviationweather.gov/api/data/';
const UA='PilotDesk/4.0 (+https://www.pilot-desk.com)';
const PRODUCTS=new Set(['metar','pirep','airsigmet','gairmet','cwa','obstacle']);
const BBOX_REQUIRED=new Set(['metar','pirep','obstacle']);
const FALLBACK_GLOBAL=new Set(['airsigmet','gairmet','cwa']);

function parseBbox(value){
  const parts=String(value||'').split(',').map(Number);
  if(parts.length!==4||parts.some(v=>!Number.isFinite(v)))return null;
  const south=parts[0],west=parts[1],north=parts[2],east=parts[3];
  if(south<-90||north>90||west<-180||east>180||south>=north||west>=east)return null;
  return {south,west,north,east,raw:parts.join(',')};
}

async function fetchGeoJson(url,timeout){
  const c=new AbortController();
  const timer=setTimeout(()=>c.abort(),timeout||6500);
  try{
    const r=await fetch(url,{headers:{Accept:'application/geo+json,application/json','User-Agent':UA},signal:c.signal,cache:'no-store'});
    if(r.status===204)return {ok:true,status:204,data:{type:'FeatureCollection',features:[]}};
    const body=await r.text();
    if(!r.ok)return {ok:false,status:r.status,error:(body||('HTTP '+r.status)).slice(0,240)};
    let data;
    try{data=JSON.parse(body)}catch{return {ok:false,status:r.status,error:'Aviation Weather Center returned unreadable GeoJSON.'}}
    if(data&&data.type==='FeatureCollection'&&Array.isArray(data.features))return {ok:true,status:r.status,data};
    if(Array.isArray(data))return {ok:true,status:r.status,data:{type:'FeatureCollection',features:data}};
    return {ok:false,status:r.status,error:'Aviation Weather Center returned an unexpected GeoJSON shape.'};
  }catch(e){
    return {ok:false,status:null,error:e&&e.name==='AbortError'?'Aviation Weather Center request timed out.':'Aviation Weather Center request failed.'};
  }finally{clearTimeout(timer)}
}

module.exports=async function handler(req,res){
  res.setHeader('Content-Type','application/json; charset=utf-8');
  res.setHeader('X-Robots-Tag','noindex');
  if(req.method!=='GET'){
    res.setHeader('Allow','GET');
    res.setHeader('Cache-Control','no-store');
    return res.status(405).json({error:'Method not allowed'});
  }

  const product=String((req.query&&req.query.product)||'').trim().toLowerCase();
  if(!PRODUCTS.has(product)){
    res.setHeader('Cache-Control','no-store');
    return res.status(400).json({error:'Unsupported aviation layer.'});
  }

  const bbox=parseBbox(req.query&&req.query.bbox);
  if(BBOX_REQUIRED.has(product)&&!bbox){
    res.setHeader('Cache-Control','no-store');
    return res.status(400).json({error:'A valid south,west,north,east bounding box is required.'});
  }
  if(bbox&&BBOX_REQUIRED.has(product)&&((bbox.north-bbox.south)>30||(bbox.east-bbox.west)>30)){
    res.setHeader('Cache-Control','no-store');
    return res.status(400).json({error:'Zoom in before loading this layer.'});
  }

  const params=new URLSearchParams({format:'geojson'});
  if(bbox)params.set('bbox',bbox.raw);
  if(product==='pirep')params.set('age','3');
  let upstream=await fetchGeoJson(AWC+product+'?'+params.toString(),6500);

  if(!upstream.ok&&upstream.status===400&&FALLBACK_GLOBAL.has(product)){
    upstream=await fetchGeoJson(AWC+product+'?format=geojson',6500);
  }

  if(!upstream.ok){
    res.setHeader('Cache-Control','no-store');
    return res.status(upstream.status===429?429:502).json({error:upstream.error||'Live aviation layer unavailable.',product,source:'U.S. Aviation Weather Center'});
  }

  res.setHeader('Cache-Control','public, s-maxage=60, stale-while-revalidate=180');
  res.setHeader('X-PilotDesk-Layer-Source','AWC');
  return res.status(200).json({
    product,
    source:'U.S. Aviation Weather Center',
    sourceUrl:'https://aviationweather.gov/data/api/',
    fetchedAt:new Date().toISOString(),
    geojson:upstream.data
  });
};
