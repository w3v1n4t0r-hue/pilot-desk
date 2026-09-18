import fs from 'node:fs';

const failures=[];
const check=(ok,msg)=>{if(!ok)failures.push(msg)};
const read=p=>fs.readFileSync(p,'utf8');

const guides=read('guides.html');
const weather=read('guides/aviation-weather-reference.html');
const nav=read('guides/navigation-reference.html');
const perf=read('guides/aircraft-performance-reference.html');
const conv=read('guides/aviation-conversions.html');
const e6b=read('e6b-flight-computer.html');
const multi=read('guides/multiengine-checkride-study-guide.html');
const calcGen=read('scripts/generate-calculator-pages.mjs');
const css=read('assets/experience.css');

for(const href of [
 '/guides/aviation-weather-reference.html',
 '/guides/navigation-reference.html',
 '/guides/aircraft-performance-reference.html',
 '/e6b-flight-computer.html',
 '/guides/aviation-conversions.html',
 '/guides/multiengine-checkride-study-guide.html'
]) check(guides.includes(`href="${href}"`),`Guides hub missing topic hub link: ${href}`);

check(guides.includes('Start with the system, not an isolated page.'),'Guides hub topic-first framing missing');
check(guides.includes('<img src="/assets/icon.svg"'),'Guides hub must use official PilotDesk logo');
check(!guides.includes('viewBox="0 0 64 40"'),'Retired Guides hub airplane logo returned');

const clusterChecks=[
 ['weather',weather,['/calculators/density-altitude/','/calculators/pressure-altitude/','/calculators/crosswind/','/training/instrument-rating.html']],
 ['navigation',nav,['/calculators/wind-triangle/','/calculators/time-speed-distance/','/route-planner.html','/training/private-pilot.html']],
 ['performance',perf,['/calculators/density-altitude/','/calculators/climb-gradient/','/calculators/glide-range/','/weight-balance.html','/poh-chart-studio.html']],
 ['conversions',conv,['/calculators/speed-conversion/','/calculators/pressure-conversion/','/calculators/weight-conversion/','/e6b-flight-computer.html']],
 ['e6b',e6b,['/guides/wind-triangle.html','/calculators/wind-triangle/','/calculators/fuel-required/','/guides/pilot-math-formulas.html']],
 ['multi',multi,['/guides/vmc-vs-vyse.html','/guides/critical-engine-multiengine.html','/guides/single-engine-climb-performance.html','/training/multiengine.html']]
];
for(const [name,html,links] of clusterChecks){
 for(const href of links)check(html.includes(`href="${href}"`),`${name} cluster missing contextual link: ${href}`);
}

for(const mapping of [
 "'Atmosphere & Weather':['/guides/aviation-weather-reference.html'",
 "'Performance':['/guides/aircraft-performance-reference.html'",
 "'Navigation':['/guides/navigation-reference.html'",
 "'Conversions':['/guides/aviation-conversions.html'",
 "'Flight Planning':['/e6b-flight-computer.html'"
]) check(calcGen.includes(mapping),`Calculator generator lost category → hub route: ${mapping}`);

check(css.includes('.pd-seo-topic-grid'),'Topic-hub visual system missing');
check(css.includes('.pd-topic-links'),'Contextual internal-link styling missing');
check(css.includes('@media(max-width:560px)'),'Topic links mobile guard missing');

if(failures.length){
 console.error(`Internal SEO architecture checks failed with ${failures.length} issue(s):`);
 failures.forEach(x=>console.error(' - '+x));
 process.exit(1);
}
console.log('Internal SEO architecture checks passed: calculator → hub routes, topic hubs, contextual calculator/training links, multi-engine cluster, branding, and mobile navigation verified.');
