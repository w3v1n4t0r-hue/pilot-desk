'use strict';

const WFS='https://tfr.faa.gov/geoserver/TFR/ows';
const LIST_PRIMARY='https://tfr.faa.gov/tfrapi/getTfrList';
const LIST_FALLBACK='https://tfr.faa.gov/tfrapi/exportTfrList';
const UA='PilotDesk/4.0 (+https://www.pilot-desk.com)';

function parseBbox(value){
  const parts=String(value||'').split(',').map(Number);
  if(parts.length!==4||parts.some(v=>!Number.isFinite(v)))return null;
  const south=parts[0],west=parts[1],north=parts[2],east=parts[3];
  if(south<-90||north>90||west<-180||east>180||south>=north||west>=east)return null;
  return {south,west,north,east};
}
async function getJson(url,timeout){
  const c=new AbortController(),timer=setTimeout(()=>c.abort(),timeout||9000);
  try{
    const r=await fetch(url,{headers:{Accept:'application/json','User-Agent':UA},signal:c.signal,cache:'no-store'});
    const body=await r.text();
    if(!r.ok)throw new Error((body||('HTTP '+r.status)).slice(0,200));
    return JSON.parse(body);
  }finally{clearTimeout(timer)}
}
function metaId(x){return String((x&&(x.notam_id||x.notamId||x.NOTAMID||x.notamID))||'').trim()}
function pick(x){
  const keys=Array.prototype.slice.call(arguments,1);
  for(const k of keys){if(x&&x[k]!==undefined&&x[k]!==null&&x[k]!=='')return x[k]}
  return '';
}
function isoDateFromDescription(text,index){
  const months='January|February|March|April|May|June|July|August|September|October|November|December';
  const matches=String(text||'').match(new RegExp('(?:'+months+')\\s+\\d{1,2},\\s+\\d{4}','g'))||[];
  const raw=matches[index||0];
  if(!raw)return null;
  const d=new Date(raw+' 00:00:00 UTC');
  return Number.isFinite(d.getTime())?d.toISOString().slice(0,10):null;
}
function statusFor(description){
  const start=isoDateFromDescription(description,0),end=isoDateFromDescription(description,1);
  const today=new Date().toISOString().slice(0,10);
  if(start&&start>today)return 'upcoming';
  if(end&&end<today)return 'expired';
  return 'active';
}
function detailUrl(id){
  if(!id)return 'https://tfr.faa.gov/';
  return 'https://tfr.faa.gov/tfr3/?page=detail_'+encodeURIComponent(id.replace('/','_'))+'.html';
}

module.exports=async function handler(req,res){
  res.setHeader('Content-Type','application/json; charset=utf-8');
  res.setHeader('X-Robots-Tag','noindex');
  if(req.method!=='GET'){
    res.setHeader('Allow','GET');
    res.setHeader('Cache-Control','no-store');
    return res.status(405).json({error:'Method not allowed'});
  }
  const bbox=parseBbox(req.query&&req.query.bbox);
  if(!bbox){
    res.setHeader('Cache-Control','no-store');
    return res.status(400).json({error:'A valid south,west,north,east bounding box is required.'});
  }

  const params=new URLSearchParams({
    service:'WFS',
    version:'1.1.0',
    request:'GetFeature',
    typeName:'TFR:V_TFR_LOC',
    maxFeatures:'300',
    outputFormat:'application/json',
    srsname:'EPSG:4326',
    bbox:[bbox.west,bbox.south,bbox.east,bbox.north,'EPSG:4326'].join(',')
  });

  try{
    const geometryPromise=getJson(WFS+'?'+params.toString(),10000);
    const metadataPromise=getJson(LIST_PRIMARY,6500).catch(()=>getJson(LIST_FALLBACK,6500)).catch(()=>[]);
    const data=await Promise.all([geometryPromise,metadataPromise]);
    const geometry=data[0],metadata=data[1];
    const rawMeta=Array.isArray(metadata)?metadata:((metadata&&metadata.data)||(metadata&&metadata.items)||[]);
    const metaMap=new Map(rawMeta.map(x=>[metaId(x),x]).filter(x=>x[0]));
    const features=((geometry&&geometry.features)||[]).map(feature=>{
      const props=(feature&&feature.properties)||{};
      const notamKey=String(pick(props,'NOTAM_KEY','notam_key','NOTAMID','notam_id'));
      const id=notamKey.split('-')[0];
      const meta=metaMap.get(id)||{};
      const description=String(pick(meta,'description','Description')||pick(props,'TITLE','title','NAME','name')||'');
      const type=String(pick(meta,'type','Type')||pick(props,'TYPE','type')||'TFR');
      return {
        ...feature,
        properties:{
          ...props,
          notamId:id,
          type,
          description,
          facility:String(pick(meta,'facility','Facility')||pick(props,'FACILITY','facility')),
          state:String(pick(meta,'state','State')||pick(props,'STATE','state')),
          effectiveStart:isoDateFromDescription(description,0),
          effectiveEnd:isoDateFromDescription(description,1),
          status:statusFor(description),
          detailUrl:String(pick(meta,'notam_detail','notamDetail','NotamDetail')||detailUrl(id))
        }
      };
    }).filter(x=>x.geometry);

    res.setHeader('Cache-Control','public, s-maxage=120, stale-while-revalidate=300');
    return res.status(200).json({
      source:'Federal Aviation Administration TFR GeoServer',
      sourceUrl:'https://tfr.faa.gov/',
      fetchedAt:new Date().toISOString(),
      geojson:{type:'FeatureCollection',features}
    });
  }catch(e){
    res.setHeader('Cache-Control','no-store');
    return res.status(502).json({error:e&&e.name==='AbortError'?'FAA TFR service timed out.':((e&&e.message)||'FAA TFR service unavailable.'),source:'Federal Aviation Administration'});
  }
};
