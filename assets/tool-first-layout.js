(()=>{
'use strict';
const path=location.pathname,home=path==='/'||path==='/index.html',calc=path.startsWith('/calculators/')&&!path.includes('weight-balance-builder');
const qs=(s,r=document)=>r.querySelector(s),qsa=(s,r=document)=>[...r.querySelectorAll(s)];
function simplifyNav(){const nav=qs('.topbar nav');if(!nav)return;for(const a of qsa('a',nav)){const href=a.getAttribute('href');if(home&&(href==='/sources.html'||href==='/legal/privacy.html'))a.remove()}}
function homeLayout(){if(!home)return;const main=qs('main.shell');if(!main)return;const hero=qs('.hero',main),quick=qs('#pdQuickStart',main),search=qs('.search',main);if(search)(quick||hero)?.insertAdjacentElement('afterend',search);
if(!qs('#pdPopularTools')){const section=document.createElement('section');section.id='pdPopularTools';section.className='pd-popular-tools';section.innerHTML='<div class="category-head"><h2>Popular tools</h2><span>Start calculating</span></div><div class="pd-popular-grid"><a href="/calculators/crosswind/">Crosswind</a><a href="/calculators/density-altitude/">Density altitude</a><a href="/calculators/fuel-required/">Fuel required</a><a href="/weight-balance.html">Weight &amp; balance</a><a href="/weather.html">Airport weather</a><a href="/flight-planning-workspace.html">Flight planning workspace</a></div>';search?.insertAdjacentElement('afterend',section)}
const recents=qsa(':scope > .recent-section',main);if(recents.length&&!qs('.pd-home-library',main)){const d=document.createElement('details');d.className='pd-home-library';d.innerHTML='<summary>Your saved tools &amp; history</summary>';for(const s of recents)d.appendChild(s);const firstCat=qs('section.category',main);firstCat?.insertAdjacentElement('afterend',d)}
const trust=qs('.trust-row',main),guide=qs('#pdGuidesHome',main);if(trust&&guide)guide.insertAdjacentElement('beforebegin',trust);
}
function calculatorLayout(){if(!calc)return;const info=qs('.calc-main > .info-card[data-pd-seo-depth]');if(info&&!info.closest('.pd-learn-panel')){const d=document.createElement('details');d.className='pd-learn-panel';d.innerHTML='<summary>Formula, method &amp; examples</summary>';info.parentNode.insertBefore(d,info);d.appendChild(info)}const related=qs('.sidebar .related');if(related){const seen=new Set();for(const a of qsa('a[href]',related)){const href=a.getAttribute('href');if(seen.has(href))a.remove();else seen.add(href)}}}
function run(){simplifyNav();homeLayout();calculatorLayout()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{run();setTimeout(run,0)},{once:true});else{run();setTimeout(run,0)}
})();
