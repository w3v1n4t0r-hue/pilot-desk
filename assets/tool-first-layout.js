(()=>{
'use strict';
const path=location.pathname,home=path==='/'||path==='/index.html',calc=path.startsWith('/calculators/')&&!path.includes('weight-balance-builder'),guide=path.startsWith('/guides/');
const APP_PATHS=new Set([
  '/planner.html','/airport.html','/route-planner.html','/flights.html','/flight-brief.html',
  '/aircraft.html','/weather.html','/procedures.html','/poh-chart-studio.html','/checklist-trainer.html',
  '/flight-planning-workspace.html','/weight-balance.html','/e6b-flight-computer.html','/metar-decoder.html',
  '/flight-training.html','/history.html','/account.html'
]);
const qs=(s,r=document)=>r.querySelector(s),qsa=(s,r=document)=>[...r.querySelectorAll(s)];
const slug=s=>String(s||'').toLowerCase().replace(/&/g,'and').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
function simplifyNav(){const nav=qs('.topbar nav');if(!nav)return;for(const a of qsa('a',nav)){const href=a.getAttribute('href');if(home&&(href==='/sources.html'||href==='/legal/privacy.html'))a.remove()}}
function homeLayout(){
  if(!home)return;const main=qs('main.shell');if(!main)return;
  const hero=qs('.hero',main),quick=qs('#pdQuickStart',main),search=qs('.search',main);
  if(search)(quick||hero)?.insertAdjacentElement('afterend',search);
  if(!qs('#pdPopularTools')){const section=document.createElement('section');section.id='pdPopularTools';section.className='pd-popular-tools';section.innerHTML='<div class="category-head"><h2>Popular tools</h2><span>Start calculating</span></div><div class="pd-popular-grid"><a href="/calculators/crosswind/">Crosswind</a><a href="/calculators/density-altitude/">Density altitude</a><a href="/calculators/fuel-required/">Fuel required</a><a href="/weight-balance.html">Weight &amp; balance</a><a href="/weather.html">Airport weather</a><a href="/flight-planning-workspace.html">Flight planning workspace</a></div>';search?.insertAdjacentElement('afterend',section)}

  const categories=qsa(':scope > section.category:not(#pdGuidesHome)',main);
  for(const section of categories){const h=qs('.category-head h2',section);if(h&&!section.id)section.id='tools-'+slug(h.textContent)}
  if(categories.length&&!qs('#pdCategoryJump',main)){
    const nav=document.createElement('nav');nav.id='pdCategoryJump';nav.className='pd-category-jump';nav.setAttribute('aria-label','Calculator categories');
    nav.innerHTML=categories.map(section=>{const h=qs('.category-head h2',section);return h?`<a href="#${section.id}">${h.textContent.trim()}</a>`:''}).join('');
    qs('#pdPopularTools',main)?.insertAdjacentElement('afterend',nav);
  }

  const firstCat=categories[0],topAd=qs(':scope > .ad-wrap',main);
  if(firstCat&&topAd&&topAd.compareDocumentPosition(firstCat)&Node.DOCUMENT_POSITION_FOLLOWING)firstCat.insertAdjacentElement('afterend',topAd);

  const recents=qsa(':scope > .recent-section',main);
  if(recents.length&&!qs('.pd-home-library',main)){
    const d=document.createElement('details');d.className='pd-home-library';d.innerHTML='<summary>Your saved tools &amp; history</summary>';for(const s of recents)d.appendChild(s);
    (topAd&&topAd.previousElementSibling===firstCat?topAd:firstCat)?.insertAdjacentElement('afterend',d);
  }
  const trust=qs('.trust-row',main),guideHome=qs('#pdGuidesHome',main);if(trust&&guideHome)guideHome.insertAdjacentElement('beforebegin',trust);
}
function calculatorLayout(){if(!calc)return;const info=qs('.calc-main > .info-card[data-pd-seo-depth]');if(info&&!info.closest('.pd-learn-panel')){const d=document.createElement('details');d.className='pd-learn-panel';d.innerHTML='<summary>Formula, method &amp; examples</summary>';info.parentNode.insertBefore(d,info);d.appendChild(info)}const related=qs('.sidebar .related');if(related){const seen=new Set();for(const a of qsa('a[href]',related)){const href=a.getAttribute('href');if(seen.has(href))a.remove();else seen.add(href)}}}

function normalizeAppHero(main){
  let hero=qs(':scope > .pd-flight-hero,:scope > .wx-hero,:scope > .pd-account-hero,:scope > .pd-page-hero',main);
  if(hero){hero.classList.add('pd-page-hero');return}
  const h1=qsa(':scope > h1',main)[0];
  if(!h1)return;
  const prev=h1.previousElementSibling;
  const badge=prev&&prev.matches('.badge,.eyebrow')?prev:null;
  const intro=h1.nextElementSibling?.matches('p')?h1.nextElementSibling:null;
  hero=document.createElement('section');hero.className='pd-page-hero pd-synth-hero';
  main.insertBefore(hero,badge||h1);
  if(badge)hero.appendChild(badge);
  hero.appendChild(h1);
  if(intro)hero.appendChild(intro);
}
function moveCoreReference(main){
  const core=qs(':scope > .info-card[data-pd-core-depth="1"]',main);
  if(!core||core.closest('.pd-reference-panel'))return;
  const d=document.createElement('details');d.className='pd-reference-panel';
  const s=document.createElement('summary');s.textContent='Planning notes & verification';d.appendChild(s);d.appendChild(core);
  const ad=qs(':scope > .ad-wrap',main);
  if(ad)main.insertBefore(d,ad);else main.appendChild(d);
}
function appLayout(){
  if(home||calc||guide||!APP_PATHS.has(path))return;
  const main=qs('main.shell,main.pd-account-shell');if(!main)return;
  document.documentElement.classList.add('pd-streamlined-app');
  main.classList.add('pd-streamlined-shell');
  normalizeAppHero(main);
  moveCoreReference(main);
}
function run(){simplifyNav();homeLayout();calculatorLayout();appLayout()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{run();setTimeout(run,0);setTimeout(run,120)},{once:true});else{run();setTimeout(run,0);setTimeout(run,120)}
})();