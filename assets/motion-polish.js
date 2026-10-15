/* PilotDesk motion polish. Optional enhancement; does not change flight data or maps. */
(()=>{
 'use strict';
 if(window.__pdMotionPolish)return;
 window.__pdMotionPolish=true;
 const reduced=()=>window.matchMedia?.('(prefers-reduced-motion: reduce)').matches||document.documentElement.classList.contains('pd-reduced-motion')||navigator.connection?.saveData;
 const controls=new Set(),disposals=[];
 const hasMotion=()=>!reduced()&&typeof Element!=='undefined'&&typeof Element.prototype.animate==='function';
 function play(node,frames,options){
   if(!node||!hasMotion()||document.hidden)return;
   try{const control=node.animate(frames,options);controls.add(control);control.finished.then(()=>controls.delete(control),()=>controls.delete(control));return control}catch{return null}
 }
 function highlight(el){
   if(reduced()||!el||document.hidden)return;
   el.classList.remove('pd-motion-value-updated');
   // Reflow only the individual textual result, never the map.
   void el.offsetWidth;
   el.classList.add('pd-motion-value-updated');
 }
 function trackValues(){
   const ids=['rpSummaryRoute','rpSummaryDistance','rpSummaryEte','rpSummaryFuel'];
   ids.forEach(id=>{
     const el=document.getElementById(id);
     if(!el||typeof MutationObserver==='undefined')return;
     let previous=el.textContent.trim();
     new MutationObserver(()=>{
       const next=el.textContent.trim();
       if(next!==previous){previous=next;highlight(el)}
     }).observe(el,{subtree:true,childList:true,characterData:true});
   });
 }
 function trackLoading(){
   if(typeof MutationObserver==='undefined')return;
   ['rpMapStatus','rpDepartureReviewStatus','rpReviewWindBasis'].forEach(id=>{
     const el=document.getElementById(id);
     if(!el)return;
     const sync=()=>{
       const content=(el.textContent||'').trim();
       const busy=/^(loading|fetching|retrieving|refreshing|checking|updating|requesting)\b/i.test(content);
       if(busy)el.dataset.pdLoading='true';
       else delete el.dataset.pdLoading;
     };
     new MutationObserver(sync).observe(el,{subtree:true,childList:true,characterData:true});
     sync();
   });
 }
 function homeEntrance(){
   if(!document.body.classList.contains('pd-home-2026')||document.querySelector('[data-pd-preview]'))return;
   const hero=document.querySelector('.pd-home-hero-copy');
   const preview=document.querySelector('.pd-home-product');
   play(hero,[{opacity:.65,transform:'translateY(9px)'},{opacity:1,transform:'none'}],
     {duration:270,easing:'cubic-bezier(.22,.72,.18,1)'});
   play(preview,[{opacity:.65,transform:'translateY(11px)'},{opacity:1,transform:'none'}],
     {duration:340,delay:70,easing:'cubic-bezier(.22,.72,.18,1)'});
 }
 function homeWind(){
   const slider=document.getElementById('pdHomeWind');
   const gauge=document.querySelector('.pd-home-wind-diagram');
   if(!slider||!gauge||document.querySelector('[data-pd-wind-vector]'))return;
   let last=Number(slider.value);
   slider.addEventListener('change',()=>{
     const next=Number(slider.value);
     if(next===last)return;
     last=next;
     play(gauge,[{opacity:.8},{opacity:1}],{duration:160,easing:'ease-out'});
   });
 }
 function panels(){
   const editor=document.getElementById('rpRouteEditor');
   if(!editor||typeof MutationObserver==='undefined')return;
   let lastHidden=editor.hidden;
   new MutationObserver(()=>{
     if(editor.hidden===lastHidden)return;
     lastHidden=editor.hidden;
     if(!lastHidden)play(editor,[{opacity:.35,transform:'translateX(-7px)'},{opacity:1,transform:'none'}],
       {duration:170,easing:'cubic-bezier(.22,.72,.18,1)'});
   }).observe(editor,{attributes:true,attributeFilter:['hidden']});
 }
 function disclosures(){
   const runs=new WeakMap();
   const click=event=>{
     const summary=event.target.closest?.('summary'),details=summary?.parentElement;
     if(!details?.matches('details.pd-calc-result-summary, details.wb-advanced')||!hasMotion()||document.hidden||event.defaultPrevented)return;
     if(event.target.closest('a,button,input,select,textarea'))return;
     event.preventDefault();
     const prior=runs.get(details),opening=prior?!prior.opening:!details.open;
     const from=details.getBoundingClientRect().height;
     prior?.control?.cancel();details.style.height='';details.style.overflow='';
     details.open=false;const collapsed=details.getBoundingClientRect().height;
     details.open=true;const expanded=details.getBoundingClientRect().height;
     const control=play(details,[{height:from+'px'},{height:(opening?expanded:collapsed)+'px'}],{duration:190,easing:'cubic-bezier(.22,.72,.18,1)'});
     if(!control){details.open=opening;return;}
     const run={control,opening};runs.set(details,run);details.style.overflow='hidden';
     const finish=()=>{if(runs.get(details)!==run)return;runs.delete(details);details.open=opening;details.style.height='';details.style.overflow='';};
     control.finished.then(finish,finish);
   };
   document.addEventListener('click',click);disposals.push(()=>document.removeEventListener('click',click));
 }
 function tabIndicators(){
   document.querySelectorAll('[role="tablist"]').forEach(list=>{
     if(list.closest('.rp-map-card')||list.querySelector('.pd-tab-indicator'))return;
     const indicator=document.createElement('span');indicator.className='pd-tab-indicator';indicator.setAttribute('aria-hidden','true');list.append(indicator);list.classList.add('pd-motion-tabs');
     let previous=null,animation=null;
     const sync=()=>{
       const tab=list.querySelector('[role="tab"][aria-selected="true"]');
       if(!tab||!tab.getClientRects().length){indicator.hidden=true;previous=null;return;}
       indicator.hidden=false;const rect=tab.getBoundingClientRect(),parent=list.getBoundingClientRect();
       const next={left:rect.left-parent.left+list.scrollLeft,width:rect.width,top:rect.bottom-parent.top+list.scrollTop-2};
       animation?.cancel();indicator.style.left=next.left+'px';indicator.style.width=next.width+'px';indicator.style.top=next.top+'px';
       if(previous)animation=play(indicator,[{left:previous.left+'px',width:previous.width+'px',top:previous.top+'px'},{left:next.left+'px',width:next.width+'px',top:next.top+'px'}],{duration:190,easing:'cubic-bezier(.22,.72,.18,1)'});
       previous=next;
     };
     const observer=new MutationObserver(sync);observer.observe(list,{subtree:true,attributes:true,attributeFilter:['aria-selected']});
     const resize=new ResizeObserver(()=>{previous=null;sync();});resize.observe(list);sync();
     disposals.push(()=>{observer.disconnect();resize.disconnect();animation?.cancel();});
   });
 }
 function settle(){if(reduced()||document.hidden)controls.forEach(control=>control.finish());}
 const preference=window.matchMedia('(prefers-reduced-motion: reduce)');preference.addEventListener('change',settle);document.addEventListener('pilotdesk:preferences-applied',settle);document.addEventListener('visibilitychange',settle);
 window.addEventListener('pagehide',()=>{controls.forEach(control=>control.finish());disposals.forEach(dispose=>dispose());preference.removeEventListener('change',settle);document.removeEventListener('pilotdesk:preferences-applied',settle);document.removeEventListener('visibilitychange',settle);},{once:true});
 function init(){homeEntrance();homeWind();trackValues();trackLoading();panels();disclosures();tabIndicators()}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
 else init();
})();
