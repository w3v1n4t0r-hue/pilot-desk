(()=>{
  window.va=window.va||function(){(window.vaq=window.vaq||[]).push(arguments)};
  window.si=window.si||function(){(window.siq=window.siq||[]).push(arguments)};

  const load=(src,key)=>{
    if(document.querySelector(`script[data-${key}]`))return;
    const s=document.createElement('script');
    s.defer=true;
    s.src=src;
    s.setAttribute(`data-${key}`,'1');
    document.head.appendChild(s);
  };
  load('/_vercel/insights/script.js','pd-vercel-analytics');
  load('/_vercel/speed-insights/script.js','pd-speed-insights');

  const clean=v=>String(v??'').slice(0,80);
  window.pdTrack=(name,data={})=>{
    try{
      const safe={};
      Object.entries(data).slice(0,2).forEach(([k,v])=>safe[clean(k)]=clean(v));
      window.va('event',{name:clean(name),data:safe});
    }catch{}
  };

  document.addEventListener('click',e=>{
    const el=e.target.closest('a,button');if(!el)return;
    if(el.matches('[data-calculate]'))window.pdTrack('Calculator Used',{tool:document.body.dataset.calc||location.pathname.split('/').filter(Boolean).pop()||'unknown'});
    else if(el.matches('#pdInstallHome,.pd-install'))window.pdTrack('Install Prompt',{page:location.pathname});
    else if(el.matches('#pdExportAircraft'))window.pdTrack('Aircraft Export',{page:'aircraft'});
    else if(el.matches('[data-wb-print]'))window.pdTrack('WB Print',{page:'weight-balance'});
    else if(el.matches('[data-wb-copy]'))window.pdTrack('WB Copy',{page:'weight-balance'});
    else if(el.matches('[data-copy-link]'))window.pdTrack('Share Link',{tool:location.pathname.split('/').filter(Boolean).pop()||'calculator'});
    else if(el.tagName==='A'&&location.pathname.startsWith('/guides/')&&el.getAttribute('href')?.startsWith('/calculators/'))window.pdTrack('Guide To Calculator',{guide:location.pathname.split('/').pop()||'guide'});
  },true);

  document.addEventListener('submit',e=>{
    if(e.target?.id==='weatherForm')window.pdTrack('Weather Search',{source:'weather'});
    if(e.target?.id==='aircraftForm')window.pdTrack('Aircraft Saved',{source:'aircraft'});
  },true);

  document.addEventListener('change',e=>{
    if(e.target?.id==='pdImportAircraft')window.pdTrack('Aircraft Import',{source:'aircraft'});
  },true);
})();
