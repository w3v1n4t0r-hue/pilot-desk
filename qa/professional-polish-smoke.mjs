import fs from 'node:fs';

const read=p=>fs.readFileSync(p,'utf8');
const css=read('assets/professional-polish.css');
const architecture=read('assets/avionics-architecture.css');
const architectureJs=read('assets/avionics-architecture.js');
const opsCss=read('assets/avionics-ops.css');
const command=read('assets/avionics-command.js');
const strip=read('assets/flight-strip-export.js');
const crosswind=read('assets/crosswind-mfd.js');
const bootstrap=read('assets/app-bootstrap.js');
const brand=read('assets/brand.js');
const sw=read('sw.js');
const failures=[];
const check=(ok,msg)=>{if(!ok)failures.push(msg)};

check(css.length>5000,'professional polish stylesheet is unexpectedly small');
for(const selector of ['.topbar','.hero','.tool-card','.calc-box','.input-wrap','.result','.content-page','.pd-app-dock','footer'])check(css.includes(selector),`professional polish is missing ${selector}`);
check(css.includes('@media(max-width:760px)'),'professional polish needs explicit mobile treatment');
check(css.includes('@media(prefers-reduced-motion:reduce)'),'professional polish must respect reduced motion');
check(css.includes(':focus-visible'),'professional polish must preserve visible keyboard focus');
check(css.includes('min-height:44px')||css.includes('min-height:50px'),'professional polish should preserve touch-friendly control sizing');
check(!css.includes('display:none!important'),'professional polish must not hide core interface sections');
check(!css.includes('position:fixed')||css.includes('body:before'),'professional polish should not introduce new fixed interactive overlays');
check(bootstrap.includes('/assets/professional-polish.css'),'app bootstrap is not loading professional polish');
check(sw.includes("'/assets/professional-polish.css'"),'professional polish is not cached for installed/offline use');

for(const token of ['--bg-primary:#09090b','--bg-surface:#121316','--bg-elevated:#18191e','--border-hairline:#27272a','--text-readout:#fafafa','--text-label:#a1a1aa','--text-dim:#71717a','--accent-functional:#ffffff'])check(architecture.includes(token),`avionics architecture missing design token ${token}`);
for(const sentinel of ['height:52px!important','.pd-panel-header','height:42px!important','.pd-output-console','grid-template-columns:minmax(0,1.02fr) minmax(285px,.78fr)','.pd-tool-code','.pd-zulu-clock','.pd-copy-summary'])check(architecture.includes(sentinel),`avionics architecture missing ${sentinel}`);
for(const sentinel of ['PILOT DESK','DESK // OPS','FLIGHT COMPUTER // OUTPUT','COPY DATA','pd-density-toggle','setInterval(tick,1000)','button.click()'])check(architectureJs.includes(sentinel),`avionics behavior missing ${sentinel}`);

for(const sentinel of ['input[type="number"]::-webkit-inner-spin-button','.pd-command-backdrop','.pd-time-stack','.pd-search-trigger','.pd-flight-strip-copy','.pd-crosswind-display','.pd-xwind-svg'])check(opsCss.includes(sentinel),`avionics ops stylesheet missing ${sentinel}`);
for(const sentinel of ['[OPS // v1.0]','Ctrl K','Type a tool, abbreviation, or calculation','Crosswind & Headwind Component','Pressure & Density Altitude','inputMode=\'decimal\'','setInterval(tick,1000)'])check(command.includes(sentinel),`command/header behavior missing ${sentinel}`);
for(const sentinel of ['COPY FLIGHT STRIP','✓ COPIED TO SCRATCHPAD','navigator.clipboard.writeText','CALC: CROSSWIND COMPONENT // PILOT DESK','TIMESTAMP:'])check(strip.includes(sentinel),`flight-strip export missing ${sentinel}`);
for(const sentinel of ['RUNWAY / WIND VECTOR','data-runway-group','data-wind-group','gustSpeed','Math.sin(rad)','Math.cos(rad)','15 KTS IS NOT A UNIVERSAL AIRCRAFT LIMIT'])check(crosswind.includes(sentinel),`crosswind MFD missing ${sentinel}`);

for(const asset of ['/assets/avionics-architecture.css','/assets/avionics-architecture.js','/assets/avionics-ops.css','/assets/avionics-command.js','/assets/flight-strip-export.js','/assets/crosswind-mfd.js']){
  check(bootstrap.includes(asset),`stable bootstrap missing ${asset}`);
  check(sw.includes(`'${asset}'`),`service worker missing ${asset}`);
}
check(!brand.includes('addStyle('),'brand module must not inject a second visual stylesheet stack after boot');
check(brand.includes("img.src='/assets/icon.svg'")&&brand.includes("word.textContent='PilotDesk'")&&brand.includes("tag.textContent='FLIGHT TOOLS'"),'brand module must normalize the clean PilotDesk identity');
check(bootstrap.includes('pd-ui-booting')&&bootstrap.includes('pd-ui-ready'),'avionics shell needs a guarded single-state reveal');

if(failures.length){console.error(`Professional polish checks failed with ${failures.length} issue(s):`);failures.forEach(x=>console.error(' - '+x));process.exit(1)}
console.log('Professional polish checks passed: the avionics UI has one boot owner, one stable PilotDesk brand, a guarded first reveal, and no late stylesheet restyling chain.');
