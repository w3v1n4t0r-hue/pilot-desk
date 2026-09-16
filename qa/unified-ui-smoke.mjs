import fs from 'node:fs';

const read=p=>fs.readFileSync(p,'utf8');
const entry=read('assets/styles.css');
const legacy=read('assets/styles-legacy.css');
const hub=read('assets/hub.css');
const experience=read('assets/experience.css');
const tokens=read('assets/design-tokens.css');
const bootstrap=read('assets/app-bootstrap.js');
const nav=read('assets/global-nav.js');
const failures=[];
const need=(text,needle,label)=>{if(!text.includes(needle))failures.push(`${label}: missing ${needle}`)};

const layers=['styles-legacy.css','hub.css','experience.css','design-tokens.css'];
for(const layer of layers)need(entry,`@import url("/assets/${layer}");`,'styles.css');
for(let i=1;i<layers.length;i++)if(entry.indexOf(layers[i-1])>entry.indexOf(layers[i]))failures.push(`styles.css: ${layers[i-1]} must load before ${layers[i]}`);
if(!entry.trim().endsWith('@import url("/assets/design-tokens.css");'))failures.push('styles.css: design-tokens.css must be the final shared cascade layer during migration');
for(const retired of ['unified-ui.css','site-chassis.css','home-visual-system.css','professional-polish.css','avionics-ui.css'])if(entry.includes(retired))failures.push(`styles.css: retired authority layer returned: ${retired}`);

if(legacy.length<10000)failures.push('styles-legacy.css: legacy compatibility payload looks unexpectedly short');
need(legacy,'nav:not(.pd-global-nav):not(.pd-main-nav)','styles-legacy.css mobile nav isolation');
for(const selector of ['.tool-card','.pd-hub-card','.pd-card','.input-wrap','.result','.pd-account-link','.pd-site-search','.pd-home-action'])need(experience,selector,'experience.css');
for(const accessibility of [':focus-visible','min-height:44px','@media(max-width:800px)','@media(max-width:480px)','@media(prefers-reduced-motion:reduce)'])need(experience,accessibility,'experience.css');
for(const namespace of ['--pd-color-canvas','--pd-color-surface-1','--pd-color-text','--pd-color-line','--pd-color-accent','--pd-color-success','--pd-panel','--pd-good'])need(tokens,namespace,'design-tokens.css');
if(/:root\s*\{/.test(legacy)||/:root\s*\{/.test(hub)||/:root\s*\{/.test(experience))failures.push('shared legacy layers must not redeclare the canonical root token palette');

if(bootstrap.includes('loadStyle('))failures.push('app-bootstrap.js: streamlined bootstrap should not rebuild stylesheet precedence at runtime');
if(nav.includes('ensureStyle(')||nav.includes('data-pd-experience'))failures.push('global-nav.js: navigation must not append a stylesheet after design-tokens.css');
for(const retired of ['unified-ui.css','site-chassis.css','home-visual-system.css'])if(bootstrap.includes(retired))failures.push(`app-bootstrap.js: retired CSS finalizer returned: ${retired}`);

for(const page of ['calculators/crosswind/index.html','weather.html','account.html','written-prep.html','route-planner.html','weight-balance.html']){
  const html=read(page);
  need(html,'/assets/styles.css',page);
}

if(failures.length){console.error('Unified UI checks failed:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Unified UI checks passed: PilotDesk uses one canonical stylesheet entrypoint, current shared component styling, final design tokens, and no runtime CSS authority stack.');
