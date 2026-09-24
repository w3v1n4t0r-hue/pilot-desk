import fs from 'node:fs';

const read=p=>fs.readFileSync(p,'utf8');
const failures=[];
const ok=(value,message)=>{if(!value)failures.push(message)};
const home=read('src/pages/index.astro');
const data=read('src/data/site.mjs');
const css=read('assets/home-desk.css');
const desk=read('assets/home-desk.js');
const sw=read('sw.js');

for(const text of [
  'Do the flight math. Check the weather. Study the next rating.',
  'Plan a flight',
  'Common pilot calculations','Three aviation questions each day.',
  'Study by certificate or rating.','Check the source behind the number.'
])ok(home.includes(text),`homepage is missing its core value signal: ${text}`);
for(const text of ['Plan a Flight','Use a Calculator','Study for a Written'])ok(data.includes(text),`homepage quick action is missing: ${text}`);
for(const href of ['/route-planner.html','/tools.html','/written-prep.html','/daily/','/flight-training.html','/sources.html'])ok(home.includes(href),`homepage is missing core destination ${href}`);
for(const href of ['/calculators/density-altitude/','/calculators/crosswind/','/weather.html','/airport.html'])ok(data.includes(href),`homepage quick tools are missing ${href}`);
ok(home.includes('home-desk.css')&&home.includes('home-desk.js'),'homepage desk assets are not connected');
ok(home.includes('Pick up where you left off')&&desk.includes('RECENT TOOL'),'homepage should help users resume a local workflow');
ok(css.includes('@media(max-width:640px)')&&css.includes('min-width:0'),'homepage responsive styles should handle small screens');
for(const asset of ['/assets/home-desk.css','/assets/home-desk.js'])ok(sw.includes(asset),`service worker is missing ${asset}`);

if(failures.length){console.error(`Homepage value checks failed (${failures.length})`);failures.forEach(x=>console.error(' - '+x));process.exit(1)}
console.log('Homepage value checks passed: calculators, planning, weather, training, sources, local workflow recovery, and responsive styling are present.');
