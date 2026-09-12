import fs from 'node:fs';

const read=p=>fs.readFileSync(p,'utf8');
const sticky=read('assets/sticky-app.js');
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

check(bootstrap.includes("/assets/sticky-app.js"),'sticky app must load from the ad-independent bootstrap');
for(const needle of ['pd-app-dock','Your workspace','pd-recent-pages','pd-favorites','pd-calculation-history','pd-scenarios:','beforeinstallprompt','display-mode: standalone','Continue where you left off','Cross Tool Handoff'])check(sticky.includes(needle),`sticky app missing ${needle}`);
check(sticky.includes('viewport-fit')===false,'sticky app should not rewrite viewport text at runtime');
check(sticky.includes('min-height:46px'),'mobile dock targets should be touch-friendly');
check(analytics.includes('Tool Opened')&&analytics.includes('Calculation Completed')&&analytics.includes('Save Action')&&analytics.includes('Share Action'),'analytics funnel milestones missing');
check(analytics.includes('__pdTrackQueue'),'deferred analytics must flush buffered early events');
for(const forbidden of ['calculator inputs','tail number','passenger'])check(!analytics.toLowerCase().includes(forbidden),'analytics bundle should not contain sensitive-value collection logic');
check(ads.includes('ensureManualPlaceholders')&&ads.includes("validSlot('top')")&&ads.includes("validSlot('sidebar')"),'manual AdSense placements are not config-ready');
check(weather.includes('tafIssueAge')&&weather.includes('tafExpired')&&weather.includes('Check TAF currency.'),'TAF freshness/validity safeguards missing');
check(weather.includes('pilotdesk:weatherloaded'),'weather analytics should expose only a coarse result event');
check(sw.includes("CACHE='pilotdesk-v25'")&&sw.includes("'/offline.html'")&&sw.includes('Promise.allSettled'),'offline release hardening missing');
check(sw.includes('MAX_RUNTIME_ENTRIES')&&sw.includes('event.preloadResponse'),'PWA cache should stay bounded and use navigation preload');
check(offline.includes('Do not rely on cached operational data')&&offline.includes('Flight Planning Workspace'),'offline page needs safety boundary and useful cached tools');
check(manifest.launch_handler?.client_mode==='navigate-existing','PWA launch handler missing');
check((manifest.shortcuts||[]).some(x=>x.url==='/flight-planning-workspace.html'),'PWA shortcut for flight workspace missing');
check(privacy.includes('recently visited PilotDesk pages')&&privacy.includes('Calculation Completed')===false&&privacy.includes('saved flight-workspace values'),'privacy policy does not document local sticky workspace accurately');
check(privacy.includes('tool being opened')&&privacy.includes('share action'),'privacy policy does not document funnel analytics');
check(feedback.includes('Security or privacy issue')&&feedback.includes('Report a vulnerability'),'security feedback guidance missing');
check(security.includes('Do **not** post')&&security.includes('Report a vulnerability'),'repository security policy missing safe private-report guidance');

if(failures.length){console.error(`Sticky app release checks failed with ${failures.length} issue(s):`);failures.forEach(x=>console.error(' - '+x));process.exit(1)}
console.log('Sticky app release checks passed: retention shell, bounded PWA/offline cache, privacy-safe funnel analytics, weather freshness, monetization readiness, and security guidance verified.');
