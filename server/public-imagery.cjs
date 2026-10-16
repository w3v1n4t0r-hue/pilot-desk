'use strict';
const products={
  radarcomp:{url:'https://opengeo.ncep.noaa.gov/geoserver/conus/ows',layer:'conus_cref_qcd'},
  radar_lowest_tilt:{url:'https://opengeo.ncep.noaa.gov/geoserver/conus/ows',layer:'conus_bref_qcd'},
  satellite:{url:'https://nowcoast.noaa.gov/geoserver/observations/satellite/ows',layer:'global_visible_imagery_mosaic'},
  satelliteir:{url:'https://nowcoast.noaa.gov/geoserver/observations/satellite/ows',layer:'global_longwave_imagery_mosaic'},
  lightning:{url:'https://nowcoast.noaa.gov/geoserver/wms',layer:'lightning_detection:ldn_lightning_strike_density'},
};
const cache=new Map(),pending=new Map();
async function capabilities(url){
 const old=cache.get(url);if(old&&Date.now()-old.at<300000)return old;
 if(pending.has(url))return pending.get(url);
 const request=(async()=>{const r=await fetch(url+'?service=WMS&request=GetCapabilities',{headers:{'User-Agent':'PilotDesk/4.0 (+https://www.pilot-desk.com)'},signal:AbortSignal.timeout(9000)});if(!r.ok)throw Error();const entry={at:Date.now(),xml:await r.text()};cache.set(url,entry);return entry})();
 pending.set(url,request);try{return await request}finally{pending.delete(url)}
}
module.exports=async(req,res)=>{
  res.setHeader('X-Robots-Tag','noindex');res.setHeader('Cache-Control','no-store');
  if(req.method!=='GET'){res.setHeader('Allow','GET');return res.status(405).json({error:'Use GET.'})}
  const product=String(req.query?.product||''),source=Object.hasOwn(products,product)?products[product]:null;if(!source)return res.status(400).json({error:'Unsupported public imagery product.'});
  try{const old=await capabilities(source.url);
    const start=old.xml.indexOf('<Name>'+source.layer+'</Name>');if(start<0)throw Error();const part=old.xml.slice(start,old.xml.indexOf('</Layer>',start));const dimension=part.match(/<Dimension\b(?=[^>]*name="time")(?=[^>]*default="([^"]+)")[^>]*>/i);const frameTime=dimension?.[1];if(!frameTime||!Number.isFinite(Date.parse(frameTime)))throw Error();res.setHeader('Cache-Control','public, s-maxage=300');return res.status(200).json({product,source:'NOAA / NWS',sourceUrl:source.url,layer:source.layer,frameTime:new Date(frameTime).toISOString(),fetchedAt:new Date(old.at).toISOString()});
  }catch{return res.status(502).json({error:'Public imagery time metadata unavailable. Retry later.',product})}
};
