(()=>{
'use strict';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function render(host,{kind='empty',title='',detail='',actionLabel='',actionHref='' }={}){
 if(typeof host==='string')host=document.querySelector(host);if(!host)return null;
 const cls=['loading','empty','error','warning'].includes(kind)?kind:'empty';
 host.innerHTML=`<div class="pd-state pd-state-${cls}"><span class="pd-state-instrument" aria-hidden="true"><i></i><i></i><i></i></span><div><b>${esc(title)}</b><span>${esc(detail)}</span>${actionLabel&&actionHref?`<a class="pd-state-action" href="${esc(actionHref)}">${esc(actionLabel)} →</a>`:''}</div></div>`;
 return host.firstElementChild;
}
function applyMotionPreference(){
 let reduced=false;try{reduced=localStorage.getItem('pd-setting-reduce-motion')==='1'}catch{}
 document.documentElement.dataset.pdReduceMotion=reduced?'1':'0';
}
window.PilotDeskState={render,applyMotionPreference};
applyMotionPreference();
})();