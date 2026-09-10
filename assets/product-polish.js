(()=>{
  const path=location.pathname;
  const qs=s=>document.querySelector(s);
  const qsa=s=>[...document.querySelectorAll(s)];

  function nav(){
    const nav=qs('.topbar nav');
    if(nav){
      const wanted=[['/','Calculators'],['/weather.html','Weather'],['/aircraft.html','Aircraft'],['/guides.html','Guides'],['/about.html','About']];
      wanted.forEach(([href,label])=>{if(!nav.querySelector(`a[href="${href}"]`)){const a=document.createElement('a');a.href=href;a.textContent=label;nav.appendChild(a)}});
      qsa('.topbar nav a').forEach(a=>{const href=a.getAttribute('href');const active=(href==='/'&&(path==='/'||path==='/index.html'))||(href!=='/'&&path===href)||(href==='/guides.html'&&path.startsWith('/guides/'));if(active)a.setAttribute('aria-current','page')});
    }
    const foot=qs('.footer-links');if(foot&&!foot.querySelector('a[href="/feedback.html"]')){const a=document.createElement('a');a.href='/feedback.html';a.textContent='Feedback';foot.appendChild(a)}
  }

  function home(){
    if(path!=='/'&&path!=='/index.html')return;
    const main=qs('main.shell');if(!main||qs('#pdStartHere'))return;
    const section=document.createElement('section');
    section.id='pdStartHere';section.className='category pd-start-here';
    section.innerHTML='<div class="category-head"><h2>Start here</h2><span>Popular pilot tools</span></div><div class="grid pd-start-grid"><a class="tool-card" href="/weather.html"><b>Airport Weather</b><p>METAR, TAF, airport details and runway wind components.</p></a><a class="tool-card" href="/calculators/crosswind/"><b>Crosswind Component</b><p>Headwind, tailwind and crosswind from runway and wind.</p></a><a class="tool-card" href="/calculators/density-altitude/"><b>Density Altitude</b><p>Estimate density altitude from pressure altitude and temperature.</p></a><a class="tool-card" href="/calculators/weight-balance-builder/"><b>Weight & Balance</b><p>Build a loading table and calculate weight, moment and CG.</p></a><a class="tool-card" href="/aircraft.html"><b>Aircraft Profiles</b><p>Save common aircraft numbers locally for faster calculations.</p></a><a class="tool-card" href="/guides.html"><b>Pilot Math Guides</b><p>Quick explanations for the formulas behind the tools.</p></a></div>';
    const footerAd=[...main.querySelectorAll('.ad-wrap')].pop();if(footerAd)main.insertBefore(section,footerAd);else main.appendChild(section);
  }

  function weather(){
    if(path!=='/weather.html')return;const chips=qs('.pd-chiprow');if(!chips||chips.querySelector('[data-pd-notam]'))return;
    const a=document.createElement('a');a.className='pd-chip';a.dataset.pdNotam='1';a.href='https://notams.aim.faa.gov/notamSearch/';a.target='_blank';a.rel='noopener';a.textContent='FAA NOTAM Search ↗';chips.appendChild(a);
    const panel=chips.closest('.pd-panel');if(panel&&!panel.querySelector('[data-pd-briefing-note]')){const p=document.createElement('p');p.dataset.pdBriefingNote='1';p.className='fine';p.textContent='PilotDesk does not provide an official preflight briefing. Check current NOTAMs, TFRs, weather and other required information through approved sources.';panel.appendChild(p)}
  }

  function calculator(){if(!path.startsWith('/calculators/'))return;const notice=qs('.calc-box .notice');if(notice&&!notice.dataset.pdFinal){notice.dataset.pdFinal='1';notice.textContent='Planning and training aid only. Verify aircraft limitations, performance, weather and operational decisions with current approved sources.'}}
  function meta(){if(!qs('meta[name="application-name"]')){const m=document.createElement('meta');m.name='application-name';m.content='PilotDesk';document.head.appendChild(m)}if(!qs('meta[name="apple-mobile-web-app-title"]')){const m=document.createElement('meta');m.name='apple-mobile-web-app-title';m.content='PilotDesk';document.head.appendChild(m)}}
  const run=()=>{nav();home();weather();calculator();meta()};if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});else run();
})();
