import fs from 'node:fs';

const read=p=>fs.readFileSync(p,'utf8');
const home=read('src/pages/index.astro');
const tools=read('src/pages/tools.astro');
const data=read('src/data/site.mjs');
const experience=read('assets/experience.css');
const bootstrap=read('assets/app-bootstrap.js');
const calculator=read('calculators/crosswind/index.html');
const sw=read('sw.js');
const vercel=JSON.parse(read('vercel.json'));
const failures=[];
const check=(ok,msg)=>{if(!ok)failures.push(msg)};

for(const task of ['Plan a Flight','Use a Calculator','Study for a Written'])check(home.includes(task),`Astro homepage missing primary task ${task}`);
check(home.includes('data-pd-home-account'),'homepage must keep account discovery near primary tasks');
check(home.includes('Popular tools')&&home.includes('Explore PilotDesk'),'homepage must preserve fast tool discovery without dumping the full inventory');
check(data.includes("['/daily/', 'Play Daily'"),'shared homepage model must retain Daily as a fourth task');
check(tools.includes('pdToolDirectorySearch')&&tools.includes('pdToolDirectoryGroup')&&tools.includes('/assets/tools-directory.js'),'calculator directory must remain searchable/filterable');
check(tools.includes('47 tools'),'calculator directory count must match the standard calculator inventory');

for(const responsive of ['.pd-home-actions{','@media(max-width:800px)','@media(max-width:480px)','min-height:44px'])check(experience.includes(responsive),`current experience layer missing task-first/mobile safeguard ${responsive}`);
for(const retired of ['tool-first-layout.js','performance.js','home-command-center.js'])check(!bootstrap.includes(`/assets/${retired}`),`retired runtime layout optimizer returned: ${retired}`);
check(bootstrap.includes('/assets/calculator-ux.js'),'calculator-specific QoL must remain route-scoped in the streamlined bootstrap');

check(calculator.includes('data-calculate')&&calculator.includes('class="info-card"')&&calculator.includes('class="formula"'),'calculator must retain operational controls plus visible reference and formula content');
check(sw.includes('...GENERATED_CALCULATORS'),'all calculators must be deterministically available to the offline worker');
check(vercel.git?.deploymentEnabled?.main===true&&vercel.git?.deploymentEnabled?.['*']===false,'non-production branches must not spend Vercel deployments');

if(failures.length){console.error(`Tool-first optimization checks failed with ${failures.length} issue(s):`);failures.forEach(x=>console.error(' - '+x));process.exit(1)}
console.log('Tool-first optimization checks passed: Astro keeps primary tasks concise, calculator discovery searchable, mobile controls usable, and retired runtime layout stacks out.');
