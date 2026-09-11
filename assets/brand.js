(()=>{
'use strict';
function apply(){document.querySelectorAll('.brandmark').forEach(el=>{el.dataset.pdBrandAsset='1';el.innerHTML='<img src="/assets/icon.svg" alt="" width="38" height="38">';el.setAttribute('aria-label','PilotDesk');el.style.background='transparent';el.style.boxShadow='none';el.style.border='0';el.style.color='inherit';el.style.width='38px';el.style.height='38px';el.style.borderRadius='9px';el.style.padding='0';const img=el.querySelector('img');if(img){img.style.display='block';img.style.width='38px';img.style.height='38px'}})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply,{once:true});else apply();
})();
