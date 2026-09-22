import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8');
const failures=[];const check=(ok,msg)=>{if(!ok)failures.push(msg)};

const e6b=read('e6b-flight-computer.html');
const math=read('guides/pilot-math-formulas.html');
const multi=read('guides/multiengine-checkride-study-guide.html');
const weather=read('weather.html');
const cfi=read('for-cfis.html');
const sitemap=read('sitemap.xml');

check(e6b.includes('Free online E6B calculator and flight computer'),'E6B exact-intent description missing');
check(e6b.includes('E6B ONLINE SEARCH SHORTCUTS'),'E6B shortcut cluster missing');
for(const href of ['/calculators/wind-triangle/','/calculators/time-speed-distance/','/calculators/fuel-required/','/guides/pilot-math-formulas.html'])
  check(e6b.includes(`href="${href}"`),'E6B cluster missing '+href);

check(math.includes('Free pilot math formulas and aviation cheat sheet'),'Pilot math CTR description missing');
check(math.includes('MOST-USED PILOT FORMULAS'),'Pilot math formula cluster missing');
check(math.includes('data-pd-pilot-math-faq'),'Pilot math FAQ schema missing');
for(const href of ['/calculators/time-speed-distance/','/calculators/crosswind/','/calculators/density-altitude/','/calculators/moment-cg/'])
  check(math.includes(`href="${href}"`),'Pilot math cluster missing '+href);

check(multi.includes('Multi-Engine Checkride Study Guide: VMC, VYSE & Engine-Out | PilotDesk'),'Multi-engine authority title missing');
check(multi.includes('ENGINE-OUT STUDY ORDER'),'Engine-out study sequence missing');
check(multi.includes('data-pd-multi-faq'),'Multi-engine FAQ schema missing');
for(const href of ['/guides/vmc-vs-vyse.html','/guides/critical-engine-multiengine.html','/guides/zero-sideslip-multiengine.html','/guides/feathering-vs-windmilling-propeller.html','/guides/single-engine-climb-performance.html'])
  check(multi.includes(`href="${href}"`),'Multi-engine hub missing '+href);

for(const page of [
 'guides/vmc-vs-vyse.html','guides/feathering-vs-windmilling-propeller.html',
 'guides/critical-engine-multiengine.html','guides/zero-sideslip-multiengine.html',
 'guides/single-engine-climb-performance.html','guides/single-engine-service-ceiling.html'
]) check(read(page).includes('/guides/multiengine-checkride-study-guide.html'),page+': missing authority backlink to multi-engine hub');

check(weather.includes('/guides/crosswind-component.html')&&weather.includes('/guides/density-altitude.html')&&weather.includes('/calculators/isa-temperature/'),'Weather page is not feeding authority into weather/performance cluster');
check(cfi.includes('REFERENCE HANDOFFS')&&cfi.includes('/guides/pilot-math-formulas.html')&&cfi.includes('/guides/multiengine-checkride-study-guide.html'),'CFI referral path missing Sprint 2 study clusters');

for(const path of [
 'e6b-flight-computer.html','for-cfis.html','guides/critical-engine-multiengine.html',
 'guides/crosswind-component.html','guides/density-altitude.html','guides/feathering-vs-windmilling-propeller.html',
 'guides/multiengine-checkride-study-guide.html','guides/pilot-math-formulas.html',
 'guides/single-engine-climb-performance.html','guides/single-engine-service-ceiling.html',
 'guides/vmc-vs-vyse.html','guides/zero-sideslip-multiengine.html','weather.html'
]) check(sitemap.includes('https://www.pilot-desk.com/'+path+'</loc><lastmod>2026-09-22</lastmod>'),path+': Sprint 2 sitemap freshness missing');

if(failures.length){
 console.error('SEO Sprint 2 authority checks failed ('+failures.length+')');
 failures.forEach(x=>console.error(' - '+x));
 process.exit(1);
}
console.log('SEO Sprint 2 authority checks passed: E6B/pilot-math, multi-engine engine-out, weather-performance, and CFI referral clusters are connected.');
