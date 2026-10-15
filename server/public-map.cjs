'use strict';
const ROOT='https://services6.arcgis.com/ssFJjBXIUyZDrSYZ/ArcGIS/rest/services/';
const SERVICES={airports:'US_Airport',airspace:'Class_Airspace',boundaries:'Boundary_Airspace',sua:'Special_Use_Airspace',mtr:'MTRSegment',airways:'ATS_Route',navaids:'NAVAIDSystem',fixes:'DesignatedPoints'};
const cache=new Map();
function bbox(value){if(typeof value!=='string')return null;const p=value.split(',');if(p.length!==4||p.some(x=>!x.trim()))return null;const v=p.map(Number);if(v.some(x=>!Number.isFinite(x))||v[0]<-85||v[2]>85||v[1]<-180||v[3]>180||v[0]>=v[2]||v[1]>=v[3])return null;return v}
async function json(url){const r=await fetch(url,{headers:{Accept:'application/json','User-Agent':'PilotDesk/4.0 (+https://www.pilot-desk.com)'},signal:AbortSignal.timeout(9000)});if(!r.ok)throw Error('FAA data service unavailable.');const j=await r.json();if(j.error)throw Error('FAA data service rejected the request.');return j}
module.exports=async(req,res)=>{
  res.setHeader('X-Robots-Tag','noindex');res.setHeader('Cache-Control','no-store');
  if(req.method!=='GET'){res.setHeader('Allow','GET');return res.status(405).json({error:'Use GET.'})}
  const product=String(req.query?.product||''),service=Object.hasOwn(SERVICES,product)?SERVICES[product]:null,b=bbox(req.query?.bbox);
  if(!service||!b)return res.status(400).json({error:'Choose a supported product and valid south,west,north,east bounds.'});
  if(b[2]-b[0]>12||b[3]-b[1]>12)return res.status(400).json({error:'Zoom in to load FAA detail (maximum 12° bounds).'});
  const endpoint=ROOT+service+'/FeatureServer/0',params=new URLSearchParams({where:'1=1',geometry:[b[1],b[0],b[3],b[2]].join(','),geometryType:'esriGeometryEnvelope',inSR:'4326',outSR:'4326',spatialRel:'esriSpatialRelIntersects',outFields:'*',returnGeometry:'true',resultRecordCount:'2000',f:'geojson'});
  try{
    const queryKey=product+':'+b.join(','),old=cache.get(queryKey);
    let result=old&&Date.now()-old.at<300000?old.data:null;
    if(!result){const [geojson,meta]=await Promise.all([json(endpoint+'/query?'+params),json(endpoint+'?f=json')]);if(geojson.type!=='FeatureCollection'||!Array.isArray(geojson.features))throw Error('FAA returned unreadable map geometry.');result={product,source:'FAA Aeronautical Information Services',sourceUrl:endpoint,sourceUpdatedAt:meta.editingInfo?.dataLastEditDate?new Date(meta.editingInfo.dataLastEditDate).toISOString():null,fetchedAt:new Date().toISOString(),possiblyTruncated:geojson.exceededTransferLimit===true||geojson.features.length>=2000,geojson};cache.set(queryKey,{at:Date.now(),data:result});if(cache.size>80)cache.delete(cache.keys().next().value)}
    res.setHeader('Cache-Control','public, s-maxage=300');return res.status(200).json(result);
  }catch{return res.status(502).json({error:'FAA map data unavailable. Retry later.',product})}
};
