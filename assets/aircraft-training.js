(()=>{
'use strict';
if(location.pathname!=='/aircraft.html')return;
function enhance(){
  const list=document.querySelector('#aircraftList');if(!list)return;
  list.querySelectorAll('article.pd-card').forEach(card=>{const edit=card.querySelector('button[data-edit]'),actions=card.querySelector('.pd-actions');if(!edit||!actions||actions.querySelector('[data-aircraft-training]'))return;const a=document.createElement('a');a.className='pd-btn secondary';a.dataset.aircraftTraining='1';a.href='/checklist-trainer.html?aircraft='+encodeURIComponent(edit.dataset.edit);a.textContent='Training';actions.insertBefore(a,actions.firstChild)});
  const saved=document.querySelector('#aircraftList')?.closest('.pd-panel')?.querySelector('.pd-card-head .pd-actions')||null;
}
function init(){enhance();const list=document.querySelector('#aircraftList');if(list)new MutationObserver(enhance).observe(list,{childList:true,subtree:true})}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init,{once:true}):init();
})();
