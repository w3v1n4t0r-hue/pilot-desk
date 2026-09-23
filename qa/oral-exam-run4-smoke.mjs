import fs from 'node:fs';
import vm from 'node:vm';

const failures=[];
const check=(condition,message)=>{if(!condition)failures.push(message)};
const html=fs.readFileSync('learn/oral-exam/index.html','utf8');
const script=fs.readFileSync('assets/oral-exam-workbench.js','utf8');
const answersScript=fs.readFileSync('assets/oral-exam-answers.js','utf8');
const shell=fs.readFileSync('assets/learn-shell.js','utf8');
const bootstrap=fs.readFileSync('assets/app-bootstrap.js','utf8');
const context={window:{}};
vm.runInNewContext(answersScript,context,{filename:'oral-exam-answers.js'});
const answers=context.window.PilotDeskOralAnswers;

for(const track of ['private','instrument','commercial','multi','cfi','cfii']){
  check(html.includes(`data-track="${track}"`),`${track}: missing rating selection`);
  check(answers[track]&&Object.keys(answers[track]).length>=2,`${track}: fewer than two sourced model answers`);
  for(const answer of Object.values(answers[track]||{})){
    check(answer.area&&answer.task&&answer.short&&answer.why&&answer.follow,`${track}: missing answer structure or ACS/PTS connection`);
    check(answer.sources?.every(([label,url])=>label&&/^https:\/\/(www\.faa\.gov|www\.ecfr\.gov)\//.test(url)),`${track}: source is not an official FAA/eCFR link`);
  }
}
check(answers.instrument[2].short.includes('alternate')&&answers.instrument[2].sources.some(([label])=>label.includes('91.169')),'Alternate minimums source missing');
check(answers.private[1].sources.some(([label])=>label.includes('91.205')),'91.205 source missing');
for(const id of ['pdOralSearch','pdOralList','pdOralModeHelp'])check(html.includes(`id="${id}"`),`Missing ${id}`);
for(const mode of ['study','oral','quiz','weak'])check(html.includes(`data-oral-mode="${mode}"`),`Missing ${mode} mode`);
check(html.indexOf('oral-exam-answers.js')<html.indexOf('oral-exam-workbench.js'),'Answer data must load before workbench');
check(script.includes('pd-oral-practice-v1')&&script.includes('localStorage.setItem'),'Practice history is not persisted');
check(script.includes('if(query&&!haystack.includes(query))return'),'Topic/source search missing');
for(const route of ['/learn/checkride-lab/','/learn/study-plan/','/learn/coverage/'])check(shell.includes(route),`Learn navigation missing ${route}`);
check(bootstrap.includes("path.startsWith('/learn/')"),'Learn navigation is not initialized on all Learn pages');

if(failures.length){console.error(failures.join('\n'));process.exit(1)}
console.log('Run 4 oral guide source, rating, mode, search, progress, and Learn navigation checks passed.');
