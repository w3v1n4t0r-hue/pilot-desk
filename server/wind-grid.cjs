'use strict';
const radians=x=>x*Math.PI/180;
function distance(a,b){const lat=radians(b.lat-a.lat),lon=radians(b.lon-a.lon),h=Math.sin(lat/2)**2+Math.cos(radians(a.lat))*Math.cos(radians(b.lat))*Math.sin(lon/2)**2;return 3440.065*2*Math.asin(Math.min(1,Math.sqrt(h)))}
function interpolate(stations,point){
 const nearby=stations.map(s=>({...s,distance:distance(s,point)})).filter(s=>s.distance<=300).sort((a,b)=>a.distance-b.distance).slice(0,4);if(!nearby.length)return null;
 const exact=nearby[0].distance<.01,used=exact?[nearby[0]]:nearby;let u=0,v=0,total=0,temp=0,tempWeight=0;
 for(const s of used){const weight=1/Math.max(1,s.distance)**2;u+=weight*s.speed*Math.sin(radians(s.direction));v+=weight*s.speed*Math.cos(radians(s.direction));total+=weight;if(Number.isFinite(s.temperature)){temp+=s.temperature*weight;tempWeight+=weight}}
 const speed=Math.hypot(u/total,v/total);return {direction:speed<.1?0:(Math.atan2(u,v)*180/Math.PI+360)%360,speed,temperature:tempWeight?temp/tempWeight:null,variable:used.some(s=>s.variable),interpolated:!exact,sources:used.map(s=>s.station),nearestNm:Math.round(nearby[0].distance)};
}
function grid(stations,bounds,altitude){const features=[];for(let y=0;y<3;y++)for(let x=0;x<3;x++){const lat=bounds[0]+(bounds[2]-bounds[0])*(y+.5)/3,lon=bounds[1]+(bounds[3]-bounds[1])*(x+.5)/3;if(lat<24||lat>50||lon<-125||lon>-66)continue;const wind=interpolate(stations,{lat,lon});if(wind)features.push({type:'Feature',geometry:{type:'Point',coordinates:[lon,lat]},properties:{...wind,altitude}})}return features}
module.exports={distance,interpolate,grid};
