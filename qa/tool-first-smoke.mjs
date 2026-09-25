import fs from 'node:fs';

const read=p=>fs.readFileSync(p,'utf8');
const home=read('src/pages/index.astro');
const tools=read('src/pages/tools.astro');
const data=read('src/data/site.mjs');
const experience=read('assets/experience.css');
const homeCss=read('assets/home-desk.css');
const styles=read('assets/styles.css');
const bootstrap=read('assets/app-bootstrap.js');
const calculator=read('calculators/crosswind/index.html');
const sw=read('sw.js');
const vercel=JSON.parse(read('vercel.json'));
const failures=[];
const check=(ok,msg)=>{if(!ok)failures.push(msg)};

for(const task of ['Plan a Flight','Use a Calculator','Study for a Written'])check(data.includes(task),`shared homepage data missing primary task ${task}`);
check(home.includes('pd-home-hero-links')&&home.includes('pdHomeWind'),'Homepage must preserve primary actions and the interactive tool example');
check(home.includes('data-pd-home-account'),'homepage must keep account discovery near primary tasks');
check(home.includes('id="popular-tools"')&&home.includes('id="pdHomeDesk"')&&home.includes('/tools.html'),'homepage must preserve fast tool discovery without dumping the full inventory');
check(data.includes("['/daily/', 'Play Daily'"),'shared homepage model must retain Daily as a fourth task');
check(tools.includes('pdToolDirectorySearch')&&tools.includes('pdToolDirectoryGroup')&&tools.includes('/assets/tools-directory.js'),'calculator directory must remain searchable/filterable');
check(tools.includes('pdToolCount')&&!tools.includes('47 tools'),'calculator directory must use the live inventory count instead of a hard-coded total');

for(const responsive of ['.pd-home-actions{','@media(max-width:800px)','@media(max-width:480px)','min-height:44px'])check(experience.includes(responsive),`current experience layer missing task-first/mobile safeguard ${responsive}`);
check(!styles.includes('/assets/home-polish.css'),'obsolete competing homepage CSS layer must stay out of the shared cascade');
for(const guard of ['margin:0!important','grid-template-columns:1fr!important','@media(max-width:1040px)','max-width:100%!important'])check(homeCss.includes(guard),`homepage layout guard missing ${guard}`);
check(!/margin\s*:\s*0\s+calc\(50%\s*-\s*50vw\)/i.test(homeCss),'homepage hero must not use negative viewport margins');
for(const retired of ['tool-first-layout.js','performance.js','home-command-center.js'])check(!bootstrap.includes(`/assets/${retired}`),`retired runtime layout optimizer returned: ${retired}`);
check(bootstrap.includes('/assets/calculator-ux.js'),'calculator-specific QoL must remain route-scoped in the streamlined bootstrap');

check(calculator.includes('data-calculate')&&calculator.includes('class="info-card"')&&(calculator.includes('class="formula"')||calculator.includes('Formula and method')),'calculator must retain operational controls plus visible reference and formula content');
check(sw.includes('...GENERATED_CALCULATORS'),'all calculators must be deterministically available to the offline worker');
check(vercel.git?.deploymentEnabled?.main===true&&vercel.git?.deploymentEnabled?.['*']===false,'non-production branches must not spend Vercel deployments');

if(failures.length){console.error(`Tool-first optimization checks failed with ${failures.length} issue(s):`);failures.forEach(x=>console.error(' - '+x));process.exit(1)}
console.log('Tool-first optimization checks passed: Astro keeps primary tasks concise, calculator discovery searchable, mobile controls usable, and retired runtime layout stacks out.');

