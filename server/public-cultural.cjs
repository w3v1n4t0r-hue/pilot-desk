'use strict';
const SELECTORS={
  major_roads:'way[highway~"^(motorway|trunk|primary|secondary)$"]',
  minor_roads:'way[highway~"^(tertiary|residential|unclassified|service)$"]',
  all_roads:'way[highway]',railroads:'way[railway=rail]',
  urban_areas:'way[landuse~"^(residential|commercial|industrial)$"]',
  forests_parks:'way[landuse=forest];way[leisure=park];way[natural=wood]',
  points_of_interest:'node[tourism];node[amenity~"^(hospital|fuel)$"]',
  power_lines:'way[power~"^(line|minor_line)$"]',
  peaks_passes:'node[natural~"^(peak|saddle)$"];way[aerialway]',
  place_labels:'node[place~"^(city|town|village)$"]',
};
const cache=new Map();
module.exports=async(req,res)=>{
  res.setHeader('X-Robots-Tag','noindex');res.setHeader('Cache-Control','no-store');
  if(req.method!=='GET'){res.setHeader('Allow','GET');return res.status(405).json({error:'Use GET.'})}
  const product=String(req.query?.product||''),raw=String(req.query?.bbox||'').split(','),b=raw.map(Number);
  if(!Object.hasOwn(SELECTORS,product)||raw.length!==4||raw.some(x=>!x.trim())||b.some(x=>!Number.isFinite(x))||b[0]<-85||b[2]>85||b[1]<-180||b[3]>180||b[0]>=b[2]||b[1]>=b[3])return res.status(400).json({error:'Choose a supported cultural layer and valid bounds.'});
  if(b[2]-b[0]>.35||b[3]-b[1]>.35)return res.status(400).json({error:'Zoom in for OpenStreetMap detail (maximum 0.35° bounds).'});
  const key=product+':'+b.join(','),old=cache.get(key);if(old&&Date.now()-old.at<900000){res.setHeader('Cache-Control','public, s-maxage=900');return res.status(200).json(old.data)}
  const statements=SELECTORS[product].split(';').map(s=>s+'('+b.join(',')+');').join('');
  try{
    const r=await fetch('https://overpass-api.de/api/interpreter',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded','User-Agent':'PilotDesk/4.0 (+https://www.pilot-desk.com)'},body:new URLSearchParams({data:'[out:json][timeout:12];('+statements+');out geom 500;'}),signal:AbortSignal.timeout(16000)});
    if(r.status===429){res.setHeader('Retry-After','60');return res.status(429).json({error:'Public map source is busy. Wait one minute before retrying.'})}
    if(!r.ok)throw Error();const j=await r.json();if(j.remark||!Array.isArray(j.elements))throw Error();
    const features=j.elements.flatMap(el=>{const p={...(el.tags||{}),osmId:el.type+'/'+el.id};if(el.type==='node'&&Number.isFinite(el.lat)&&Number.isFinite(el.lon))return [{type:'Feature',properties:p,geometry:{type:'Point',coordinates:[el.lon,el.lat]}}];const coords=el.geometry?.filter(p=>Number.isFinite(p.lon)&&Number.isFinite(p.lat)).map(p=>[p.lon,p.lat]);if(!coords||coords.length<2)return [];const area=['urban_areas','forests_parks'].includes(product)&&coords.length>=4&&coords[0][0]===coords.at(-1)[0]&&coords[0][1]===coords.at(-1)[1];return [{type:'Feature',properties:p,geometry:area?{type:'Polygon',coordinates:[coords]}:{type:'LineString',coordinates:coords}}]});
    const data={product,source:'OpenStreetMap contributors / Overpass',sourceUrl:'https://www.openstreetmap.org/copyright',fetchedAt:new Date().toISOString(),sourceUpdatedAt:j.osm3s?.timestamp_osm_base||null,possiblyTruncated:j.elements.length>=500,geojson:{type:'FeatureCollection',features}};cache.set(key,{at:Date.now(),data});if(cache.size>60)cache.delete(cache.keys().next().value);res.setHeader('Cache-Control','public, s-maxage=900');return res.status(200).json(data);
  }catch{return res.status(502).json({error:'Public cultural map data unavailable. Retry later.',product})}
};
