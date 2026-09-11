import fs from 'node:fs';

const read=p=>fs.readFileSync(p,'utf8');
const layout=read('assets/tool-first-layout.js');
const perf=read('assets/performance.css');
const perfJs=read('assets/performance.js');
const bootstrap=read('assets/app-bootstrap.js');
const index=read('index.html');
const calculator=read('calculators/crosswind/index.html');
const vercel=JSON.parse(read('vercel.json'));
const failures=[];
const check=(ok,msg)=>{if(!ok)failures.push(msg)};

for(const needle of ['Popular tools','Your saved tools &amp; history','Formula, method &amp; examples','pd-home-library','pd-learn-panel'])check(layout.includes(needle),`tool-first layout missing ${needle}`);
check(layout.includes("insertAdjacentElement('afterend',search)"),'homepage search should move directly behind quick start/hero');
check(layout.includes("href==='/sources.html'")&&layout.includes("href==='/legal/privacy.html'"),'homepage utility nav should move secondary links out of the primary navigation');
check(layout.includes('seen.has(href)'),'related-tool duplicates should be removed');
check(perf.includes('-webkit-line-clamp:2'),'tool descriptions should remain compact');
check(perf.includes('content-visibility:auto'),'long pages should skip off-screen rendering work where supported');
check(perf.includes('font-size:16px!important'),'mobile form inputs should avoid iOS zoom');
check(perfJs.includes("rel='prefetch'")&&perfJs.includes('saveData'),'fast connections should prefetch a small number of likely next pages without ignoring data-saver');
check(bootstrap.includes("load('/assets/tool-first-layout.js','pd-tool-first')"),'tool-first layout must load from app bootstrap');
check(bootstrap.includes("load('/assets/performance.js','pd-performance')"),'performance helper must load from app bootstrap');
check(index.includes('id="toolSearch"')&&index.includes('section class="category"'),'homepage must retain the original search and calculator inventory');
check(calculator.includes('data-calculate')&&calculator.includes('data-pd-seo-depth'),'calculator must retain both operational controls and reference content');
check(vercel.git?.deploymentEnabled?.main===true&&vercel.git?.deploymentEnabled?.['*']===false,'optimization branches must not spend Vercel deployments');

if(failures.length){console.error(`Tool-first optimization checks failed with ${failures.length} issue(s):`);failures.forEach(x=>console.error(' - '+x));process.exit(1)}
console.log('Tool-first optimization checks passed: calculators stay primary, supporting content is progressive, mobile inputs are stable, performance helpers are bounded, and previews remain disabled.');
