(()=>{
'use strict';
if(window.PilotDeskState)return;
const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
function node(target){return typeof target==='string'?document.querySelector(target):target}
function render(target,opts={}){
 const host=node(target);if(!host)return null;
 const kind=['loading','empty','error','ready'].includes(opts.kind)?opts.kind:'ready';
 const title=String(opts.title||({loading:'Loading',empty:'Nothing here yet',error:'Unable to load',ready:'Ready'}[kind]));
 const detail=String(opts.detail||'');
 const action=opts.actionHref&&opts.actionLabel?'<a class="pd-state-action" href="'+esc(opts.actionHref)+'">'+esc(opts.actionLabel)+'</a>':'';
 const retry=opts.retryLabel?'<button class="pd-state-action" type="button" data-pd-state-retry>'+esc(opts.retryLabel)+'</button>':'';
 const scan=kind==='loading'?'<span class="pd-state-scan" aria-hidden="true"><i></i><i></i><i></i></span>':'';
 host.innerHTML='<div class="pd-system-state" data-kind="'+kind+'" role="'+(kind==='error'?'alert':'status')+'">'+scan+'<div><b>'+esc(title)+'</b>'+(detail?'<span>'+esc(detail)+'</span>':'')+'</div>'+(action||retry)+'</div>';
 if(opts.onRetry&&retry)host.querySelector('[data-pd-state-retry]')?.addEventListener('click',opts.onRetry,{once:true});
 return host.firstElementChild;
}
function clear(target){const host=node(target);if(host)host.replaceChildren()}
window.PilotDeskState={render,clear};
})();