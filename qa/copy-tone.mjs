import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const banned=[
  [/\bworkspace\b/i,'workspace'],
  [/\bdesigned to\b/i,'designed to'],
  [/\bbuilt around\b/i,'built around'],
  [/\bintentionally\b/i,'intentionally'],
  [/\bin one place\b/i,'in one place'],
  [/\bseamless(?:ly)?\b/i,'seamless'],
  [/\beffortless(?:ly)?\b/i,'effortless'],
  [/\bstreamlin(?:e|ed|es|ing)\b/i,'streamline'],
  [/\bpowerful\b/i,'powerful'],
  [/\bsource model\b/i,'source model'],
  [/\bcurrent snapshot\b/i,'current snapshot'],
  [/\blocal library\b/i,'local library'],
  [/\bsource visibility\b/i,'source visibility'],
  [/\bmake the arithmetic visible\b/i,'make the arithmetic visible'],
  [/\bpractice setup\b/i,'practice setup'],
  [/\bwhat this version can do\b/i,'what this version can do']
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
}
const manifest=JSON.parse(fs.readFileSync('site.webmanifest','utf8'));
const manifestText=[manifest.description,...(manifest.shortcuts||[]).flatMap(x=>[x.name,x.short_name,x.description])].filter(Boolean).join(' ');
for(const [re,label] of banned)if(re.test(manifestText))failures.push(`site.webmanifest: ${label}`);
for(const file of ['scripts/generate-calculator-pages.mjs','assets/weather-fixed.js','assets/product-nav.js','assets/airport.js','assets/flights.js','assets/flight-brief.js','assets/aircraft-v2.js']){
  if(!fs.existsSync(file))continue;
  const text=fs.readFileSync(file,'utf8');
  for(const [re,label] of banned.slice(1))if(re.test(text))failures.push(`${file}: ${label}`);
}
if(failures.length){console.error('Public copy tone check failed:');for(const x of failures)console.error(' - '+x);process.exit(1)}
console.log(`Public copy tone check passed across ${files.length} HTML pages and user-facing app copy.`);
