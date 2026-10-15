'use strict';
const W=require('../assets/winds-aloft-core.js');
const AWC='https://aviationweather.gov/api/data/',cache=new Map();
async function get(key,url,asJson,ttl){const old=cache.get(key);if(old&&Date.now()-old.at<ttl)return old.promise;const promise=(async()=>{const r=await fetch(url,{headers:{'User-Agent':'PilotDesk/4.0 (+https://www.pilot-desk.com)'},signal:AbortSignal.timeout(10000)});if(!r.ok)throw Error();return asJson?r.json():r.text()})();cache.set(key,{at:Date.now(),promise});try{return await promise}catch(e){cache.delete(key);throw e}}
module.exports=async(req,res)=>{
  res.setHeader('X-Robots-Tag','noindex');res.setHeader('Cache-Control','no-store');
  if(req.method!=='GET'){res.setHeader('Allow','GET');return res.status(405).json({error:'Use GET.'})}
  const altitude=Number(req.query?.altitude),raw=String(req.query?.bbox||'').split(','),b=raw.map(Number);
  if(!Number.isFinite(altitude)||altitude<3000||altitude>39000||raw.length!==4||raw.some(x=>!x.trim())||b.some(x=>!Number.isFinite(x))||b[0]>=b[2]||b[1]>=b[3]||b[0]<-85||b[2]>85||b[1]<-180||b[3]>180)return res.status(400).json({error:'Enter valid bounds and altitude from 3,000 to 39,000 ft MSL.'});
  if(b[2]<24||b[0]>50||b[3]<-125||b[1]>-66)return res.status(422).json({error:'Public winds station forecasts cover CONUS only.'});
  try{
    const settled=await Promise.allSettled(['06','12','24'].map(async cycle=>W.parse(await get(cycle,AWC+'windtemp?region=us&level=low&fcst='+cycle,false,300000))));
    const bulletin=settled.filter(r=>r.status==='fulfilled').map(r=>r.value).filter(v=>v.baseAt<=Date.now()&&Date.now()-v.baseAt<36*3600000&&v.start<=Date.now()&&v.end>=Date.now()).sort((a,b)=>b.baseAt-a.baseAt)[0];
    if(!bulletin)return res.status(422).json({error:'No public winds bulletin covers the current time.'});
    const ids=bulletin.stations.map(s=>'K'+s.id).join(','),info=await get('stations:'+ids,AWC+'stationinfo?format=json&ids='+encodeURIComponent(ids),true,86400000);if(!Array.isArray(info))throw Error();
    const features=bulletin.stations.flatMap(s=>{const p=info.find(p=>p.icaoId==='K'+s.id||p.id==='K'+s.id);if(!p||!Number.isFinite(p.lat)||!Number.isFinite(p.lon)||p.lat<b[0]||p.lat>b[2]||p.lon<b[1]||p.lon>b[3])return [];try{const wind=W.sample(s.levels,altitude);return [{type:'Feature',geometry:{type:'Point',coordinates:[p.lon,p.lat]},properties:{station:s.id,...wind}}]}catch{return []}});
    res.setHeader('Cache-Control','public, s-maxage=300');return res.status(200).json({source:'AWC / NWS station wind forecasts',sourceUrl:'https://aviationweather.gov/data/windtemp/',fetchedAt:new Date().toISOString(),baseAt:new Date(bulletin.baseAt).toISOString(),validAt:new Date(bulletin.validAt).toISOString(),validFrom:new Date(bulletin.start).toISOString(),validTo:new Date(bulletin.end).toISOString(),altitude,geojson:{type:'FeatureCollection',features}});
  }catch{return res.status(502).json({error:'Public winds forecast unavailable. Retry later.'})}
};
