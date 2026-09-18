(()=>{
'use strict';
const SUPABASE_URL='https://hqqgcfiaxcrzyuhtkzqg.supabase.co';
const SUPABASE_PUBLISHABLE_KEY='sb_publishable_Mj4GgPXqlild6Z_4k47Ypg_TeUvlyfQ';
const APP_PATHS=new Set(['/tools.html','/daily/','/daily/index.html','/written-prep.html','/skill-gap.html','/planner.html','/airport.html','/route-planner.html','/flights.html','/flight-brief.html','/aircraft.html','/weather.html','/procedures.html','/poh-chart-studio.html','/checklist-trainer.html','/flight-planning-workspace.html','/weight-balance.html','/e6b-flight-computer.html','/metar-decoder.html','/flight-training.html','/history.html','/account.html']);
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
 if(searchable.length)return searchable;
 if(Array.isArray(window.PILOTDESK_NAV_SEARCH)){searchable=window.PILOTDESK_NAV_SEARCH;return searchable}
 if(Array.isArray(window.PILOTDESK_NAV?.searchable)){searchable=window.PILOTDESK_NAV.searchable;return searchable}
 searchPromise=searchPromise||loadDataScript('/assets/navigation-search.js',()=>Array.isArray(window.PILOTDESK_NAV_SEARCH));
 await searchPromise;searchable=Array.isArray(window.PILOTDESK_NAV_SEARCH)?window.PILOTDESK_NAV_SEARCH:[];return searchable;
}
function ensureStyle(href,key){if([...document.querySelectorAll('link[rel="stylesheet"]')].some(l=>{try{return new URL(l.href,location.href).pathname===href}catch{return false}}))return;const l=document.createElement('link');l.rel='stylesheet';l.href=href;l.dataset[key]='1';document.head.appendChild(l)}
function ensureUnifiedStyle(){ensureStyle('/assets/experience.css','pdExperience')}
function markStandaloneApp(){if(!APP_PATHS.has(location.pathname))return;document.documentElement.classList.add('pd-streamlined-app');const main=document.querySelector('main.shell,main.pd-account-shell');if(main){main.classList.add('pd-streamlined-shell');const hero=main.querySelector(':scope > .pd-flight-hero,:scope > .wx-hero,:scope > .pd-account-hero,:scope > .pd-page-hero,:scope > .pd-prep-hero');if(hero)hero.classList.add('pd-page-hero')}}
function sectionCurrent(section,path){return section.paths.some(p=>p.endsWith('/')?path.startsWith(p):path===p)}
function iconSearch(){return '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="m16 16 4 4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>'}
function navMarkup(path){return sections.map(s=>`<div class="pd-nav-item" data-pd-nav-item><button class="pd-nav-button" type="button" aria-expanded="false" ${sectionCurrent(s,path)?'aria-current="page"':''}>${s.label}<i class="pd-nav-caret"></i></button><div class="pd-nav-menu">${s.items.map(([href,title,copy])=>`<a href="${href}"><b>${title}</b><span>${copy}</span></a>`).join('')}</div></div>`).join('')}
function renderSearchResults(host,q){const query=String(q||'').trim().toLowerCase();if(!query){host.hidden=true;host.innerHTML='';return}const words=query.split(/\s+/).filter(Boolean);const hits=searchable.map(([title,href,keywords])=>({title,href,score:words.reduce((n,w)=>n+(title.toLowerCase().includes(w)?3:0)+(keywords.includes(w)?1:0),0)})).filter(x=>x.score>0).sort((a,b)=>b.score-a.score).slice(0,7);host.innerHTML=hits.length?hits.map(x=>`<a href="${x.href}">${x.title}</a>`).join(''):'<span>No PilotDesk page matched that search.</span>';host.hidden=false}
function closeMenus(header){header.querySelectorAll('[data-pd-nav-item].open').forEach(x=>{x.classList.remove('open');x.querySelector('button')?.setAttribute('aria-expanded','false')})}
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
 actions.innerHTML=`<div class="pd-search-wrap"><label class="pd-site-search">${iconSearch()}<input type="search" autocomplete="off" spellcheck="false" aria-label="Search PilotDesk" placeholder="Search PilotDesk"></label><div class="pd-search-results" hidden></div></div><a class="pd-account-link" href="/account.html" data-pd-account-link><span class="pd-account-avatar" hidden>PD</span><span class="pd-account-text">Sign in</span></a>`;
 const search=actions.querySelector('input'),results=actions.querySelector('.pd-search-results');
 search.addEventListener('input',async()=>{if(search.value.trim())await ensureSearchData();renderSearchResults(results,search.value)});
 search.addEventListener('keydown',e=>{if(e.key==='Escape'){search.value='';renderSearchResults(results,'');search.blur()}if(e.key==='Enter'){const first=results.querySelector('a');if(first){e.preventDefault();location.assign(first.href)}}});
 nav.querySelectorAll('[data-pd-nav-item]>.pd-nav-button').forEach(btn=>btn.addEventListener('click',e=>{e.stopPropagation();const item=btn.parentElement,open=!item.classList.contains('open');closeMenus(header);if(open){item.classList.add('open');btn.setAttribute('aria-expanded','true')}}));
 menu.addEventListener('click',e=>{e.stopPropagation();const open=nav.classList.toggle('open');menu.setAttribute('aria-expanded',String(open));menu.setAttribute('aria-label',open?'Close navigation':'Open navigation')});
 nav.addEventListener('click',e=>{if(e.target.closest('a')){nav.classList.remove('open');menu.setAttribute('aria-expanded','false')}});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeMenus(header);nav.classList.remove('open');menu.setAttribute('aria-expanded','false');results.hidden=true}});
 document.addEventListener('click',e=>{if(!header.contains(e.target)){closeMenus(header);nav.classList.remove('open');menu.setAttribute('aria-expanded','false');results.hidden=true}});
}
function initials(user){const name=user?.user_metadata?.full_name||user?.email||'';const parts=String(name).trim().split(/[\s@._-]+/).filter(Boolean);return(parts.slice(0,2).map(x=>x[0]).join('')||'PD').toUpperCase()}
function hydrateHomeAccount(session){const box=document.querySelector('[data-pd-home-account]');if(!box)return;const title=box.querySelector('[data-pd-home-account-title]'),copy=box.querySelector('[data-pd-home-account-copy]'),actions=box.querySelector('[data-pd-home-account-actions]');if(session){if(title)title.textContent='Your PilotDesk account is ready';if(copy)copy.textContent='Pick up your written prep, Daily streak, saved aircraft, or profile.';if(actions)actions.innerHTML='<a class="primary" href="/written-prep.html">Continue studying</a><a href="/account.html">Open account</a>'}else{if(title)title.textContent='Sign in to save your progress';if(copy)copy.textContent='Keep written-prep scores, streaks, aircraft, and other PilotDesk progress tied to your account.';if(actions)actions.innerHTML='<a class="primary" href="/account.html?next=%2F">Sign in</a><a href="/account.html?next=%2F">Create a free account</a>'}}
async function hydrateAccount(){const link=document.querySelector('[data-pd-account-link]');if(!link)return;try{const mod=await import('https://esm.sh/@supabase/supabase-js@2.57.4');const client=mod.createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});const {data:{session}}=await client.auth.getSession();const avatar=link.querySelector('.pd-account-avatar'),text=link.querySelector('.pd-account-text');const render=s=>{hydrateHomeAccount(s);if(s){avatar.hidden=false;avatar.textContent=initials(s.user);text.textContent='Account';link.setAttribute('aria-label','Open PilotDesk account')}else{avatar.hidden=true;text.textContent='Sign in';link.setAttribute('aria-label','Sign in to PilotDesk')}};render(session);client.auth.onAuthStateChange((_event,next)=>render(next))}catch{hydrateHomeAccount(null)}}
function scheduleAccountHydration(){const run=()=>hydrateAccount();if('requestIdleCallback'in window)requestIdleCallback(run,{timeout:2500});else setTimeout(run,800)}
async function apply(){const data=await ensureNavigationCore();sections=Array.isArray(data.sections)?data.sections:[];ensureUnifiedStyle();markStandaloneApp();if(location.pathname==='/'||location.pathname==='/index.html')document.body.classList.add('pd-home-2026');document.querySelectorAll('header.topbar').forEach(bindHeader);scheduleAccountHydration()}
ensureUnifiedStyle();markStandaloneApp();if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply,{once:true});else apply();
})();
