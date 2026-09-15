import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8');
const failures=[];const ok=(c,m)=>{if(!c)failures.push(m)};
const must=[
'assets/growth-suite.js','assets/share-enhance.js','assets/avionics-ui.css','assets/context-widget.js','assets/pilotdesk-architecture-2026.css','assets/pilotdesk-navigation-2026.css','assets/pilotdesk-workspaces-2026.css','src/pages/index.astro','src/data/site.mjs','src/components/Header.astro','training/private-pilot.html','training/instrument-rating.html','training/commercial-pilot.html','training/multiengine.html','training/cfi.html','guides/crosswind-component-chart.html','guides/avgas-weight-per-gallon.html','guides/three-degree-descent-rate-chart.html','guides/cessna-172-glide-distance.html','guides/seminole-vmc-study.html','sitemap-retention.xml'
];
for(const p of must)ok(fs.existsSync(p),`Missing ${p}`);
const growth=read('assets/growth-suite.js');
for(const needle of ['What are you trying to calculate or study?','Search No Results','pd-recent-weather','pd-saved-flights','Pinned tools','Workspace Open','/training/private-pilot.html','/training/instrument-rating.html','/training/commercial-pilot.html','/training/multiengine.html','/training/cfi.html'])ok(growth.includes(needle),`growth-suite missing ${needle}`);
const share=read('assets/share-enhance.js');ok(share.includes('data-pd-share-card')||share.includes('pdShareCard'),'Share card missing');ok(!share.includes('applyParams()'),'share-enhance must not duplicate calculator URL hydration');ok(!share.includes("dataset.copyLink='1'"),'share-enhance must not add a second copy-link control');
const analytics=read('assets/analytics.js');for(const n of ['Calculator Abandoned','Returning Visitor','External Visit'])ok(analytics.includes(n),`analytics missing ${n}`);ok(analytics.includes('now-last<700'),'analytics event de-duplication missing');
const features=read('assets/features.js');ok(features.includes('Pin to dashboard')&&features.includes('★ Pinned'),'calculator pinning copy missing');
const ads=read('assets/ads.js');ok(ads.includes("!isCalc")&&ads.includes("pilotdesk:calculated"),'ad loading does not protect calculator-first UX');
const adcfg=read('assets/ad-config.js');ok(adcfg.includes("pathname==='/assets/brand.js'"),'brand loader duplicate-request guard missing');
const brand=read('assets/brand.js');ok(!brand.includes('/assets/growth-suite.js'),'brand.js must not launch a delayed second UI phase');ok(!brand.includes('addStyle('),'brand.js must not reintroduce late visual stylesheet loading');
const bootstrap=read('assets/app-bootstrap.js');
for(const s of ['/assets/avionics-ui.css','/assets/pilotdesk-architecture-2026.css','/assets/context-widget.js','/assets/growth-suite.js','/assets/sticky-app.js','/assets/pilotdesk-plus.js'])ok(bootstrap.includes(s),`app bootstrap missing visual ownership for ${s}`);
ok(!bootstrap.includes('/assets/home-command-center.js')&&!bootstrap.includes('/assets/home-task-polish.css')&&!bootstrap.includes('/assets/home-command-center.css')&&!bootstrap.includes('/assets/home-avionics-final.css'),'retired homepage layers must not compete with native Astro homepage');
ok(!bootstrap.includes("deferLoad('/assets/growth-suite.js'")&&!bootstrap.includes("deferLoad('/assets/sticky-app.js'")&&!bootstrap.includes("deferLoad('/assets/pilotdesk-plus.js'"),'visible retention UI must not appear after first reveal');
ok(bootstrap.includes('pd-ui-booting')&&bootstrap.includes('Promise.allSettled(jobs)')&&bootstrap.includes('setTimeout(()=>{clearTimeout(failOpen);openGate()},120)'),'growth visual stack must settle behind the first-paint gate');
const home=read('src/pages/index.astro');
const siteData=read('src/data/site.mjs');
const header=read('src/components/Header.astro');
for(const s of ['Popular tools','WRITTEN PREP','PILOTDESK DAILY','Explore PilotDesk','data-pd-home-account'])ok(home.includes(s),`Astro homepage missing ${s}`);
for(const s of ['Plan a Flight','Use a Calculator','Study for a Written','Play Daily'])ok(siteData.includes(s),`Astro homepage action data missing ${s}`);
for(const href of ['/route-planner.html','/tools.html','/written-prep.html','/daily/'])ok(siteData.includes(href),`homepage action data missing ${href}`);
ok(header.includes('navSections')&&header.includes('href="/daily/"'),'shared Astro header must keep primary navigation and Daily visible');
const architecture=read('assets/pilotdesk-architecture-2026.css');
for(const s of ['.pd-home-actions{','.pd-home-account-strip{','.pd-popular-grid{','.pd-feature-grid{','.pd-category-grid{','@media(max-width:860px)','@media(max-width:560px)'])ok(architecture.includes(s),`Astro homepage architecture missing ${s}`);
const avionics=read('assets/avionics-ui.css');for(const s of ['--pd-mono:','font-variant-numeric:tabular-nums','border-radius:4px','.input-wrap span','.result.primary strong'])ok(avionics.includes(s),`global avionics visual system missing ${s}`);ok(!/box-shadow:\s*0\s+\d+px\s+\d+px/i.test(avionics),'global avionics layer should not introduce soft promotional drop shadows');
const widget=read('assets/context-widget.js');for(const s of ['crosswindBody','densityBody','weatherBody','wbBody','descentBody','fuelBody','/api/weather?station=','pd-last-context-widget'])ok(widget.includes(s),`context widget missing ${s}`);ok(widget.includes('Math.sin(rel)')&&widget.includes('Math.cos(rel)'),'crosswind quick-widget math missing');ok(widget.includes('Math.tan(3*Math.PI/180)'),'descent quick-widget geometry missing');
const manifest=JSON.parse(read('site.webmanifest'));ok(manifest.start_url==='/', 'PWA should open at dashboard/home');ok(manifest.shortcuts?.some(x=>x.url==='/flight-training.html'),'PWA training shortcut missing');ok(manifest.shortcuts?.some(x=>x.url==='/?search=1'),'PWA search shortcut missing');
const robots=read('robots.txt');ok(robots.includes('sitemap-retention.xml'),'robots.txt missing retention sitemap');
const submit=read('scripts/submit-indexnow.py');ok(submit.includes("glob('sitemap*.xml')"),'IndexNow should collect all sitemap files');
const sourcePages=[...must.filter(p=>p.endsWith('.html')),'flight-training.html','for-flight-schools.html'];
for(const p of sourcePages){const h=read(p);ok((h.match(/<h1\b/g)||[]).length===1,`${p} must have one H1`);ok(/rel="canonical"/.test(h),`${p} missing canonical`);ok(/faa\.gov|current approved|exact aircraft POH\/AFM|controlling source/i.test(h),`${p} missing source/verification language`);ok(!/\b(seamless|effortless|powerful|game-changing|revolutionary|unlock|elevate)\b/i.test(h),`${p} contains marketing/AI-ish filler`)}
const c172=read('guides/cessna-172-glide-distance.html');ok(c172.includes('not</strong> a published Cessna 172 performance claim'),'C172 guide must label generic example as non-aircraft-specific');
const avgas=read('guides/avgas-weight-per-gallon.html');ok(avgas.includes('6.01 lb per U.S. gallon at 59°F'),'Avgas guide standard value/source note missing');
const descent=read('guides/three-degree-descent-rate-chart.html');ok(descent.includes('120 kt')&&descent.includes('637 fpm')&&descent.includes('600 fpm'),'3-degree chart regression value missing');
const sw=read('sw.js');ok(sw.includes("CACHE='pilotdesk-v36'")&&sw.includes("'/assets/growth-suite.js'")&&sw.includes("'/assets/avionics-ui.css'")&&sw.includes("'/assets/pilotdesk-architecture-2026.css'"),'service worker not updated for Astro architecture and growth suite');for(const s of ['/assets/avionics-ui.css','/assets/pilotdesk-architecture-2026.css','/assets/pilotdesk-navigation-2026.css','/assets/pilotdesk-workspaces-2026.css','/assets/context-widget.js','/assets/navigation-data.js'])ok(sw.includes(s),`service worker missing ${s}`);
if(failures.length){console.error(`Growth + retention check failed (${failures.length})`);for(const x of failures)console.error(' - '+x);process.exit(1)}
console.log('Growth + retention smoke check passed: native Astro homepage, retention UI, shared navigation, and PWA cache settle into one site architecture.');
