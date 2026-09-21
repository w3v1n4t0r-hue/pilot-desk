import fs from 'node:fs';

const read=p=>fs.readFileSync(p,'utf8');
const entry=read('assets/styles.css');
const legacy=read('assets/styles-legacy.css');
const hub=read('assets/hub.css');
const experience=read('assets/experience.css');
const tokens=read('assets/design-tokens.css');
const visual=read('assets/visual-system.css');
const routePlanner=read('assets/route-planner.css');
const account=read('assets/account.css');
const pricing=read('assets/pricing.css');
const weather=read('assets/weather.css');
const bootstrap=read('assets/app-bootstrap.js');
const failures=[];
const need=(text,needle,label)=>{if(!text.includes(needle))failures.push(`${label}: missing ${needle}`)};

const layers=['styles-legacy.css','hub.css','experience.css','design-tokens.css'];
for(const layer of layers)need(entry,`@import url("/assets/${layer}");`,'styles.css');
for(let i=1;i<layers.length;i++)if(entry.indexOf(layers[i-1])>entry.indexOf(layers[i]))failures.push(`styles.css: ${layers[i-1]} must load before ${layers[i]}`);
if(!entry.trim().endsWith('@import url("/assets/design-tokens.css");'))failures.push('styles.css: design-tokens.css must be the final shared cascade layer during migration');
for(const retired of ['unified-ui.css','site-chassis.css','home-visual-system.css','professional-polish.css','avionics-ui.css','professional-shell.css'])if(entry.includes(retired))failures.push(`styles.css: retired authority layer returned: ${retired}`);
need(visual,'html.pd-streamlined-app','visual-system.css');
need(visual,'font-variant-numeric:tabular-nums','visual-system.css');
need(visual,'font-size:clamp(30px,3.2vw,42px)','visual-system.css');
if(/backdrop-filter\s*:\s*blur/i.test(routePlanner))failures.push('route-planner.css: glass blur returned');
for(const [name,css] of [['account.css',account],['pricing.css',pricing],['weather.css',weather]])if(/(?:radial-gradient|linear-gradient)/i.test(css))failures.push(`${name}: decorative gradient returned`);

if(legacy.length<10000)failures.push('styles-legacy.css: legacy compatibility payload looks unexpectedly short');
for(const selector of ['.tool-card','.pd-hub-card','.pd-card','.input-wrap','.result','.pd-account-link','.pd-site-search','.pd-home-action'])need(experience,selector,'experience.css');
for(const accessibility of [':focus-visible','min-height:44px','@media(max-width:800px)','@media(max-width:480px)','@media(prefers-reduced-motion:reduce)'])need(experience,accessibility,'experience.css');
for(const namespace of ['--pd-panel','--pd-line','--pd-text','--pd-accent','--pd-good','--pd-warn'])need(tokens,namespace,'design-tokens.css');
need(hub,'--pd-panel','hub.css');

if(bootstrap.includes('loadStyle('))failures.push('app-bootstrap.js: streamlined bootstrap should not rebuild stylesheet precedence at runtime');
for(const retired of ['unified-ui.css','site-chassis.css','home-visual-system.css'])if(bootstrap.includes(retired))failures.push(`app-bootstrap.js: retired CSS finalizer returned: ${retired}`);

for(const page of ['calculators/crosswind/index.html','weather.html','account.html','written-prep.html','route-planner.html','weight-balance.html']){
  const html=read(page);
  need(html,'/assets/styles.css',page);
}

if(failures.length){console.error('Unified UI checks failed:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Unified UI checks passed: PilotDesk uses one canonical stylesheet entrypoint, current shared component styling, final design tokens, and no runtime CSS authority stack.');
