(()=>{
'use strict';
if(window.__pdBootLoaded)return;window.__pdBootLoaded=true;
const load=src=>new Promise(resolve=>{if(document.querySelector(`script[src="${src}"]`)){resolve();return}const s=document.createElement('script');s.src=src;s.async=false;s.onload=resolve;s.onerror=resolve;document.head.appendChild(s)});
async function start(){
  await load('/assets/brand.js');
  if(location.pathname.startsWith('/calculators/')&&!location.pathname.includes('weight-balance-builder')){
    await load('/assets/calculator-ux.js');
    await load('/assets/features.js');
  }
  await load('/assets/runtime-qol.js');
  await load('/assets/pilotdesk-plus.js');
  await load('/assets/growth-suite.js');
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
