import fs from 'node:fs';

const read=p=>fs.readFileSync(p,'utf8');
const css=read('assets/site-chassis.css');
const homeVisual=read('assets/home-visual-system.css');
const entry=read('assets/styles.css');
const boot=read('assets/app-bootstrap.js');
const layout=read('assets/tool-first-layout.js');
const nav=read('assets/global-nav.js');
const planner=read('planner.html');
const weather=read('weather.html');
const aircraft=read('aircraft.html');
const failures=[];
const need=(text,needle,label)=>{if(!text.includes(needle))failures.push(`${label}: missing ${needle}`)};

need(entry,'@import url("/assets/site-chassis.css");','styles.css');
need(entry,'@import url("/assets/home-visual-system.css");','styles.css');
if(entry.indexOf('home-visual-system.css')<entry.indexOf('site-chassis.css'))failures.push('styles.css: homepage visual system must be the final canonical style');
need(boot,"loadStyle('/assets/site-chassis.css','pd-site-chassis')",'app-bootstrap.js');
need(boot,"loadStyle('/assets/home-visual-system.css','pd-home-visual-system')",'app-bootstrap.js');
if(boot.indexOf("loadStyle('/assets/site-chassis.css','pd-site-chassis')")<boot.indexOf("loadStyle('/assets/unified-ui.css','pd-unified-ui')"))failures.push('app-bootstrap.js: site chassis must load after unified UI');
if(boot.indexOf("loadStyle('/assets/home-visual-system.css','pd-home-visual-system')")<boot.indexOf("loadStyle('/assets/site-chassis.css','pd-site-chassis')"))failures.push('app-bootstrap.js: homepage visual system must load after site chassis');

for(const token of ['--pd-chassis-max:1380px','.pd-streamlined-shell','.pd-page-hero','.pd-hub-grid','.pd-hub-card','.pd-reference-panel','.pd-flight-subnav'])need(css,token,'site-chassis.css');
need(css,'grid-column:span 4!important','site-chassis.css');
need(css,'grid-column:span 6!important','site-chassis.css');
need(css,'.pd-streamlined-shell>.pd-product-nav{display:none!important}','site-chassis.css');

for(const token of ['--pd-home-canvas:#09090b','--pd-home-panel:#101114','.topbar{','.pd-page-hero','.pd-hub-card','.pd-panel','.category-head','radial-gradient(circle at 7px 7px','#3f5655'])need(homeVisual,token,'home-visual-system.css');
need(homeVisual,"content:'PILOTDESK // FLIGHT TOOLS'",'home-visual-system.css');
need(homeVisual,"linear-gradient(to bottom,var(--pd-home-rail) 0 29px,var(--pd-home-panel) 29px 100%)",'home-visual-system.css');

need(layout,"APP_PATHS=new Set",'tool-first-layout.js');
need(layout,"document.documentElement.classList.add('pd-streamlined-app')",'tool-first-layout.js');
need(layout,"main.classList.add('pd-streamlined-shell')",'tool-first-layout.js');
need(layout,"s.textContent='Planning notes & verification'",'tool-first-layout.js');
need(layout,'normalizeAppHero(main)','tool-first-layout.js');
need(layout,'moveCoreReference(main)','tool-first-layout.js');

need(nav,"ensureStyle('/assets/site-chassis.css','pdSiteChassis')",'global-nav.js');
need(nav,"ensureStyle('/assets/home-visual-system.css','pdHomeVisualSystem')",'global-nav.js');
need(nav,"document.documentElement.classList.add('pd-streamlined-app')",'global-nav.js');

for(const [name,html] of [['planner.html',planner],['weather.html',weather],['aircraft.html',aircraft]]){
  need(html,'data-pd-core-depth="1"',name);
  need(html,'/assets/styles.css',name);
}

if(failures.length){console.error('Site chassis checks failed:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Site chassis checks passed: homepage avionics visuals now define the global chrome, app heroes, hub cards, panels, controls, readouts and footer while preserving one task-first page structure.');
