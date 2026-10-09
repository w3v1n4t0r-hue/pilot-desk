'use strict';

const AWC='https://aviationweather.gov/api/data/';
const UA='PilotDesk/4.0 (+https://www.pilot-desk.com)';
const PRODUCTS=new Set(['metar','pirep','sigmet','airsigmet','gairmet','cwa','obstacle']);
const BBOX_REQUIRED=new Set(['metar','pirep','obstacle']);
const GLOBAL=new Set(['sigmet','airsigmet','gairmet','cwa']);
const cache=new Map();
// Share current warning packages across map and route requests. Never cache failures.
async function currentPackage(product,fore){
  const key=product+':'+(fore??''),old=cache.get(key);
  if(old&&Date.now()-old.at<60000)return old.promise;
  const params=new URLSearchParams({format:'geojson'});if(fore!=null)params.set('fore',fore);
  const promise=fetchGeoJson(AWC+product+'?'+params,8000);
  cache.set(key,{at:Date.now(),promise});
  const value=await promise;if(!value.ok)cache.delete(key);return value;
}
function inBounds(feature,bbox){
  if(!bbox)return true;
  const coords=[];function visit(v){if(!Array.isArray(v))return;if(typeof v[0]==='number'&&typeof v[1]==='number')coords.push(v);else v.forEach(visit);}
  visit(feature.geometry?.coordinates);if(!coords.length)return true;
  return Math.max(...coords.map(c=>c[0]))>=bbox.west&&Math.min(...coords.map(c=>c[0]))<=bbox.east&&Math.max(...coords.map(c=>c[1]))>=bbox.south&&Math.min(...coords.map(c=>c[1]))<=bbox.north;
}

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
    if(r.status===204)return {ok:true,status:204,fetchedAt:new Date().toISOString(),data:{type:'FeatureCollection',features:[]}};
    const body=await r.text();
    if(!r.ok)return {ok:false,status:r.status,error:(body||('HTTP '+r.status)).slice(0,240)};
    let data;
    try{data=JSON.parse(body)}catch{return {ok:false,status:r.status,error:'Aviation Weather Center returned unreadable GeoJSON.'}}
    if(data&&data.type==='FeatureCollection'&&Array.isArray(data.features))return {ok:true,status:r.status,fetchedAt:new Date().toISOString(),data};
    if(Array.isArray(data))return {ok:true,status:r.status,fetchedAt:new Date().toISOString(),data:{type:'FeatureCollection',features:data}};
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
  if(req.query?.bbox&&!bbox){res.setHeader('Cache-Control','no-store');return res.status(400).json({error:'Invalid geographic bounding box.'});}
  if(BBOX_REQUIRED.has(product)&&!bbox){
    res.setHeader('Cache-Control','no-store');
    return res.status(400).json({error:'A valid south,west,north,east bounding box is required.'});
  }
  const maxLat=product==='metar'?60:30,maxLon=product==='metar'?180:30;
  if(bbox&&BBOX_REQUIRED.has(product)&&((bbox.north-bbox.south)>maxLat||(bbox.east-bbox.west)>maxLon)){
    res.setHeader('Cache-Control','no-store');
    return res.status(400).json({error:'Zoom in before loading this layer.'});
  }

  const params=new URLSearchParams({format:'geojson'});
  if(bbox&&!GLOBAL.has(product))params.set('bbox',bbox.raw);
  if(product==='pirep')params.set('age','3');
  // /sigmet replaces the legacy CONUS-only /airsigmet feed; retain the client alias.
  const providerProduct=product==='airsigmet'?'sigmet':product;
  const allForecasts=product==='gairmet'&&req.query?.forecasts==='all';
  const packages=allForecasts?await Promise.all([0,3,6,9,12].map(f=>currentPackage(providerProduct,f))):[GLOBAL.has(product)?await currentPackage(providerProduct):await fetchGeoJson(AWC+product+'?'+params,8000)];
  const upstream=packages.find(p=>p.ok)||packages[0],failed=packages.filter(p=>!p.ok);

  if(!upstream.ok){
    res.setHeader('Cache-Control','no-store');
    return res.status(upstream.status===429?429:502).json({error:upstream.error||'Live aviation layer unavailable.',product,source:'U.S. Aviation Weather Center'});
  }

  res.setHeader('Cache-Control',failed.length?'no-store':'public, s-maxage=60');
  res.setHeader('X-PilotDesk-Layer-Source','AWC');
  return res.status(200).json({
    product,
    providerProduct,
    source:'U.S. Aviation Weather Center',
    sourceUrl:'https://aviationweather.gov/data/api/',
    fetchedAt:packages.filter(p=>p.ok).map(p=>p.fetchedAt).sort()[0],
    partial:failed.length>0,
    errors:failed.map(p=>({status:p.status,error:p.error})),
    forecastHours:allForecasts?[0,3,6,9,12].filter((f,i)=>packages[i].ok):undefined,
    possiblyTruncated:packages.some(p=>p.ok&&p.data.features.length>=400),
    geojson:{type:'FeatureCollection',features:packages.filter(p=>p.ok).flatMap(p=>p.data.features).filter(f=>inBounds(f,bbox))}
  });
};
