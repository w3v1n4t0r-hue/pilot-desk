import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8');
const failures=[];const ok=(c,m)=>{if(!c)failures.push(m)};
const must=[
'assets/share-enhance.js','assets/experience.css','assets/design-tokens.css','assets/app-bootstrap.js','assets/global-nav.js','src/pages/index.astro','src/data/site.mjs','src/components/Header.astro','training/private-pilot.html','training/instrument-rating.html','training/commercial-pilot.html','training/multiengine.html','training/cfi.html','guides/crosswind-component-chart.html','guides/avgas-weight-per-gallon.html','guides/three-degree-descent-rate-chart.html','guides/cessna-172-glide-distance.html','guides/seminole-vmc-study.html','sitemap-retention.xml'
];
for(const p of must)ok(fs.existsSync(p),`Missing ${p}`);

const share=read('assets/share-enhance.js');
ok(share.includes('data-pd-share-card')||share.includes('pdShareCard'),'Share card missing');
ok(!share.includes('applyParams()'),'share-enhance must not duplicate calculator URL hydration');
ok(!share.includes("dataset.copyLink='1'"),'share-enhance must not add a second copy-link control');

const analytics=read('assets/analytics.js');
for(const n of ['Calculator Abandoned','Returning Visitor','External Visit'])ok(analytics.includes(n),`analytics missing ${n}`);
ok(analytics.includes('now-last<700'),'analytics event de-duplication missing');
const features=read('assets/features.js');
ok(features.includes('Pin to dashboard')&&features.includes('★ Pinned'),'calculator pinning copy missing');
const ads=read('assets/ads.js');
ok(ads.includes("!isCalc")&&ads.includes("pilotdesk:calculated"),'ad loading does not protect calculator-first UX');

const bootstrap=read('assets/app-bootstrap.js');
for(const asset of ['/assets/navigation-data.js','/assets/flight-store.js','/assets/global-nav.js','/assets/theme.js','/assets/errors.js','/assets/analytics.js','/assets/update.js'])ok(bootstrap.includes(asset),`streamlined bootstrap missing ${asset}`);
for(const retired of ['/assets/context-widget.js','/assets/growth-suite.js','/assets/sticky-app.js','/assets/avionics-command.js','/assets/home-command-center.js'])ok(!bootstrap.includes(retired),`retired competing retention/UI layer returned: ${retired}`);
ok(bootstrap.includes("if(calc){load('/assets/features.js')")&&bootstrap.includes("load('/assets/pilotdesk-plus.js')"),'calculator retention enhancements must stay route-scoped');
ok(bootstrap.includes('isAstroNative')&&bootstrap.includes("if(!isAstroNative)load('/assets/experience.js')"),'native Astro pages must not be rebuilt by the legacy experience runtime');
ok(!bootstrap.includes('pd-ui-booting')&&!bootstrap.includes('visibility:hidden'),'retention UI must not hide static content behind a first-paint gate');

const home=read('src/pages/index.astro');
const siteData=read('src/data/site.mjs');
const header=read('src/components/Header.astro');
for(const s of ['Popular tools','Explore PilotDesk','data-pd-home-account','homeActions.slice(0,3).map'])ok(home.includes(s),`Astro homepage missing ${s}`);
for(const s of ['Plan a Flight','Use a Calculator','Study for a Written','Play Daily'])ok(siteData.includes(s),`Astro homepage action data missing ${s}`);
for(const href of ['/route-planner.html','/tools.html','/written-prep.html','/daily/'])ok(siteData.includes(href),`homepage action data missing ${href}`);
ok(siteData.includes("['/daily/', 'Daily challenge'")&&siteData.includes("['/written-prep.html', 'Written Prep'"),'shared Learn navigation must keep Daily and Written Prep discoverable');
ok(header.includes('navSections.map')&&header.includes('data-pd-astro-shell'),'shared Astro header must render the canonical navigation model');

const experience=read('assets/experience.css');
for(const s of ['.pd-home-actions{','.pd-popular-grid{','.pd-home-section{','.pd-home-action{','@media(max-width:800px)','@media(max-width:480px)','min-height:44px'])ok(experience.includes(s),`current homepage experience missing ${s}`);
const tokens=read('assets/design-tokens.css');
for(const s of ['--pd-color-canvas:#050506','--pd-color-surface-1:#0c0c0e','--pd-color-text:#f5f5f5','--pd-color-accent:#8ed8f8','body:before,body:after'])ok(tokens.includes(s),`current design-token/motion layer missing ${s}`);

const manifest=JSON.parse(read('site.webmanifest'));
ok(manifest.start_url==='/', 'PWA should open at dashboard/home');
ok(manifest.shortcuts?.some(x=>x.url==='/flight-training.html'),'PWA training shortcut missing');
ok(manifest.shortcuts?.some(x=>x.url==='/?search=1'),'PWA search shortcut missing');
const robots=read('robots.txt');ok(robots.includes('sitemap-retention.xml'),'robots.txt missing retention sitemap');
const submit=read('scripts/submit-indexnow.py');ok(submit.includes("glob('sitemap*.xml')"),'IndexNow should collect all sitemap files');

const sourcePages=[...must.filter(p=>p.endsWith('.html')),'flight-training.html','for-flight-schools.html'];
for(const p of sourcePages){const h=read(p);ok((h.match(/<h1\b/g)||[]).length===1,`${p} must have one H1`);ok(/rel="canonical"/.test(h),`${p} missing canonical`);ok(/faa\.gov|current approved|exact aircraft POH\/AFM|controlling source/i.test(h),`${p} missing source/verification language`);ok(!/\b(seamless|effortless|powerful|game-changing|revolutionary|unlock|elevate)\b/i.test(h),`${p} contains marketing/AI-ish filler`)}
const c172=read('guides/cessna-172-glide-distance.html');ok(c172.includes('not</strong> a published Cessna 172 performance claim'),'C172 guide must label generic example as non-aircraft-specific');
const avgas=read('guides/avgas-weight-per-gallon.html');ok(avgas.includes('6.01 lb per U.S. gallon at 59°F'),'Avgas guide standard value/source note missing');
const descent=read('guides/three-degree-descent-rate-chart.html');ok(descent.includes('120 kt')&&descent.includes('637 fpm')&&descent.includes('600 fpm'),'3-degree chart regression value missing');

const sw=read('sw.js');
const swVersion=Number(sw.match(/CACHE='pilotdesk-v(\d+)'/)?.[1]||0);
ok(swVersion>=38,'service worker cache version is behind the offline reliability release');
ok(sw.includes("importScripts('/assets/offline-precache.js')")&&sw.includes('...GENERATED_CALCULATORS'),'service worker must consume the generated calculator offline manifest');
for(const s of ['/assets/experience.css','/assets/design-tokens.css','/assets/navigation-data.js','/assets/global-nav.js'])ok(sw.includes(s),`service worker missing current shared asset ${s}`);
ok(sw.includes('migrateCalculatorEntries')&&sw.includes('networkOnlyPath'),'service worker must preserve calculator caches while keeping live APIs network-only');

if(failures.length){console.error(`Growth + retention check failed (${failures.length})`);for(const x of failures)console.error(' - '+x);process.exit(1)}
console.log('Growth + retention smoke check passed: native Astro discovery, Daily/Written Prep/account retention paths, responsive shared UI, SEO discovery, and deterministic offline coverage remain intact without retired shell layers.');
