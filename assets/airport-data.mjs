let manifest;
const packages=new Map();
async function json(url){const r=await fetch(url,{signal:AbortSignal.timeout(10000)});if(!r.ok)throw Error('Airport data unavailable');return r.json()}
export async function airportIndex(){if(!manifest)manifest=json('/data/airports/manifest.json').catch(e=>{manifest=null;throw e});return manifest}
export async function airportDetails(ident){
 const index=await airportIndex(),id=index.aliases[String(ident).trim().toUpperCase()];if(!id)return null;
 const prefix=id.slice(0,2);if(!packages.has(prefix)){const request=json('/data/airports/'+prefix+'.json?cycle='+index.effective).catch(e=>{packages.delete(prefix);throw e});packages.set(prefix,request);if(packages.size>12)packages.delete(packages.keys().next().value)}
 const data=await packages.get(prefix);return data[id]?{...data[id],effective:index.effective,expires:index.expires,source:index.source}:null;
}
export function runwayWind(end,metar){
 const direction=Number(metar?.wdir),speed=Number(metar?.wspd);if(end.trueHeading==null||metar?.wdir==null||metar?.wdir==='VRB'||metar?.wspd==null||!Number.isFinite(direction)||!Number.isFinite(speed))return null;
 const angle=(direction-end.trueHeading)*Math.PI/180;return {head:speed*Math.cos(angle),cross:speed*Math.sin(angle)};
}
