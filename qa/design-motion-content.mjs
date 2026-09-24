import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const read=p=>fs.readFileSync(p,'utf8');
const wind=read('assets/crosswind-mfd.js');
const rotate=wind.slice(wind.indexOf('function rotateVector('),wind.indexOf('function update('));
const group={dataset:{},style:{}};
vm.runInNewContext(rotate+';rotateVector(group,359);rotateVector(group,1);',{group});
assert.equal(group.style.transform,'rotate(361deg)');
vm.runInNewContext(rotate+';rotateVector(group,359);',{group});
assert.equal(group.style.transform,'rotate(359deg)');

// Test the actual canvas renderer in both motion modes. Values and axes stay exact.
const wb=read('assets/weight-balance.js');
const draw=wb.slice(wb.indexOf('function draw('),wb.indexOf('function calculate('));
let arcs=[],scheduled=[],cancelled=0;
const ctx=new Proxy({arc:(x,y)=>arcs.push([x,y]),getImageData:()=>({})},{get:(t,k)=>t[k]||(()=>{})});
const env={chart:{width:900,height:480,getContext:()=>ctx},envelope:[[30,1000],[50,1000],[50,3000],[30,3000]],cgFrame:0,cgDomain:'',cgPositions:{},cgReducedMotion:{matches:false},cancelAnimationFrame:()=>cancelled++,requestAnimationFrame:fn=>{scheduled.push(fn);return scheduled.length;},performance:{now:()=>0}};
vm.createContext(env);vm.runInContext(draw,env);
const point=(cg,W=2000)=>({ok:true,cg,W});
env.draw(point(38),point(39));const before=env.cgPositions.dep[0];
env.draw(point(42),point(39));assert.equal(env.cgPositions.dep[0],before);assert.equal(scheduled.length,1);
scheduled.shift()(90);assert.ok(env.cgPositions.dep[0]>before);const middle=env.cgPositions.dep[0];
scheduled.shift()(180);assert.ok(env.cgPositions.dep[0]>middle);assert.equal(scheduled.length,0);
env.cgReducedMotion.matches=true;env.draw(point(38),point(39));assert.equal(env.cgPositions.dep[0],before);assert.equal(scheduled.length,0);
env.cgReducedMotion.matches=false;env.draw(point(65),point(39));assert.equal(scheduled.length,0,'scale changes must render immediately');
env.envelope=[];env.draw({ok:false},{ok:false});assert.equal(Object.keys(env.cgPositions).length,0);assert.ok(cancelled>=5);

const redirects=JSON.parse(read('vercel.json')).redirects.filter(x=>/guides\/(wind-correction-angle|groundspeed-vs-airspeed|course-heading-track|true-magnetic-heading|metar-wind-and-gusts|metar-ceiling-and-visibility|taf-change-groups)\.html/.test(x.source));
assert.equal(redirects.length,7);
const inventory=JSON.parse(read('src/data/inventory.json'));
for(const row of redirects){
 assert.equal(row.permanent,true);
 assert.match(read(row.source.slice(1)),/name="robots" content="noindex,follow"/);
 assert.ok(!inventory.some(x=>x.href===row.source));
 const [target,anchor]=row.destination.split('#');assert.ok(read(target.slice(1)).includes(`id="${anchor}"`));
 for(const file of fs.readdirSync('dist').filter(x=>/^sitemap.*\.xml$/.test(x)))assert.ok(!read('dist/'+file).includes(row.source),`${file} still indexes ${row.source}`);
}
assert.match(read('guides/wind-triangle.html'),/cancel the rightward drift/);
assert.match(read('guides/metar-taf.html'),/Worked TAF timeline/);
assert.match(read('assets/motion.css'),/prefers-reduced-motion:reduce/);
assert.match(read('assets/calculators-2026.css'),/pd-calc-output-panel\{position:static;grid-row:auto\}/);
console.log('Design/content regressions passed: shortest-angle rotation, CG motion/reduced motion/scale/invalid states, seven redirects, anchors and sitemap exclusions.');
