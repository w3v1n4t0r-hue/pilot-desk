(()=>{
'use strict';
if(window.__pilotDeskAppBootstrap)return;
window.__pilotDeskAppBootstrap=true;

const path=location.pathname;
const isHome=path==='/'||path==='/index.html';
const isCalculator=path.startsWith('/calculators/')&&!path.includes('weight-balance-builder');
const isMobile=matchMedia('(max-width:760px)').matches;
const isStandalone=matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;

try{
  const saved=localStorage.getItem('pd-theme');
  const valid=new Set(['system','light','dark','night-red']);
  const mode=valid.has(saved)?saved:'dark';
  const resolved=mode==='system'?(matchMedia('(prefers-color-scheme: light)').matches?'light':'dark'):mode;
  document.documentElement.dataset.pdTheme=resolved;
  document.documentElement.style.colorScheme=resolved==='light'?'light':'dark';
}catch{}

window.__pdTrackQueue=Array.isArray(window.__pdTrackQueue)?window.__pdTrackQueue:[];
if(!window.pdTrack)window.pdTrack=(name,data={})=>window.__pdTrackQueue.push([name,data]);

const loadStyle=(href,key)=>{
  if(document.querySelector(`link[data-${key}]`)||[...document.styleSheets].some(s=>{try{return new URL(s.href,location.href).pathname===href}catch{return false}}))return;
  const l=document.createElement('link');l.rel='stylesheet';l.href=href;l.setAttribute(`data-${key}`,'1');document.head.appendChild(l);
};
const load=(src,key)=>{
  if(document.querySelector(`script[data-${key}]`)||[...document.scripts].some(s=>{try{return new URL(s.src,location.href).pathname===src}catch{return false}}))return;
  const s=document.createElement('script');s.src=src;s.async=false;s.setAttribute(`data-${key}`,'1');document.head.appendChild(s);
};
const ready=fn=>document.readyState==='loading'?document.addEventListener('DOMContentLoaded',fn,{once:true}):fn();
const idle=(fn,timeout=1400)=>'requestIdleCallback'in window?requestIdleCallback(fn,{timeout}):setTimeout(fn,Math.min(timeout,700));
const afterPaint=fn=>requestAnimationFrame(()=>requestAnimationFrame(fn));
const deferLoad=(src,key,timeout=1400)=>ready(()=>afterPaint(()=>idle(()=>load(src,key),timeout)));

loadStyle('/assets/professional-polish.css','pd-professional-polish');
loadStyle('/assets/performance.css','pd-performance-css');

load('/assets/global-nav.js','pd-global-nav');
load('/assets/brand.js','pd-brand');
load('/assets/theme.js','pd-theme');
load('/assets/seo.js','pd-seo');
load('/assets/errors.js','pd-errors');
load('/assets/performance.js','pd-performance');
load('/assets/tool-first-layout.js','pd-tool-first');

if(isCalculator){
  load('/assets/features.js','pd-features');
  load('/assets/share-enhance.js','pd-share');
  load('/assets/calculator-ux.js','pd-calc-ux');
}
if(path==='/aircraft.html'){
  load('/assets/aircraft-transfer.js','pd-aircraft-transfer');
  load('/assets/aircraft-training.js','pd-aircraft-training');
}
if(path==='/weather.html')load('/assets/offline-weather.js','pd-weather-offline');
if(path==='/weight-balance.html'||path.includes('weight-balance-builder'))load('/assets/wb-export.js','pd-wb-export');

deferLoad('/assets/analytics.js','pd-analytics',650);
deferLoad('/assets/product-polish.js','pd-polish',900);
deferLoad('/assets/runtime-qol.js','pd-qol',1000);
if(isMobile||isStandalone)ready(()=>afterPaint(()=>load('/assets/sticky-app.js','pd-sticky-app')));
else deferLoad('/assets/sticky-app.js','pd-sticky-app',1800);
deferLoad('/assets/pilotdesk-plus.js','pd-plus',isHome||path==='/history.html'||isCalculator?1100:2600);
deLoadUpdate();
function deLoadUpdate(){deferLoad('/assets/update.js','pd-update',3000)}

const canonicalWeightBalance='/weight-balance.html';
function repairLegacyLinks(root=document){root.querySelectorAll?.('a[href="/calculators/weight-balance-builder/"],a[href="/calculators/weight-balance-builder"]').forEach(a=>a.setAttribute('href',canonicalWeightBalance))}
function addQuickStart(){
  if(!isHome||document.getElementById('pdQuickStart'))return;
  const hero=document.querySelector('.hero');if(!hero)return;
  const section=document.createElement('section');section.id='pdQuickStart';section.className='pd-quick-start';
  section.innerHTML=`<div class="pd-quick-head"><div><span class="eyebrow">QUICK START</span><h2>What are you doing today?</h2></div><span>Jump straight into the flight tool you need.</span></div><div class="pd-quick-grid"><a href="/airport.html" data-pd-launch="airport"><b>Airport search</b><span>Runways, weather and procedures</span></a><a href="/route-planner.html" data-pd-launch="route"><b>Plan a route</b><span>Route, navlog and saved flights</span></a><a href="/flight-planning-workspace.html" data-pd-launch="flight-workspace"><b>Flight math</b><span>Wind, time, fuel and descent in one flow</span></a><a href="/weather.html" data-pd-launch="weather"><b>Live weather</b><span>METAR, TAF and nearby stations</span></a><a href="/weight-balance.html" data-pd-launch="weight-balance"><b>Weight &amp; balance</b><span>Build and save a loading scenario</span></a></div>`;
  hero.insertAdjacentElement('afterend',section)
}
function injectStyle(){
  if(document.getElementById('pdBootstrapCss'))return;
  const s=document.createElement('style');s.id='pdBootstrapCss';
  s.textContent=`.pd-quick-start{margin:16px 0 20px;padding:18px;border:1px solid var(--line);border-radius:12px;background:linear-gradient(180deg,rgba(255,255,255,.025),rgba(255,255,255,.008))}.pd-quick-head{display:flex;justify-content:space-between;gap:18px;align-items:end;margin-bottom:12px}.pd-quick-head h2{margin:4px 0 0;font-size:18px}.pd-quick-head>span{color:var(--muted);font-size:11px}.pd-quick-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(155px,1fr));gap:8px}.pd-quick-grid a{display:flex;min-height:74px;flex-direction:column;justify-content:center;gap:4px;padding:12px;border:1px solid var(--line);border-radius:9px;background:var(--panel);color:var(--text);transition:border-color .15s ease,transform .15s ease}.pd-quick-grid a:hover,.pd-quick-grid a:focus-visible{border-color:var(--silver2);transform:translateY(-1px);outline:none}.pd-quick-grid b{font-size:12px}.pd-quick-grid span{color:var(--muted);font-size:10px;line-height:1.35}@media(max-width:760px){.pd-quick-head{display:block}.pd-quick-head>span{display:block;margin-top:5px}.pd-quick-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.pd-quick-grid a{min-height:68px}}@media(max-width:420px){.pd-quick-grid{grid-template-columns:1fr}}`;
  document.head.appendChild(s)
}
let searchTracked=false;
function analyticsHooks(){
  document.addEventListener('click',e=>{const launch=e.target.closest('[data-pd-launch]');if(launch)window.pdTrack?.('Quick Start',{target:launch.dataset.pdLaunch||'unknown'});const favorite=e.target.closest('.pd-star');if(favorite)window.pdTrack?.('Favorite Toggle',{tool:document.body.dataset.calc||'unknown'});const legacy=e.target.closest('a[href="/calculators/weight-balance-builder/"],a[href="/calculators/weight-balance-builder"]');if(legacy)legacy.setAttribute('href',canonicalWeightBalance)},true);
  const search=document.getElementById('toolSearch');if(search)search.addEventListener('input',()=>{if(searchTracked||search.value.trim().length<2)return;searchTracked=true;window.pdTrack?.('Homepage Search',{page:'home'})},{passive:true})
}
function init(){injectStyle();repairLegacyLinks();addQuickStart();analyticsHooks()}
ready(init);
})();
