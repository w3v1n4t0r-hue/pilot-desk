import fs from 'node:fs';
import path from 'node:path';

const dist='dist';
if(!fs.existsSync(dist)){
  console.error('Deep audit: dist/ missing; run npm run build first.');
  process.exit(1);
}

const files=[];
const walk=d=>{for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name);if(e.isDirectory())walk(p);else if(e.isFile()&&e.name.endsWith('.html'))files.push(p)}};
walk(dist);

const hard=[],notes=[];
const add=(arr,iteration,file,msg)=>arr.push({iteration,file,msg});
const strip=s=>String(s||'')
  .replace(/<script\b[\s\S]*?<\/script>/gi,' ')
  .replace(/<style\b[\s\S]*?<\/style>/gi,' ')
  .replace(/<svg\b[\s\S]*?<\/svg>/gi,' ')
  .replace(/<[^>]+>/g,' ')
  .replace(/&(?:nbsp|amp|quot|#39|apos);/gi,' ')
  .replace(/\s+/g,' ').trim();
const withoutShell=html=>html
  .replace(/<header\b[\s\S]*?<\/header>/gi,' ')
  .replace(/<footer\b[\s\S]*?<\/footer>/gi,' ');
const metaTags=html=>[...html.matchAll(/<meta\b[^>]*>/gi)].map(m=>m[0]);
const attr=(tag,name)=>{
  const m=String(tag||'').match(new RegExp('\\b'+name+'=(["\\\'])(.*?)\\1','i'));
  return m?.[2]||'';
};
const meta=(html,name)=>{
  const tag=metaTags(html).find(t=>attr(t,'name').toLowerCase()===name.toLowerCase());
  return tag?attr(tag,'content'):'';
};
const indexable=html=>{
  const tokens=meta(html,'robots').toLowerCase().split(',').map(x=>x.trim()).filter(Boolean);
  return tokens.includes('index')&&!tokens.includes('noindex');
};
const norm=s=>strip(s).toLowerCase().replace(/[“”‘’]/g,"'").replace(/[^a-z0-9%+./' -]/g,'').replace(/\s+/g,' ').trim();
const htmlByFile=new Map(files.map(f=>[f,fs.readFileSync(f,'utf8')]));

// ITERATION 1 — copy individuality and human rhythm.
const paragraphOwners=new Map();
const headingOwners=new Map();
for(const [file,html] of htmlByFile){
  const body=withoutShell(html);
  for(const m of body.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)){
    const raw=strip(m[1]), key=norm(raw);
    if(raw.length<120) continue;
    if(/planning (?:and|&) training aid only|verify operational information with current approved sources/i.test(raw)) continue;
    if(!paragraphOwners.has(key))paragraphOwners.set(key,{raw,files:new Set()});
    paragraphOwners.get(key).files.add(file);
  }
  for(const m of body.matchAll(/<h2\b[^>]*>([\s\S]*?)<\/h2>/gi)){
    const raw=strip(m[1]),key=norm(raw);
    if(!key)continue;
    if(!headingOwners.has(key))headingOwners.set(key,{raw,files:new Set()});
    headingOwners.get(key).files.add(file);
  }
}
for(const {raw,files:owners} of paragraphOwners.values()){
  if(owners.size>=5)add(hard,1,[...owners][0],`same long paragraph appears on ${owners.size} pages: "${raw.slice(0,120)}…"`);
}
for(const {raw,files:owners} of headingOwners.values()){
  if(owners.size>=8&&!/^(sources?|common questions|related tools|how it works|what it means|formula and method|worked example setup|what the result means|common mistakes to avoid|sources and limitations|related pilotdesk guides|related pilotdesk tools|worked example|source check|checks for this workflow|training use for this tool|continue from here)$/i.test(raw))
    add(hard,1,[...owners][0],`same section heading appears on ${owners.size} pages: "${raw}"`);
}
for(const [file,html] of htmlByFile){
  const body=withoutShell(html),text=strip(body);
  if(/\b(?:simply|just) (?:click|enter|select)\b/i.test(text))add(notes,1,file,'instruction copy may be over-simplified or repetitive');
  const prose=[...body.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)].map(m=>strip(m[1])).filter(x=>x.length>25).join(' ');
  const sentences=prose.split(/[.!?]+\s+/).map(x=>x.trim()).filter(x=>x.length>25);
  let sameStarts=0;
  for(let i=2;i<sentences.length;i++){
    const starts=sentences.slice(i-2,i+1).map(s=>s.split(/\s+/).slice(0,2).join(' ').toLowerCase());
    if(new Set(starts).size===1)sameStarts++;
  }
  if(sameStarts>=2)add(notes,1,file,'several prose sentences in a row begin with the same two words');
}

// ITERATION 2 — visual language and anti-template structure.
for(const [file,html] of htmlByFile){
  const styles=[...html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)].map(m=>m[1]).join('\n');
  if(/radial-gradient/i.test(styles))add(hard,2,file,'decorative radial gradient in page-local CSS');
  if(/backdrop-filter\s*:\s*blur/i.test(styles))add(hard,2,file,'glass blur in page-local CSS');
  if(/box-shadow\s*:\s*(?!none)(?:[^;}]+)/i.test(styles))add(notes,2,file,'page-local box shadow should be justified as real elevation');
  const cards=(html.match(/class=["'][^"']*(?:\bcard\b|\bpanel\b|\btile\b|info-card|feature-card)[^"']*["']/gi)||[]).length;
  const h2=(html.match(/<h2\b/gi)||[]).length;
  const text=strip(withoutShell(html));
  const words=(text.match(/\b[\w'-]+\b/g)||[]).length;
  if(cards>=16&&cards>h2*2&&words<1000)add(hard,2,file,`card/panel density is too high (${cards} surfaces, ${h2} H2s, ${words} words)`);
  if(/font-size\s*:\s*(?:5[6-9]|[6-9]\d|1\d\d)px/i.test(styles)&&!/clamp\(/i.test(styles))
    add(notes,2,file,'large fixed typography in page-local CSS; review startup-hero feel');
}
const cssFiles=['assets/design-tokens.css','assets/experience.css','assets/visual-system.css','assets/consistency.css','assets/home-polish.css','assets/responsive-polish.css'].filter(fs.existsSync);
for(const cssFile of cssFiles){
  const css=fs.readFileSync(cssFile,'utf8');
  if(/radial-gradient/i.test(css))add(hard,2,cssFile,'decorative radial gradient remains in shared CSS');
  if(/backdrop-filter\s*:\s*blur/i.test(css))add(hard,2,cssFile,'shared glass blur remains');
  if(/@keyframes\s+[^\{]*(glow|pulse)[^\{]*\{/i.test(css))add(notes,2,cssFile,'review continuous glow/pulse animation');
}

// ITERATION 3 — interaction and accessibility.
for(const [file,html] of htmlByFile){
  for(const m of html.matchAll(/<img\b[^>]*>/gi))if(!/\balt\s*=/i.test(m[0]))add(hard,3,file,'image missing alt attribute');
  for(const m of html.matchAll(/<iframe\b[^>]*>/gi))if(!/\btitle\s*=/i.test(m[0]))add(hard,3,file,'iframe missing title');
  for(const m of html.matchAll(/<a\b[^>]*target=["']_blank["'][^>]*>/gi))if(!/\brel=["'][^"']*noopener/i.test(m[0]))add(hard,3,file,'target=_blank link missing rel=noopener');
  const ids=[...html.matchAll(/\bid=["']([^"']+)["']/gi)].map(m=>m[1]);
  const dup=[...new Set(ids.filter((x,i)=>ids.indexOf(x)!==i))];
  if(dup.length)add(hard,3,file,'duplicate element id(s): '+dup.slice(0,8).join(', '));
  for(const m of html.matchAll(/<button\b([^>]*)>/gi))if(!/\btype=["'](?:button|submit|reset)["']/i.test(m[1]))add(notes,3,file,'button missing explicit type');
  const labels=[...html.matchAll(/<label\b[^>]*for=["']([^"']+)["']/gi)].map(m=>m[1]);
  for(const m of html.matchAll(/<(input|select|textarea)\b([^>]*)>/gi)){
    const tag=m[0],attrs=m[2],id=attr(tag,'id'),type=attr(tag,'type').toLowerCase();
    if(type==='hidden')continue;
    const hasName=/\baria-label\s*=|\baria-labelledby\s*=/i.test(attrs)|| (id&&labels.includes(id));
    const before=html.slice(0,m.index);
    const wrapped=before.lastIndexOf('<label')>before.lastIndexOf('</label>');
    if(!hasName&&!wrapped)add(notes,3,file,`${m[1]} may not have an accessible label${id?` (#${id})`:''}`);
  }
}

// ITERATION 4 — mobile, motion and performance discipline.
for(const [file,html] of htmlByFile){
  if(!/<meta\b[^>]*name=["']viewport["']/i.test(html))add(hard,4,file,'missing viewport meta');
  const styles=[...html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)].map(m=>m[1]).join('\n');
  if(/animation\s*:/i.test(styles)&&!/prefers-reduced-motion/i.test(styles))add(notes,4,file,'page-local animation lacks page-local reduced-motion guard');
  const hugeFixed=[...styles.matchAll(/(?:width|min-width)\s*:\s*(\d{3,})px/gi)].map(m=>Number(m[1])).filter(n=>n>=700);
  if(hugeFixed.length&&!/@media\s*\([^)]*max-width/i.test(styles))add(hard,4,file,'large fixed-width local CSS without responsive media rule');
  if(/position\s*:\s*fixed/i.test(styles)&&!/max-width|width\s*:\s*min\(|inset/i.test(styles))add(notes,4,file,'fixed-position local UI should be reviewed at narrow widths');
}
const responsive=fs.existsSync('assets/responsive-polish.css')?fs.readFileSync('assets/responsive-polish.css','utf8'):'';
const narrowBreakpoints=[...responsive.matchAll(/max-width\s*:\s*(\d+)px/gi)].map(m=>Number(m[1]));
if(!narrowBreakpoints.some(n=>n<=430))add(notes,4,'assets/responsive-polish.css','no narrow-phone breakpoint at or below 430px');

// ITERATION 5 — final consistency, metadata, hierarchy, trust.
const titles=new Map(),canonicals=new Map();
for(const [file,html] of htmlByFile){
  const idx=indexable(html);
  const title=strip((html.match(/<title>([\s\S]*?)<\/title>/i)||[])[1]);
  const desc=meta(html,'description').trim();
  const canonical=(html.match(/<link\b[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i)||html.match(/<link\b[^>]*href=["']([^"']+)["'][^>]*rel=["']canonical["']/i)||[])[1]||'';
  const h1=(html.match(/<h1\b/gi)||[]).length;
  if(idx&&h1!==1)add(hard,5,file,`indexable page should have exactly one H1; found ${h1}`);
  if(idx&&(title.length<18||title.length>72))add(notes,5,file,`title length is ${title.length} characters`);
  if(idx&&(desc.length<50||desc.length>180))add(notes,5,file,`meta description length is ${desc.length} characters`);
  if(idx&&canonical){
    if(!titles.has(title))titles.set(title,[]);
    titles.get(title).push(file);
    if(!canonicals.has(canonical))canonicals.set(canonical,[]);
    canonicals.get(canonical).push(file);
  }
  const hs=[...html.matchAll(/<h([1-6])\b/gi)].map(m=>Number(m[1]));
  for(let i=1;i<hs.length;i++)if(hs[i]>hs[i-1]+1){add(notes,5,file,`heading level jumps H${hs[i-1]}→H${hs[i]}`);break}
  if(/href=["']http:\/\//i.test(html))add(notes,5,file,'plain-http outbound link remains');
  if(/\b(?:AI-powered|powered by AI|artificial intelligence powered)\b/i.test(strip(html)))add(notes,5,file,'AI marketing language appears in user-facing copy');
}
for(const [title,owners] of titles)if(title&&owners.length>1)add(hard,5,owners[0],`duplicate page title on ${owners.length} indexable pages: "${title}"`);
for(const [canonical,owners] of canonicals)if(canonical&&owners.length>1)add(hard,5,owners[0],`duplicate canonical on ${owners.length} pages: ${canonical}`);


/* PRODUCT-LAYOUT REGRESSIONS uncovered in the September five-pass audit. */
const sourceRead=p=>fs.readFileSync(p,'utf8');
const coreSource=[
  'planner.html','weather.html','airport.html','metar-decoder.html','procedures.html',
  'poh-chart-studio.html','checklist-trainer.html','flight-training.html','guides.html'
];
for(const file of coreSource){
  const html=sourceRead(file);
  const visibleText=strip(withoutShell(html));
  for(const phrase of ['Checks for this workflow','Training use for this tool','Continue from here']){
    if(visibleText.includes(phrase))add(hard,1,file,'generated template heading returned: '+phrase);
  }
}
const guidesSource=sourceRead('guides.html');
for(const phrase of ['POPULAR PILOT SEARCHES','Guide → calculator → training → source.','Start with the system, not an isolated page.']){
  if(strip(guidesSource).includes(phrase))add(hard,1,'guides.html','SEO/template-looking guide copy returned: '+phrase);
}
if(/\sstyle=["']/i.test(guidesSource))add(notes,2,'guides.html','inline layout style returned to Guides directory');
const plannerSource=sourceRead('planner.html');
if(!plannerSource.includes('pd-plan-flow')||plannerSource.includes('Use the planner as a flight-planning workflow'))add(hard,2,'planner.html','task-first planner layout regressed');
const weatherSource=sourceRead('weather.html');
if(weatherSource.indexOf('class="pd-panel"')>weatherSource.indexOf('pd-weather-read'))add(hard,2,'weather.html','weather lookup must stay ahead of explanatory material');
const trainingSource=sourceRead('flight-training.html');
if(trainingSource.includes('pd-seo-cluster-strip')||trainingSource.includes('class="pd-list"'))add(hard,2,'flight-training.html','duplicate/SEO-style training catalog returned');
if(!trainingSource.includes('class="pd-training-scenario"')||!trainingSource.includes('USE A REAL SCENARIO'))add(hard,2,'flight-training.html','hand-edited training scenario layout is missing');

const siteJs=sourceRead('assets/site.js');
if(siteJs.includes("const items=$('.tool-card")||siteJs.includes('.pd-reveal')||siteJs.includes('IntersectionObserver'))add(hard,3,'assets/site.js','decorative reveal runtime or single-element forEach bug returned');
if(!siteJs.includes('animateResultUpdates();'))add(hard,3,'assets/site.js','result-update feedback is no longer initialized');

const experienceJs=sourceRead('assets/experience.js');
for(const marker of ["multi:['Multi-Engine','/training/multiengine.html']","cfii:['CFII','/training/cfii.html']"])if(!experienceJs.includes(marker))add(hard,3,'assets/experience.js','rating destination missing: '+marker);
if(experienceJs.includes("['/flight-training.html','/written-prep.html'")||experienceJs.includes("path.startsWith('/training/')"))add(hard,3,'assets/experience.js','duplicate rating selector returned to rating/training pages');
if(!experienceJs.includes("pd-guide-filter")||!experienceJs.includes("pdGuideCount"))add(hard,3,'assets/experience.js','Guides search/filter count missing');

const globalNav=sourceRead('assets/global-nav.js');
for(const marker of ["p.startsWith('/calculators/')","p.startsWith('/training/')","p.startsWith('/learn/oral-exam/')","p==='/guides.html'"])if(!globalNav.includes(marker))add(hard,5,'assets/global-nav.js','shared streamlined shell missing '+marker);

const motionCss=sourceRead('assets/motion.css');
for(const retired of ['pd-page-in','.pd-reveal','pd-scan','translateY(-3px)'])if(motionCss.includes(retired))add(hard,2,'assets/motion.css','decorative motion returned: '+retired);
const tokensCss=sourceRead('assets/design-tokens.css');
if(!tokensCss.includes('.tool-card,.pd-card,.pd-hub-card,.pd-flight-card,.info-card,.side-card')||!tokensCss.includes('clip-path:none!important'))add(hard,2,'assets/design-tokens.css','simple content cards are being chamfered again');

console.log('PilotDesk deep five-iteration audit');
console.log(`Built pages reviewed: ${files.length}`);
for(let i=1;i<=5;i++){
  console.log(`ITERATION ${i}: ${hard.filter(x=>x.iteration===i).length} blocking, ${notes.filter(x=>x.iteration===i).length} review note(s)`);
  for(const x of hard.filter(x=>x.iteration===i).slice(0,80))console.log(` BLOCK P${i} ${x.file}: ${x.msg}`);
  for(const x of notes.filter(x=>x.iteration===i).slice(0,40))console.log(` NOTE  P${i} ${x.file}: ${x.msg}`);
}
if(hard.length){
  console.error(`Deep five-iteration audit failed with ${hard.length} blocking issue(s).`);
  process.exit(1);
}
console.log('Deep five-iteration audit passed all blocking checks.');
