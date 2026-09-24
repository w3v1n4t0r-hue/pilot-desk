import fs from 'node:fs';

const read=p=>fs.readFileSync(p,'utf8');
const layout=read('src/layouts/BaseLayout.astro');
const header=read('src/components/Header.astro');
const footer=read('src/components/Footer.astro');
const experience=read('assets/experience.css');
const bootstrap=read('assets/app-bootstrap.js');
const nav=read('assets/global-nav.js');
const planner=read('dist/planner.html');
const weather=read('dist/weather.html');
const aircraft=read('dist/aircraft.html');
const failures=[];
const need=(text,needle,label)=>{if(!text.includes(needle))failures.push(`${label}: missing ${needle}`)};

for(const needle of ['data-pd-astro-native="1"','<Header />','<Footer />','class="shell"','id="main-content"','/assets/styles.css','/assets/app-bootstrap.js'])need(layout,needle,'BaseLayout.astro');
need(header,'data-pd-astro-shell','Header.astro');need(header,'navSections.map','Header.astro');need(header,'pd-header-actions','Header.astro');need(header,'aria-expanded="false"','Header.astro');
need(footer,'footerLinks.map','Footer.astro');need(footer,'supplements, but does not replace','Footer.astro');need(footer,'official weather','Footer.astro');need(footer,'NOTAMs','Footer.astro');

for(const selector of ['.shell{','.topbar{','.pd-main-nav{','.pd-nav-menu{','.pd-header-actions{','.hero,','.pd-hub-grid{','.pd-hub-card','.pd-panel','footer{'])need(experience,selector,'experience.css');
for(const responsive of ['@media(max-width:800px)','@media(max-width:480px)','.pd-main-nav.open'])need(experience,responsive,'experience.css');

need(bootstrap,'isAstroNative','app-bootstrap.js');need(bootstrap,"/assets/global-nav.js",'app-bootstrap.js');
for(const retired of ['site-chassis.css','home-visual-system.css','tool-first-layout.js'])if(bootstrap.includes(retired))failures.push(`app-bootstrap.js: retired chassis layer returned: ${retired}`);
need(nav,'data-pd-astro-shell','global-nav.js');need(nav,'window.PILOTDESK_NAV_CORE','global-nav.js');need(nav,'navigation-search.js','global-nav.js');

for(const [name,html] of [['dist/planner.html',planner],['dist/weather.html',weather],['dist/aircraft.html',aircraft]]){
  const release=JSON.parse(read('dist/assets/release-manifest.json')).assets;
  for(const asset of ['/assets/styles.css','/assets/app-bootstrap.js'])need(html,release[asset],name);
}

if(failures.length){console.error('Site chassis checks failed:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Site chassis checks passed: native Astro pages and built legacy workspaces share one header/footer/navigation contract, responsive shell styling, and the streamlined bootstrap.');
