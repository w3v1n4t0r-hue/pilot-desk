import fs from 'node:fs';

const read=p=>fs.readFileSync(p,'utf8');
const bootstrap=read('assets/app-bootstrap.js');
const analytics=read('assets/analytics.js');
const ads=read('assets/ads.js');
const weather=read('assets/weather-fixed.js');
const sw=read('sw.js');
const privacy=read('legal/privacy.html');
const feedback=read('feedback.html');
const offline=read('offline.html');
const security=read('SECURITY.md');
const manifest=JSON.parse(read('site.webmanifest'));
const failures=[];
const check=(ok,msg)=>{if(!ok)failures.push(msg)};

check(!bootstrap.includes('/assets/sticky-app.js'),'retired sticky app shell must not be reintroduced into the streamlined bootstrap');
check(bootstrap.includes('/assets/flight-store.js')&&bootstrap.includes('/assets/global-nav.js'),'streamlined app shell must retain shared flight storage and navigation');
check(analytics.includes('Tool Opened')&&analytics.includes('Calculation Completed')&&analytics.includes('Save Action')&&analytics.includes('Share Action'),'analytics funnel milestones missing');
check(analytics.includes('__pdTrackQueue'),'deferred analytics must flush buffered early events');
check(analytics.includes('blockedKey')&&analytics.includes('query|search|term|text')&&analytics.includes('tailnumber')&&analytics.includes('passenger'),'analytics must discard free-text and personal-value fields before sending events');
check(ads.includes('ensureManualPlaceholders')&&ads.includes("validSlot('top')")&&ads.includes("validSlot('sidebar')"),'manual AdSense placements are not config-ready');
check(weather.includes('tafIssueAge')&&weather.includes('tafExpired')&&weather.includes('Check TAF currency.'),'TAF freshness/validity safeguards missing');
check(weather.includes('pilotdesk:weatherloaded'),'weather analytics should expose only a coarse result event');
check(/const CACHE='pilotdesk-v\d+'/.test(sw)&&sw.includes("'/offline.html'")&&sw.includes('Promise.allSettled'),'offline release hardening missing');
check(sw.includes("importScripts('/assets/offline-precache.js')")&&sw.includes('GENERATED_CALCULATORS')&&sw.includes('migrateCalculatorEntries'),'calculator offline precache or cache migration missing');
check(sw.includes("'/assets/navigation-data.js'")&&sw.includes('MAX_RUNTIME_ENTRIES')&&sw.includes('event.preloadResponse'),'PWA cache should include shared navigation data, stay bounded and use navigation preload');
check(sw.includes('networkOnlyPath')&&sw.includes("url.origin!==self.location.origin"),'service worker must keep live API and cross-origin requests out of static caches');
check(bootstrap.includes("serviceWorker.register('/sw.js')")&&bootstrap.includes('requestIdleCallback')&&bootstrap.includes('timeout:1500'),'service worker should register shortly after load/idle');
check(offline.includes('Do not rely on cached operational data')&&offline.includes('Calculator tools available offline'),'offline page needs a safety boundary and deterministic calculator guidance');
check(manifest.launch_handler?.client_mode==='navigate-existing','PWA launch handler missing');
check((manifest.shortcuts||[]).some(x=>x.url==='/flight-planning-workspace.html'),'PWA shortcut for flight workspace missing');
check(privacy.includes('recently visited PilotDesk pages')&&privacy.includes('Calculation Completed')===false&&privacy.includes('saved flight-workspace values'),'privacy policy does not document local workspace data accurately');
check(privacy.includes('tool being opened')&&privacy.includes('share action'),'privacy policy does not document funnel analytics');
check(feedback.includes('Security or privacy issue')&&feedback.includes('Report a vulnerability'),'security feedback guidance missing');
check(security.includes('Do **not** post')&&security.includes('Report a vulnerability'),'repository security policy missing safe private-report guidance');

if(failures.length){console.error(`PWA release checks failed with ${failures.length} issue(s):`);failures.forEach(x=>console.error(' - '+x));process.exit(1)}
console.log('PWA release checks passed: streamlined shell, bounded deterministic offline cache, privacy-safe analytics, weather freshness, monetization readiness, and security guidance verified.');
