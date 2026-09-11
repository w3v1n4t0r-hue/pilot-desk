(()=>{
'use strict';
const sameOrigin=a=>{try{return new URL(a.href,location.href).origin===location.origin}catch{return false}};
const ready=fn=>document.readyState==='loading'?document.addEventListener('DOMContentLoaded',fn,{once:true}):fn();
function images(){document.querySelectorAll('img').forEach((img,i)=>{if(!img.hasAttribute('decoding'))img.decoding='async';if(i>0&&!img.hasAttribute('loading'))img.loading='lazy'})}
function forms(){document.querySelectorAll('input[type="number"]').forEach(i=>{if(!i.hasAttribute('inputmode'))i.inputMode='decimal';i.spellcheck=false});document.querySelectorAll('input[type="search"],#toolSearch,#airportQuery,#station').forEach(i=>{i.autocomplete='off';i.spellcheck=false;i.setAttribute('enterkeyhint','search')})}
function prefetch(){if(navigator.connection?.saveData||/2g/.test(navigator.connection?.effectiveType||''))return;const done=new Set();document.addEventListener('pointerover',e=>{const a=e.target.closest('a[href]');if(!a||!sameOrigin(a)||done.size>=4)return;const u=new URL(a.href,location.href);if(u.pathname===location.pathname||done.has(u.pathname))return;done.add(u.pathname);const l=document.createElement('link');l.rel='prefetch';l.href=u.pathname+u.search;document.head.appendChild(l)},{passive:true})}
ready(()=>{images();forms();prefetch()});
})();
