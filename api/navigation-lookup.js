'use strict';

// Keep public endpoint URLs while bundling these lookups into one function.
const handlers = {
  'airport-search': require('../src/server/airport-search.cjs'),
  'nearby-airports': require('../src/server/nearby-airports.cjs'),
  navigation: require('../src/server/navigation.cjs'),
};

module.exports = async function handler(req, res) {
  const route = req.query?.pdLookup;
  if (route === 'route-review-briefing' || route === 'route-review-resolve') {
    res.setHeader('Cache-Control', 'no-store');
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      return res.status(405).json({ error: 'Use POST to request a route review.' });
    }
    try {
      const service = await import('../src/server/route-review-service.mjs');
      const body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {});
      const request = new Request('https://www.pilot-desk.com/api/navigation-lookup', { method: 'POST', body });
      const response = await (route === 'route-review-briefing' ? service.handleBriefing(request) : service.handleResolve(request));
      return res.status(response.status).json(await response.json());
    } catch {
      return res.status(502).json({ error: 'Route review could not be retrieved. Your route is preserved; try again.' });
    }
  }
  if (typeof route !== 'string' || !Object.hasOwn(handlers, route)) {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(404).json({ error: 'Unknown navigation lookup.' });
  }
  return handlers[route](req, res);
};
