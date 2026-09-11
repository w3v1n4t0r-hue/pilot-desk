(()=>{
'use strict';
function apply(){
  document.querySelectorAll('a.brand').forEach(el=>{
    if(el.dataset.pdWordmark==='1')return;
    el.dataset.pdWordmark='1';
    el.setAttribute('aria-label','PilotDesk home');
    el.innerHTML='<img class="pd-wordmark" src="/assets/wordmark.svg" alt="PilotDesk" width="190" height="40" decoding="async">';
  });
  if(!document.getElementById('pd-brand-style')){
    const s=document.createElement('style');
    s.id='pd-brand-style';
    s.textContent='.brand[data-pd-wordmark="1"]{display:flex;align-items:center;gap:0;min-width:0}.brand[data-pd-wordmark="1"] .pd-wordmark{display:block;width:190px;max-width:44vw;height:auto;filter:drop-shadow(0 5px 16px rgba(0,0,0,.22))}@media(max-width:700px){.brand[data-pd-wordmark="1"] .pd-wordmark{width:154px;max-width:58vw}}';
    document.head.appendChild(s);
  }
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply,{once:true});else apply();
})();
