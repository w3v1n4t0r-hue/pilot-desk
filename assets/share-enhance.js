(()=>{
  const isCalc=location.pathname.startsWith('/calculators/');
  if(!isCalc)return;
  function buildUrl(){
    const u=new URL(location.href);u.search='';
    document.querySelectorAll('[data-calc-input]').forEach(el=>{const v=String(el.value??'').trim();if(v!=='')u.searchParams.set(el.id,v)});
    return u.toString();
  }
  async function copyDeepLink(){
    try{await navigator.clipboard.writeText(buildUrl());window.toast?.('Share link copied')}
    catch{window.toast?.('Could not copy link')}
  }
  document.addEventListener('DOMContentLoaded',()=>{
    const actions=document.querySelector('.calc-actions');
    if(!actions||actions.querySelector('[data-copy-link]'))return;
    const b=document.createElement('button');b.type='button';b.dataset.copyLink='1';b.textContent='Copy share link';b.addEventListener('click',copyDeepLink);actions.appendChild(b);
  });
})();
