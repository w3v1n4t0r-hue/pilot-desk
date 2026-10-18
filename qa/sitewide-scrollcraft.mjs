import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {composePage} from '../scripts/compose-cinematic-pages.mjs';
const walk=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);
const pages=walk('dist').filter(p=>p.endsWith('.html'));let decorated=0;
for(const file of pages){const html=fs.readFileSync(file,'utf8');if(!html.includes('data-pd-cinematic'))continue;decorated++;assert.equal((html.match(/data-pd-cinematic=/g)||[]).length,1,file);assert.equal((html.match(/<h1\b/gi)||[]).length,1,file);assert(html.includes('id="pdWorkSurface"'),file);assert(html.includes('scrollcraft-engine.'),file);assert(!/data-pd-cinematic[^>]+hidden/.test(html),file);}
assert(decorated>=150,'All interior page families must be composed');
const sample='<html><head><meta name="description" content="Wind &amp; runway"></head><body><main><section><h1 id="title">Crosswind</h1><form id="calc"><input name="wind" value="20"><button>Calculate</button></form></section></main></body></html>';
assert(composePage(sample,'/pricing.html').includes('data-pd-cinematic="membership"'),'Pricing must not be mistaken for icing/weather');
const output=composePage(sample,'/calculators/crosswind/');assert.equal(composePage(output,'/calculators/crosswind/'),output,'Composition must be idempotent');assert(output.includes('<form id="calc"><input name="wind" value="20"><button>Calculate</button></form>'),'Working form must remain byte-identical');assert(output.includes('<h1 id="title">Crosswind</h1>'),'Original heading identity must survive');assert.equal(composePage(sample,'/index.html'),sample,'Approved homepage must retain its existing hero');
const engine=fs.readFileSync('assets/scrollcraft-engine.js'),reference=fs.readFileSync('scrollcraft/builds/sitewide-pilotdesk/scrollcraft.js');assert.equal(createHash('sha256').update(engine).digest('hex'),createHash('sha256').update(reference).digest('hex'),'Scrollcraft engine must remain unchanged');
console.log(`PASS ${decorated} cinematic build pages, original heading/form preservation, idempotent composition and unchanged Scrollcraft engine`);
