import fs from 'node:fs';

const read=p=>fs.readFileSync(p,'utf8');
const failures=[];
const check=(ok,msg)=>{if(!ok)failures.push(msg)};

const bootstrap=read('assets/app-bootstrap.js');
const clarity=read('assets/product-clarity.js');
const clarityCss=read('assets/product-clarity.css');
const architecture=read('assets/pilotdesk-architecture-2026.css');
const navCss=read('assets/pilotdesk-navigation-2026.css');
const home=read('assets/home-architecture-2026.js');
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
for(const asset of ['analytics.js','errors.js','seo.js','product-polish.js','runtime-qol.js','pilotdesk-plus.js','sticky-app.js','update.js','performance.js','tool-first-layout.js']){
  check(bootstrap.includes(`/assets/${asset}`),`app bootstrap is missing ${asset}`);
  check(!ads.includes(`/assets/${asset}`),`ads.js still owns non-ad module ${asset}`);
}
for(const asset of ['planner-pro.js','flight-library.js','procedure-pro.js','trainer-pro.js','preview-harvest.js'])check(bootstrap.includes(`/assets/${asset}`),`consolidated bootstrap is missing ${asset}`);
for(const asset of ['professional-polish.css','performance.css','avionics-ui.css','avionics-architecture.css','avionics-ops.css','product-clarity.css','pilotdesk-architecture-2026.css'])check(bootstrap.includes(`/assets/${asset}`),`single-state boot is missing ${asset}`);
for(const asset of ['avionics-architecture.js','avionics-command.js','flight-strip-export.js','crosswind-mfd.js','context-widget.js','product-clarity.js'])check(bootstrap.includes(`/assets/${asset}`),`critical avionics/product boot is missing ${asset}`);
check(bootstrap.includes('pd-ui-booting')&&bootstrap.includes('pd-ui-ready'),'boot gate must hide intermediate visual states');
check(bootstrap.includes('Promise.allSettled(jobs)'),'boot gate must wait for critical visual assets');
check(bootstrap.includes("root.classList.add('pd-home-2026')"),'new homepage architecture class must exist before reveal');
check(bootstrap.includes('/assets/home-architecture-2026.js')&&bootstrap.includes('!isAstroNative'),'legacy homepage renderer must remain available without replacing native Astro pages');
check(bootstrap.includes('/assets/navigation-data.js'),'bootstrap must load the shared navigation payload');
check(!bootstrap.includes('/assets/home-command-center.js'),'retired homepage command-center JS must not compete with the new homepage');
check(!bootstrap.includes('/assets/home-daily.js'),'retired homepage Daily injection must not compete with the new homepage');
check(bootstrap.includes('__pdTrackQueue'),'deferred analytics must preserve early product events');
check(!ads.includes('professional-polish.css')&&!ads.includes('performance.css'),'visual/performance layers must not depend on ads.js');
check(safety.includes('/assets/app-bootstrap.js'),'calculator/home path must load app bootstrap without ads.js');
check(productNav.includes('/assets/app-bootstrap.js'),'workspace path must load app bootstrap without ads.js');
check(!bootstrap.includes('What are you doing today?'),'retired generic homepage copy must not return');
check(!bootstrap.includes('query:search.value'),'homepage analytics must not send search text');

for(const needle of ['CONNECTED WORKFLOW','Plan a flight in one flow','pdCalculatorLibrary','Core calculations','Formula + assumptions','pd-verification-strip','pdWorkspaceContext','Load aircraft defaults'])check(clarity.includes(needle),`product clarity layer missing ${needle}`);
check(clarity.includes("localStorage.getItem('pd-aircraft-active')")&&clarity.includes("localStorage.getItem('pd-last-airport')"),'connected workspace must reuse saved aircraft/weather context');
check(clarityCss.includes('.pd-library-drawer')&&clarityCss.includes('.pd-planning-flow'),'connected workflow styles missing');

for(const needle of ['--pd-shell:1360px','.pd-main-nav','.pd-site-search','.pd-home-actions','.pd-home-account-strip','.pd-popular-grid','.pd-feature-grid','.pd-category-grid'])check(architecture.includes(needle),`2026 architecture CSS missing ${needle}`);
check(navCss.includes('.pd-search-results'),'new global search results need a stable shell');
for(const needle of ['Plan a Flight','Use a Calculator','Study for a Written','Play Daily'])check(siteData.includes(needle),`shared homepage data is missing ${needle}`);
for(const needle of ['Popular tools','WRITTEN PREP','PILOTDESK DAILY','Explore PilotDesk'])check(astroHome.includes(needle)||home.includes(needle),`homepage is missing ${needle}`);
for(const needle of ["label: 'Tools'","label: 'Plan'","label: 'Weather'","label: 'Learn'"])check(siteData.includes(needle),`shared global navigation is missing ${needle}`);
check(siteData.includes("['/tools.html', 'All calculators'"),'Tools navigation must expose the calculator directory');
check(astroHeader.includes('navSections')&&astroHeader.includes('href="/daily/"'),'Astro header must render shared navigation and Daily');
for(const needle of ['window.PILOTDESK_NAV','data-pd-account-link','Sign in'])check(nav.includes(needle),`global navigation runtime is missing ${needle}`);

const wb=(manifest.shortcuts||[]).find(x=>x.short_name==='W&B'||x.name==='Weight & Balance');
const flightMath=(manifest.shortcuts||[]).find(x=>x.short_name==='Flight Math');
check(wb?.url==='/weight-balance.html','installed-app Weight & Balance shortcut must use the canonical tool URL');
check(flightMath?.url==='/flight-planning-workspace.html','installed app must expose the connected flight-planning workspace');
check(manifest.launch_handler?.client_mode==='navigate-existing','installed app should reuse an existing app window where supported');
for(const asset of ['/assets/app-bootstrap.js','/assets/navigation-data.js','/assets/sticky-app.js','/assets/professional-polish.css','/assets/avionics-ui.css','/assets/avionics-architecture.css','/assets/avionics-ops.css','/assets/product-clarity.css','/assets/pilotdesk-architecture-2026.css','/assets/pilotdesk-navigation-2026.css','/assets/home-architecture-2026.js','/assets/hero-flightline.svg','/assets/performance.css','/assets/performance.js','/assets/tool-first-layout.js','/assets/planner-pro.js','/assets/flight-library.js','/assets/procedure-pro.js','/assets/trainer-pro.js','/assets/preview-harvest.js'])check(sw.includes(`'${asset}'`),`service worker must cache ${asset}`);
check(sw.includes("CACHE='pilotdesk-v36'"),'service worker cache version should match the Astro architecture release');
check(sw.includes("if(e.data?.type==='SKIP_WAITING')"),'service worker must still support explicit user-approved updates');
check(!sw.includes('await self.skipWaiting()'),'service worker install must not force a mid-session version switch');
check(update.includes('userRequestedRefresh')&&update.includes("if(!userRequestedRefresh)return"),'controller changes must not force an unsolicited reload');
check(sw.includes("'/offline.html'"),'service worker must cache a dedicated offline fallback');
check(sw.includes('Promise.allSettled'),'precache should tolerate a single optional asset failure');
check(sw.includes('event.preloadResponse'),'navigation preload should be consumed instead of duplicating a navigation request');
check(sw.includes('MAX_RUNTIME_ENTRIES'),'runtime cache should be bounded');
check(sw.includes("if(req.mode==='navigate'){u.search='';"),'navigation cache keys should ignore query-string variants');
check(sw.includes("'/assets/pilotdesk-architecture-2026.css'"),'new architecture CSS should be network-first');
check(!sw.includes("fetch('/sitemap.xml'"),'service-worker install should not crawl the whole sitemap');

if(failures.length){console.error(`App bootstrap checks failed with ${failures.length} issue(s):`);failures.forEach(x=>console.error(' - '+x));process.exit(1)}
console.log('App bootstrap checks passed: PilotDesk uses one stable navigation shell, one organized homepage, and the new architecture is cached safely.');
