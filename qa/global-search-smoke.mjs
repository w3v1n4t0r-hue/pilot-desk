import fs from 'node:fs';
import vm from 'node:vm';

const failures=[];
const check=(ok,msg)=>{if(!ok)failures.push(msg)};
const nav=fs.readFileSync('assets/global-nav.js','utf8');
const intel=fs.readFileSync('assets/search-intelligence.js','utf8');
const searchData=fs.readFileSync('assets/navigation-search.js','utf8');
const css=fs.readFileSync('assets/experience.css','utf8');

const context={window:{}};
vm.createContext(context);
vm.runInContext(searchData,context);
vm.runInContext(intel,context);
const engine=context.window.PilotDeskSearch;
check(Boolean(engine?.rank),'Search intelligence did not initialize');

const cases=[
 ['how much crosswind','/calculators/crosswind/'],
 ['3 degree descent','/calculators/three-degree-descent/'],
 ['VMC','/guides/vmc-vs-vyse.html'],
 ['IFR alternate','/guides/ifr-alternate-requirements.html'],
 ['CG','/weight-balance.html'],
 ['hot day performance','/calculators/density-altitude/'],
 ['oral prep','/learn/oral-exam/'],
 ['groundspeed','/calculators/wind-triangle/']
];
for(const [query,expected] of cases){
 const hits=engine?.rank(query,context.window.PILOTDESK_NAV_SEARCH,8)||[];
 check(hits[0]?.href===expected,`Search "${query}" should rank ${expected} first; got ${hits[0]?.href||'nothing'}`);
}

check(nav.includes("/assets/search-intelligence.js"),'Global nav does not lazy-load search intelligence');
check(nav.includes("placeholder=\"Crosswind, VMC, IFR alternate…\""),'Task-oriented search placeholder missing');
check(nav.includes("e.key==='ArrowDown'")&&nav.includes("e.key==='ArrowUp'"),'Keyboard result navigation missing');
check(nav.includes("e.key==='/'"),'Slash-to-search shortcut missing');
check(nav.includes('pd-search-suggest'),'Quick search suggestions missing');
check(nav.includes("pdTrack?.('Site Search Open'"),'Search-result analytics missing');
check(!nav.includes("query:search.value")&&!nav.includes("query: search.value"),'Free-text search query must not be sent to analytics');
check(css.includes('.pd-search-suggestion'),'Search suggestion styling missing');
check(css.includes('.pd-search-results a.active'),'Active keyboard-result styling missing');
check(css.includes('@media(max-width:760px)'),'Mobile search-results treatment missing');

if(failures.length){
 console.error('Global Search 2.0 checks failed with '+failures.length+' issue(s):');
 failures.forEach(x=>console.error(' - '+x));
 process.exit(1);
}
console.log('Global Search 2.0 checks passed: pilot-intent ranking, keyboard navigation, suggestions, privacy-safe analytics, and mobile UI verified.');
