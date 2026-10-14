/* Scoped to the homepage and route summary; never animates chart layers. */
(()=>{
 'use strict';
 const media=matchMedia('(prefers-reduced-motion: reduce)'),instances=[],disposals=[];
 const motion=()=>!media.matches&&!document.documentElement.classList.contains('pd-reduced-motion')&&!document.hidden&&!navigator.connection?.saveData;
 const duration=seconds=>{if(!Number.isFinite(seconds)||seconds<0)return '—';const t=Math.round(seconds),pad=n=>String(n).padStart(2,'0');return `${pad(Math.floor(t/3600))}:${pad(Math.floor(t%3600/60))}:${pad(t%60)}`;};
 function mount(figure){
  const plane=figure.querySelector('.pd-flight-aircraft'),button=figure.querySelector('button'),from=figure.querySelector('[data-flight-from]'),to=figure.querySelector('[data-flight-to]');let animation=null;
  const stop=()=>{animation?.cancel();animation=null;};
  const play=()=>{stop();if(!motion()||figure.hidden)return;plane.style.left='0%';const control=plane.animate([{left:'0%'},{left:'100%'}],{duration:6000,easing:'linear',fill:'forwards'});animation=control;control.finished.then(()=>{if(animation!==control)return;plane.style.left='100%';control.cancel();animation=null;},()=>{});};
  const settle=()=>{stop();plane.style.left='50%';button.disabled=!motion();};button.addEventListener('click',play);instances.push({settle});
  if(figure.dataset.pdFlight==='home'){
   const dep=document.getElementById('pdHomeDeparture'),arr=document.getElementById('pdHomeDestination');
   const sync=()=>{from.textContent=dep?.value.trim().toUpperCase()||'DEP';to.textContent=arr?.value.trim().toUpperCase()||'ARR';};
   const change=()=>{sync();play();};[dep,arr].filter(Boolean).forEach(input=>{input.addEventListener('input',sync);input.addEventListener('change',change);disposals.push(()=>{input.removeEventListener('input',sync);input.removeEventListener('change',change);});});sync();
   const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){play();observer.disconnect();}},{threshold:.5});observer.observe(figure);disposals.push(()=>observer.disconnect());
  }else{
   const invalidate=()=>{stop();figure.hidden=true;figure.querySelector('[data-flight-time]').textContent='—';};
   const update=event=>{const route=event?.detail||window.pdNavlogResult,legs=route?.legs;if(!Array.isArray(legs)||!legs.length||!Number.isFinite(route.totalHours)||route.totalHours<0||!Number.isFinite(route.totalDistance)){invalidate();return;}
    figure.hidden=false;from.textContent=legs[0].from||'DEP';to.textContent=legs[legs.length-1].to||'ARR';figure.querySelector('[data-flight-time]').textContent=duration(route.totalHours*3600);figure.querySelector('[data-flight-distance]').textContent=route.totalDistance.toLocaleString(undefined,{maximumFractionDigits:1})+' NM';figure.setAttribute('aria-label',`${from.textContent} to ${to.textContent}, planned time ${duration(route.totalHours*3600)}`);play();};
   document.addEventListener('pilotdesk:route-built',update);document.addEventListener('pilotdesk:route-invalidated',invalidate);disposals.push(()=>{document.removeEventListener('pilotdesk:route-built',update);document.removeEventListener('pilotdesk:route-invalidated',invalidate);});if(window.pdNavlogResult)update();
  }
  button.disabled=!motion();disposals.push(()=>{stop();button.removeEventListener('click',play);});
 }
 function settle(){instances.forEach(i=>i.settle());}
 document.querySelectorAll('[data-pd-flight]').forEach(mount);media.addEventListener('change',settle);document.addEventListener('pilotdesk:preferences-applied',settle);document.addEventListener('visibilitychange',settle);window.addEventListener('pagehide',()=>{disposals.forEach(fn=>fn());media.removeEventListener('change',settle);document.removeEventListener('pilotdesk:preferences-applied',settle);document.removeEventListener('visibilitychange',settle);},{once:true});
})();
