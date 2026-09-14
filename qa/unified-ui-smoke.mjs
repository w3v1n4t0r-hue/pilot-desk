import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const css=read('assets/unified-ui.css');
const bootstrap=read('assets/app-bootstrap.js');
const globalNav=read('assets/global-nav.js');

const failures=[];
const requireText=(haystack,needle,label)=>{if(!haystack.includes(needle))failures.push(`${label}: missing ${needle}`)};

requireText(css,'--pd-ui-control-height:42px','unified-ui.css');
requireText(css,'--pd-ui-button-height:38px','unified-ui.css');
requireText(css,'.input-wrap{','unified-ui.css');
requireText(css,'.tool-card{','unified-ui.css');
requireText(css,'.pd-account-card','unified-ui.css');
requireText(css,'.wx-block','unified-ui.css');
requireText(css,'.pd-hub-card','unified-ui.css');
requireText(css,'.pd-hero-search input','unified-ui.css');
requireText(css,'border-radius:var(--pd-ui-radius-sm)!important','unified-ui.css');
requireText(css,'background-image:none!important','unified-ui.css');

requireText(bootstrap,"loadStyle('/assets/unified-ui.css','pd-unified-ui')",'app-bootstrap.js');
const unifiedIndex=bootstrap.indexOf("loadStyle('/assets/unified-ui.css','pd-unified-ui')");
for(const legacy of ['home-avionics-final.css','product-clarity.css','avionics-architecture.css']){
  const i=bootstrap.indexOf(legacy);
  if(i>=0&&unifiedIndex<=i)failures.push(`app-bootstrap.js: unified UI must load after ${legacy}`);
}
requireText(globalNav,"'/assets/unified-ui.css'",'global-nav.js');
requireText(globalNav,'ensureUnifiedStyle','global-nav.js');

function walk(dir){
  const out=[];
  for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
    if(['.git','node_modules'].includes(entry.name))continue;
    const full=path.join(dir,entry.name);
    if(entry.isDirectory())out.push(...walk(full));
    else if(entry.isFile()&&entry.name.endsWith('.html'))out.push(full);
  }
  return out;
}

const loaders=[
  '/assets/unified-ui.css',
  '/assets/app-bootstrap.js',
  '/assets/safety.js',
  '/assets/product-nav.js',
  '/assets/global-nav.js',
  '/assets/site.js'
];
const uncovered=[];
for(const file of walk(root)){
  const rel=path.relative(root,file).replaceAll(path.sep,'/');
  const html=fs.readFileSync(file,'utf8');
  if(!html.includes('/assets/styles.css'))continue;
  if(!loaders.some(loader=>html.includes(loader)))uncovered.push(rel);
}
if(uncovered.length)failures.push(`HTML pages without the unified UI load path: ${uncovered.join(', ')}`);

if(failures.length){
  console.error('Unified UI checks failed:\n- '+failures.join('\n- '));
  process.exit(1);
}
console.log('Unified UI checks passed.');
