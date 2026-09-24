import fs from 'node:fs';
const fail=m=>{console.error('Google audit regression:',m);process.exitCode=1};
const read=p=>fs.readFileSync(p,'utf8');
const home=read('index.html'),astroHome=read('src/pages/index.astro'),bootstrap=read('assets/app-bootstrap.js'),ads=read('assets/ads.js'),adsTxt=read('ads.txt'),prepare=read('scripts/prepare-astro-public.mjs'),productionWatch=read('.github/workflows/production-watch.yml'),theme=read('assets/theme.js'),tokens=read('assets/design-tokens.css'),site=read('assets/site.js'),nav=read('assets/global-nav.js'),siteData=read('src/data/site.mjs'),header=read('src/components/Header.astro'),syncNav=read('scripts/sync-navigation.mjs'),vercel=read('vercel.json');
if(/pagead2\.googlesyndication\.com\/pagead\/js\/adsbygoogle\.js\?client=/.test(home))fail('homepage eagerly loads AdSense');
if(adsTxt.trim()!=='google.com, pub-2325772529624834, DIRECT, f08c47fec0942fa0')fail('ads.txt publisher record is missing or malformed');
if(!prepare.includes("'robots.txt', 'ads.txt'"))fail('Astro public preparation no longer copies ads.txt');
if(!vercel.includes('"source": "/ads.txt"')&&!vercel.includes('"source":"/ads.txt"'))fail('Vercel ads.txt response header rule missing');
for(const url of ['https://www.pilot-desk.com/ads.txt','https://pilot-desk.com/ads.txt'])if(!productionWatch.includes(url))fail('production watch missing '+url);
if(!ads.includes('scheduleAds()')||!ads.includes("isCalc?10000:7000")||!ads.includes("requestIdleCallback"))fail('AdSense lazy-start guard missing');
if(!theme.includes("localStorage.setItem('pd-theme','dark')")||!theme.includes("dataset.pdTheme='dark'")||!theme.includes("colorScheme='dark'"))fail('dark-only brand theme guard missing');
for(const x of ['--bg:#050607','--panel:#0c1014','--text:#f2f3f3','--muted:#b0b5ba','--muted2:#747b82','--accent:#6faed1'])if(!tokens.includes(x))fail('cockpit contrast token missing '+x);
if(!site.includes("if(!['/','/index.html'].includes(location.pathname))loadWorkspaceShell();"))fail('legacy homepage workspace-shell CLS guard missing');
if(!site.includes('No recent tools yet.'))fail('recent-tools stable empty state missing');
if(!bootstrap.includes("serviceWorker.register('/sw.js')")||!bootstrap.includes('requestIdleCallback')||!bootstrap.includes('timeout:1500'))fail('service worker early idle registration guard missing');
const nativeHomeGuard=astroHome.includes('<BaseLayout')&&astroHome.includes('pd-home-actions')&&bootstrap.includes('isAstroNative')&&!bootstrap.includes('/assets/product-nav.js');
if(!nativeHomeGuard)fail('native Astro homepage CLS guard missing');
const canonicalNav=header.includes("import { navSections }")&&syncNav.includes("from '../src/data/site.mjs'")&&nav.includes('window.PILOTDESK_NAV')&&nav.includes("data-pd-astro-shell")&&siteData.includes("label: 'Tools'")&&siteData.includes("label: 'Plan'")&&siteData.includes("label: 'Weather'")&&siteData.includes("label: 'Learn'");
if(!canonicalNav)fail('stable canonical nav guard missing');
if(!vercel.includes('includeSubDomains; preload'))fail('HSTS preload token missing');
if(vercel.includes("https: http:;"))fail('HTTP scheme still allowed in script-src');
const consolidatedGuides=[
  'guides/aviation-speed-conversions.html','guides/aviation-distance-conversions.html',
  'guides/aviation-temperature-conversions.html','guides/aviation-volume-conversions.html',
  'guides/altimeter-pressure-conversions.html','guides/aircraft-weight-conversions.html',
  'guides/vertical-speed-conversions.html','guides/free-aviation-tools-for-flight-schools.html',
  'guides/aviation-calculator-widgets-flight-school-websites.html','guides/climb-gradient.html',
  'guides/pilot-checkride-math.html'
];
for(const file of consolidatedGuides)if(!/<meta\s+name="robots"\s+content="noindex,follow"/i.test(read(file)))fail(`thin satellite guide should stay out of search results: ${file}`);
for(const file of fs.readdirSync('.').filter(name=>/^sitemap.*\.xml$/i.test(name))){
  const xml=read(file);
  for(const guide of consolidatedGuides)if(xml.includes(`/${guide}`))fail(`${file} still lists consolidated guide ${guide}`);
}
const utilityAndDuplicatePages=[
  ['skill-gap.html','https://www.pilot-desk.com/skill-gap.html'],
  ['learn/coverage/index.html','https://www.pilot-desk.com/learn/coverage/'],
  ['guides/popular-aviation-tools.html','https://www.pilot-desk.com/guides/popular-aviation-tools.html']
];
for(const [file,url] of utilityAndDuplicatePages){
  if(!/<meta\s+name="robots"\s+content="noindex,follow"/i.test(read(file)))fail(`utility or duplicate page should stay out of search results: ${file}`);
  for(const sitemap of fs.readdirSync('.').filter(name=>/^sitemap.*\.xml$/i.test(name)))if(read(sitemap).includes(url))fail(`${sitemap} still lists noindex page ${url}`);
}
const conversionHub=read('guides/aviation-conversions.html');
if(!/<meta\s+name="robots"\s+content="index,follow"/i.test(conversionHub)||!conversionHub.includes('U.S. liquid gallon')||!conversionHub.includes('fuel density')||!conversionHub.includes('ft/NM'))fail('aviation conversion hub no longer provides its consolidated reference');
const formulaReference=read('guides/pilot-math-formulas.html');
if(!/<meta\s+name="robots"\s+content="index,follow/i.test(formulaReference)||!formulaReference.includes('Technical sources'))fail('comprehensive pilot math reference should remain the indexed formula resource');
const hydro=read('guides/hydroplaning-speed.html');
if(!hydro.includes('8.6 × √(main-tire pressure in PSI)')||!hydro.includes('documentID/1042093')||!hydro.includes('viscous hydroplaning')||!hydro.includes('51.6 knots'))fail('hydroplaning guide is missing sourced FAA method or limits');
const hydroCalc=read('calculators/hydroplaning/index.html');
if(!site.includes("v=8.6*Math.sqrt(p)")||!hydroCalc.includes('8.6 × √(main-tire pressure in PSI)')||!hydroCalc.includes('51.6 knots')||!hydroCalc.includes('10_afh_ch9.pdf'))fail('hydroplaning calculator must use and source the FAA 8.6 × √PSI estimate');
const climb=read('guides/vx-vy-altitude.html');
if(!climb.includes('Airplane Flying Handbook')||!climb.includes('best angle of climb')||!climb.includes('best rate of climb')||!climb.includes('AFM/POH'))fail('Vx/Vy guide is missing its learning context or aircraft-specific source');
const navigation=read('guides/navigation-reference.html');
if(!navigation.includes('Worked wind-triangle example')||!navigation.includes('about 30.6 minutes')||!navigation.includes('current charts'))fail('navigation hub is missing its worked planning example or source limits');
const weather=read('guides/aviation-weather-reference.html');
if(!weather.includes('complete weather picture')||!weather.includes('current official observations')||!weather.includes('valid time'))fail('weather hub is missing its briefing workflow');
const performance=read('guides/aircraft-performance-reference.html');
if(!performance.includes('At 60° of bank')||!performance.includes('repeatable performance-chart workflow')||!performance.includes('current AFM/POH'))fail('performance hub is missing worked relationships or aircraft-specific workflow');
if(!/<meta\s+name="robots"\s+content="noindex,follow"/i.test(read('feedback.html')))fail('feedback form should not be a search landing page');
if(!ads.includes("rule.trim()==='noindex'")||!ads.includes("||noindex||"))fail('AdSense loader should skip pages marked noindex');
for(const file of ['guides/top-of-descent.html','guides/climb-rate-vs-climb-gradient.html','guides/true-airspeed-rule.html','guides/standard-rate-turn.html']){
  const html=read(file);
  if(html.includes('$12026-09-23'))fail(`${file} has malformed review-date metadata`);
  for(const [,json] of html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi))try{JSON.parse(json)}catch{fail(`${file} has invalid JSON-LD`)}
}
for(const file of fs.readdirSync('.').filter(name=>/^sitemap.*\.xml$/i.test(name)))if(read(file).includes('/feedback.html'))fail(`${file} still lists the feedback utility page`);
const ratio=(a,b)=>{const lum=h=>{const v=h.match(/[0-9a-f]{2}/gi).map(x=>parseInt(x,16)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);return .2126*v[0]+.7152*v[1]+.0722*v[2]};const [x,y]=[lum(a),lum(b)].sort((m,n)=>n-m);return (x+.05)/(y+.05)};
for(const [fg,bg] of [['#aaa9a5','#050505'],['#77777f','#050505'],['#f4f3ee','#0d0d0f'],['#d8d7d2','#0b0b0d']])if(ratio(fg,bg)<4.5)fail(`contrast ${fg} on ${bg} = ${ratio(fg,bg).toFixed(2)}`);
if(!process.exitCode)console.log('Google audit regression checks PASS');
