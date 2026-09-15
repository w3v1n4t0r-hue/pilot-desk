(()=>{
'use strict';
const icon=(d)=>`<svg viewBox="0 0 32 32" aria-hidden="true"><path d="${d}"/></svg>`;
const actions=[
 ['/route-planner.html','Plan a Flight','Routes, airports, procedures, aircraft, and saved flights.','M5 18h22M16 4v24M9 18l3-8h8l3 8M11 24h10'],
 ['/calculators/crosswind/','Use a Calculator','Performance, W&B, fuel, E6B, navigation, and more.','M7 4h18v24H7zM10 9h12M11 15h2m3 0h2m3 0h1M11 20h2m3 0h2m3 0h1M11 24h2m3 0h6'],
 ['/written-prep.html','Study for a Written','PPL, Instrument, CPL, CFI, CFII, and ATP practice.','M5 7c4-2 8-1 11 2v18c-3-3-7-4-11-2V7Zm22 0c-4-2-8-1-11 2v18c3-3 7-4 11-2V7Z'],
 ['/daily/','Play Daily','Three aviation questions. New challenge every day.','M7 25V17h4v8M14 25V11h4v14M21 25V6h4v19']
];
const popular=[
 ['/weight-balance.html','Weight & Balance','M16 5v22M7 9h18M10 9 5 19h10L10 9Zm12 0-5 10h10L22 9ZM11 27h10'],
 ['/calculators/fuel-required/','Fuel Planning','M6 5h14v22H6zM9 9h8v6H9zM20 9h3l3 4v10a3 3 0 0 1-6 0V11'],
 ['/calculators/density-altitude/','Density Altitude','M16 7a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 10 6-6M10 24h12'],
 ['/calculators/crosswind/','Crosswind','M6 8h15c4 0 4 6 0 6h-5M6 15h9c4 0 4 6 0 6h-3M6 22h5'],
 ['/e6b-flight-computer.html','E6B','M16 5a11 11 0 1 0 0 22 11 11 0 0 0 0-22Zm0 6a5 5 0 1 0 0 10 5 5 0 0 0 0-10Z'],
 ['/weather.html','METAR / TAF','M9 23h14a5 5 0 0 0 1-10 8 8 0 0 0-15-1 5.5 5.5 0 0 0 0 11Z'],
 ['/airport.html','Airport Info','M16 4v24M10 8h12M9 28h14M12 13h8M11 18h10M13 23h6'],
 ['/route-planner.html','Flight Plan','M7 5h18v22H7zM11 10h10M11 15h10M11 20h6']
];
const cats=[
 ['/calculators/crosswind/','Tools','Calculators, E6B, W&B, conversions, and flight math.','M8 25 24 9M10 10l5-5 7 7-5 5M6 26l5-1-4-4-1 5Z'],
 ['/route-planner.html','Plan','Routes, airports, procedures, aircraft, and saved flights.','M5 21 27 9M13 17l-2 9 5-5 7 3-2-9M5 21l5 1'],
 ['/weather.html','Weather','METARs, TAFs, airport weather, and weather tools.','M8 23h15a5 5 0 0 0 0-10 8 8 0 0 0-15-1 5.5 5.5 0 0 0 0 11Z'],
 ['/flight-training.html','Learn','Written prep, weak subjects, flight training, and pilot guides.','M5 7c4-2 8-1 11 2v18c-3-3-7-4-11-2V7Zm22 0c-4-2-8-1-11 2v18c3-3 7-4 11-2V7Z']
];
function render(){
 if(!(location.pathname==='/'||location.pathname==='/index.html'))return;
 const main=document.querySelector('main.shell');if(!main)return;
 document.body.classList.add('pd-home-2026');
 main.innerHTML=`
 <section class="pd-home-hero" aria-labelledby="pdHomeTitle"><div class="pd-home-hero-inner"><div class="pd-home-hero-copy"><div class="eyebrow">PLAN · CALCULATE · LEARN · FLY</div><h1 id="pdHomeTitle">Built for the next leg.</h1><p>Flight planning, pilot math, weather, and written prep in one place. Pick what you need and get to it.</p></div><div class="pd-home-actions">${actions.map(([href,title,copy,path])=>`<a class="pd-home-action" href="${href}"><span class="pd-home-action-icon">${icon(path)}</span><b>${title}</b><span>${copy}</span><em>›</em></a>`).join('')}</div></div></section>
 <div class="pd-home-wrap">
  <section class="pd-home-account-strip" data-pd-home-account><div class="pd-home-account-icon">${icon('M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10ZM3 30c1-8 5-12 13-12s12 4 13 12')}</div><div class="pd-home-account-copy"><b data-pd-home-account-title>Sign in to save your progress</b><span data-pd-home-account-copy>Keep written-prep scores, streaks, aircraft, and other PilotDesk progress tied to your account.</span></div><div class="pd-home-account-actions" data-pd-home-account-actions><a class="primary" href="/account.html?next=%2F">Sign in</a><a href="/account.html?next=%2F">Create a free account</a></div></section>
  <section class="pd-home-section" id="popular-tools"><div class="pd-home-section-head"><div><h2>Popular tools</h2><p>The things pilots reach for most.</p></div><a href="/calculators/crosswind/">Open calculators →</a></div><div class="pd-popular-grid">${popular.map(([href,title,path])=>`<a class="pd-popular-tool" href="${href}">${icon(path)}<span>${title}</span></a>`).join('')}</div></section>
  <div class="ad-wrap"><div class="ad-label">ADVERTISEMENT</div><div class="ad-slot" data-ad-slot="top"><span>Ad space</span></div></div>
  <section class="pd-home-section"><div class="pd-feature-grid"><article class="pd-feature-card"><div class="eyebrow">WRITTEN PREP</div><h3>Know what you know before test day.</h3><p>5,000 ACS-linked practice questions across PPL, Instrument, CPL, CFI, and ATP, plus CFII PTS practice. Three choices per question, explanations, weak-subject review, and saved progress.</p><a href="/written-prep.html">Start studying →</a></article><article class="pd-feature-card"><div class="eyebrow">PILOTDESK DAILY</div><h3>Keep aviation knowledge fresh.</h3><p>Three aviation questions each day. Save your score, build a streak, and keep a small amount of studying in your normal routine.</p><a href="/daily/">Play today →</a></article></div></section>
  <section class="pd-home-section"><div class="pd-home-section-head"><div><h2>Explore PilotDesk</h2><p>Everything is organized around four jobs.</p></div></div><div class="pd-category-grid">${cats.map(([href,title,copy,path])=>`<a class="pd-category-card" href="${href}">${icon(path)}<b>${title}</b><span>${copy}</span><em>›</em></a>`).join('')}</div></section>
 </div>`;
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',render,{once:true});else render();
})();