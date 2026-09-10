'use strict';
const FAA_SEARCH='https://www.faa.gov/air_traffic/flight_info/aeronav/digital_products/dtpp/search/results/';
const UA='PilotDesk/2.1 (+https://www.pilot-desk.com)';
function clean(v){return String(v||'').trim().toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,4)}
function decode(s){return String(s||'').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#039;|&#39;/g,"'").replace(/&nbsp;/g,' ').replace(/&lt;/g,'<').replace(/&gt;/g,'>')}
function text(s){return decode(String(s||'').replace(/<script[\s\S]*?<\/script>/gi,' ').replace(/<style[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim())}
function abs(href){try{return new URL(decode(href),'https://www.faa.gov').href}catch{return null}}
function parse(html,icao,faaIdent){
  const eff=html.match(/Procedure effective date:\s*([^<\n]+?)\s*\((\d{4})\)/i),cycle=eff?.[2]||null,effective=eff?.[1]?.trim()||null;
  const out=[],seen=new Set();
  for(const row of html.match(/<tr[\s\S]*?<\/tr>/gi)||[]){
    const link=row.match(/<a[^>]+href=["']([^"']+\.pdf(?:\?[^"']*)?)["'][^>]*>([\s\S]*?)<\/a>/i);if(!link)continue;
    const url=abs(link[1]),name=text(link[2]),rowText=text(row);if(!url||!name||seen.has(url))continue;
    let type='OTHER';const m=rowText.match(/\b(APD|IAP|DP|STAR|ODP|MIN|LAH|HOT)\b/i);if(m)type=m[1].toUpperCase();
    if(type==='IAP'&&/AIRPORT DIAGRAM/i.test(name))type='APD';
    out.push({type,name,pdfUrl:url});seen.add(url);
  }
  return{station:icao,faaIdent,cycle,effective,procedures:out};
}
module.exports=async function handler(req,res){
  res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('X-Robots-Tag','noindex');
  if(req.method!=='GET'){res.setHeader('Allow','GET');res.setHeader('Cache-Control','no-store');return res.status(405).json({error:'Method not allowed'})}
  const station=clean(req.query?.ident);if(!/^[A-Z0-9]{3,4}$/.test(station)){res.setHeader('Cache-Control','no-store');return res.status(400).json({error:'Enter a valid U.S. airport identifier.'})}
  const faaIdent=station.length===4?station.slice(-3):station,url=`${FAA_SEARCH}?ident=${encodeURIComponent(faaIdent)}`;
  const c=new AbortController(),timer=setTimeout(()=>c.abort(),12000);
  try{
    const r=await fetch(url,{headers:{Accept:'text/html,application/xhtml+xml','User-Agent':UA},signal:c.signal});const html=await r.text();
    if(!r.ok){res.setHeader('Cache-Control','no-store');return res.status(502).json({error:`FAA procedure search returned ${r.status}.`,station,sourceUrl:url})}
    const data=parse(html,station,faaIdent);res.setHeader('Cache-Control','public, s-maxage=14400, stale-while-revalidate=3600');
    return res.status(200).json({...data,fetchedAt:new Date().toISOString(),source:'Federal Aviation Administration d-TPP',sourceUrl:url,notice:'Verify the current FAA procedure effective date and the chart itself before operational use.'});
  }catch(e){res.setHeader('Cache-Control','no-store');return res.status(502).json({error:e?.name==='AbortError'?'FAA procedure lookup timed out.':'FAA procedure lookup failed.',station,sourceUrl:url})}
  finally{clearTimeout(timer)}
};
