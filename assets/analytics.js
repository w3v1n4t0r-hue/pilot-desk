(()=>{
  const queued=Array.isArray(window.__pdTrackQueue)?window.__pdTrackQueue.slice():[];
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
  queued.splice(0,50).forEach(([name,data])=>window.pdTrack(name,data));
  window.__pdTrackQueue=[];

  const path=location.pathname;
  const slug=()=>document.body.dataset.calc||path.split('/').filter(Boolean).pop()||'home';
  const pageKind=()=>path.startsWith('/calculators/')?'calculator':path.startsWith('/guides/')?'guide':path==='/weather.html'?'weather':path.includes('planner')||path==='/flights.html'||path==='/flight-brief.html'?'planning':path==='/aircraft.html'||path==='/weight-balance.html'?'aircraft':'other';
  try{
    const key='pd-analytics-open:'+path;
    if(!sessionStorage.getItem(key)){sessionStorage.setItem(key,'1');window.pdTrack('Tool Opened',{type:pageKind(),tool:slug()})}
  }catch{}

  document.addEventListener('click',e=>{
    const el=e.target.closest('a,button');if(!el)return;
    if(el.matches('[data-calculate]'))window.pdTrack('Calculator Used',{tool:slug()});
    else if(el.matches('#pdInstallHome,.pd-install'))window.pdTrack('Install Prompt',{page:path});
    else if(el.matches('#pdExportAircraft'))window.pdTrack('Aircraft Export',{page:'aircraft'});
    else if(el.matches('[data-wb-print]'))window.pdTrack('WB Print',{page:'weight-balance'});
    else if(el.matches('[data-wb-copy]'))window.pdTrack('WB Copy',{page:'weight-balance'});
    else if(el.matches('[data-copy-link],[data-pd-copy-link],[data-pd-share],#workspaceShare'))window.pdTrack('Share Action',{tool:slug()});
    else if(el.matches('[data-save-scenario],#workspaceSave,.pd-star'))window.pdTrack('Save Action',{tool:slug()});
    else if(el.tagName==='A'&&path.startsWith('/guides/')&&el.getAttribute('href')?.startsWith('/calculators/'))window.pdTrack('Guide To Calculator',{guide:slug()});
  },true);

  document.addEventListener('submit',e=>{
    if(e.target?.id==='weatherForm')window.pdTrack('Weather Search',{source:'weather'});
    if(e.target?.id==='aircraftForm')window.pdTrack('Aircraft Saved',{source:'aircraft'});
  },true);

  document.addEventListener('change',e=>{
    if(e.target?.id==='pdImportAircraft')window.pdTrack('Aircraft Import',{source:'aircraft'});
  },true);

  document.addEventListener('pilotdesk:calculated',()=>window.pdTrack('Calculation Completed',{tool:slug()}));
  document.addEventListener('pilotdesk:weatherloaded',e=>window.pdTrack('Weather Result',{freshness:e.detail?.stale?'stale':'fresh',source:e.detail?.fallback?'backup':'primary'}));
})();
