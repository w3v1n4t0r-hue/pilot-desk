import fs from 'node:fs';

const failures=[];
const check=(ok,msg)=>{if(!ok)failures.push(msg)};
const read=p=>fs.readFileSync(p,'utf8');

const home=read('src/pages/index.astro');
const toolsPage=read('src/pages/tools.astro');
const homeCss=read('assets/home-desk.css');
const siteData=read('src/data/site.mjs');
const nav=read('assets/global-nav.js');
const navCore=read('assets/navigation-core.js');
const navCss=read('assets/pilotdesk-navigation-2026.css');
const responsiveCss=read('assets/responsive-polish.css');
const tokens=read('assets/design-tokens.css');
const header=read('src/components/Header.astro');
const styles=read('assets/styles.css');
const legacyCss=read('assets/styles-legacy.css');
const sw=read('sw.js');

for(const phrase of [
  'Your next flight starts here.',
  'Core tools work without an account','FAA, AWC and eCFR references',
  'Common pilot calculations','Three daily questions','Study for the flying you do.',
  'OPTIONAL ACCOUNT','SOURCES','Common questions'
]) check(home.includes(phrase),'Homepage structure/copy changed or missing: '+phrase);
for(const phrase of ['Plan a Flight','Use a Calculator','Study for a Written']) check(siteData.includes(phrase),'Homepage quick-start action missing: '+phrase);
check(home.includes('id="pdHomeSearch"')&&home.includes('<kbd>/</kbd>'),'Homepage slash-search shortcut missing');
check(!/47 Flight Tools|Search 47 browser-based tools/i.test(toolsPage),'Tools directory must not advertise a stale hardcoded inventory count');
check(home.includes('id="pdHomeDesk"')&&home.includes('Pick up where you left off'),'Returning-user resume desk missing');
check(homeCss.includes('.pd-home-desk[hidden]{display:none!important}'),'Returning-user desk does not have restrained active-state emphasis');
check(homeCss.includes('.pd-home-command:hover')&&homeCss.includes('border-color:var(--accent)'),'Slash-search control is not visually discoverable');
check(!/purple|magenta|pink/i.test(homeCss),'Homepage CSS reintroduced purple/pink SaaS color language');
check(!/radial-gradient/i.test(homeCss),'Homepage CSS reintroduced decorative radial gradients');

check(tokens.includes('--accent:#6faed1'),'Aviation-blue accent token missing');
check(tokens.includes('--bg:#050607')&&tokens.includes('--panel:#0c1014'),'Graphite/navy dark surface tokens missing');
check(tokens.includes('background:var(--accent)!important;color:#061018'),'Primary actions do not use the restrained accent token');

const order=['"label":"Tools"','"label":"Plan"','"label":"Weather"','"label":"Learn"'];
let last=-1;
for(const marker of order){const i=navCore.indexOf(marker);check(i>last,'Navigation order must be Tools → Plan → Weather → Learn');last=i}
check(!navCore.includes('"label":"Calculators"'),'Stale Calculators top-level label remains in runtime nav');
for(const item of [
 'Free aviation calculators','E6B flight computer','Weight & balance','Flight math','Calculation history',
 'Route planner','Airport search','Procedures','Aircraft','Saved flights','Flight brief','Aircraft performance',
 'METAR & TAF','METAR decoder','Read METARs & TAFs',
 'Written Prep','Weak subjects','Flight training','Pilot guides','Daily challenge','Checklist practice',
 'ACS & FAR reference','Certificates & ratings','Oral exam guide'
]) check(navCore.includes(item),'Required mega-menu item missing: '+item);
for(const label of ['Tools','Plan','Weather','Learn']) check(nav.includes(label+':')&&header.includes(label+':'),'Aviation glyph missing for '+label);
check(nav.includes('data-section="\${s.label}"'),'Runtime nav lacks section marker for mega-menu layout');
check(navCss.includes('grid-template-columns:repeat(2,minmax(0,1fr))'),'Desktop mega-menu is not grouped into columns');
check(navCss.includes('@media(max-width:820px)')&&navCss.includes('min-height:58px'),'Mobile drawer lacks generous touch targets');
check(navCss.includes('.pd-main-nav.open{display:block!important}'),'Mobile navigation drawer open state missing');
check(!legacyCss.includes('.topbar nav:not(.pd-global-nav){'),'Legacy bottom-dock rule must not force the closed main navigation visible');
check(nav.includes("pathname==='/assets/styles.css'"),'Global navigation must reuse the shared stylesheet bundle instead of appending duplicate experience.css');
check(nav.includes('function setMobileNavOpen(nav,menu,open)'),'All mobile drawer close paths must update its accessible label and expanded state together');
check(navCss.includes('.pd-header-actions{width:auto!important;order:initial!important;flex:0 0 auto!important'),'Mobile account controls must remain in the header row');
check(!navCss.includes('.pd-account-text{display:none!important}')&&!responsiveCss.includes('.pd-account-text{display:none!important}'),'Phone navigation must keep a visible account control when the signed-out avatar is hidden');
check(navCss.includes('color:var(--accent)'),'Navigation active/search states do not use restrained aviation-blue accent');
check(styles.includes('@import url("/assets/pilotdesk-navigation-2026.css");'),'Navigation stylesheet not loaded');
check(styles.trim().endsWith('@import url("/assets/design-tokens.css");'),'Design tokens must remain final shared CSS authority');
check(sw.includes("'/assets/pilotdesk-navigation-2026.css'"),'EFB navigation stylesheet is not available in the offline shell');
check(Number(sw.match(/CACHE='pilotdesk-v(\d+)'/)?.[1]||0)>=44,'Step 1 service-worker release version was not advanced');

if(failures.length){
  console.error('Claude Step 1 home/navigation smoke failed ('+failures.length+')');
  failures.forEach(x=>console.error(' - '+x));
  process.exit(1);
}
console.log('Claude Step 1 home/navigation smoke passed.');
