/* Carry chart-planner route and aircraft inputs to the same-origin review workspace. */
(() => {
 'use strict';
 const target='/route-review.html';
 function buildLink(){
  const planner=window.PilotDeskRoutePlanner,points=planner?.getPoints?.();
  if(!Array.isArray(points)||points.length<2)throw new Error('Build a route before opening the departure review.');
  const read=id=>document.getElementById(id)?.value||'',number=(id,fallback)=>{const v=read(id);return v===''?fallback:Number(v);};
  const flight={route:read('rpRoute'),points:points.map(p=>({id:p.id,lat:p.lat,lon:p.lon,name:p.name||p.id,type:p.type,source:p.source,nonAirport:p.type!=='PA'&&p.source!=='airport',towered:p.towered})),tas:number('rpTas',120),burn:number('rpBurn',10),windDir:number('rpWindDir',0),windSpeed:number('rpWindSpeed',0),planning:window.PilotDeskRoutePerformance?.getSettings?.()||{}};
  const url=new URL(target,window.location.origin);url.hash='flight='+encodeURIComponent(JSON.stringify(flight));return url.href;
 }
 window.PilotDeskRouteReview={buildLink};
 function mount(){if(document.getElementById('pdDepartureReviewWorkspace'))return;const parent=document.querySelector('.pd-flight-context .pd-actions')||document.querySelector('.rp-panel');if(!parent)return;const b=document.createElement('button');b.type='button';b.id='pdDepartureReviewWorkspace';b.className='pd-btn secondary';b.textContent='Open route review';b.addEventListener('click',()=>{try{window.location.assign(buildLink());}catch(e){const status=document.getElementById('rpStatus');if(status)status.textContent=e.message;}});parent.appendChild(b);}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();
