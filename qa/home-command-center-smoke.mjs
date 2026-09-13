import fs from 'node:fs';

const read=p=>fs.readFileSync(p,'utf8');
const failures=[];
const ok=(value,message)=>{if(!value)failures.push(message)};

for(const p of ['assets/home-command-center.css','assets/home-task-polish.css','assets/home-command-center.js','assets/context-widget.js'])ok(fs.existsSync(p),`Missing ${p}`);

const brand=read('assets/brand.js');
for(const s of ['/assets/home-command-center.css','/assets/home-task-polish.css','/assets/home-command-center.js','/assets/context-widget.js','pd-home-command-center'])ok(brand.includes(s),`brand.js missing ${s}`);

const home=read('assets/home-command-center.js');
for(const s of ['pd-top-search','pd-hero-search','pdHeroWidget','What are you doing today?','Pick up where you left off','All aviation calculators','pd-section-kicker'])ok(home.includes(s),`home command center missing ${s}`);
for(const href of ['/airport.html','/route-planner.html','/flight-planning-workspace.html','/weather.html','/weight-balance.html'])ok(home.includes(href),`home task card missing ${href}`);
ok(home.includes('openGlobalSearch'),'homepage must route hero/topbar search into universal search');
ok(home.includes('pdUniversalSearch,#pdDiscovery,#pdPopularTools'),'homepage must remove redundant discovery panels');
ok(!home.includes('installCardPolish'),'homepage styling must live in stylesheets, not runtime injected CSS');
ok(!home.includes("localStorage.getItem('pd-home-task')"),'homepage must not restore an arbitrary persistent selected task card');

const base=read('assets/home-command-center.css');
ok(base.includes('grid-auto-flow:column')&&base.includes('scroll-snap-type:x mandatory'),'mobile task cards must swipe horizontally');

const polish=read('assets/home-task-polish.css');
for(const s of ['--pd-home-max:1380px','backdrop-filter:blur(18px)','grid-template-columns:repeat(5,minmax(0,1fr))','grid-template-rows:76px auto auto','radial-gradient(180px 90px','.tool-card:hover','@media(prefers-reduced-motion:reduce)'])ok(polish.includes(s),`premium homepage polish missing ${s}`);
for(const task of ['airport','route','flight-workspace','weather','weight-balance'])ok(home.includes(`data-home-task="${task}"`),`quick-action card missing ${task}`);
ok(home.includes('const taskIcon=')&&home.includes('pd-icon-accent')&&polish.includes('Precision quick-action pictograms'),'refined quick-action icon system missing');
ok(polish.includes('grid-auto-columns:minmax(230px,74vw)'),'mobile quick actions need swipeable card sizing');
ok(!/font-size:\s*7px!important/.test(polish),'premium homepage should not rely on unreadably tiny 7px text');

const widget=read('assets/context-widget.js');
for(const s of ['crosswindBody','densityBody','weatherBody','wbBody','descentBody','fuelBody','/api/weather?station=','pd-last-context-widget'])ok(widget.includes(s),`context widget missing ${s}`);
ok(widget.includes('Math.tan(3*Math.PI/180)'),'3-degree descent geometry missing');
ok(widget.includes('Math.sin(rel)')&&widget.includes('Math.cos(rel)'),'crosswind component math missing');

const sw=read('sw.js');
for(const s of ['/assets/home-command-center.css','/assets/home-task-polish.css','/assets/home-command-center.js','/assets/context-widget.js'])ok(sw.includes(s),`service worker missing ${s}`);

if(failures.length){console.error(`Homepage command-center checks failed (${failures.length})`);failures.forEach(x=>console.error(' - '+x));process.exit(1)}
console.log('Homepage command-center checks passed: premium header/hero, reference-style aviation quick actions, live widget, personalized tools, responsive calculator library and offline assets verified.');
