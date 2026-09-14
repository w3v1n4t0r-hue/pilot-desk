import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const css=read('assets/unified-ui.css');
const baseEntry=read('assets/styles.css');
const legacyBase=read('assets/styles-legacy.css');
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

/* styles.css is now a tiny canonical entry point. Every ordinary HTML page already
   references it, so static guides/legal/content pages receive the exact same UI
   contract without needing page-specific JavaScript. */
requireText(baseEntry,'@import url("/assets/styles-legacy.css");','styles.css');
requireText(baseEntry,'@import url("/assets/unified-ui.css");','styles.css');
if(baseEntry.indexOf('styles-legacy.css')>baseEntry.indexOf('unified-ui.css')){
  failures.push('styles.css: legacy layout must load before the unified UI authority layer');
}
if(legacyBase.length<10000)failures.push('styles-legacy.css: legacy layout payload looks unexpectedly short');

/* Rich app pages can load page-specific styles later, so bootstrap re-applies the
   authority layer after all of them. Standalone account-style pages get the same
   finalizer through global-nav.js as a fallback. */
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

const uncovered=[];
for(const file of walk(root)){
  const rel=path.relative(root,file).replaceAll(path.sep,'/');
  const html=fs.readFileSync(file,'utf8');
  const hasCanonicalBase=html.includes('/assets/styles.css');
  const hasDirectUnified=html.includes('/assets/unified-ui.css');
  if(!hasCanonicalBase&&!hasDirectUnified)uncovered.push(rel);
}
if(uncovered.length)failures.push(`HTML pages outside the canonical UI system: ${uncovered.join(', ')}`);

if(failures.length){
  console.error('Unified UI checks failed:\n- '+failures.join('\n- '));
  process.exit(1);
}
console.log('Unified UI checks passed: every HTML page enters the canonical stylesheet and rich app pages re-apply the final authority layer after page CSS.');
