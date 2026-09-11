import fs from 'node:fs';
import path from 'node:path';
const replacement='<span class="brandmark" aria-label="PilotDesk"><img src="/assets/icon.svg" alt="" width="38" height="38"></span>';
function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){if(e.name==='.git'||e.name==='node_modules')continue;const p=path.join(dir,e.name);if(e.isDirectory())walk(p);else if(e.isFile()&&e.name.endsWith('.html')){let s=fs.readFileSync(p,'utf8');const before=s;s=s.replace(/<span class="brandmark"[^>]*>(?:PD|<svg[\s\S]*?<\/svg>)<\/span>/g,replacement);if(s!==before)fs.writeFileSync(p,s)}}}
walk(process.cwd());
console.log('Normalized PilotDesk branding to the centralized icon asset.');
