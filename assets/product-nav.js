(()=>{
'use strict';
let installPrompt=null;
const standalone=()=>matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
function modal(){
  const back=document.createElement('div');back.className='pd-modal-backdrop';back.innerHTML='<div class="pd-modal" role="dialog" aria-modal="true" aria-labelledby="pdInstallTitle"><h2 id="pdInstallTitle">Install PilotDesk</h2><p>Use your browser\'s install option to keep PilotDesk on your home screen. On iPhone or iPad, tap Share and then <strong>Add to Home Screen</strong>. On desktop Chrome or Edge, use the install icon in the address bar if it appears.</p><div class="pd-modal-actions"><button class="pd-btn secondary" type="button" data-close>Close</button></div></div>';back.addEventListener('click',e=>{if(e.target===back||e.target.closest('[data-close]'))back.remove()});document.body.appendChild(back);
}
async function install(){
  if(standalone())return;
  if(installPrompt){installPrompt.prompt();try{await installPrompt.userChoice}catch{}installPrompt=null;document.querySelectorAll('.pd-install-button').forEach(x=>x.hidden=true);return}
  modal();
}
function addNav(){
  const nav=document.querySelector('.topbar nav');if(!nav)return;
  const links=[['/airport.html','Airports'],['/flights.html','Flights'],['/flight-brief.html','Brief'],['/aircraft.html','Hangar']];
  for(const [href,label] of links){if(nav.querySelector(`a[href="${href}"]`))continue;const a=document.createElement('a');a.href=href;a.textContent=label;nav.appendChild(a)}
}
function addProductRow(){
  const main=document.querySelector('main');if(!main||main.querySelector('.pd-product-nav'))return;
  const row=document.createElement('nav');row.className='pd-product-nav pd-no-print';row.setAttribute('aria-label','PilotDesk workspace');
  row.innerHTML='<a href="/airport.html">Airport Search</a><a href="/route-planner.html">Route Planner</a><a href="/flights.html">Saved Flights</a><a href="/flight-brief.html">Flight Brief</a><a href="/aircraft.html">My Hangar</a><button class="pd-install-button" type="button">Install PilotDesk</button>';
  const anchor=main.querySelector('.breadcrumbs,.pd-flight-hero,.wx-hero,.hero,.badge,h1')||main.firstElementChild;
  if(anchor?.classList?.contains('breadcrumbs'))anchor.insertAdjacentElement('afterend',row);else main.insertBefore(row,anchor||main.firstChild);
  const b=row.querySelector('.pd-install-button');b.hidden=standalone();b.addEventListener('click',install);
}
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installPrompt=e;document.querySelectorAll('.pd-install-button').forEach(x=>x.hidden=false)});
window.addEventListener('appinstalled',()=>{installPrompt=null;document.querySelectorAll('.pd-install-button').forEach(x=>x.hidden=true)});
function init(){if(location.pathname==='/'||location.pathname==='/index.html')return;addNav();addProductRow()}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init,{once:true}):init();
})();
