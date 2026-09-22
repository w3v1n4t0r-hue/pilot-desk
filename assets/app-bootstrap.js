(()=>{if(document.querySelector('script[src*="/assets/system-states.js"]'))return;const s=document.createElement('script');s.src='/assets/system-states.js';s.defer=true;document.head.appendChild(s)})();
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
load('/assets/navigation-core.js');load('/assets/global-nav.js');load('/assets/theme.js');load('/assets/billing.js');
if(calc||path==='/weight-balance.html'||path.includes('weight-balance-builder'))load('/assets/calculation-account.js');
if(calc){load('/assets/features.js');load('/assets/calculator-ux.js');load('/assets/crosswind-mfd.js');load('/assets/pilotdesk-plus.js')}
if(calc)load('/assets/share-enhance.js');
if(/^\/(guides\/|training\/|learn\/oral-exam\/|for-cfis\.html$|flight-training\.html$|e6b-flight-computer\.html$|weather\.html$|metar-decoder\.html$)/.test(path))load('/assets/page-share.js');
if(['/written-prep.html','/skill-gap.html','/flight-training.html','/checklist-trainer.html','/training/acs-far-reference.html'].includes(path)||path.startsWith('/learn/oral-exam/'))load('/assets/learn-shell.js');
if(path==='/history.html')load('/assets/pilotdesk-plus.js');
if(path==='/weather.html')load('/assets/offline-weather.js');
if(path==='/weight-balance.html'||path.includes('weight-balance-builder'))load('/assets/wb-export.js');
if(path==='/aircraft.html'){load('/assets/aircraft-transfer.js');load('/assets/aircraft-training.js');load('/assets/aircraft-profile-hub.js')}
if(path==='/route-planner.html')load('/assets/planner-pro.js');
if(path==='/procedures.html')load('/assets/procedure-pro.js');
if(path==='/checklist-trainer.html')load('/assets/trainer-pro.js');
if(!isAstroNative)load('/assets/experience.js');
if(['/planner.html','/airport.html','/aircraft.html','/route-planner.html','/flights.html','/weather.html','/weight-balance.html','/flight-planning-workspace.html','/procedures.html','/flight-brief.html'].includes(path))load('/assets/flight-journey.js');
load('/assets/errors.js');load('/assets/analytics.js');load('/assets/update.js');
})();
