import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { sharedShell } from '../scripts/shared-shell.mjs';

const source = readFileSync('assets/analytics.js', 'utf8');
const attribution = 'utm_source=test&utm_medium=email&utm_campaign=sample&utm_term=planning&utm_content=button';
const privateParams = 'id=private-id&route=KGFK%20KFAR&flight=private-flight&station=KGFK';
const origin = 'https://www.pilot-desk.com';
const loaders = [
  ['va', '/_vercel/insights/script.js'],
  ['si', '/_vercel/speed-insights/script.js']
];
const cases = [
  ['/flight-brief.html', 'KGFK'],
  ['/preflight-brief.html', 'KGFK'],
  ['/route-planner.html', 'KGFK'],
  ['/weather.html', 'KGFK'],
  ['/pricing.html', 'KGFK', 'direct'],
  ['/pricing.html', 'route-planner', 'route-planner']
];
for (const [path, from, pricingSource] of cases) {
  const url = origin + path + '?' + privateParams + '&' + attribution + '&from=' + from + '#private-fragment';
  const referrer = origin + '/flights.html?' + attribution + '&' + privateParams + '&from=KFAR#private-fragment';
  const location = new URL(url);
  const window = {};
  const hooks = new Map();
  const loaded = [];
  const document = {
    referrer,
    querySelector: () => null,
    createElement: () => ({ setAttribute() {} }),
    addEventListener() {},
    head: { appendChild(script) {
      const [name] = loaders.find(([, src]) => src === script.src);
      const [command, hook] = window[name === 'va' ? 'vaq' : 'siq'][0];
      assert.equal(command, 'beforeSend', 'Redaction must be queued before the collector loads');
      hooks.set(name, hook);
      loaded.push(script.src);
    } }
  };
  const context = vm.createContext({ window, document, location, URL, addEventListener() {} });
  vm.runInContext(source, context);
  vm.runInContext(source, context);
  assert.deepEqual(loaded, loaders.map(([, src]) => src), 'Duplicate bootstrap must not load a collector twice');
  assert.equal(hooks.size, loaders.length);
  for (const hook of hooks.values()) {
    const event = { url, referrer, metric: 'LCP' };
    const safe = hook(event);
    assert.equal(safe.url, origin + path + '?' + attribution);
    assert.equal(safe.referrer, origin + '/flights.html?' + attribution);
    assert.equal(safe.metric, 'LCP');
    assert.equal(event.url, url);
    assert.equal(hook({ url: 'http://[' }), null);
  }
  assert.equal(location.href, url, 'Existing links must retain their URL parameters');
  if (pricingSource) {
    const pricing = window.vaq.find(([command, event]) => command === 'event' && event.name === 'Pricing Viewed');
    assert.equal(pricing[1].data.source, pricingSource);
  }
}

for (const html of [
  readFileSync('src/layouts/BaseLayout.astro', 'utf8'),
  sharedShell(readFileSync('flight-brief.html', 'utf8'), '/flight-brief.html')
]) {
  assert.match(html, /src="\/assets\/analytics\.js"/);
  assert.doesNotMatch(html, /src="\/_vercel\/(?:speed-)?insights\/script\.js"/);
}
assert.match(readFileSync('vercel.json', 'utf8'), /"key": "Referrer-Policy",\s*"value": "strict-origin-when-cross-origin"/);
console.log('Analytics URL redaction checks passed.');
