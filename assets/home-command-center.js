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
  form.innerHTML='<input type="search" aria-label="Search PilotDesk" autocomplete="off" placeholder="SEARCH"><kbd>⌘ K</kbd>';
  brand.insertAdjacentElement('afterend',form);
  form.addEventListener('submit',e=>{e.preventDefault();openGlobalSearch(q('input',form).value.trim())});
  q('input',form).addEventListener('focus',()=>window.pdTrack?.('Homepage Search Focus',{placement:'topbar'}),{once:true});
}

function buildHero(){
  const hero=q('.hero');if(!hero)return;hero.classList.add('pd-command-hero');
  const copy=hero.firstElementChild;
  if(copy){
    copy.classList.add('pd-hero-copy');
    const eyebrow=q('.eyebrow',copy);if(eyebrow)eyebrow.innerHTML='<span aria-hidden="true"></span><b>PILOTDESK</b><i>FLIGHT TOOLS</i>';
    if(!q('.pd-hero-search',copy)){
      const form=document.createElement('form');form.className='pd-hero-search';form.setAttribute('role','search');
      form.innerHTML='<input type="search" autocomplete="off" spellcheck="false" aria-label="Search PilotDesk calculators and study tools" placeholder="Search calculators, weather, training"><button type="submit"><span>Search</span><kbd>↵</kbd></button>';
      q('h1',copy)?.insertAdjacentElement('afterend',form);
      form.addEventListener('submit',e=>{e.preventDefault();const query=q('input',form).value.trim();window.pdTrack?.('Homepage Search',{placement:'hero'});openGlobalSearch(query)});
    }
  }
  let host=q('.hero-stat',hero)||q('#pdHeroWidget');if(!host){host=document.createElement('div');hero.appendChild(host)}
  host.className='pd-hero-widget-host';host.id='pdHeroWidget';host.replaceChildren();
  document.dispatchEvent(new CustomEvent('pilotdesk:home-widget-ready'));
}

const taskIcon={
  airport:`<svg viewBox="0 0 110 110" focusable="false" aria-hidden="true">
    <path d="M38 93 48 18h14l10 75"/><path d="M48 18h14"/>
    <path d="M43 75h24M45 60h20M47 45h16" class="pd-icon-muted"/>
    <path d="M55 25v10m0 9v10m0 9v10" stroke-dasharray="4 4"/>
    <path d="M45 88h5m3 0h4m3 0h5M46 83h4m3 0h4m3 0h4"/>
    <text x="55" y="78" text-anchor="middle">27</text>
  </svg>`,
  route:`<svg viewBox="0 0 110 110" focusable="false" aria-hidden="true">
    <polyline points="18,85 38,68 58,60 76,40 91,24"/>
    <circle cx="18" cy="85" r="4"/><circle cx="38" cy="68" r="3.5"/><circle cx="58" cy="60" r="3.5"/><circle cx="76" cy="40" r="3.5"/>
    <path d="m86 18 10 2-7 8-2-4-5-1 4-5Z" class="pd-icon-fill"/>
    <text x="13" y="99" class="pd-icon-small">KSEA</text><text x="47" y="51" class="pd-icon-small">V23</text><text x="76" y="16" class="pd-icon-small">KDEN</text>
  </svg>`,
  math:`<svg viewBox="0 0 110 110" focusable="false" aria-hidden="true">
    <circle cx="55" cy="55" r="39"/><circle cx="55" cy="55" r="31" class="pd-icon-muted"/>
    <line x1="55" y1="16" x2="55" y2="23"/><line x1="55" y1="87" x2="55" y2="94"/><line x1="16" y1="55" x2="23" y2="55"/><line x1="87" y1="55" x2="94" y2="55"/>
    <line x1="28" y1="28" x2="33" y2="33" class="pd-icon-muted"/><line x1="77" y1="77" x2="82" y2="82" class="pd-icon-muted"/><line x1="82" y1="28" x2="77" y2="33" class="pd-icon-muted"/><line x1="33" y1="77" x2="28" y2="82" class="pd-icon-muted"/>
    <text x="55" y="12" text-anchor="middle">N</text><text x="100" y="58" text-anchor="middle">E</text><text x="55" y="106" text-anchor="middle">S</text><text x="10" y="58" text-anchor="middle">W</text>
    <path d="M55 36v13l15 7v5l-15-3v11l5 4v3l-5-2-5 2v-3l5-4V58l-15 3v-5l15-7V36Z" class="pd-icon-fill"/>
    <line x1="55" y1="55" x2="72" y2="34"/>
  </svg>`,
  weather:`<svg viewBox="0 0 110 110" focusable="false" aria-hidden="true">
    <path d="M15 51h39a11 11 0 0 0-2-21.8A16 16 0 0 0 22 34a9 9 0 0 0-7 17Z"/>
    <line x1="22" y1="60" x2="17" y2="69"/><line x1="35" y1="60" x2="30" y2="69"/><line x1="48" y1="60" x2="43" y2="69"/>
    <text x="64" y="32" class="pd-icon-small">230° 12KT</text><text x="64" y="46" class="pd-icon-small">10SM</text><text x="64" y="60" class="pd-icon-small">BKN015</text><text x="64" y="74" class="pd-icon-small">18/12</text>
    <line x1="64" y1="82" x2="98" y2="82" class="pd-icon-muted"/><line x1="64" y1="88" x2="89" y2="88" class="pd-icon-muted"/>
  </svg>`,
  balance:`<svg viewBox="0 0 110 110" focusable="false" aria-hidden="true">
    <line x1="25" y1="17" x2="25" y2="88" class="pd-icon-muted"/><line x1="25" y1="88" x2="99" y2="88" class="pd-icon-muted"/>
    <line x1="25" y1="69" x2="99" y2="69" class="pd-icon-muted"/><line x1="25" y1="50" x2="99" y2="50" class="pd-icon-muted"/><line x1="25" y1="31" x2="99" y2="31" class="pd-icon-muted"/>
    <line x1="44" y1="17" x2="44" y2="88" class="pd-icon-muted"/><line x1="63" y1="17" x2="63" y2="88" class="pd-icon-muted"/><line x1="82" y1="17" x2="82" y2="88" class="pd-icon-muted"/>
    <polygon points="43,28 68,28 93,53 93,77 60,77 43,50"/><circle cx="67" cy="57" r="3.5"/>
    <text x="5" y="21" class="pd-icon-small">WT</text><text x="4" y="29" class="pd-icon-small">LB</text><text x="54" y="101" class="pd-icon-small">CG %MAC</text>
  </svg>`
};

const tasks=[
  {href:'/airport.html',launch:'airport',code:'APT',index:'01',title:'Airport search',copy:'Runways, weather and procedures',footer:'AIRPORT DATA',icon:taskIcon.airport},
  {href:'/route-planner.html',launch:'route',code:'ROUTE',index:'02',title:'Plan a route',copy:'Route, navlog and saved flights',footer:'FLIGHT PLANNING',icon:taskIcon.route},
  {href:'/flight-planning-workspace.html',launch:'flight-workspace',code:'PERF',index:'03',title:'Flight math',copy:'Wind, time, fuel and descent',footer:'PERFORMANCE',icon:taskIcon.math},
  {href:'/weather.html',launch:'weather',code:'WX',index:'04',title:'Live weather',copy:'METAR, TAF and nearby stations',footer:'WEATHER DATA',icon:taskIcon.weather},
  {href:'/weight-balance.html',launch:'weight-balance',code:'W&B',index:'05',title:'Weight & balance',copy:'Build and save a loading scenario',footer:'LOADING ANALYSIS',icon:taskIcon.balance}
];

function taskMarkup(){return `<div class="pd-quick-head"><div><span class="pd-section-kicker">PRIMARY FUNCTIONS</span><h2>Flight tools</h2></div><span>SELECT TASK</span></div><div class="pd-task-strip">${tasks.map(t=>`<a class="pd-task-card" href="${t.href}" data-pd-launch="${t.launch}" data-home-task="${t.launch}"><div class="pd-task-top"><span>${t.code}</span><i class="pd-task-rule" aria-hidden="true"></i><span class="pd-task-index">${t.index}</span></div><div class="pd-task-body"><div class="pd-task-copy"><b>${t.title}</b><span>${t.copy}</span></div><div class="pd-task-icon-window"><i class="pd-task-icon" aria-hidden="true">${t.icon}</i></div></div><div class="pd-task-footer">${t.footer}</div></a>`).join('')}</div>`}

function buildQuickStart(){
  const hero=q('.hero');if(!hero)return;let section=q('#pdQuickStart');
  if(!section){section=document.createElement('section');section.id='pdQuickStart';section.className='pd-quick-start';hero.insertAdjacentElement('afterend',section)}
  section.innerHTML=taskMarkup();
  qa('[data-home-task]',section).forEach(card=>card.addEventListener('pointerdown',()=>{qa('[data-home-task]',section).forEach(x=>x.classList.remove('is-active'));card.classList.add('is-active')}));
}

function arrangePersonal(){
  if(q('#pdHomePersonal'))return;const sections=qa('main.shell > .recent-section');if(sections.length<2)return;
  const panel=document.createElement('section');panel.id='pdHomePersonal';panel.innerHTML='<div class="pd-home-personal-head"><div><span class="pd-section-kicker">LOCAL DATA</span><h2>Recent activity</h2></div><span>Stored in this browser</span></div><div class="pd-home-personal-grid"></div>';
  const quick=q('#pdQuickStart');(quick||q('.hero')).insertAdjacentElement('afterend',panel);const grid=q('.pd-home-personal-grid',panel);grid.append(sections[0],sections[1]);
  if(sections[2]){sections[2].classList.add('pd-home-history-lower');const guides=q('#pdGuidesHome');if(guides)guides.insertAdjacentElement('beforebegin',sections[2]);else q('main.shell')?.appendChild(sections[2])}
}

function arrangeLowerPage(){
  const main=q('main.shell');if(!main)return;
  const trust=q('.trust-row');if(trust){trust.classList.add('pd-home-trust-lower');const guides=q('#pdGuidesHome');if(guides)guides.insertAdjacentElement('afterend',trust)}
  const search=q('.search');if(search&&!q('#pdAllCalculators')){const intro=document.createElement('section');intro.id='pdAllCalculators';intro.innerHTML='<div class="pd-all-head"><div><span class="pd-section-kicker">CALCULATOR LIBRARY</span><h2>All aviation calculators</h2><p>Planning, performance, navigation and training.</p></div><span class="pd-all-count">48 TOOLS</span></div>';search.insertAdjacentElement('beforebegin',intro);const input=q('#toolSearch',search);if(input)input.placeholder='Filter calculators'}
  const ad=qa('main.shell > .ad-wrap')[0],cats=qa('main.shell > .category');if(ad&&cats[1])cats[1].insertAdjacentElement('afterend',ad);
}

function removeDuplicateDiscovery(){
  const kill=()=>qa('#pdUniversalSearch,#pdDiscovery,#pdPopularTools').forEach(x=>x.remove());kill();const main=q('main.shell');if(!main)return;
  const mo=new MutationObserver(kill);mo.observe(main,{childList:true});setTimeout(()=>mo.disconnect(),5000);
}

function init(){
  installTopSearch();buildHero();buildQuickStart();arrangePersonal();arrangeLowerPage();removeDuplicateDiscovery();
  if(new URLSearchParams(location.search).get('search')==='1')setTimeout(()=>q('.pd-hero-search input')?.focus(),80);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{init();setTimeout(()=>{buildQuickStart();arrangePersonal();arrangeLowerPage()},120)},{once:true});else init();
})();
