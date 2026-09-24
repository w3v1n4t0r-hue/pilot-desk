(()=>{
'use strict';
const SUPABASE_URL='https://hqqgcfiaxcrzyuhtkzqg.supabase.co';
const SUPABASE_PUBLISHABLE_KEY='sb_publishable_Mj4GgPXqlild6Z_4k47Ypg_TeUvlyfQ';
const APP_PATHS=new Set(['/tools.html','/daily/','/daily/index.html','/written-prep.html','/skill-gap.html','/planner.html','/airport.html','/route-planner.html','/flights.html','/flight-brief.html','/aircraft.html','/weather.html','/procedures.html','/poh-chart-studio.html','/checklist-trainer.html','/flight-planning-workspace.html','/weight-balance.html','/e6b-flight-computer.html','/metar-decoder.html','/flight-training.html','/history.html','/account.html','/pricing.html','/for-flight-schools.html']);
let sections=[];
let searchable=[];

function loadDataScript(path,ready){
 return new Promise(resolve=>{
  if(ready())return resolve(true);
  const existing=[...document.scripts].find(s=>{try{return new URL(s.src,location.href).pathname===path}catch{return false}});
  const finish=()=>resolve(ready());
  if(existing){existing.addEventListener('load',finish,{once:true});existing.addEventListener('error',finish,{once:true});setTimeout(finish,900);return}
  const script=document.createElement('script');script.src=path;script.async=true;script.addEventListener('load',finish,{once:true});script.addEventListener('error',finish,{once:true});document.head.appendChild(script);setTimeout(finish,900);
 });
}
async function ensureNavigationCore(){
 if(window.PILOTDESK_NAV_CORE?.sections)return window.PILOTDESK_NAV_CORE;
 if(window.PILOTDESK_NAV?.sections)return {sections:window.PILOTDESK_NAV.sections};
 await loadDataScript('/assets/navigation-core.js',()=>Boolean(window.PILOTDESK_NAV_CORE?.sections));
 return window.PILOTDESK_NAV_CORE||{sections:[]};
}
let searchPromise;
async function ensureSearchData(){
 if(searchable.length&&window.PilotDeskSearch)return searchable;
 if(Array.isArray(window.PILOTDESK_NAV_SEARCH))searchable=window.PILOTDESK_NAV_SEARCH;
 else if(Array.isArray(window.PILOTDESK_NAV?.searchable))searchable=window.PILOTDESK_NAV.searchable;
 searchPromise=searchPromise||Promise.all([
  searchable.length?Promise.resolve(true):loadDataScript('/assets/navigation-search.js',()=>Array.isArray(window.PILOTDESK_NAV_SEARCH)),
  window.PilotDeskSearch?Promise.resolve(true):loadDataScript('/assets/search-intelligence.js',()=>Boolean(window.PilotDeskSearch))
 ]);
 await searchPromise;
 searchable=searchable.length?searchable:(Array.isArray(window.PILOTDESK_NAV_SEARCH)?window.PILOTDESK_NAV_SEARCH:[]);
 return searchable;
}
function ensureStyle(href,key){if([...document.querySelectorAll('link[rel="stylesheet"]')].some(l=>{try{return new URL(l.href,location.href).pathname===href}catch{return false}}))return;const l=document.createElement('link');l.rel='stylesheet';l.href=href;l.dataset[key]='1';document.head.appendChild(l)}
function ensureUnifiedStyle(){const hasSharedStyles=[...document.querySelectorAll('link[rel="stylesheet"]')].some(l=>{try{return new URL(l.href,location.href).pathname==='/assets/styles.css'}catch{return false}});if(!hasSharedStyles)ensureStyle('/assets/experience.css','pdExperience')}
function markStandaloneApp(){const p=location.pathname;const app=APP_PATHS.has(p)||p.startsWith('/calculators/')||p.startsWith('/training/')||p.startsWith('/learn/oral-exam/')||p.startsWith('/guides/')||p==='/guides.html';if(!app)return;document.documentElement.classList.add('pd-streamlined-app');const main=document.querySelector('main.shell,main.pd-account-shell');if(main){main.classList.add('pd-streamlined-shell');const hero=main.querySelector(':scope > .pd-flight-hero,:scope > .wx-hero,:scope > .pd-account-hero,:scope > .pd-page-hero,:scope > .pd-prep-hero');if(hero)hero.classList.add('pd-page-hero')}}
function sectionCurrent(section,path){return section.paths.some(p=>p.endsWith('/')?path.startsWith(p):path===p)}
function iconSearch(){return '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="m16 16 4 4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>'}
function navGlyph(label){const glyphs={
  Tools:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8"/><path d="M12 6v2M12 16v2M6 12h2M16 12h2M8.2 8.2l1.4 1.4M14.4 14.4l1.4 1.4M15.8 8.2l-1.4 1.4M9.6 14.4l-1.4 1.4"/><circle cx="12" cy="12" r="2.5"/></svg>',
  Plan:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8"/><path d="m12 5 2.2 4.8L19 12l-4.8 2.2L12 19l-2.2-4.8L5 12l4.8-2.2Z"/></svg>',
  Weather:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h10M4 12h16M4 17h12"/><path d="m16 5 2 2-2 2M18 15l2 2-2 2"/></svg>',
  Learn:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5.5h6.2A2.8 2.8 0 0 1 14 8.3V19H8a3 3 0 0 0-3 3V5.5Z"/><path d="M19 5.5h-2.2A2.8 2.8 0 0 0 14 8.3V19h2a3 3 0 0 1 3 3V5.5Z"/></svg>'
};return glyphs[label]||''}
function navMarkup(path){return sections.map(s=>`<div class="pd-nav-item" data-pd-nav-item data-section="${s.label}"><button class="pd-nav-button" type="button" aria-expanded="false" ${sectionCurrent(s,path)?'aria-current="page"':''}><span class="pd-nav-glyph">${navGlyph(s.label)}</span><span>${s.label}</span><i class="pd-nav-caret" aria-hidden="true"></i></button><div class="pd-nav-menu">${s.items.map(([href,title,copy])=>`<a href="${href}"><b>${title}</b><span>${copy}</span></a>`).join('')}</div></div>`).join('')}
function searchLengthBucket(q){const n=String(q||'').trim().length;return n<5?'short':n<14?'medium':'long'}
function renderSearchResults(host,q){
 const query=String(q||'').trim();
 if(!query){
  const suggestions=window.PilotDeskSearch?.suggestions||[];
  if(!suggestions.length){host.hidden=true;host.innerHTML='';return}
  host.innerHTML='<div class="pd-search-suggest-label">Try a pilot task</div>'+suggestions.map(x=>`<button type="button" class="pd-search-suggestion" data-pd-search-suggest="${x}">${x}</button>`).join('');
  host.hidden=false;return;
 }
 const hits=window.PilotDeskSearch?.rank(query,searchable,8)||[];
 host.innerHTML=hits.length?hits.map((x,i)=>`<a href="${x.href}" data-pd-search-result="${i}" data-pd-search-type="${x.type||'PilotDesk'}"><span><b>${x.title}</b><small>${x.type||'PilotDesk'}${x.intent?' · best match':''}</small></span><em>${x.reason||''}</em></a>`).join(''):'<span class="pd-search-empty">No strong match. Try a pilot term like crosswind, VMC, CG, or IFR alternate.</span>';
 host.hidden=false;
}
function closeMenus(header){header.querySelectorAll('[data-pd-nav-item].open').forEach(x=>{x.classList.remove('open');x.querySelector('button')?.setAttribute('aria-expanded','false')})}
function setMobileNavOpen(nav,menu,open){nav.classList.toggle('open',open);menu.setAttribute('aria-expanded',String(open));menu.setAttribute('aria-label',open?'Close navigation':'Open navigation')}
function bindHeader(header){
 const astroShell=header.hasAttribute('data-pd-astro-shell');
 const nav=header.querySelector(':scope > nav')||document.createElement('nav');
 nav.className='pd-main-nav';nav.id='pdMainNav';
 nav.innerHTML=navMarkup(location.pathname);nav.setAttribute('aria-label','Main navigation');
 if(!nav.parentNode)header.appendChild(nav);
 let menu=header.querySelector('[data-menu]');
 if(!menu){menu=document.createElement('button');menu.type='button';menu.className='menu-btn';menu.dataset.menu='';menu.textContent='☰';header.insertBefore(menu,nav)}
 menu.setAttribute('aria-controls','pdMainNav');menu.setAttribute('aria-label','Open navigation');menu.setAttribute('aria-expanded','false');
 let actions=header.querySelector('.pd-header-actions');if(!actions){actions=document.createElement('div');actions.className='pd-header-actions';header.appendChild(actions)}
 actions.innerHTML=`<a class="pd-plans-link" href="/pricing.html">Plans</a><button class="pd-search-toggle" type="button" aria-label="Open search" aria-expanded="false">${iconSearch()}</button><div class="pd-search-wrap" id="pdSiteSearch"><label class="pd-site-search">${iconSearch()}<input type="search" autocomplete="off" spellcheck="false" aria-label="Search PilotDesk" placeholder="Crosswind, VMC, IFR alternate…"><kbd class="pd-search-key" aria-hidden="true">/</kbd></label><div class="pd-search-results" aria-label="Search results" hidden></div></div><a class="pd-account-link" href="/account.html" data-pd-account-link><span class="pd-account-avatar" hidden>PD</span><span class="pd-account-text">Sign in</span></a>`;
 const search=actions.querySelector('input'),results=actions.querySelector('.pd-search-results');let active=-1;
 const searchToggle=actions.querySelector('.pd-search-toggle');
 const openSearch=()=>{header.classList.add('pd-search-open');searchToggle.setAttribute('aria-expanded','true');setMobileNavOpen(nav,menu,false);search.focus()};
 const closeSearch=()=>{header.classList.remove('pd-search-open');searchToggle.setAttribute('aria-expanded','false');results.hidden=true};
 searchToggle.setAttribute('aria-controls','pdSiteSearch');searchToggle.addEventListener('click',()=>{if(header.classList.contains('pd-search-open')){closeSearch();searchToggle.focus()}else openSearch()});
 document.addEventListener('pilotdesk:open-search',openSearch);
 const links=()=>[...results.querySelectorAll('a[data-pd-search-result]')];
 const move=dir=>{const items=links();if(!items.length)return;active=(active+dir+items.length)%items.length;items.forEach((a,i)=>a.classList.toggle('active',i===active));items[active].scrollIntoView({block:'nearest'})};
 search.addEventListener('focus',async()=>{await ensureSearchData();renderSearchResults(results,search.value)});
 search.addEventListener('input',async()=>{await ensureSearchData();active=-1;renderSearchResults(results,search.value)});
 search.addEventListener('keydown',e=>{
  if(e.key==='Escape'){search.value='';closeSearch();searchToggle.focus();active=-1}
  else if(e.key==='ArrowDown'){e.preventDefault();move(1)}
  else if(e.key==='ArrowUp'){e.preventDefault();move(-1)}
  else if(e.key==='Enter'){const items=links(),target=active>=0?items[active]:items[0];if(target){e.preventDefault();window.pdTrack?.('Site Search Open',{resultType:target.dataset.pdSearchType||'unknown',queryLength:searchLengthBucket(search.value)});location.assign(target.href)}}
 });
 results.addEventListener('click',e=>{
  const suggest=e.target.closest('[data-pd-search-suggest]');if(suggest){search.value=suggest.dataset.pdSearchSuggest;search.dispatchEvent(new Event('input'));search.focus();return}
  const result=e.target.closest('[data-pd-search-result]');if(result)window.pdTrack?.('Site Search Open',{resultType:result.dataset.pdSearchType||'unknown',queryLength:searchLengthBucket(search.value)});
 });
 document.addEventListener('keydown',e=>{if(e.key==='/'&&!/input|textarea|select/i.test(document.activeElement?.tagName||'')){e.preventDefault();openSearch()}});
 
 nav.querySelectorAll('[data-pd-nav-item]>.pd-nav-button').forEach(btn=>btn.addEventListener('click',e=>{e.stopPropagation();const item=btn.parentElement,open=!item.classList.contains('open');closeMenus(header);if(open){item.classList.add('open');btn.setAttribute('aria-expanded','true')}}));
 menu.addEventListener('click',e=>{e.stopPropagation();closeSearch();setMobileNavOpen(nav,menu,!nav.classList.contains('open'))});
 nav.addEventListener('click',e=>{if(e.target.closest('a')){setMobileNavOpen(nav,menu,false)}});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeMenus(header);setMobileNavOpen(nav,menu,false);closeSearch()}});
 document.addEventListener('click',e=>{if(!header.contains(e.target)){closeMenus(header);setMobileNavOpen(nav,menu,false);closeSearch()}});
}
function initials(user){const name=user?.user_metadata?.full_name||user?.email||'';const parts=String(name).trim().split(/[\s@._-]+/).filter(Boolean);return(parts.slice(0,2).map(x=>x[0]).join('')||'PD').toUpperCase()}
function hydrateHomeAccount(session){const box=document.querySelector('[data-pd-home-account]');if(!box)return;const title=box.querySelector('[data-pd-home-account-title]'),copy=box.querySelector('[data-pd-home-account-copy]'),actions=box.querySelector('[data-pd-home-account-actions]');if(session){if(title)title.textContent='Your PilotDesk account is ready';if(copy)copy.textContent='Pick up your written prep, Daily streak, training goal, or account workspace.';if(actions)actions.innerHTML='<a class="primary" href="/written-prep.html">Continue studying</a><a href="/account.html">Open account</a>'}else{if(title)title.textContent='Sign in to save your progress';if(copy)copy.textContent='Keep written-prep scores, streaks, your training goal, and optional cloud backups tied to your account.';if(actions)actions.innerHTML='<a class="pd-btn secondary" href="/account.html?next=%2F">Sign in / create account</a>'}}
async function hydrateAccount(){const link=document.querySelector('[data-pd-account-link]');if(!link)return;try{const {getPilotDeskClient}=await import('/assets/supabase-client.js');const client=await getPilotDeskClient();const {data:{session}}=await client.auth.getSession();const avatar=link.querySelector('.pd-account-avatar'),text=link.querySelector('.pd-account-text');const render=s=>{hydrateHomeAccount(s);if(s){avatar.hidden=false;avatar.textContent=initials(s.user);text.textContent='Account';link.setAttribute('aria-label','Open PilotDesk account')}else{avatar.hidden=true;text.textContent='Sign in';link.setAttribute('aria-label','Sign in to PilotDesk')}};render(session);client.auth.onAuthStateChange((_event,next)=>render(next))}catch{hydrateHomeAccount(null)}}
function scheduleAccountHydration(){const run=()=>hydrateAccount();if('requestIdleCallback'in window)requestIdleCallback(run,{timeout:2500});else setTimeout(run,800)}
async function apply(){const data=await ensureNavigationCore();sections=Array.isArray(data.sections)?data.sections:[];ensureUnifiedStyle();markStandaloneApp();if(location.pathname==='/'||location.pathname==='/index.html')document.body.classList.add('pd-home-2026');document.querySelectorAll('header.topbar').forEach(bindHeader);scheduleAccountHydration();requestAnimationFrame(()=>document.documentElement.classList.add('pd-ready'))}
ensureUnifiedStyle();markStandaloneApp();if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply,{once:true});else apply();
})();
