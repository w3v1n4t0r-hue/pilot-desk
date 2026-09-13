import fs from 'node:fs';

const read=p=>fs.readFileSync(p,'utf8');
const failures=[];const ok=(v,m)=>{if(!v)failures.push(m)};
const required=['assets/home-command-center.css','assets/home-task-polish.css','assets/home-command-center.js','assets/context-widget.js'];
for(const p of required)ok(fs.existsSync(p),`Missing ${p}`);

const brand=read('assets/brand.js');
for(const s of ['/assets/home-command-center.css','/assets/home-task-polish.css','/assets/home-command-center.js','/assets/context-widget.js','pd-home-command-center'])ok(brand.includes(s),`brand.js missing ${s}`);

const home=read('assets/home-command-center.js');
for(const s of ['pd-top-search','pd-hero-search','pdHeroWidget','What are you doing today?','Recent & favorite tools','All aviation calculators','pd-home-task'])ok(home.includes(s),`home command center missing ${s}`);
for(const href of ['/airport.html','/route-planner.html','/flight-planning-workspace.html','/weather.html','/weight-balance.html'])ok(home.includes(href),`home task card missing ${href}`);
ok(home.includes('openGlobalSearch'),'homepage must route hero/topbar search into universal search');
ok(home.includes('pdUniversalSearch,#pdDiscovery,#pdPopularTools'),'homepage must remove redundant discovery panels');

const css=read('assets/home-command-center.css');
for(const s of ['.pd-task-strip','.pd-task-card.is-active','.pd-home-personal-grid','#pdAllCalculators','.pd-hero-widget-host','.pd-top-search'])ok(css.includes(s),`homepage CSS missing ${s}`);
ok(css.includes('grid-auto-flow:column')&&css.includes('scroll-snap-type:x mandatory'),'mobile task cards must swipe horizontally');
ok(css.includes('grid-template-columns:repeat(4'),'desktop calculator catalog should be denser below the fold');

const polish=read('assets/home-task-polish.css');
for(const s of ['grid-template-columns:38px minmax(0,1fr)','grid-row:1 / span 2','min-height:96px','pd-task-card.is-active','grid-auto-columns:minmax(220px,72vw)'])ok(polish.includes(s),`homepage task polish missing ${s}`);
ok(!/height:\s*58px/.test(polish),'polished task cards must not restore giant 58px icons');

const widget=read('assets/context-widget.js');
for(const s of ['crosswindBody','densityBody','weatherBody','wbBody','descentBody','fuelBody','/api/weather?station=','pd-last-context-widget'])ok(widget.includes(s),`context widget missing ${s}`);
ok(widget.includes("path==='/weather.html'")&&widget.includes("path==='/aircraft.html'")&&widget.includes("path==='/weight-balance.html'"),'context widget page targeting missing');
ok(widget.includes("Math.tan(3*Math.PI/180)"),'3-degree descent geometry missing');
ok(widget.includes("Math.sin(rel)")&&widget.includes("Math.cos(rel)"),'crosswind component math missing');

const sw=read('sw.js');
for(const s of ['/assets/home-command-center.css','/assets/home-task-polish.css','/assets/home-command-center.js','/assets/context-widget.js'])ok(sw.includes(s),`service worker missing ${s}`);
ok(sw.includes("CACHE='pilotdesk-v29'"),'homepage redesign must ship with a fresh service-worker cache');

if(failures.length){console.error(`Homepage command-center checks failed (${failures.length})`);failures.forEach(x=>console.error(' - '+x));process.exit(1)}
console.log('Homepage command-center checks passed: compact search nav, clean quick-action cards, live context widgets, swipeable task cards, personalized tools, dense calculator catalog, and fresh offline caching verified.');