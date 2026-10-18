import fs from 'node:fs';
import assert from 'node:assert/strict';
const page=fs.readFileSync('src/pages/faa-sample-questions.astro','utf8');
const {questions}=JSON.parse(fs.readFileSync('src/data/faa-samples.json','utf8'));
assert.equal(questions.length,270);
assert.equal(new Set(questions.map(q=>q.id)).size,270);
assert.deepEqual(Object.fromEntries(['PAR','IRA','CAX','FIA'].map(t=>[t,questions.filter(q=>q.track===t).length])),{PAR:61,IRA:59,CAX:50,FIA:100});
for(const q of questions){assert.equal(q.correct_choice,null);assert.equal(q.publication_status,'reference_only');assert.deepEqual(Object.keys(q.choices),['A','B','C']);assert.ok(q.source_url.startsWith('https://www.faa.gov/'));}
assert.match(page,/not scored/);
assert.ok(fs.readFileSync('src/pages/flight-training.astro','utf8').includes('/faa-sample-questions.html'));
assert.ok(fs.readFileSync('written-prep.html','utf8').includes('/faa-sample-questions.html'));
console.log('FAA reference collection: 270 source-linked, unscored records; both discovery links present.');
