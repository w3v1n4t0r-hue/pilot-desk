'use strict';

const BASE='https://external-api.faa.gov/notamapi/v1/notams';
const UA='PilotDesk/4.0 (+https://www.pilot-desk.com)';

const clean=v=>String(v||'').trim().toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,4);
function deep(obj,path){return path.split('.').reduce((v,k)=>v&&typeof v==='object'?v[k]:undefined,obj)}
function first(obj,paths){for(const p of paths){const v=deep(obj,p);if(v!==undefined&&v!==null&&v!=='')return v}return null}
function getItems(payload){
  if(Array.isArray(payload))return payload;
  if(Array.isArray(payload&&payload.items))return payload.items;
  if(Array.isArray(payload&&payload.notams))return payload.notams;
  if(Array.isArray(payload&&payload.features))return payload.features;
  return [];
}
function classify(text){
  const s=String(text||'').toUpperCase();
  if(/\bRWY\b|RUNWAY/.test(s))return 'RUNWAY';
  if(/\bTWY\b|TAXIWAY|APRON/.test(s))return 'TAXIWAY';
  if(/LGT|LIGHT/.test(s))return 'LIGHTING';
  if(/VOR|VORTAC|NDB|NAV|GPS|GNSS/.test(s))return 'NAVAID';
  if(/OBST|TOWER|CRANE/.test(s))return 'OBSTACLE';
  if(/AIRSPACE|TFR|RESTRICT/.test(s))return 'AIRSPACE';
  return 'OTHER';
}
function normalize(item){
  const p=(item&&item.properties)||item||{};
  const n=first(p,['coreNOTAMData.notam','notam'])||p;
  const text=String(first(n,['text','traditionalMessage','icaoMessage'])||first(p,['text','message','traditionalMessage'])||'').trim();
  return {
    id:String(first(n,['id','notamId','number'])||first(p,['id','notamId','number'])||''),
    number:String(first(n,['number','notamNumber'])||first(p,['number','notamNumber'])||''),
    location:String(first(n,['location','icaoLocation'])||first(p,['location','icaoLocation'])||''),
    classification:String(first(n,['classification'])||first(p,['classification'])||''),
    effectiveStart:first(n,['effectiveStart','effectiveStartDate'])||first(p,['effectiveStart','effectiveStartDate']),
    effectiveEnd:first(n,['effectiveEnd','effectiveEndDate'])||first(p,['effectiveEnd','effectiveEndDate']),
    text,
    category:classify(text)
  };
}

module.exports=async function handler(req,res){
  res.setHeader('Content-Type','application/json; charset=utf-8');
  res.setHeader('X-Robots-Tag','noindex');
  if(req.method!=='GET'){
    res.setHeader('Allow','GET');
    res.setHeader('Cache-Control','no-store');
    return res.status(405).json({error:'Method not allowed'});
  }

  const station=clean(req.query&&req.query.station);
  if(!/^[A-Z0-9]{3,4}$/.test(station)){
    res.setHeader('Cache-Control','no-store');
    return res.status(400).json({error:'Enter a valid 3- or 4-character station identifier.'});
  }

  const clientId=process.env.FAA_NOTAM_CLIENT_ID;
  const clientSecret=process.env.FAA_NOTAM_CLIENT_SECRET;
  if(!clientId||!clientSecret){
    res.setHeader('Cache-Control','no-store');
    return res.status(503).json({
      configured:false,
      station,
      error:'FAA NOTAM API credentials are not configured on the PilotDesk server.',
      officialSearch:'https://notams.aim.faa.gov/notamSearch/'
    });
  }

  const c=new AbortController(),timer=setTimeout(()=>c.abort(),8000);
  try{
    const url=new URL(BASE);
    url.searchParams.set('icaoLocation',station);
    url.searchParams.set('responseFormat','geoJson');
    const r=await fetch(url,{
      headers:{Accept:'application/json',client_id:clientId,client_secret:clientSecret,'User-Agent':UA},
      signal:c.signal,
      cache:'no-store'
    });
    const body=await r.text();
    if(!r.ok){
      res.setHeader('Cache-Control','no-store');
      return res.status(r.status===401||r.status===403?503:502).json({
        configured:true,
        station,
        error:r.status===401||r.status===403?'FAA NOTAM credentials were rejected.':'FAA NOTAM API returned '+r.status+'.',
        detail:body.slice(0,160)
      });
    }
    const payload=body?JSON.parse(body):{};
    const normalized=getItems(payload).map(normalize).filter(x=>x.text||x.number);
    const counts=normalized.reduce((a,n)=>{a[n.category]=(a[n.category]||0)+1;return a},{});
    res.setHeader('Cache-Control','public, s-maxage=120, stale-while-revalidate=300');
    return res.status(200).json({
      configured:true,
      station,
      source:'Federal Aviation Administration NOTAM API',
      fetchedAt:new Date().toISOString(),
      count:normalized.length,
      counts,
      notams:normalized
    });
  }catch(e){
    res.setHeader('Cache-Control','no-store');
    return res.status(502).json({configured:true,station,error:e&&e.name==='AbortError'?'FAA NOTAM request timed out.':'FAA NOTAM request failed.'});
  }finally{clearTimeout(timer)}
};
