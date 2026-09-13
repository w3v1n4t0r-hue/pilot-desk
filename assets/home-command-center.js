(()=>{
'use strict';
const path=location.pathname;if(path!=='/'&&path!=='/index.html')return;
const q=(s,r=document)=>r.querySelector(s),qa=(s,r=document)=>[...r.querySelectorAll(s)];
document.documentElement.classList.add('pd-home-command-center');

function openGlobalSearch(query=''){
  const attempt=(n=0)=>{const trigger=q('[data-pd-global-search]');if(trigger){trigger.click();setTimeout(()=>{const input=q('#pdSearchDialog input');if(input){input.value=query;input.dispatchEvent(new Event('input',{bubbles:true}));input.focus()}},20);return}if(n<20){setTimeout(()=>attempt(n+1),50);return}const local=q('#toolSearch');if(local){local.value=query;local.dispatchEvent(new Event('input',{bubbles:true}));q('#pdAllCalculators')?.scrollIntoView({behavior:'smooth',block:'start'})}};attempt();
}

function installTopSearch(){
  const top=q('.topbar'),brand=q('.brand',top);if(!top||!brand||q('.pd-top-search',top))return;
  const form=document.createElement('form');form.className='pd-top-search';form.setAttribute('role','search');
  form.innerHTML='<span class="pd-search-icon" aria-hidden="true">⌕</span><input type="search" aria-label="Search PilotDesk" autocomplete="off" placeholder="Search PilotDesk"><kbd>⌘ K</kbd>';
  brand.insertAdjacentElement('afterend',form);
  form.addEventListener('submit',e=>{e.preventDefault();openGlobalSearch(q('input',form).value.trim())});
  q('input',form).addEventListener('focus',()=>window.pdTrack?.('Homepage Search Focus',{placement:'topbar'}),{once:true});
}

function buildHero(){
  const hero=q('.hero');if(!hero)return;hero.classList.add('pd-command-hero');
  const copy=hero.firstElementChild;
  if(copy){
    copy.classList.add('pd-hero-copy');
    const eyebrow=q('.eyebrow',copy);if(eyebrow)eyebrow.innerHTML='<span></span><b>PILOTDESK</b><span class="pd-sr-only">flight tools</span><i class="pd-cycle-word" aria-hidden="true">FLIGHT TOOLS</i>';
    if(!q('.pd-hero-search',copy)){
      const form=document.createElement('form');form.className='pd-hero-search';form.setAttribute('role','search');
      form.innerHTML='<span class="pd-hero-search-icon" aria-hidden="true">⌕</span><input type="search" autocomplete="off" spellcheck="false" aria-label="Search PilotDesk calculators and study tools" placeholder="Search calculators, weather, training, guides…"><button type="submit"><span>Search</span><kbd>↵</kbd></button>';
      q('h1',copy)?.insertAdjacentElement('afterend',form);
      form.addEventListener('submit',e=>{e.preventDefault();const query=q('input',form).value.trim();window.pdTrack?.('Homepage Search',{placement:'hero'});openGlobalSearch(query)});
    }
  }
  let host=q('.hero-stat',hero)||q('#pdHeroWidget');if(!host){host=document.createElement('div');hero.appendChild(host)}
  host.className='pd-hero-widget-host';host.id='pdHeroWidget';host.replaceChildren();
  document.dispatchEvent(new CustomEvent('pilotdesk:home-widget-ready'));
}

const taskIcon={
  airport:'<svg viewBox="0 0 48 48" focusable="false"><path d="M15 41 20 7h8l5 34M18 33h12M19 25h10"/><path class="pd-icon-accent" d="M24 11v5m0 5v5m0 5v5"/></svg>',
  route:'<svg viewBox="0 0 48 48" focusable="false"><circle cx="10" cy="36" r="3"/><circle cx="38" cy="12" r="3"/><path d="M13 35c7-2 6-10 13-12s6-8 9-9"/><path class="pd-icon-accent" d="m21 17 10 4-5 3-2 5-3-12Z"/></svg>',
  math:'<svg viewBox="0 0 48 48" focusable="false"><circle cx="24" cy="24" r="16"/><circle cx="24" cy="24" r="3"/><path d="M24 8v8m0 16v8M8 24h8m16 0h8"/><path class="pd-icon-accent" d="m15 33 18-18M15 15l4 4m10 10 4 4"/></svg>',
  weather:'<svg viewBox="0 0 48 48" focusable="false"><path d="M12 29h24a7 7 0 0 0-1-13.9A11 11 0 0 0 14.5 18 6 6 0 0 0 12 29Z"/><path class="pd-icon-accent" d="M9 35h18m-12 6h24m-6-6h7"/></svg>',
  balance:'<svg viewBox="0 0 48 48" focusable="false"><path d="M24 7v34M14 41h20M10 13h28"/><path d="m14 13-6 12h12l-6-12Zm20 0-6 12h12l-6-12Z"/><path class="pd-icon-accent" d="M7 25c1 4 4 6 7 6s6-2 7-6m6 0c1 4 4 6 7 6s6-2 7-6"/></svg>'
};
function taskMarkup(){return `<div class="pd-quick-head"><div><span class="pd-section-kicker">QUICK START</span><h2>What are you doing today?</h2></div><span>Go straight to the tool you need.</span></div><div class="pd-task-strip">
<a class="pd-task-card" href="/airport.html" data-pd-launch="airport" data-home-task="airport"><i class="pd-task-icon" aria-hidden="true">${taskIcon.airport}</i><b>Airport search</b><span>Runways, weather and procedures</span></a>
<a class="pd-task-card" href="/route-planner.html" data-pd-launch="route" data-home-task="route"><i class="pd-task-icon" aria-hidden="true">${taskIcon.route}</i><b>Plan a route</b><span>Route, navlog and saved flights</span></a>
<a class="pd-task-card" href="/flight-planning-workspace.html" data-pd-launch="flight-workspace" data-home-task="flight-workspace"><i class="pd-task-icon" aria-hidden="true">${taskIcon.math}</i><b>Flight math</b><span>Wind, time, fuel and descent</span></a>
<a class="pd-task-card" href="/weather.html" data-pd-launch="weather" data-home-task="weather"><i class="pd-task-icon" aria-hidden="true">${taskIcon.weather}</i><b>Live weather</b><span>METAR, TAF and nearby stations</span></a>
<a class="pd-task-card" href="/weight-balance.html" data-pd-launch="weight-balance" data-home-task="weight-balance"><i class="pd-task-icon" aria-hidden="true">${taskIcon.balance}</i><b>Weight &amp; balance</b><span>Build and save a loading scenario</span></a>
</div>`}

function buildQuickStart(){
  const hero=q('.hero');if(!hero)return;let section=q('#pdQuickStart');
  if(!section){section=document.createElement('section');section.id='pdQuickStart';section.className='pd-quick-start';hero.insertAdjacentElement('afterend',section)}
  section.innerHTML=taskMarkup();
  qa('[data-home-task]',section).forEach(card=>card.addEventListener('pointerdown',()=>{qa('[data-home-task]',section).forEach(x=>x.classList.remove('is-active'));card.classList.add('is-active')}));
}

function arrangePersonal(){
  if(q('#pdHomePersonal'))return;const sections=qa('main.shell > .recent-section');if(sections.length<2)return;
  const panel=document.createElement('section');panel.id='pdHomePersonal';panel.innerHTML='<div class="pd-home-personal-head"><div><span class="pd-section-kicker">YOUR PILOTDESK</span><h2>Pick up where you left off</h2></div><span>Saved only in this browser</span></div><div class="pd-home-personal-grid"></div>';
  const quick=q('#pdQuickStart');(quick||q('.hero')).insertAdjacentElement('afterend',panel);const grid=q('.pd-home-personal-grid',panel);grid.append(sections[0],sections[1]);
  if(sections[2]){sections[2].classList.add('pd-home-history-lower');const guides=q('#pdGuidesHome');if(guides)guides.insertAdjacentElement('beforebegin',sections[2]);else q('main.shell')?.appendChild(sections[2])}
}

function arrangeLowerPage(){
  const main=q('main.shell');if(!main)return;
  const trust=q('.trust-row');if(trust){trust.classList.add('pd-home-trust-lower');const guides=q('#pdGuidesHome');if(guides)guides.insertAdjacentElement('afterend',trust)}
  const search=q('.search');if(search&&!q('#pdAllCalculators')){const intro=document.createElement('section');intro.id='pdAllCalculators';intro.innerHTML='<div class="pd-all-head"><div><span class="pd-section-kicker">CALCULATOR LIBRARY</span><h2>All aviation calculators</h2><p>Fast tools for planning, performance, navigation and training.</p></div><span class="pd-all-count">48 tools</span></div>';search.insertAdjacentElement('beforebegin',intro);const input=q('#toolSearch',search);if(input)input.placeholder='Filter the 48 calculators…'}
  const ad=qa('main.shell > .ad-wrap')[0],cats=qa('main.shell > .category');if(ad&&cats[1])cats[1].insertAdjacentElement('afterend',ad);
}

function removeDuplicateDiscovery(){
  const kill=()=>qa('#pdUniversalSearch,#pdDiscovery,#pdPopularTools').forEach(x=>x.remove());kill();const main=q('main.shell');if(!main)return;
  const mo=new MutationObserver(kill);mo.observe(main,{childList:true});setTimeout(()=>mo.disconnect(),5000);
}

function init(){
  installTopSearch();buildHero();buildQuickStart();arrangePersonal();arrangeLowerPage();removeDuplicateDiscovery();
  const word=q('.pd-cycle-word'),labels=['FLIGHT TOOLS','LIVE WEATHER','PERFORMANCE','NAVIGATION','TRAINING'];
  if(word&&!word.dataset.cycling&&!matchMedia('(prefers-reduced-motion: reduce)').matches){word.dataset.cycling='1';let i=0;setInterval(()=>{word.classList.add('is-changing');setTimeout(()=>{i=(i+1)%labels.length;word.textContent=labels[i];word.classList.remove('is-changing')},180)},2600)}
  if(new URLSearchParams(location.search).get('search')==='1')setTimeout(()=>q('.pd-hero-search input')?.focus(),80);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{init();setTimeout(()=>{buildQuickStart();arrangePersonal();arrangeLowerPage()},120)},{once:true});else init();
})();
