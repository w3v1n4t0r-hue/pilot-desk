/* PilotDesk motion polish. Optional enhancement; does not change flight data or maps. */
(()=>{
 'use strict';
 if(window.__pdMotionPolish)return;
 window.__pdMotionPolish=true;
 const reduced=()=>window.matchMedia?.('(prefers-reduced-motion: reduce)').matches||navigator.connection?.saveData;
 const hasMotion=()=>!reduced()&&typeof Element!=='undefined'&&typeof Element.prototype.animate==='function';
 function play(node,frames,options){
   if(!node||!hasMotion()||document.hidden)return;
   try{return node.animate(frames,options)}catch{return null}
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
   if(!document.body.classList.contains('pd-home-2026'))return;
   const hero=document.querySelector('.pd-home-hero-copy');
   const calculator=document.querySelector('.pd-home-example');
   play(hero,[{opacity:.45,transform:'translateY(9px)'},{opacity:1,transform:'none'}],
     {duration:260,easing:'cubic-bezier(.22,.72,.18,1)'});
   play(calculator,[{opacity:.6,transform:'translateY(7px)'},{opacity:1,transform:'none'}],
     {duration:300,delay:60,easing:'cubic-bezier(.22,.72,.18,1)'});
 }
 function homeWind(){
   const slider=document.getElementById('pdHomeWind');
   const gauge=document.querySelector('.pd-home-wind-diagram');
   if(!slider||!gauge)return;
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
 function init(){homeEntrance();homeWind();trackValues();trackLoading();panels()}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
 else init();
})();
