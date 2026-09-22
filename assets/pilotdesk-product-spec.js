(()=>{
'use strict';
if(window.__PDProductSpecReady)return;window.__PDProductSpecReady=true;
const $=(s,r=document)=>r.querySelector(s);
function normalizeFooter(){
  const footer=document.querySelector('footer');if(!footer)return;
  footer.classList.add('pd-utility-footer');
  footer.innerHTML='<div><b>PilotDesk</b><p>Aviation tools for planning and training.</p></div><div class="footer-links"><a href="/pricing.html">Plans</a><a href="/for-flight-schools.html">Flight Schools</a><a href="/about.html">About</a><a href="/sources.html">Sources</a><a href="/legal/privacy.html">Privacy</a><a href="/legal/terms.html">Terms</a><a href="/feedback.html">Feedback</a><a href="/legal/safety.html">Safety</a></div><p class="fine">Planning aid only. Verify operational information with current approved sources.</p>';
}
function instrumentLoading(node){
  if(!node||node.dataset.pdInstrumentLoading)return;
  if(!/loading|preparing|checking/i.test(node.textContent||''))return;
  node.dataset.pdInstrumentLoading='1';
  node.classList.add('pd-instrument-loading');
  const bars=document.createElement('span');bars.className='pd-instrument-bars';bars.setAttribute('aria-hidden','true');bars.innerHTML='<i></i><i></i><i></i>';node.appendChild(bars);
}
function calmEmpty(node){
  if(!node||node.dataset.pdEmptyEnhanced)return;
  const text=(node.textContent||'').trim().toLowerCase();
  let href='',label='';
  if(/no (saved )?flights|no routes/.test(text)){href='/route-planner.html';label='Build a route'}
  else if(/no aircraft/.test(text)){href='/aircraft.html';label='Add an aircraft'}
  else if(/no answers|no score|no questions/.test(text)&&location.pathname.includes('skill-gap')){href='/written-prep.html';label='Open Written Prep'}
  if(!href)return;
  node.dataset.pdEmptyEnhanced='1';
  if(!node.querySelector('a,button')){const a=document.createElement('a');a.className='pd-btn secondary';a.href=href;a.textContent=label;node.append(' ',a)}
}
function enhanceStates(root=document){
  root.querySelectorAll('.wx-skeleton,.pd-loading,.pd-prep-empty,.pd-daily-title').forEach(instrumentLoading);
  root.querySelectorAll('.pd-empty,.pd-empty-state').forEach(calmEmpty);
  root.querySelectorAll('.wx-error,.pd-gap-error,[data-kind="bad"]').forEach(x=>x.classList.add('pd-error-state'));
}
function observeStates(){
  const mo=new MutationObserver(records=>{for(const r of records)for(const n of r.addedNodes)if(n.nodeType===1)enhanceStates(n)});
  mo.observe(document.body,{childList:true,subtree:true});
}
function init(){normalizeFooter();enhanceStates();observeStates()}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init,{once:true}):init();
})();