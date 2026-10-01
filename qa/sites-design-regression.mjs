import assert from 'node:assert/strict';
import fs from 'node:fs';
import { navSections } from '../src/data/site.mjs';
import { sharedShell } from '../scripts/shared-shell.mjs';

// Every study workspace and both briefs need their correct navigation section.
const sectionFor=path=>navSections.filter(s=>s.paths.some(p=>p.endsWith('/')?path.startsWith(p):path===p)).map(s=>s.label);
for(const route of ['/learn/oral-exam/','/learn/checkride-lab/','/learn/study-plan/','/learn/coverage/'])assert.deepEqual(sectionFor(route),['Learn'],route);
for(const route of ['/flight-brief.html','/preflight-brief.html'])assert.deepEqual(sectionFor(route),['Plan'],route);

// A noindex auth page intentionally lacks a canonical URL. Its application shell
// must depend on the actual route, not the presence of SEO metadata.
const account=fs.readFileSync('account.html','utf8');
assert(!account.includes('rel="canonical"'));
for(const route of ['/account.html','/daily/index.html','/preflight-brief.html']){
 const output=sharedShell(account,route);
 assert(output.includes('class="pd-streamlined-app"'),route);
}

// Keep all five study modes, but prevent another duplicated session chooser.
const prep=fs.readFileSync('written-prep.html','utf8');
const chooser=prep.match(/<section class="pd-prep-modes[\s\S]*?<\/section>/)?.[0];
assert(chooser,'Written Prep session chooser');
for(const mode of ['learn','missed','marked','random','exam'])assert.equal((chooser.match(new RegExp(`data-mode="${mode}"`,'g'))||[]).length,1,mode);
assert.equal((prep.match(/class="[^"]*pd-prep-study-entry/g)||[]).length,1);
assert(prep.indexOf('id="pdPrepResume"')<prep.indexOf('id="pdPrepModes"'));
assert(prep.indexOf('id="pdPrepModes"')<prep.indexOf('id="pdPrepDashboard"'));

// Basic route output must precede advanced setup without removing any controls.
const route=fs.readFileSync('route-planner.html','utf8');
assert(route.indexOf('id="rpNavlog"')<route.indexOf('id="rpOfflinePacks"'));
for(const id of ['rpPhaseEnabled','rpPohEnabled','rpDepartureUtc','rpProcedureSegment','rpDownloadOffline','rpFuelResults'])assert(route.includes(`id="${id}"`),id);
console.log('Sites design regressions passed: navigation, noindex app shells, study modes/resume order and route controls.');
