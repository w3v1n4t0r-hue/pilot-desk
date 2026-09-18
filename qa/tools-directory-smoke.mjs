import fs from 'node:fs';

const failures=[];
const check=(ok,msg)=>{if(!ok)failures.push(msg)};
const page=fs.readFileSync('src/pages/tools.astro','utf8');
const js=fs.readFileSync('assets/tools-directory.js','utf8');
const css=fs.readFileSync('assets/experience.css','utf8');
const inventory=JSON.parse(fs.readFileSync('src/data/inventory.json','utf8'));
const calculators=inventory.filter(x=>x.type==='Calculator');

check(page.includes('robots="index,follow"'),'Tools directory should be indexable');
check(page.includes('pdToolDirectorySearch'),'Task-first calculator search missing');
check(page.includes('pdToolChips'),'Quick category filters missing');
check(page.includes('pdToolPersonal'),'Pinned/recent tools section missing');
check(!page.includes('47 tools'),'Hard-coded calculator count returned');
check(js.includes("pd-favorites")&&js.includes("pd-recent"),'Pinned/recent personalization missing');
check(js.includes("'climb-gradient':'climb gradient ft/nm"),'ft/NM search alias missing');
check(js.includes("'wind-triangle':'groundspeed ground speed"),'Groundspeed search alias missing');
check(js.includes("history.replaceState"),'Directory search/filter URL state missing');
check(js.includes("Tool Directory Open")&&js.includes("Tool Directory Filter"),'Directory analytics missing');
check(css.includes('.pd-tool-finder')&&css.includes('.pd-directory-grid'),'Directory visual system missing');
check(css.includes('@media(max-width:650px)'), 'Directory mobile layout guard missing');
check(calculators.length>=40,'Unexpected calculator inventory shrink');

if(failures.length){
  console.error(`Tools directory checks failed with ${failures.length} issue(s):`);
  failures.forEach(x=>console.error(' - '+x));
  process.exit(1);
}
console.log(`Tools directory checks passed across ${calculators.length} inventory calculators plus featured workspaces.`);
