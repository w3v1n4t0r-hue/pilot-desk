(()=>{
'use strict';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function markup(kind,title,copy,action){
 const label=kind==='loading'?'SYSTEM CHECK':kind==='error'?'UNAVAILABLE':'NO DATA';
 const actionHtml=action?.href?'<a class="pd-state-action" href="'+esc(action.href)+'">'+esc(action.label||'Continue')+'</a>':action?.onClick?'<button class="pd-state-action" type="button">'+esc(action.label||'Retry')+'</button>':'';
 return '<div class="pd-system-state" data-state="'+kind+'"><div class="pd-state-instrument" aria-hidden="true"><i></i><i></i><i></i><i></i></div><div><small>'+label+'</small><b>'+esc(title)+'</b><span>'+esc(copy||'')+'</span>'+actionHtml+'</div></div>';
}
window.PilotDeskStates={
 loading:(host,title='Loading',copy='Checking PilotDesk data…')=>{if(host)host.innerHTML=markup('loading',title,copy)},
 empty:(host,title='Nothing here yet',copy='',action=null)=>{if(host)host.innerHTML=markup('empty',title,copy,action)},
 error:(host,title='Unable to load this data',copy='Try again when the service is available.',action=null)=>{if(!host)return;host.innerHTML=markup('error',title,copy,action);if(action?.onClick)host.querySelector('.pd-state-action')?.addEventListener('click',action.onClick)}
};
function normalize(){
 document.querySelectorAll('.pd-empty').forEach(el=>{if(el.querySelector('a,button,.pd-system-state'))return;el.classList.add('pd-shared-empty')});
 document.querySelectorAll('.wx-skeleton,.pd-loading').forEach(el=>el.classList.add('pd-shared-loading'));
 document.querySelectorAll('.wx-error,.pd-gap-error').forEach(el=>el.classList.add('pd-shared-error'));
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',normalize,{once:true}):normalize();
})();