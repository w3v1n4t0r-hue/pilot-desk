(()=>{
  if(!location.pathname.startsWith('/calculators/'))return;
  function buildUrl(){const u=new URL(location.href);u.search='';document.querySelectorAll('[data-calc-input]').forEach(el=>{const v=String(el.value??'').trim();if(v!=='')u.searchParams.set(el.id,v)});return u.toString()}
  function applyParams(){const p=new URLSearchParams(location.search);let changed=false;document.querySelectorAll('[data-calc-input]').forEach(el=>{if(!el.id||!p.has(el.id))return;const v=p.get(el.id);if(v!==null&&v!==''&&Number.isFinite(Number(v))){el.value=v;el.dispatchEvent(new Event('input',{bubbles:true}));changed=true}});if(changed)window.calculate?.()}
  async function copyDeepLink(){try{await navigator.clipboard.writeText(buildUrl());window.toast?.('Share link copied')}catch{window.toast?.('Could not copy link')}}
  document.addEventListener('DOMContentLoaded',()=>{applyParams();const actions=document.querySelector('.calc-actions');if(actions&&!actions.querySelector('[data-copy-link]')){const b=document.createElement('button');b.type='button';b.dataset.copyLink='1';b.textContent='Copy share link';b.addEventListener('click',copyDeepLink);actions.appendChild(b)}document.addEventListener('click',e=>{if(e.target.closest('[data-share]'))history.replaceState(null,'',buildUrl())},true)});
})();
