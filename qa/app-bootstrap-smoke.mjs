import fs from 'node:fs';

const read=p=>fs.readFileSync(p,'utf8');
const failures=[];
const check=(ok,msg)=>{if(!ok)failures.push(msg)};

const bootstrap=read('assets/app-bootstrap.js');
const styles=read('assets/styles.css');
const astroHome=read('src/pages/index.astro');
const siteData=read('src/data/site.mjs');
const astroHeader=read('src/components/Header.astro');
const nav=read('assets/global-nav.js');
const ads=read('assets/ads.js');
const safety=read('assets/safety.js');
const productNav=read('assets/product-nav.js');
const update=read('assets/update.js');
const manifest=JSON.parse(read('site.webmanifest'));
const sw=read('sw.js');

check(bootstrap.includes('window.__pilotDeskAppBootstrap'),'app bootstrap needs an idempotency guard');
check(bootstrap.includes('__pdTrackQueue'),'deferred analytics must preserve early product events');
check(bootstrap.includes('isAstroNative')&&bootstrap.includes("if(!isAstroNative)load('/assets/experience.js')"),'legacy enhancement layer must not replace native Astro pages');
check(!bootstrap.includes('visibility:hidden'),'static content must remain visible if optional enhancements fail');
check(bootstrap.includes("serviceWorker.register('/sw.js')")&&bootstrap.includes('requestIdleCallback')&&bootstrap.includes('timeout:1500'),'service worker must register shortly after load/idle');

for(const asset of ['navigation-data.js','flight-store.js','global-nav.js','theme.js','errors.js','analytics.js','update.js'])check(bootstrap.includes(`/assets/${asset}`),`bootstrap is missing always-on module ${asset}`);
for(const asset of ['features.js','calculator-ux.js','crosswind-mfd.js','pilotdesk-plus.js'])check(bootstrap.includes(`/assets/${asset}`),`calculator bootstrap is missing ${asset}`);
for(const asset of ['offline-weather.js','wb-export.js','aircraft-transfer.js','aircraft-training.js','planner-pro.js','procedure-pro.js','trainer-pro.js','experience.js'])check(bootstrap.includes(`/assets/${asset}`),`route-specific bootstrap is missing ${asset}`);
for(const retired of ['product-polish.js','context-widget.js','avionics-command.js','sticky-app.js','home-command-center.js','home-daily.js'])check(!bootstrap.includes(`/assets/${retired}`),`retired competing shell layer returned: ${retired}`);
for(const retired of ['product-polish.js','context-widget.js','avionics-command.js','sticky-app.js'])check(!ads.includes(`/assets/${retired}`),`ads.js must not own retired product layer ${retired}`);

for(const layer of ['styles-legacy.css','hub.css','experience.css','design-tokens.css'])check(styles.includes(`/assets/${layer}`),`shared styles entrypoint is missing ${layer}`);
check(!styles.includes('professional-polish.css')&&!styles.includes('avionics-ui.css'),'shared styles entrypoint must not restore retired visual stacks');

for(const needle of ['Plan a Flight','Use a Calculator','Study for a Written','Play Daily'])check(siteData.includes(needle),`shared homepage data is missing ${needle}`);
for(const needle of ["label: 'Tools'","label: 'Plan'","label: 'Weather'","label: 'Learn'"])check(siteData.includes(needle),`shared global navigation is missing ${needle}`);
check(siteData.includes("['/tools.html', 'All calculators'"),'Tools navigation must expose the calculator directory');
check(siteData.includes("['/daily/', 'Daily challenge'"),'Learn navigation must expose PilotDesk Daily');
check(astroHome.includes('data-pd-home-account'),'homepage must preserve account discovery markup');
check(astroHeader.includes('navSections')&&astroHeader.includes('section.items.map'),'Astro header must render the shared navigation model');
for(const needle of ['window.PILOTDESK_NAV','data-pd-account-link','Sign in'])check(nav.includes(needle),`global navigation runtime is missing ${needle}`);

check(safety.includes('/assets/app-bootstrap.js'),'calculator/home path must load app bootstrap without ads.js');
check(productNav.includes('/assets/app-bootstrap.js'),'workspace path must load app bootstrap without ads.js');

const wb=(manifest.shortcuts||[]).find(x=>x.short_name==='W&B'||x.name==='Weight & Balance');
const flightMath=(manifest.shortcuts||[]).find(x=>x.short_name==='Flight Math');
check(wb?.url==='/weight-balance.html','installed-app Weight & Balance shortcut must use the canonical tool URL');
check(flightMath?.url==='/flight-planning-workspace.html','installed app must expose the connected flight-planning workspace');
check(manifest.launch_handler?.client_mode==='navigate-existing','installed app should reuse an existing app window where supported');

check(/const CACHE='pilotdesk-v\d+'/.test(sw),'service worker cache must use a versioned PilotDesk cache');
check(sw.includes("importScripts('/assets/offline-precache.js')")&&sw.includes('...GENERATED_CALCULATORS'),'service worker must consume generated calculator precache routes');
check(sw.includes('migrateCalculatorEntries'),'service worker must preserve calculator pages across cache-version upgrades');
check(sw.includes("if(event.data?.type==='SKIP_WAITING')"),'service worker must still support explicit user-approved updates');
check(!sw.includes('await self.skipWaiting()'),'service worker install must not force a mid-session version switch');
check(update.includes('userRequestedRefresh')&&update.includes("if(!userRequestedRefresh)return"),'controller changes must not force an unsolicited reload');
check(sw.includes("'/offline.html'"),'service worker must cache a dedicated offline fallback');
check(sw.includes('Promise.allSettled'),'precache should tolerate a single optional asset failure');
check(sw.includes('event.preloadResponse'),'navigation preload should be consumed instead of duplicating a navigation request');
check(sw.includes('MAX_RUNTIME_ENTRIES'),'runtime cache should be bounded');
check(sw.includes("if(req.mode==='navigate'){u.search='';"),'navigation cache keys should ignore query-string variants');
check(sw.includes("pathname.startsWith('/api/')")&&sw.includes("pathname.startsWith('/_vercel/')"),'live same-origin API traffic must bypass the offline cache');
check(!sw.includes("fetch('/sitemap.xml'"),'service-worker install should not crawl the whole sitemap');

if(failures.length){console.error(`App bootstrap checks failed with ${failures.length} issue(s):`);failures.forEach(x=>console.error(' - '+x));process.exit(1)}
console.log('App bootstrap checks passed: streamlined enhancement loading, shared Astro navigation, and deterministic offline update behavior verified.');
