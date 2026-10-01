'use strict';

// Keep public endpoint URLs while bundling these lookups into one function.
const handlers = {
  'airport-search': require('../src/server/airport-search.cjs'),
  'nearby-airports': require('../src/server/nearby-airports.cjs'),
  navigation: require('../src/server/navigation.cjs'),
};

module.exports = async function handler(req, res) {
  const route = req.query?.pdLookup;
  if (typeof route !== 'string' || !Object.hasOwn(handlers, route)) {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(404).json({ error: 'Unknown navigation lookup.' });
  }
  return handlers[route](req, res);
};
