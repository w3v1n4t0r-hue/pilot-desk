document.addEventListener('DOMContentLoaded',()=>{
  const c=window.PILOTDESK_ADS||{};const pub=(c.publisherId||'').trim();if(!/^ca-pub-\d+$/.test(pub))return;
  const renderSlots=()=>{document.querySelectorAll('.ad-slot').forEach(box=>{const key=box.dataset.adSlot,slot=c.slots?.[key],wrap=box.closest('.ad-wrap');if(!slot){if(wrap)wrap.style.display='none';return}if(wrap)wrap.style.display='block';const ins=document.createElement('ins');ins.className='adsbygoogle';ins.style.display='block';ins.style.minHeight=key==='sidebar'?'250px':'90px';ins.dataset.adClient=pub;ins.dataset.adSlot=slot;ins.dataset.adFormat='auto';ins.dataset.fullWidthResponsive='true';box.replaceWith(ins);try{(window.adsbygoogle=window.adsbygoogle||[]).push({})}catch(e){console.warn(e)}})};
  const src=`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(pub)}`;let script=[...document.scripts].find(s=>s.src===src);const afterLoad=()=>renderSlots();
  if(script){if(window.adsbygoogle)afterLoad();else script.addEventListener('load',afterLoad,{once:true})}else{script=document.createElement('script');script.async=true;script.crossOrigin='anonymous';script.src=src;script.addEventListener('load',afterLoad,{once:true});document.head.appendChild(script)}
});
(()=>{
  const path=location.pathname;
  const load=(src,key)=>{if(document.querySelector(`script[data-${key}]`))return;const s=document.createElement('script');s.src=src;s.defer=true;s.setAttribute(`data-${key}`,'1');document.head.appendChild(s)};
  load('/assets/brand.js','pd-brand');
  load('/assets/analytics.js','pd-analytics');
  load('/assets/seo.js','pd-seo');
  load('/assets/product-polish.js','pd-polish');
  load('/assets/update.js','pd-update');
  load('/assets/errors.js','pd-errors');
  if(path==='/'||path==='/index.html')load('/assets/home-fix.js','pd-home');
  if(path.startsWith('/calculators/')||path==='/aircraft.html')load('/assets/features.js','pd-features');
  if(path.startsWith('/calculators/'))load('/assets/share-enhance.js','pd-share');
  if(path==='/aircraft.html')load('/assets/aircraft-transfer.js','pd-aircraft-transfer');
  if(path==='/weight-balance.html'||path.startsWith('/calculators/weight-balance-builder'))load('/assets/wb-export.js','pd-wb-export');
})();
