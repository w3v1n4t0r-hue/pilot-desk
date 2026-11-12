import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const event = 'Pro Preflight Built';
const legacyPayload = { departure: 'KGFK', destination: 'KFAR', flightId: 'private-flight-id' };
const sent = [];
let now = 1000;
const window = {
  __pdTrackQueue: [[event, legacyPayload]],
  va: (command, payload) => { if (command === 'event') sent.push(payload); }
};

vm.runInNewContext(readFileSync('assets/analytics.js', 'utf8'), {
  window,
  Date: class extends Date { static now() { return now; } },
  document: { querySelector: () => ({}), addEventListener() {} },
  location: { pathname: '/preflight-brief.html' },
  addEventListener() {}
});

assert.equal(sent.length, 1, 'Queued completion still reaches analytics');
assert.equal(sent[0].name, event);
assert.deepEqual(Object.keys(sent[0].data), []);

sent.length = 0;
now += 1000;
window.pdTrack(event, legacyPayload);
assert.equal(sent.length, 1, 'Direct completion still reaches analytics');
assert.equal(sent[0].name, event);
assert.deepEqual(Object.keys(sent[0].data), []);

window.pdTrack('Weather Result', { freshness: 'fresh', route: 'KGFK KFAR', airport: 'KGFK', FLIGHTID: 'private-flight-id' });
assert.deepEqual(Object.keys(sent.at(-1).data), ['freshness']);
assert.equal(sent.at(-1).data.freshness, 'fresh', 'Unrelated event properties remain available');

const preflight = readFileSync('assets/pro-preflight.js', 'utf8');
assert.match(preflight, /pdTrack\?\.\('Pro Preflight Built'\)/);
console.log('Preflight analytics privacy checks passed.');
