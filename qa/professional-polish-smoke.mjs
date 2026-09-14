import fs from 'node:fs';

const read=p=>fs.readFileSync(p,'utf8');
const css=read('assets/professional-polish.css');
const architecture=read('assets/avionics-architecture.css');
const architectureJs=read('assets/avionics-architecture.js');
const bootstrap=read('assets/app-bootstrap.js');
const brand=read('assets/brand.js');
const sw=read('sw.js');
const failures=[];
const check=(ok,msg)=>{if(!ok)failures.push(msg)};

check(css.length>5000,'professional polish stylesheet is unexpectedly small');
for(const selector of ['.topbar','.hero','.tool-card','.calc-box','.input-wrap','.result','.content-page','.pd-app-dock','footer']){
  check(css.includes(selector),`professional polish is missing ${selector}`);
}
check(css.includes('@media(max-width:760px)'),'professional polish needs explicit mobile treatment');
check(css.includes('@media(prefers-reduced-motion:reduce)'),'professional polish must respect reduced motion');
check(css.includes(':focus-visible'),'professional polish must preserve visible keyboard focus');
check(css.includes('min-height:44px')||css.includes('min-height:50px'),'professional polish should preserve touch-friendly control sizing');
check(!css.includes('display:none!important'),'professional polish must not hide core interface sections');
check(!css.includes('position:fixed')||css.includes('body:before'),'professional polish should not introduce new fixed interactive overlays');
check(bootstrap.includes("loadStyle('/assets/professional-polish.css','pd-professional-polish')"),'app bootstrap is not loading professional polish');
check(sw.includes("'/assets/professional-polish.css'"),'professional polish is not cached for installed/offline use');

/* Instrumentation-grade architecture must stay coherent sitewide. */
for(const token of ['--bg-primary:#09090b','--bg-surface:#121316','--bg-elevated:#18191e','--border-hairline:#27272a','--text-readout:#fafafa','--text-label:#a1a1aa','--text-dim:#71717a','--accent-functional:#ffffff']){
  check(architecture.includes(token),`avionics architecture missing design token ${token}`);
}
for(const sentinel of ['height:52px!important','.pd-panel-header','height:42px!important','.pd-output-console','grid-template-columns:minmax(0,1.02fr) minmax(285px,.78fr)','.pd-tool-code','.pd-zulu-clock','.pd-copy-summary']){
  check(architecture.includes(sentinel),`avionics architecture missing ${sentinel}`);
}
for(const sentinel of ['PILOT DESK','DESK // OPS','FLIGHT COMPUTER // OUTPUT','COPY DATA','pd-density-toggle','setInterval(tick,1000)','button.click()']){
  check(architectureJs.includes(sentinel),`avionics behavior missing ${sentinel}`);
}
check(brand.includes("/assets/avionics-architecture.css")&&brand.includes("/assets/avionics-architecture.js"),'brand loader must install avionics architecture globally');
check(sw.includes("'/assets/avionics-architecture.css'")&&sw.includes("'/assets/avionics-architecture.js'"),'avionics architecture must be cached/network-first for installed use');

if(failures.length){
  console.error(`Professional polish checks failed with ${failures.length} issue(s):`);
  failures.forEach(x=>console.error(' - '+x));
  process.exit(1);
}
console.log('Professional polish checks passed: visual layer is isolated, responsive, accessible, instrumentation-grade, cached, and protected against generic UI regressions.');
