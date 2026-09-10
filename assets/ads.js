document.addEventListener('DOMContentLoaded',()=>{
  const c=window.PILOTDESK_ADS||{};
  const pub=(c.publisherId||'').trim();
  if(!/^ca-pub-\d+$/.test(pub))return;

  const renderSlots=()=>{
    document.querySelectorAll('.ad-slot').forEach(box=>{
      const key=box.dataset.adSlot;
      const slot=c.slots?.[key];
      if(!slot){
        box.closest('.ad-wrap')?.remove();
        return;
      }
      const ins=document.createElement('ins');
      ins.className='adsbygoogle';
      ins.style.display='block';
      ins.dataset.adClient=pub;
      ins.dataset.adSlot=slot;
      ins.dataset.adFormat='auto';
      ins.dataset.fullWidthResponsive='true';
      box.replaceWith(ins);
      try{(window.adsbygoogle=window.adsbygoogle||[]).push({})}catch(e){console.warn(e)}
    });
  };

  const src=`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(pub)}`;
  let script=[...document.scripts].find(s=>s.src===src);

  const afterLoad=()=>{
    renderSlots();
    // Auto Ads use the publisher script plus the Auto Ads setting in AdSense.
    // No manual slot IDs are required for Auto Ads placement.
  };

  if(script){
    if(window.adsbygoogle) afterLoad();
    else script.addEventListener('load',afterLoad,{once:true});
  }else{
    script=document.createElement('script');
    script.async=true;
    script.crossOrigin='anonymous';
    script.src=src;
    script.addEventListener('load',afterLoad,{once:true});
    document.head.appendChild(script);
  }
});

// Site-wide product helpers.
(()=>{
  const load=(src,key)=>{
    if(document.querySelector(`script[data-${key}]`))return;
    const s=document.createElement('script');
    s.src=src;
    s.defer=true;
    s.setAttribute(`data-${key}`,'1');
    document.head.appendChild(s);
  };
  load('/assets/brand.js','pd-brand');
  load('/assets/home-fix.js','pd-home');
  load('/assets/features.js','pd-features');
  load('/assets/analytics.js','pd-analytics');
})();
