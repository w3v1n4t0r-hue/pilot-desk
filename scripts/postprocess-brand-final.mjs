import fs from 'node:fs';
import path from 'node:path';

const canonical='<span class="brandmark" aria-hidden="true"><img src="/favicon.svg" alt="" width="40" height="40"></span>';

function walk(dir){
  for(const e of fs.readdirSync(dir,{withFileTypes:true})){
    if(e.name==='.git'||e.name==='node_modules'||e.name==='dist'||e.name==='.astro-public')continue;
    const p=path.join(dir,e.name);
    if(e.isDirectory())walk(p);
    else if(e.isFile()&&e.name.endsWith('.html')){
      let s=fs.readFileSync(p,'utf8');
      s=s.split('/assets/icon.svg').join('/favicon.svg');
      s=s.replace(/<span class="brandmark"[^>]*>[\s\S]*?<\/span>/g,canonical);
      fs.writeFileSync(p,s);
    }
  }
}
walk(process.cwd());
console.log('Normalized static PilotDesk branding to the user-created canonical logo.');
