(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.PilotDeskMapDensity=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 function group(features,project,size,priority=()=>0){
  const groups=[],other=[];
  const ordered=features.map((feature,index)=>({feature,index})).sort((a,b)=>priority(b.feature)-priority(a.feature)||a.index-b.index);
  const cells=new Map(),cellKey=(x,y)=>x+','+y;
  for(const {feature} of ordered){
   const c=feature.geometry?.type==='Point'?feature.geometry.coordinates:null;
   if(!c||!Number.isFinite(c[0])||!Number.isFinite(c[1])){other.push({feature,members:[feature]});continue;}
   if(!(size>0)){groups.push({feature,members:[feature]});continue;}
   const p=project(c),x=Math.floor(p.x/size),y=Math.floor(p.y/size);let near=null;
   for(let dx=-1;dx<=1;dx++)for(let dy=-1;dy<=1;dy++)for(const candidate of cells.get(cellKey(x+dx,y+dy))||[]){
    if((!near||candidate.order<near.order)&&Math.abs(candidate.point.x-p.x)<size&&Math.abs(candidate.point.y-p.y)<size)near=candidate;
   }
   if(near)near.members.push(feature);else{
    const group={feature,members:[feature],point:p,order:groups.length},key=cellKey(x,y),bucket=cells.get(key)||[];
    bucket.push(group);cells.set(key,bucket);groups.push(group);
   }
  }
  return [...other,...groups.map(({feature,members})=>({feature,members}))];
 }
 function routeBounds(points){
  if(points.length<2)return null;
  const valid=points.every(p=>Number.isFinite(p.lat)&&Number.isFinite(p.lon)&&Math.abs(p.lat)<=90&&Math.abs(p.lon)<=180);
  if(!valid)return null;
  const lat=points.map(p=>p.lat),lon=points.map(p=>p.lon);
  // These regional APIs and the route intersection display do not support a date-line seam.
  if(Math.max(...lon)-Math.min(...lon)>180)return null;
  return [Math.max(-90,Math.min(...lat)-1),Math.max(-180,Math.min(...lon)-1),Math.min(90,Math.max(...lat)+1),Math.min(180,Math.max(...lon)+1)].map(v=>v.toFixed(3)).join(',');
 }
 function publicAirport(feature){const p=feature.properties||{};return (p.PRIVATEUSE===0||p.PRIVATEUSE==='0')&&String(p.TYPE_CODE||'').trim().toUpperCase()==='AD';}
 return {group,routeBounds,publicAirport};
});
