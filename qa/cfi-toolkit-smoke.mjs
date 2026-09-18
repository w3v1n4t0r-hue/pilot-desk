import fs from 'node:fs';

const failures=[];
const check=(ok,msg)=>{if(!ok)failures.push(msg)};
const page=fs.readFileSync('for-cfis.html','utf8');
const js=fs.readFileSync('assets/cfi-toolkit.js','utf8');
const css=fs.readFileSync('assets/experience.css','utf8');
const checklist=fs.readFileSync('checklist-trainer.html','utf8');
const poh=fs.readFileSync('poh-chart-studio.html','utf8');

for(const needle of [
  'Teach the decision, then check the math.',
  '5-MINUTE SCENARIOS',
  'Copy student prompt',
  'Copy student link',
  'A repeatable way to use PilotDesk with a student.',
  'Finish at the source.'
])check(page.includes(needle),`CFI toolkit missing: ${needle}`);

for(const scenario of ['crosswind','density-altitude','weight-balance','ifr-descent','multi','oral']){
  check(page.includes(`data-cfi-scenario="${scenario}"`),`CFI scenario missing: ${scenario}`);
}

check(page.includes('/assets/cfi-toolkit.js'),'CFI toolkit script missing from page');
check(js.includes('CFI Student Prompt Copied'),'Prompt-copy analytics missing');
check(js.includes('CFI Student Link Copied'),'Student-link analytics missing');
check(js.includes('CFI Toolkit Shared'),'Toolkit-share analytics missing');
check(js.includes('navigator.share'),'Native share support missing');
check(css.includes('.pd-cfi-scenario-grid'),'CFI scenario layout missing');
check(css.includes('.pd-cfi-workflow'),'CFI lesson workflow styling missing');
check(css.includes('@media(max-width:700px)'),'CFI mobile layout guard missing');

for(const [name,html] of [['Checklist Trainer',checklist],['POH Chart Studio',poh]]){
  check(html.includes('<img src="/assets/icon.svg"'),`${name} does not use official PilotDesk logo`);
  check(!html.includes('viewBox="0 0 64 40"'),`${name} retired inline airplane logo returned`);
}

if(failures.length){
  console.error(`CFI toolkit checks failed with ${failures.length} issue(s):`);
  failures.forEach(x=>console.error(' - '+x));
  process.exit(1);
}
console.log('CFI toolkit checks passed: student scenarios, copy/share handoffs, lesson workflow, analytics, mobile treatment, and supporting-tool branding verified.');
