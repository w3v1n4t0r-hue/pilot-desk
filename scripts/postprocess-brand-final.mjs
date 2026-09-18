import fs from 'node:fs';
import path from 'node:path';

const canonical='<span class="brandmark" aria-label="PilotDesk"><img src="/assets/icon.svg" alt="" width="36" height="36" aria-hidden="true"></span>';
let changed=0;

function normalize(html){
  const before=html;
  html=html.replace(/<span\s+class=["']brandmark["'][^>]*>\s*(?:<svg[\s\S]*?<\/svg>|<img[^>]*>|PD)\s*<\/span>/gi,canonical);
  html=html.replace(/(<a\s+class=["']brand["'][^>]*href=["']\/["'][^>]*>)(?!\s*<span\s+class=["']brandmark["'])/gi,`$1${canonical}`);
  return html===before?null:html;
}
function walk(dir){
  for(const ent of fs.readdirSync(dir,{withFileTypes:true})){
    if(['.git','node_modules','dist'].includes(ent.name))continue;
    const p=path.join(dir,ent.name);
    if(ent.isDirectory())walk(p);
    else if(ent.isFile()&&ent.name.endsWith('.html')){
      const html=fs.readFileSync(p,'utf8');
      const next=normalize(html);
      if(next!==null){fs.writeFileSync(p,next);changed++;}
    }
  }
}
walk(process.cwd());
console.log(`Locked ${changed} pages to the canonical handmade PilotDesk logo.`);
