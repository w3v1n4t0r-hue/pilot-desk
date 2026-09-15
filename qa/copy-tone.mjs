import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const banned=[
  [/\bseamless(?:ly)?\b/i,'seamless'],
  [/\beffortless(?:ly)?\b/i,'effortless'],
  [/\bstreamlin(?:e|ed|es|ing)\b/i,'streamline'],
  [/\bpowerful\b/i,'powerful'],
  [/\bunlock(?:s|ed|ing)?\b/i,'unlock'],
  [/\belevate your\b/i,'elevate your'],
  [/\bgame[- ]chang(?:er|ing)\b/i,'game-changing'],
  [/\bcutting[- ]edge\b/i,'cutting-edge'],
  [/\brevolutioniz(?:e|es|ed|ing)\b/i,'revolutionize'],
  [/\bdelve(?:s|d|ing)?\b/i,'delve'],
  [/\bin today['’]s fast[- ]paced\b/i,"in today's fast-paced"],
  [/\bwhether you['’]re a\b/i,"whether you're a"],
  [/\bHow How\b/i,'duplicated How heading'],
  [/\bsource model\b/i,'source model'],
  [/\bcurrent snapshot\b/i,'current snapshot'],
  [/\blocal library\b/i,'local library'],
  [/\bsource visibility\b/i,'source visibility'],
  [/\bmake the arithmetic visible\b/i,'make the arithmetic visible'],
  [/\bpractice setup\b/i,'practice setup'],
  [/\bwhat this version can do\b/i,'what this version can do'],
  [/\bdiagnostic(?:s)?\b/i,'diagnostic'],
  [/\bknowledge map\b/i,'knowledge map'],
  [/\bskill map\b/i,'skill map'],
  [/\bACS map\b/i,'ACS map'],
  [/\bstudy workspace\b/i,'study workspace'],
  [/\bcommand center\b/i,'command center'],
  [/\btelemetry\b/i,'telemetry'],
  [/\bpipeline\b/i,'pipeline'],
  [/\bruntime\b/i,'runtime'],
  [/\bchassis\b/i,'chassis'],
  [/\blaunchpad\b/i,'launchpad'],
  [/\badaptive\b/i,'adaptive'],
  [/\bbaseline\b/i,'baseline'],
  [/\bserver[- ]side\b/i,'server-side'],
  [/\bparameterized\b/i,'parameterized']
];
const dynamicBanned=[
  [/\bdiagnostic(?:s)?\b/i,'diagnostic'],
  [/\bknowledge map\b/i,'knowledge map'],
  [/\bskill map\b/i,'skill map'],
  [/\bACS map\b/i,'ACS map'],
  [/\bstudy workspace\b/i,'study workspace'],
  [/\badaptive\b/i,'adaptive'],
  [/\bbaseline\b/i,'baseline'],
  [/\bserver[- ]side\b/i,'server-side'],
  [/\bparameterized\b/i,'parameterized']
];
const files=[];
function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){if(['.git','node_modules'].includes(e.name))continue;const p=path.join(dir,e.name);if(e.isDirectory())walk(p);else if(e.isFile()&&e.name.endsWith('.html'))files.push(p)}}
walk(root);
const failures=[];
for(const file of files){
  const raw=fs.readFileSync(file,'utf8');
  const meta=[...raw.matchAll(/<meta\s+[^>]*name=["']description["'][^>]*content=["']([^"']*)["'][^>]*>/gi),...raw.matchAll(/<meta\s+[^>]*content=["']([^"']*)["'][^>]*name=["']description["'][^>]*>/gi)].map(m=>m[1]).join(' ');
  const visible=raw.replace(/<script\b[\s\S]*?<\/script>/gi,' ').replace(/<style\b[\s\S]*?<\/style>/gi,' ').replace(/<svg\b[\s\S]*?<\/svg>/gi,' ').replace(/<[^>]+>/g,' ').replace(/&[a-z0-9#]+;/gi,' ').replace(/\s+/g,' ');
  const text=visible+' '+meta;
  for(const [re,label] of banned)if(re.test(text))failures.push(`${path.relative(root,file)}: ${label}`);
  if(/\s\/\/\s/.test(visible))failures.push(`${path.relative(root,file)}: code-style // separator`);
}
const manifest=JSON.parse(fs.readFileSync('site.webmanifest','utf8'));
const manifestText=[manifest.description,...(manifest.shortcuts||[]).flatMap(x=>[x.name,x.short_name,x.description])].filter(Boolean).join(' ');
for(const [re,label] of banned)if(re.test(manifestText))failures.push(`site.webmanifest: ${label}`);
for(const file of [
  'scripts/generate-calculator-pages.mjs',
  'assets/weather-fixed.js','assets/product-nav.js','assets/airport.js','assets/flights.js','assets/flight-brief.js','assets/aircraft-v2.js',
  'assets/skill-gap.js','assets/written-prep.js','assets/home-daily.js','assets/account.js'
]){
  if(!fs.existsSync(file))continue;
  const text=fs.readFileSync(file,'utf8');
  for(const [re,label] of dynamicBanned)if(re.test(text))failures.push(`${file}: ${label}`);
}
if(!fs.existsSync('assets/pilot-language.css')){
  failures.push('assets/pilot-language.css: final public visual-language override missing');
}else{
  const css=fs.readFileSync('assets/pilot-language.css','utf8');
  if(!/\.pd-page-hero:after\s*\{[^}]*content:\s*['"]PILOTDESK FLIGHT TOOLS['"]/s.test(css))failures.push('assets/pilot-language.css: plain page-hero label missing');
  if(!/\.pd-hub-card>small:before\s*\{[^}]*content:none/s.test(css))failures.push('assets/pilot-language.css: hub-card leading plus override missing');
  if(!/\.pd-hub-card \.pd-arrow:after\s*\{[^}]*content:none/s.test(css))failures.push('assets/pilot-language.css: hub-card trailing plus override missing');
}
if(failures.length){console.error('Public copy tone check failed:');for(const x of failures)console.error(' - '+x);process.exit(1)}
console.log(`Public copy tone check passed across ${files.length} HTML pages and user-facing app copy.`);
