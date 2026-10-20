import fs from 'node:fs';
import assert from 'node:assert/strict';

const page = fs.readFileSync('src/pages/faa-sample-questions.astro', 'utf8');
const training = fs.readFileSync('src/pages/flight-training.astro', 'utf8');
const ads = fs.readFileSync('assets/ads.js', 'utf8');

assert.match(page, /robots="noindex,follow"/);
assert.match(page, /FAA sample knowledge test questions/);
assert.match(page, /Transport Canada PSTAR study guide, TP 11919/);
assert.match(page, /Current FAA Airman Certification Standards/);
assert.match(page, /PilotDesk Written Prep/);
assert.doesNotMatch(page, /faa-samples\.json|canada-pstar\.json|data-sample-question|source_question_number/);
assert.ok(!fs.existsSync('src/data/faa-samples.json'));
assert.ok(!fs.existsSync('src/data/canada-pstar.json'));
assert.ok(training.includes('/faa-sample-questions.html'));
assert.match(ads, /adFreePaths=new Set\(\['\/tools\.html','\/guides\.html','\/faa-sample-questions\.html'\]\)/);

console.log('Sample question route now points to official study sources without republishing question banks.');
