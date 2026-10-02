'use strict';

const ROOT='https://services6.arcgis.com/ssFJjBXIUyZDrSYZ/ArcGIS/rest/services/';
const UA='PilotDesk/4.0 (+https://www.pilot-desk.com)';
const SOURCES={
  airports:{service:'US_Airport',layer:0,label:'FAA Airports'},
  navaids:{service:'NAVAIDSystem',layer:0,label:'FAA NAVAID System'},
  fixes:{service:'DesignatedPoints',layer:0,label:'FAA Designated Points'},
  airways:{service:'ATS_Route',layer:0,label:'FAA ATS Routes'},
  sua:{service:'Special_Use_Airspace',layer:0,label:'FAA Special Use Airspace'},
  airspace:{service:'Class_Airspace',layer:0,label:'FAA Class Airspace'}
};

function parseBbox(value){
  const parts=String(value||'').split(',').map(Number);
  if(parts.length!==4||parts.some(v=>!Number.isFinite(v)))return null;
  const south=parts[0],west=parts[1],north=parts[2],east=parts[3];
  if(south<-90||north>90||west<-180||east>180||south>=north||west>=east)return null;
  return {south,west,north,east};
}

async function getGeoJson(url){
  const c=new AbortController(),timer=setTimeout(()=>c.abort(),7000);
  try{
    const r=await fetch(url,{headers:{Accept:'application/geo+json,application/json','User-Agent':UA},signal:c.signal,cache:'no-store'});
    const body=await r.text();
    if(!r.ok)throw new Error((body||('HTTP '+r.status)).slice(0,200));
    const data=JSON.parse(body);
    if(!data||data.type!=='FeatureCollection'||!Array.isArray(data.features))throw new Error('FAA map service returned an unexpected response.');
    return data;
  }finally{clearTimeout(timer)}
}

async function addTowerStatus(geojson){
  const ids=[...new Set(geojson.features.map(f=>String(f.properties?.ICAO_ID||'').trim()).filter(id=>/^[A-Z0-9]{4}$/.test(id)))].slice(0,400);
  const records=new Map();
  if(ids.length){
    const c=new AbortController(),timer=setTimeout(()=>c.abort(),4500);
    try{
      const r=await fetch('https://aviationweather.gov/api/data/airport?format=json&ids='+encodeURIComponent(ids.join(',')),{headers:{Accept:'application/json','User-Agent':UA},signal:c.signal,cache:'no-store'});
      if(r.ok&&r.status!==204){const rows=await r.json();if(Array.isArray(rows))for(const row of rows){if(row.source!=='FAA'||!Object.prototype.hasOwnProperty.call(row,'tower'))continue;const status=row.tower==='T'?'towered':row.tower===null||row.tower===''?'non-towered':'unknown';if(row.icaoId)records.set(row.icaoId,status);}}
    }catch{}finally{clearTimeout(timer)}
  }
  for(const f of geojson.features){f.properties={...f.properties,towerStatus:records.get(String(f.properties?.ICAO_ID||'').trim())||'unknown'};}
  return geojson;
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
  const source=SOURCES[product];
  if(!source){
    res.setHeader('Cache-Control','no-store');
    return res.status(400).json({error:'Unsupported FAA map layer.'});
  }
  const bbox=parseBbox(req.query&&req.query.bbox);
  if(!bbox){
    res.setHeader('Cache-Control','no-store');
    return res.status(400).json({error:'A valid south,west,north,east bounding box is required.'});
  }
  if((bbox.north-bbox.south)>35||(bbox.east-bbox.west)>35){
    res.setHeader('Cache-Control','no-store');
    return res.status(400).json({error:'Zoom in before loading this FAA map layer.'});
  }

  const params=new URLSearchParams({
    where:product==='airports'?"PRIVATEUSE = 0 AND TYPE_CODE = 'AD'":'1=1',
    geometry:[bbox.west,bbox.south,bbox.east,bbox.north].join(','),
    geometryType:'esriGeometryEnvelope',
    inSR:'4326',
    spatialRel:'esriSpatialRelIntersects',
    outFields:'*',
    returnGeometry:'true',
    outSR:'4326',
    resultRecordCount:product==='airports'?'1000':'2000',
    f:'geojson'
  });

  try{
    const url=ROOT+source.service+'/FeatureServer/'+source.layer+'/query?'+params.toString();
    const geojson=await getGeoJson(url);
    if(product==='airports')await addTowerStatus(geojson);
    res.setHeader('Cache-Control','public, s-maxage=1800, stale-while-revalidate=21600');
    return res.status(200).json({
      product,
      source:source.label,
      sourceUrl:ROOT+source.service+'/FeatureServer',
      fetchedAt:new Date().toISOString(),
      geojson
    });
  }catch(e){
    res.setHeader('Cache-Control','no-store');
    return res.status(502).json({error:e&&e.name==='AbortError'?'FAA map layer request timed out.':((e&&e.message)||'FAA map layer unavailable.'),product,source:source.label});
  }
};
