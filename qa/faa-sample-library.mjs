import fs from 'node:fs';
import assert from 'node:assert/strict';
const page=fs.readFileSync('src/pages/faa-sample-questions.astro','utf8');
const {questions}=JSON.parse(fs.readFileSync('src/data/faa-samples.json','utf8'));
assert.equal(questions.length,574);
assert.equal(new Set(questions.map(q=>q.id)).size,574);
assert.deepEqual(Object.fromEntries(['PAR','IRA','CAX','FIA','FOI','ATM','UAG','SPA','ADX','AGI','PRH'].map(t=>[t,questions.filter(q=>q.track===t).length])),{PAR:61,IRA:59,CAX:50,FIA:100,FOI:20,ATM:100,UAG:46,SPA:36,ADX:45,AGI:38,PRH:19});
for(const q of questions){assert.equal(q.correct_choice,null);assert.equal(q.publication_status,'reference_only');assert.deepEqual(Object.keys(q.choices),['A','B','C']);assert.ok(q.source_url.startsWith('https://www.faa.gov/'));}
assert.match(page,/not scored/);
assert.ok(fs.readFileSync('src/pages/flight-training.astro','utf8').includes('/faa-sample-questions.html'));
assert.ok(fs.readFileSync('written-prep.html','utf8').includes('/faa-sample-questions.html'));
console.log('FAA reference collection: 574 source-linked, unscored records; both discovery links present.');

const canada=JSON.parse(fs.readFileSync('src/data/canada-pstar.json','utf8'));
assert.equal(canada.questions.length,185);
assert.deepEqual(canada.intentionally_blank_source_numbers,['7.07']);
for(const q of canada.questions){assert.equal(q.jurisdiction,'CA');assert.equal(q.correct_choice,null);assert.equal(q.publication_status,'reference_only');assert.deepEqual(Object.keys(q.choices),['1','2','3','4']);assert.ok(q.source_url.startsWith('https://tc.canada.ca/'));}
assert.ok(questions.find(q=>q.id==='faa-atm-2021-100').review_flags.length);
assert.match(page,/Canadian rules/);
assert.ok(!JSON.stringify(canada).includes('tc-ppl-2008'));
console.log('Canadian collection: 185 attributed, unscored questions; restricted private sample excluded.');

assert.ok(questions.find(q=>q.id==='faa-prh-2021-038').requires_figure_review);
assert.match(page,/Historical Sport Pilot/);
const normalize=q=>(q.question+Object.values(q.choices).join(' ')).replace(/[^\p{L}\p{N}_]+/gu,'').toLowerCase();
const original=questions.filter(q=>!['SPA','ADX','AGI','PRH'].includes(q.track));
const known=new Set(original.map(normalize));
for(const q of questions.filter(q=>['SPA','ADX','AGI','PRH'].includes(q.track))){assert.ok(!known.has(normalize(q)),q.id+' duplicates prior content');known.add(normalize(q));}
