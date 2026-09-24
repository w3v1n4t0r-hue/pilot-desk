import fs from 'node:fs';
import path from 'node:path';

const dist='dist';
const failures=[];
const htmlFiles=[];

function walk(dir){
  for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
    const p=path.join(dir,entry.name);
    if(entry.isDirectory()) walk(p);
    else if(entry.isFile()&&entry.name.endsWith('.html')) htmlFiles.push(p);
  }
}
if(!fs.existsSync(dist)){
  console.error('Page surface audit: dist/ is missing; run the build first.');
  process.exit(1);
}
walk(dist);

const officialLogo='/favicon.svg';
for(const file of htmlFiles){
  const html=fs.readFileSync(file,'utf8');
  if(!/<meta\s+name=["']viewport["'][^>]*width=device-width/i.test(html)){
    failures.push(`${file}: missing responsive viewport meta`);
  }

  const headers=[...html.matchAll(/<header\b[^>]*class=["'][^"']*\btopbar\b[^"']*["'][^>]*>[\s\S]*?<\/header>/gi)];
  if(headers.length>1) failures.push(`${file}: multiple topbar headers (${headers.length})`);

  if(headers.length===1){
    const header=headers[0][0];
    if(!header.includes(officialLogo)) failures.push(`${file}: header does not use official PilotDesk logo`);
    if(!header.includes('PilotDesk')) failures.push(`${file}: PilotDesk wordmark missing from header`);
    if(/brandmark[^>]*>\s*PD\s*</i.test(header)) failures.push(`${file}: PD placeholder remains in header`);
    if(header.includes('✈')) failures.push(`${file}: airplane glyph placeholder remains in header`);
    if(header.includes('viewBox="0 0 64 40"')) failures.push(`${file}: retired inline airplane logo remains in header`);
    const navCount=(header.match(/<nav\b/gi)||[]).length;
    if(navCount>1) failures.push(`${file}: duplicate navigation blocks in header`);
    if(!/\/assets\/styles(?:\.[a-f0-9]{12})?\.css/.test(html)) failures.push(`${file}: shared stylesheet entrypoint missing`);
    if(!/\/assets\/app-bootstrap(?:\.[a-f0-9]{12})?\.js/.test(html)&&!html.includes('data-pd-astro-native="1"')){
      failures.push(`${file}: shared app bootstrap missing`);
    }
  }

  const footers=(html.match(/<footer\b/gi)||[]).length;
  if(footers>1) failures.push(`${file}: multiple footers (${footers})`);
}

const styles=fs.readFileSync('assets/styles.css','utf8');
const consistency=fs.readFileSync('assets/consistency.css','utf8');
const sw=fs.readFileSync('sw.js','utf8');

for(const needle of [
  '@import url("/assets/consistency.css");',
  '@import url("/assets/design-tokens.css");'
]){
  if(!styles.includes(needle)) failures.push(`assets/styles.css: missing ${needle}`);
}
if(styles.indexOf('consistency.css')>styles.indexOf('design-tokens.css')){
  failures.push('assets/styles.css: consistency.css must load before final design-tokens.css authority');
}
if(!styles.trim().endsWith('@import url("/assets/design-tokens.css");')){
  failures.push('assets/styles.css: design-tokens.css must remain the final shared layer');
}
for(const needle of [
  '.topbar .brandmark',
  '.calculator-layout',
  '@media(max-width:900px)',
  '@media(max-width:800px)',
  '@media(max-width:520px)',
  'min-height:68px'
]){
  if(!consistency.includes(needle)) failures.push(`assets/consistency.css: missing ${needle}`);
}
if(!sw.includes("'/assets/consistency.css'")){
  failures.push('sw.js: consistency.css is not available offline');
}

if(failures.length){
  console.error(`Page surface audit failed with ${failures.length} issue(s):`);
  failures.slice(0,150).forEach(x=>console.error(' - '+x));
  process.exit(1);
}
console.log(`Page surface audit passed: ${htmlFiles.length} built pages checked for responsive viewport, single shell, official PilotDesk branding, navigation duplication, shared styling/bootstrap, and mobile consistency guards.`);
