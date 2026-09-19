import fs from 'node:fs';

const failures=[];
const check=(ok,msg)=>{if(!ok)failures.push(msg)};
const home=fs.readFileSync('src/pages/index.astro','utf8');
const exp=fs.readFileSync('assets/experience.js','utf8');
const css=fs.readFileSync('assets/experience.css','utf8');

for(const goal of ['plan','calculate','study','teach']){
  check(home.includes('data-pd-first-goal="'+goal+'"'),'Homepage missing first-run goal: '+goal);
}
check(home.includes('What are you working on?'),'Homepage first-run question missing');
check(home.includes('pdFirstRunSelected'),'Selected-goal shortcut missing');
check(exp.includes("const key='pd-first-run-goal'"),'First-run choice is not persisted locally');
check(exp.includes("pdTrack?.('First Run Goal'"),'First-run goal analytics missing');
check(exp.includes("pdTrack?.('First Run Continue'"),'First-run continue analytics missing');
check(exp.includes("pdTrack?.('First Run Goal Reset'"),'First-run reset analytics missing');
check(exp.includes('firstRun();resume();'),'First-run initialization order missing');
check(css.includes('.pd-first-run-grid'),'First-run layout styling missing');
check(css.includes('@media(max-width:560px)'),'First-run mobile guard missing');

if(failures.length){
  console.error('First-run experience checks failed with '+failures.length+' issue(s):');
  failures.forEach(x=>console.error(' - '+x));
  process.exit(1);
}
console.log('First-run experience checks passed: four task paths, persistent shortcut, reset, analytics, and mobile layout verified.');
