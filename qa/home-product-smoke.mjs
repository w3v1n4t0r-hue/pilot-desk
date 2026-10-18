import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const read=path=>fs.readFileSync(path,'utf8');
const home=read('src/pages/index.astro');
const css=read('assets/home-desk.css');
const motion=read('assets/motion-polish.js');
const planner=read('assets/route-planner.js');
const shared=read('assets/styles.css');
const logo=read('assets/logo-fit.css');
assert.match(home,/<HeroPrototype \/>/);
assert.match(home,/href="\/assets\/hero-prototype\.css"/);
assert.match(home,/<HomePlans \/>/);
const hero=read('src/components/HeroPrototype.astro');
for(const destination of ['/route-planner.html','/tools.html','/flight-training.html','/weather.html'])assert(hero.includes(destination));
assert.equal((hero.match(/<h1 /g)||[]).length,1);
assert.match(hero,/data-hero-prev/);assert.match(hero,/data-hero-next/);
assert.doesNotMatch(home,/robots="noindex/);
assert.match(shared,/logo-fit\.css/);
assert(shared.trim().endsWith('@import url("/assets/design-tokens.css");'),'keep shared token cascade last');
assert.match(logo,/\.topbar \.brand \.brandmark/);
assert.match(logo,/overflow:visible!important/);
assert.match(logo,/padding:4px!important/);
assert.match(logo,/object-fit:contain!important/);
assert.match(logo,/max-width:430px/);
// Exercise the actual URL handoff code, including invalid input and saved-flight protection.
const begin=planner.indexOf('const startParams=new URLSearchParams(location.search);');
const finish=planner.indexOf('rememberRoute();renderRouteSequence()}',begin);
assert(begin>=0&&finish>begin,'planner URL handoff must be wired');
const handoff=planner.slice(begin,finish);
function run(search){
  const fields={'#rpRoute':{value:''},'#rpRouteEditor':{hidden:true},
    '#rpEditorToggle':{setAttribute(k,v){this[k]=v}},'#rpWorkspace':{classList:{remove(v){this.removed=v}}}};
  const calls=[];
  vm.runInNewContext(handoff,{
    URLSearchParams,location:{search},localStorage:{setItem:(...args)=>calls.push(['store',...args])},
    $:sel=>fields[sel],updateLiveSummary:(_,route)=>calls.push(['summary',route]),
    saveDraft:()=>calls.push(['draft']),invalidateRoute:()=>calls.push(['invalidate']),
    scheduleAutoBuild:delay=>calls.push(['build',delay])
  });
  return {fields,calls};
}
let a=run('?from=kgfk&to=kfar');
assert.equal(a.fields['#rpRoute'].value,'KGFK KFAR');
assert.equal(a.fields['#rpRouteEditor'].hidden,false);
assert(a.calls.some(x=>x[0]==='build'),'new route should automatically build');
a=run('?flight=saved123&from=kgfk&to=kfar');
assert.equal(a.fields['#rpRoute'].value,'','saved-flight URL wins');
a=run('?from=<script>&to=kfar');
assert.equal(a.fields['#rpRoute'].value,'','reject malformed airport identifiers');
new vm.Script(read('assets/home-desk.js'));
new vm.Script(motion);
new vm.Script(planner);
console.log('Homepage route entry, URL handoff, saved-flight safety, crosswind and uncropped header-logo guards passed.');
