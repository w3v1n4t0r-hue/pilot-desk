import fs from 'node:fs';
import path from 'node:path';

const dist='dist';
if(!fs.existsSync(dist)){
  console.error('Five-pass audit: dist/ is missing; run the build first.');
  process.exit(1);
}

const files=[];
function walk(dir){
  for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
    const p=path.join(dir,entry.name);
    if(entry.isDirectory()) walk(p);
    else if(entry.isFile()&&entry.name.endsWith('.html')) files.push(p);
  }
}
walk(dist);

// Five independent passes: copy, visual language, density, interaction, final consistency.
const hard=[];
const notes=[];
const add=(bucket,pass,file,msg)=>bucket.push({pass,file,msg});
const visible=html=>html
  .replace(/<script\b[\s\S]*?<\/script>/gi,' ')
  .replace(/<style\b[\s\S]*?<\/style>/gi,' ')
  .replace(/<svg\b[\s\S]*?<\/svg>/gi,' ')
  .replace(/<[^>]+>/g,' ')
  .replace(/&[a-z0-9#]+;/gi,' ')
  .replace(/\s+/g,' ')
  .trim();

const buzz=[
  [/\bdelve(?:s|d|ing)?\b/i,'delve'],
  [/\bleverage(?:s|d|ing)?\b/i,'leverage'],
  [/\brevolutioniz(?:e|es|ed|ing)\b/i,'revolutionize'],
  [/\belevate(?:s|d|ing)?\b/i,'elevate'],
  [/\bseamless(?:ly)?\b/i,'seamless'],
  [/\bgame[- ]chang(?:er|ing)\b/i,'game-changer'],
  [/\becosystem\b/i,'ecosystem'],
  [/\bcornerstone\b/i,'cornerstone'],
  [/\brealm\b/i,'realm'],
  [/\btapestry\b/i,'tapestry'],
  [/\bspearhead(?:s|ed|ing)?\b/i,'spearhead'],
  [/\bunleash(?:es|ed|ing)?\b/i,'unleash']
];
const canned=[
  [/\bin today['’]s fast[- ]paced world\b/i,"in today's fast-paced world"],
  [/\bit['’]s important to note\b/i,"it's important to note"],
  [/\bwhether you['’]re a\b/i,"whether you're a"],
  [/\bwhether you are a\b/i,'whether you are a'],
  [/\beverything you need\b/i,'everything you need'],
  [/\bone[- ]stop\b/i,'one-stop'],
  [/\bat your fingertips\b/i,'at your fingertips'],
  [/\bnext[- ]level\b/i,'next-level'],
  [/\bworld[- ]class\b/i,'world-class'],
  [/\bindustry[- ]leading\b/i,'industry-leading']
];
const vagueCta=/^(learn more|get started|discover|discover more|explore|explore more|read more|click here)$/i;

let passCounts={1:0,2:0,3:0,4:0,5:0};
for(const file of files){
  const html=fs.readFileSync(file,'utf8');
  const text=visible(html);
  const lower=text.toLowerCase();

  // PASS 1 — copy voice: plainspoken, specific, no canned AI marketing language.
  for(const [re,label] of buzz){
    if(label==='pivotal') continue;
    if(re.test(text)) add(hard,1,file,'buzzword: '+label);
  }
  // "pivotal altitude" is a legitimate aviation term; only flag marketing use of pivotal.
  if(/\bpivotal\b/i.test(text)&&!/\bpivotal altitude\b/i.test(text)) add(hard,1,file,'buzzword: pivotal');
  for(const [re,label] of canned) if(re.test(text)) add(hard,1,file,'canned phrase: '+label);
  if(/\b(powerful|effortless|supercharge|unlock)\b/i.test(text)) add(notes,1,file,'review hype word in visible copy');
  passCounts[1]++;

  // PASS 2 — visual source: no inline template/glow/glass styling.
  if(/backdrop-filter\s*:/i.test(html)) add(hard,2,file,'inline glass/blurring effect');
  if(/(?:radial-gradient|filter\s*:\s*blur\()/i.test(html)) add(hard,2,file,'inline glow/blur effect');
  if(/border-radius\s*:\s*(?:[1-9]\d|999)px/i.test(html)) add(notes,2,file,'large inline corner radius');
  passCounts[2]++;

  // PASS 3 — density and hierarchy: flag pages that look like card catalogs instead of tools/editorial pages.
  const words=(text.match(/\b[\w'-]+\b/g)||[]).length;
  const cards=(html.match(/class=["'][^"']*(?:\bcard\b|\bpanel\b|\btile\b|feature-card)[^"']*["']/gi)||[]).length;
  const h2=(html.match(/<h2\b/gi)||[]).length;
  if(cards>=18&&words<700) add(notes,3,file,`card-heavy surface (${cards} card/panel elements, ${words} words)`);
  if(words>1500&&h2<5) add(notes,3,file,`long page with weak sectioning (${words} words, ${h2} H2s)`);
  passCounts[3]++;

  // PASS 4 — interaction clarity: no dead links, unnamed controls, or context-free CTAs.
  if(/href=["']#["']/i.test(html)||/href=["']javascript:/i.test(html)) add(hard,4,file,'dead or javascript link');
  for(const m of html.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/gi)){
    const attrs=m[1],label=visible(m[2]);
    if(!label&&!/aria-label\s*=/i.test(attrs)) add(hard,4,file,'button without visible or accessible name');
  }
  for(const m of html.matchAll(/<a\b[^>]*>([\s\S]*?)<\/a>/gi)){
    const label=visible(m[1]).trim();
    if(vagueCta.test(label)) add(notes,4,file,'context-free CTA: '+label);
  }
  passCounts[4]++;

  // PASS 5 — final consistency: one clear page identity and complete indexable metadata.
  const h1=(html.match(/<h1\b/gi)||[]).length;
  if(h1>1) add(hard,5,file,`multiple H1 elements (${h1})`);
  const metaTags=[...html.matchAll(/<meta\b[^>]*>/gi)].map(m=>m[0]);
  const metaContent=name=>{
    const tag=metaTags.find(t=>new RegExp('\\bname=["\\']'+name+'["\\']','i').test(t));
    return (tag?.match(/\\bcontent=["']([^"']*)["']/i)||[])[1]||'';
  };
  const robots=metaContent('robots');
  const robotTokens=robots.toLowerCase().split(',').map(x=>x.trim()).filter(Boolean);
  const indexable=robotTokens.includes('index')&&!robotTokens.includes('noindex');
  const description=metaContent('description').trim();
  if(indexable&&!/rel=["']canonical["']/i.test(html)) add(hard,5,file,'indexable page missing canonical');
  if(indexable&&!/<title>[^<]{8,}<\/title>/i.test(html)) add(hard,5,file,'indexable page missing useful title');
  if(indexable&&description.length<40) add(hard,5,file,'indexable page missing useful meta description');
  if(/\bPilot Desk\b/i.test(text)) add(hard,5,file,'brand written as “Pilot Desk” instead of “PilotDesk”');
  passCounts[5]++;
}

const sharedCss=[
  'assets/design-tokens.css',
  'assets/consistency.css',
  'assets/experience.css',
  'assets/home-polish.css',
  'assets/responsive-polish.css'
].filter(fs.existsSync).map(p=>[p,fs.readFileSync(p,'utf8')]);

const consistency=sharedCss.find(([p])=>p.endsWith('consistency.css'))?.[1]||'';
const experience=sharedCss.find(([p])=>p.endsWith('experience.css'))?.[1]||'';
if(/--pd-panel-radius\s*:\s*(?:[4-9]|\d{2,})px/i.test(consistency)) add(hard,2,'assets/consistency.css','shared panel radius conflicts with hard-square PilotDesk geometry');
if(/\.topbar \.brandmark[\s\S]{0,300}border-radius\s*:\s*(?:[4-9]|\d{2,})px/i.test(consistency)) add(hard,2,'assets/consistency.css','brandmark radius conflicts with clipped-square logo system');
if(/info-card:hover[\s\S]{0,260}box-shadow\s*:\s*(?!none)/i.test(consistency)) add(hard,2,'assets/consistency.css','shared non-interactive cards still add decorative hover shadow');
if(/radial-gradient/i.test(experience)) add(hard,2,'assets/experience.css','legacy decorative radial gradient remains');
if(/backdrop-filter\s*:\s*blur/i.test(experience)) add(hard,2,'assets/experience.css','legacy glass blur remains');
if(/linear-gradient\(145deg/i.test(experience)) add(hard,2,'assets/experience.css','legacy gradient card surface remains');
if(/@keyframes\s+pd-glow/i.test(experience)) add(hard,2,'assets/experience.css','decorative glow animation remains');

console.log('Five-pass PilotDesk audit');
console.log(`Pages reviewed: ${files.length}`);
for(const [n,label] of [
  [1,'copy voice'],
  [2,'visual/template clichés'],
  [3,'density + hierarchy'],
  [4,'interaction clarity'],
  [5,'final consistency']
]) console.log(`PASS ${n} — ${label}: ${passCounts[n]} pages reviewed`);

if(notes.length){
  console.log(`Review notes (${notes.length}; non-blocking):`);
  for(const x of notes.slice(0,120)) console.log(` - P${x.pass} ${x.file}: ${x.msg}`);
  if(notes.length>120) console.log(` ... ${notes.length-120} more review notes`);
}

if(hard.length){
  console.error(`Five-pass audit failed with ${hard.length} blocking issue(s):`);
  for(const x of hard.slice(0,180)) console.error(` - P${x.pass} ${x.file}: ${x.msg}`);
  if(hard.length>180) console.error(` ... ${hard.length-180} more`);
  process.exit(1);
}
console.log('Five-pass audit passed: every built page cleared all five blocking checks.');
