import fs from 'node:fs';

const failures=[];
const check=(ok,msg)=>{if(!ok)failures.push(msg)};
const home=fs.readFileSync('src/pages/index.astro','utf8');
const desk=fs.readFileSync('assets/home-desk.js','utf8');
const css=fs.readFileSync('assets/home-desk.css','utf8');
const sw=fs.readFileSync('sw.js','utf8');

check(home.includes('<HeroPrototype />'),'Approved task hero is missing');
check(fs.readFileSync('src/components/HeroPrototype.astro','utf8').includes('/route-planner.html'),'Route-planning destination is missing');
check(fs.readFileSync('src/components/Header.astro','utf8').includes('data-pd-account-link'),'Account discovery is missing');
check(!home.includes('pd-first-run-grid'),'Duplicate first-run task grid returned');

for(const key of ['pd-aircraft','pd-aircraft-active','pd-saved-flights','pd-favorites','pd-recent']){
  check(desk.includes(key),'Home desk does not read '+key);
}
for(const label of ['ACTIVE AIRCRAFT','LATEST FLIGHT','PINNED TOOL','RECENT TOOL']){
  check(desk.includes(label),'Home desk missing return action '+label);
}
check(desk.includes("window.pdTrack?.('Home Desk Open'"),'Home desk analytics missing');
check(css.includes('.pd-home-desk-grid'),'Home desk layout styling missing');
check(css.includes('grid-template-columns:1fr 1fr')&&desk.includes('section.hidden=items.length===0'),'Home desk must fit mobile and stay hidden without real activity');
check(sw.includes('/assets/home-desk.js')&&sw.includes('/assets/home-desk.css'),'Home desk is not available in the offline shell');

if(failures.length){
  console.error('Homepage return-to-work checks failed with '+failures.length+' issue(s):');
  failures.forEach(x=>console.error(' - '+x));
  process.exit(1);
}
console.log('Homepage task discovery, account access, and retained saved-work runtime checks passed.');
