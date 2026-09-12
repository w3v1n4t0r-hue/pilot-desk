import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8');
const failures=[];const ok=(v,m)=>{if(!v)failures.push(m)};
const required=['assets/flight-library.js','assets/planner-pro.js','assets/procedure-pro.js','assets/trainer-pro.js','assets/preview-harvest.js','assets/poh-chart-studio.js','assets/aircraft-transfer.js','assets/aircraft-training.js','api/procedure-pdf.js'];
for(const p of required)ok(fs.existsSync(p),`Missing consolidated preview feature ${p}`);
const flights=read('assets/flight-library.js'),planner=read('assets/planner-pro.js'),proc=read('assets/procedure-pro.js'),trainer=read('assets/trainer-pro.js'),harvest=read('assets/preview-harvest.js'),poh=read('assets/poh-chart-studio.js'),air=read('assets/aircraft-transfer.js'),pdf=read('api/procedure-pdf.js'),bootstrap=read('assets/app-bootstrap.js'),sw=read('sw.js');
for(const s of ['pd-flights-v1','Save current flight','data-flight-open','data-flight-update','data-flight-copy','data-flight-delete'])ok(flights.includes(s),`Saved-flight library missing ${s}`);
for(const s of ['rpAircraft','CSV','navigator.clipboard','Ctrl','navlog'])ok(planner.includes(s),`Planner enhancement missing ${s}`);
for(const s of ['Open preview','Reload','Escape','pd-proc-focus'])ok(proc.includes(s),`Procedure enhancement missing ${s}`);
for(const s of ['Export','Import','keydown','ArrowLeft','ArrowRight'])ok(trainer.includes(s),`Training enhancement missing ${s}`);
for(const s of ['pd-result-context','Run the sample values','Try the calculator','Offline-ready after first visit','Learn the formula','dynamicSocialFallback'])ok(harvest.includes(s),`Curated preview harvest missing ${s}`);
for(const forbidden of ['pd-mobile-bar','Popular right now','beforeinstallprompt','pd-install-card'])ok(!harvest.includes(forbidden),`Preview harvest reintroduced superseded UI: ${forbidden}`);
ok(poh.includes("KEY='pd-poh-models-v2'")&&poh.includes('will not extrapolate')&&poh.includes('Save model locally'),'POH chart studio did not preserve saved-model/no-extrapolation upgrade');
ok(air.includes("cruiseTas:s('cruiseTas')"),'Aircraft import/export must preserve cruise TAS');
for(const s of ["['GET','HEAD']",'safeRange','content-range','Readable.fromWeb','Accept-Ranges'])ok(pdf.includes(s),`Procedure PDF proxy missing ${s}`);
for(const a of ['planner-pro.js','flight-library.js','procedure-pro.js','trainer-pro.js','preview-harvest.js']){ok(bootstrap.includes(`/assets/${a}`),`Bootstrap does not wire ${a}`);ok(sw.includes(`/assets/${a}`),`Service worker does not cache ${a}`)}
ok(sw.includes("CACHE='pilotdesk-v27'"),'Consolidated preview release must use service worker v27');
for(const a of ['social-crosswind.svg','social-density-altitude.svg','social-e6b.svg','social-pilot-math.svg','social-route-planner.svg','social-weather.svg'])ok(fs.existsSync('assets/'+a),`Missing harvested social asset ${a}`);
if(failures.length){console.error(`Preview consolidation checks failed (${failures.length})`);failures.forEach(x=>console.error(' - '+x));process.exit(1)}
console.log('Preview consolidation checks passed: unique preview capabilities were harvested without restoring superseded navigation/install UI or touching calculator formulas.');
