import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8');
const failures=[];const ok=(v,m)=>{if(!v)failures.push(m)};
const required=['assets/flight-store.js','assets/planner-pro.js','assets/procedure-pro.js','assets/trainer-pro.js','assets/poh-chart-studio.js','assets/aircraft-transfer.js','assets/aircraft-training.js','api/procedure-pdf.js'];
for(const p of required)ok(fs.existsSync(p),`Missing consolidated feature ${p}`);
const flightStore=read('assets/flight-store.js'),planner=read('assets/planner-pro.js'),proc=read('assets/procedure-pro.js'),trainer=read('assets/trainer-pro.js'),poh=read('assets/poh-chart-studio.js'),air=read('assets/aircraft-transfer.js'),airTraining=read('assets/aircraft-training.js'),pdf=read('api/procedure-pdf.js'),bootstrap=read('assets/app-bootstrap.js'),procedures=read('assets/procedures.js'),checklist=read('assets/checklist-trainer.js'),sw=read('sw.js');
for(const s of ['pd-saved-flights','pd-flights-v1','upsert','procedures'])ok(flightStore.includes(s),`Shared flight store missing ${s}`);
for(const s of ['rpAircraft','CSV','navigator.clipboard','ctrlKey','navlog'])ok(planner.includes(s),`Planner enhancement missing ${s}`);
for(const s of ['Open preview','Reload','Escape','pd-plate-focus'])ok(proc.includes(s),`Procedure enhancement missing ${s}`);
for(const s of ['Export','Import','keydown','ArrowLeft','ArrowRight'])ok(trainer.includes(s),`Training enhancement missing ${s}`);
ok(poh.includes("KEY='pd-poh-models-v2'")&&poh.includes('will not extrapolate')&&poh.includes('Save model locally'),'POH chart studio did not preserve saved-model/no-extrapolation behavior');
ok(air.includes("cruiseTas:s('cruiseTas')"),'Aircraft import/export must preserve cruise TAS');
ok(airTraining.includes("'Weight & Balance','/weight-balance.html'"),'Aircraft binder must use canonical Weight & Balance URL');
for(const s of ["['GET','HEAD']",'safeRange','content-range','Readable.fromWeb','Accept-Ranges'])ok(pdf.includes(s),`Procedure PDF proxy missing ${s}`);

ok(bootstrap.includes('/assets/flight-store.js'),'Bootstrap must load the canonical shared flight store');
for(const [path,asset] of [['route-planner.html','planner-pro.js'],['procedures.html','procedure-pro.js'],['checklist-trainer.html','trainer-pro.js']])ok(bootstrap.includes(`path==='/${path}'`)&&bootstrap.includes(`/assets/${asset}`),`Bootstrap does not route-scope ${asset}`);
for(const retired of ['flight-library.js','preview-harvest.js','avionics-command.js'])ok(!bootstrap.includes(`/assets/${retired}`),`Retired consolidated preview layer returned: ${retired}`);
for(const asset of ['planner-pro.js','procedure-pro.js','trainer-pro.js','poh-chart-studio.js','flight-store.js'])ok(sw.includes(`/assets/${asset}`),`Service worker does not cache ${asset}`);
ok(procedures.includes('/assets/app-bootstrap.js'),'Procedures page logic must reach consolidated enhancements without depending on ads');
ok(checklist.includes('/assets/app-bootstrap.js'),'Training page logic must reach consolidated enhancements without depending on ads');
ok(/const CACHE='pilotdesk-v\d+'/.test(sw)&&Number(sw.match(/pilotdesk-v(\d+)/)?.[1]||0)>=38,'offline reliability release must use a current versioned service-worker cache');
for(const a of ['social-crosswind.svg','social-density-altitude.svg','social-e6b.svg','social-pilot-math.svg','social-route-planner.svg','social-weather.svg'])ok(fs.existsSync('assets/'+a),`Missing social asset ${a}`);
if(failures.length){console.error(`Feature consolidation checks failed (${failures.length})`);failures.forEach(x=>console.error(' - '+x));process.exit(1)}
console.log('Feature consolidation checks passed: shared flight storage and route-scoped planner/procedure/trainer enhancements remain wired without retired preview-shell layers.');
