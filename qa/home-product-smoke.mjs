import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const read=path=>fs.readFileSync(path,'utf8');
const home=read('src/pages/index.astro');
const css=read('assets/home-product.css');
const motion=read('assets/motion-polish.js');
const planner=read('assets/route-planner.js');
const shared=read('assets/styles.css');
const logo=read('assets/logo-fit.css');
assert.match(home,/href="\/assets\/home-product\.css"/);
assert.match(home,/class="pd-home-product"/);
assert.match(home,/action="\/route-planner\.html" method="get"/);
assert.match(home,/name="from"/);
assert.match(home,/name="to"/);
assert.match(home,/type="submit" class="pd-btn pd-home-route-submit"/);
assert.doesNotMatch(home,/ROUTE SCHEMATIC|NOT LIVE FLIGHT DATA|EXAMPLE ROUTE|EXAMPLE FLIGHT PATH/);
assert.equal((home.match(/id="pdHomeWind"/g)||[]).length,1,'working crosswind slider must remain');
assert.equal((home.match(/id="pdHomeCross"/g)||[]).length,1);
assert.equal((home.match(/id="pdHomeHead"/g)||[]).length,1);
assert(home.indexOf('pd-home-crosswind"')>home.indexOf('id="pdHomeDesk"'),'crosswind follows returning-user desk');
assert(home.indexOf('class="pd-home-product"')<home.indexOf('class="pd-home-proof"'),'route form above the fold');
for(const path of ['/weather.html','/tools.html','/daily/','/flight-training.html','/flights.html'])
  assert(home.includes(`href="${path}"`),`retain ${path}`);
assert.match(css,/max-width:480px/);
assert.match(css,/max-width:820px/);
assert.doesNotMatch(css,/backdrop-filter|filter:blur|position:fixed/);
assert.match(motion,/querySelector\('\.pd-home-product'\)/);
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
