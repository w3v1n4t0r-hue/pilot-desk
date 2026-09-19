import fs from 'node:fs';

const read=p=>fs.readFileSync(p,'utf8');
const css=read('assets/experience.css');
const tokens=read('assets/design-tokens.css');
const entry=read('assets/styles.css');
const bootstrap=read('assets/app-bootstrap.js');
const crosswind=read('assets/crosswind-mfd.js');
const brand=read('assets/brand.js');
const sw=read('sw.js');
const failures=[];
const check=(ok,msg)=>{if(!ok)failures.push(msg)};

check(css.length>5000,'current shared experience stylesheet is unexpectedly small');
for(const selector of ['.topbar','.hero','.tool-card','.calc-box','.input-wrap','.result','footer'])check(css.includes(selector),`experience.css is missing ${selector}`);
check(css.includes('@media(max-width:800px)')&&css.includes('@media(max-width:480px)'),'experience.css needs explicit tablet/mobile treatment');
check(css.includes('@media(prefers-reduced-motion:reduce)'),'experience.css must respect reduced motion');
check(css.includes(':focus-visible'),'experience.css must preserve visible keyboard focus');
check(css.includes('min-height:44px'),'current UI must preserve touch-friendly control sizing');

for(const token of ['--bg:#050505','--panel:#0d0d0f','--text:#f4f3ee','--line:#29292d','--pd-cut:9px','--pd-good:#5ecf89'])check(tokens.includes(token),`design token layer missing ${token}`);
for(const guard of ['body:before{','animation:none','clip-path:polygon','@keyframes pd-menu-in','@media(prefers-reduced-motion:reduce)','.pd-live-dot'])check(tokens.includes(guard),`design token/motion layer missing ${guard}`);
check(entry.trim().endsWith('@import url("/assets/design-tokens.css");'),'design-tokens.css must remain the final shared cascade authority');
check(tokens.includes('Resend-inspired restraint')&&tokens.includes('square controls and clipped corners'),'shared visual system must preserve the Resend/aviation geometry brief');
check(tokens.includes('border-radius:0!important')&&tokens.includes('--pd-radius:3px'),'visual system should avoid generic rounded dashboard cards');
check(tokens.includes('background:#f0efe9!important')&&tokens.includes('color:#070707!important'),'primary action treatment should use the eggshell/iron material palette');
check(entry.includes('/assets/experience.css'),'shared stylesheet must include the current experience layer');

for(const retired of ['professional-polish.css','avionics-architecture.css','avionics-ops.css','avionics-command.js','product-polish.js'])check(!bootstrap.includes(`/assets/${retired}`),`retired visual layer returned to bootstrap: ${retired}`);
check(!bootstrap.includes('pd-ui-booting')&&!bootstrap.includes('visibility:hidden'),'current shell must not hide static content behind a boot gate');
check(bootstrap.includes('/assets/crosswind-mfd.js'),'crosswind calculator should retain its focused instrument visualization');
check(read('assets/site.js').includes("polishInteractions();document.documentElement.classList.add('pd-ready')"),'shared motion system must initialize the one-shot interaction polish');
check(read('scripts/shared-shell.mjs').includes('/assets/icon.svg'),'shared shell must use the canonical PilotDesk aircraft/math logo');

for(const sentinel of ['RUNWAY / WIND VECTOR','data-runway-group','data-wind-group','gustSpeed','Math.sin(rad)','Math.cos(rad)','15 KTS IS NOT A UNIVERSAL AIRCRAFT LIMIT'])check(crosswind.includes(sentinel),`crosswind MFD missing ${sentinel}`);

check(!brand.includes('addStyle('),'brand module must not inject a second visual stylesheet stack');
check(brand.includes("img.src='/assets/icon.svg'")&&brand.includes("word.textContent='PilotDesk'")&&brand.includes("tag.textContent='FLIGHT TOOLS'"),'brand module must normalize the PilotDesk identity');
for(const asset of ['/assets/styles.css','/assets/experience.css','/assets/design-tokens.css','/assets/crosswind-mfd.js'])check(sw.includes(`'${asset}'`),`service worker missing current visual asset ${asset}`);

if(failures.length){console.error(`Professional visual checks failed with ${failures.length} issue(s):`);failures.forEach(x=>console.error(' - '+x));process.exit(1)}
console.log('Professional visual checks passed: current shared experience layer, canonical tokens, accessibility, restrained motion, brand, and calculator visualization are intact without retired UI stacks.');
