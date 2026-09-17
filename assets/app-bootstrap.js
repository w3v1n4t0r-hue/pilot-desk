(()=>{
'use strict';
if(window.__pilotDeskAppBootstrap)return;window.__pilotDeskAppBootstrap=true;
const path=location.pathname,calc=path.startsWith('/calculators/')&&!path.includes('weight-balance-builder');
const isAstroNative=document.documentElement.dataset.pdAstroNative==='1';
// Static content stays visible even when optional enhancements fail.
window.__pdTrackQueue=window.__pdTrackQueue||[];window.pdTrack=window.pdTrack||((name,data={})=>window.__pdTrackQueue.push([name,data]));
function load(src){if([...document.scripts].some(s=>new URL(s.src||location.href).pathname===src))return;const s=document.createElement('script');s.src=src;s.async=false;document.head.append(s)}
function registerServiceWorkerEarly(){
 const localSecure=['localhost','127.0.0.1','::1'].includes(location.hostname);
 if(!('serviceWorker'in navigator)||(location.protocol!=='https:'&&!localSecure))return;
 const start=()=>navigator.serviceWorker.register('/sw.js').catch(()=>{});
 const schedule=()=>{'requestIdleCallback'in window?requestIdleCallback(start,{timeout:1500}):setTimeout(start,500)};
 if(document.readyState==='complete')schedule();else addEventListener('load',schedule,{once:true});
}
registerServiceWorkerEarly();
load('/assets/navigation-data.js');load('/assets/flight-store.js');load('/assets/global-nav.js');load('/assets/theme.js');
if(calc){load('/assets/features.js');load('/assets/calculator-ux.js');load('/assets/crosswind-mfd.js');load('/assets/pilotdesk-plus.js')}
if(/^\/calculators\/(crosswind|wind-triangle|density-altitude)\/$/.test(path)){
 const style=document.createElement('link');style.rel='stylesheet';style.href='/assets/flight-lab.css';document.head.append(style);
 load('/assets/flight-lab.js');
}
if(path==='/history.html')load('/assets/pilotdesk-plus.js');
if(path==='/weather.html')load('/assets/offline-weather.js');
if(path==='/weight-balance.html'||path.includes('weight-balance-builder'))load('/assets/wb-export.js');
if(path==='/aircraft.html'){load('/assets/aircraft-transfer.js');load('/assets/aircraft-training.js')}
if(path==='/route-planner.html')load('/assets/planner-pro.js');
if(path==='/procedures.html')load('/assets/procedure-pro.js');
if(path==='/checklist-trainer.html')load('/assets/trainer-pro.js');
if(!isAstroNative)load('/assets/experience.js');
load('/assets/errors.js');load('/assets/analytics.js');load('/assets/update.js');
})();
