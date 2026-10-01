import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const handler = require('../api/navigation-lookup.js');
const config = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
const routes = ['airport-search', 'nearby-airports', 'navigation'];
assert.ok(fs.readdirSync('api').filter(file => file.endsWith('.js')).length <= 12);
function response() {
  return { code: 200, headers: {}, setHeader(key, value) { this.headers[key] = value; },
    status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } };
}
for (const route of routes) {
  assert.equal(config.rewrites.find(rule => rule.source === `/api/${route}`).destination,
    `/api/navigation-lookup?pdLookup=${route}`);
  const res = response();
  await handler({ method: 'POST', query: { pdLookup: route } }, res);
  assert.equal(res.code, 405, `${route} retains method validation`);
}
for (const route of ['unknown', '__proto__', ['navigation']]) {
  const res = response();
  await handler({ method: 'GET', query: { pdLookup: route } }, res);
  assert.equal(res.code, 404);
}
const originalFetch = globalThis.fetch;
try {
  globalThis.fetch = async () => ({ ok: true, arrayBuffer: async () => Buffer.from(JSON.stringify([
    { icaoId: 'KGFK', site: 'Grand Forks', lat: 47.95, lon: -97.18 },
    { icaoId: 'KFAR', site: 'Fargo', lat: 46.92, lon: -96.82 },
  ])) });
  const search = response();
  await handler({ method: 'GET', query: { pdLookup: 'airport-search', q: 'Grand Forks' } }, search);
  assert.equal(search.code, 200);
  assert.equal(search.body.results[0].id, 'KGFK');
  const nearby = response();
  await handler({ method: 'GET', query: { pdLookup: 'nearby-airports', lat: '47.95', lon: '-97.18', exclude: 'KGFK' } }, nearby);
  assert.equal(nearby.code, 200);
  assert.equal(nearby.body.results[0].id, 'KFAR');
  const navigation = response();
  await handler({ method: 'GET', query: { pdLookup: 'navigation', ident: '?' } }, navigation);
  assert.equal(navigation.code, 400);
} finally { globalThis.fetch = originalFetch; }
console.log('Navigation lookup dispatch, query preservation, validation, and function budget passed.');
