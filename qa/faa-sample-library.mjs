import fs from 'node:fs';
import assert from 'node:assert/strict';
const page=fs.readFileSync('src/pages/faa-sample-questions.astro','utf8');
const {questions}=JSON.parse(fs.readFileSync('src/data/faa-samples.json','utf8'));
assert.equal(questions.length,436);
assert.equal(new Set(questions.map(q=>q.id)).size,436);
assert.deepEqual(Object.fromEntries(['PAR','IRA','CAX','FIA','FOI','ATM','UAG'].map(t=>[t,questions.filter(q=>q.track===t).length])),{PAR:61,IRA:59,CAX:50,FIA:100,FOI:20,ATM:100,UAG:46});
for(const q of questions){assert.equal(q.correct_choice,null);assert.equal(q.publication_status,'reference_only');assert.deepEqual(Object.keys(q.choices),['A','B','C']);assert.ok(q.source_url.startsWith('https://www.faa.gov/'));}
assert.match(page,/not scored/);
assert.ok(fs.readFileSync('src/pages/flight-training.astro','utf8').includes('/faa-sample-questions.html'));
assert.ok(fs.readFileSync('written-prep.html','utf8').includes('/faa-sample-questions.html'));
console.log('FAA reference collection: 436 source-linked, unscored records; both discovery links present.');

const canada=JSON.parse(fs.readFileSync('src/data/canada-pstar.json','utf8'));
assert.equal(canada.questions.length,185);
assert.deepEqual(canada.intentionally_blank_source_numbers,['7.07']);
for(const q of canada.questions){assert.equal(q.jurisdiction,'CA');assert.equal(q.correct_choice,null);assert.equal(q.publication_status,'reference_only');assert.deepEqual(Object.keys(q.choices),['1','2','3','4']);assert.ok(q.source_url.startsWith('https://tc.canada.ca/'));}
assert.ok(questions.find(q=>q.id==='faa-atm-2021-100').review_flags.length);
assert.match(page,/Canadian rules/);
assert.ok(!JSON.stringify(canada).includes('tc-ppl-2008'));
console.log('Canadian collection: 185 attributed, unscored questions; restricted private sample excluded.');
