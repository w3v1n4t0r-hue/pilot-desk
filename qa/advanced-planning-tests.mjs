import assert from "node:assert/strict";
import { createRequire } from "node:module";
import fs from "node:fs";
const require = createRequire(import.meta.url),
  N = require("../assets/navlog-core.js"),
  P = require("../assets/aircraft-performance-core.js"),
  R = require("../assets/route-navigation.js"),
  O = require("../assets/offline-packs.js"),
  C = require("../src/server/cifp.cjs");
// Independent analytic linear surface: interpolation must reconstruct these values exactly.
const rows = [];
for (const pressureAltitude of [0, 6000])
  for (const oat of [0, 30])
    for (const weight of [2000, 3000])
      rows.push({
        pressureAltitude,
        oat,
        weight,
        cruiseTas: 100 + pressureAltitude / 1000 + oat / 10 + weight / 1000,
        cruiseBurn: 10,
        climbTas: 90,
        climbBurn: 12,
        climbRate: 600 - pressureAltitude / 20,
        descentTas: 120,
        descentBurn: 6,
        descentRate: 600,
      });
assert.deepEqual(
  P.csv(
    [...P.axes, ...P.values].join(",") +
      "\n" +
      [0, 10, 2500, 110, 10, 90, 12, 500, 120, 6, 600].join(","),
  )[0].climbRate,
  500,
);
assert.throws(() => P.csv("bad,columns\n1,2"), /header/);
const table = {
  source: "QA analytic fixture — not aircraft data",
  configuration: "Test only",
  rows,
};
assert.equal(
  P.interpolate(table, { pressureAltitude: 3000, oat: 15, weight: 2500 })
    .cruiseTas,
  107,
);
assert.throws(
  () => P.interpolate(table, { pressureAltitude: 6001, oat: 15, weight: 2500 }),
  /extrapolation/,
);
assert.throws(
  () =>
    P.interpolate(
      { ...table, rows: rows.slice(1) },
      { pressureAltitude: 3000, oat: 15, weight: 2500 },
    ),
  /corner/,
);
assert.throws(
  () => P.validate({ ...table, rows: [...rows, rows[0]] }),
  /Duplicate/,
);
const phases = {
    enabled: true,
    cruiseAltitude: 6000,
    departureElevation: 0,
    destinationElevation: 0,
  },
  performance = P.plan(
    table,
    { weight: 2500, oat: 10, pressureOffset: 0, lapseRate: 2 },
    phases,
  );
assert.equal(performance.phases.bands.climb.length, 12);
assert.ok(
  Math.abs(
    performance.phases.bands.descent.reduce((n, b) => n + b.hours, 0) * 60 - 10,
  ) < 1e-9,
);
const points = [
  { id: "A", lat: 40, lon: -100 },
  { id: "B", lat: 40, lon: -96 },
];
const nav = N.plannedBuild(
  points,
  { tas: 100, burn: 10, windFrom: 0, windSpeed: 0 },
  {
    phases,
    aircraftPerformance: {
      table,
      conditions: { weight: 2500, oat: 10, pressureOffset: 0, lapseRate: 2 },
    },
  },
);
assert.ok(nav.phaseSummary.climbMinutes > 10);
assert.ok(
  Math.abs(
    nav.legs[0].phases.reduce((n, b) => n + b.distance, 0) - nav.totalDistance,
  ) < 1e-8,
);
assert.ok(
  Math.abs(
    nav.legs[0].phases
      .filter((b) => b.kind === "descent")
      .reduce((n, b) => n + b.fuel, 0) - 1,
  ) < 1e-9,
);
assert.throws(
  () =>
    P.plan(
      table,
      { weight: 2500, oat: 29, pressureOffset: 0, lapseRate: 2 },
      phases,
    ),
  /extrapolation/,
);
const fixes = [
    { id: "A", lat: 40, lon: -100 },
    { id: "X", lat: 40, lon: -99 },
    { id: "B", lat: 40, lon: -98 },
  ],
  legs = fixes.map((point, i) => ({
    point,
    sequence: i * 10,
    end: i === 2,
    direction: "",
    minimum: "03000",
  }));
assert.deepEqual(
  R.expand(legs, fixes[0], fixes[2]).map((p) => p.id),
  ["X", "B"],
);
assert.deepEqual(
  R.expand(legs, fixes[2], fixes[0]).map((p) => p.id),
  ["X", "A"],
);
assert.throws(
  () =>
    R.expand(
      legs.map((l, i) => ({ ...l, end: i === 1 })),
      fixes[0],
      fixes[2],
    ),
  /discontinuity/,
);
assert.throws(
  () =>
    R.expand(
      legs.map((l) => ({ ...l, direction: "F" })),
      fixes[2],
      fixes[0],
    ),
  /restriction/,
);
assert.throws(
  () =>
    R.expand(
      legs.map((l, i) => (i === 1 ? { ...l, point: null } : l)),
      fixes[0],
      fixes[2],
    ),
  /unresolved/,
);
const chart = { minNativeZoom: 8, maxNativeZoom: 12 };
assert.ok(
  O.tiles(
    { west: -97.2, east: -97.15, south: 47.9, north: 47.95 },
    chart,
    8,
    12,
  ).length > 0,
);
assert.throws(
  () => O.tiles({ west: -125, east: -66, south: 25, north: 49 }, chart, 8, 12),
  /800/,
);
assert.throws(
  () => O.tiles({ west: 179, east: -179, south: 0, north: 1 }, chart, 8, 12),
  /date line/,
);
assert.equal(
  O.valid({ complete: true, expires: new Date(0).toISOString() }),
  false,
);
assert.equal(
  O.valid({
    complete: false,
    expires: new Date(Date.now() + 100000).toISOString(),
  }),
  false,
);
assert.equal(C.coordinate("N40000000", true), 40);
assert.equal(C.coordinate("W097300000", false), -97.5);
assert.equal(C.coordinate("N40600000", true), null);
assert.equal(C.crc32(Buffer.from("123456789")), 0xcbf43926);
assert.throws(() => C.unzip(Buffer.from("bad")), /archive/);
if (process.env.PILOTDESK_CIFP_FIXTURE) {
  const d = C.parse(
    fs.readFileSync(process.env.PILOTDESK_CIFP_FIXTURE, "ascii"),
    { cycle: "2609" },
  );
  assert.ok(d.records > 300000);
  assert.ok(d.identifiers.get("KGFK")?.length);
  assert.ok(d.airways.get("V430")?.every((l) => l.point));
  assert.ok(
    [...d.procedures.values()].some(
      (p) => p.airport === "KGFK" && p.legs.length,
    ),
  );
  console.log(
    "Current FAA fixture validated:",
    d.records,
    "records",
    d.airways.size,
    "airways",
  );
}
console.log(
  "Advanced planning checks passed: interpolation, unavailable conditions, phase bands, airway continuity/direction, archive integrity, offline tile/expiration bounds.",
);

const tileHandler = require("../api/chart-tile.js"),
  originalFetch = globalThis.fetch;
let requested = "";
const response = () => ({
  code: 200,
  headers: {},
  setHeader(k, v) {
    this.headers[k] = v;
  },
  status(code) {
    this.code = code;
    return this;
  },
  json(body) {
    this.body = body;
    return this;
  },
  send(body) {
    this.body = body;
    return this;
  },
});
try {
  globalThis.fetch = async (url) => {
    requested = url;
    return {
      ok: true,
      headers: new Headers({ "content-type": "application/octet-stream" }),
      arrayBuffer: async () =>
        Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 0]),
    };
  };
  let res = response();
  await tileHandler(
    { method: "GET", query: { chart: "sectional", z: "7", x: "1", y: "1" } },
    res,
  );
  assert.equal(res.code, 400);
  assert.equal(requested, "");
  res = response();
  await tileHandler(
    {
      method: "GET",
      query: { chart: "sectional", z: "12", x: "942", y: "1424" },
    },
    res,
  );
  assert.equal(res.code, 200);
  assert.equal(res.headers["Content-Type"], "image/png");
  assert.ok(requested.endsWith("/VFR_Sectional/MapServer/tile/12/1424/942"));
  globalThis.fetch = async () => ({
    ok: true,
    headers: new Headers(),
    arrayBuffer: async () => Buffer.from("<html>source unavailable</html>"),
  });
  res = response();
  await tileHandler(
    {
      method: "GET",
      query: { chart: "sectional", z: "12", x: "942", y: "1424" },
    },
    res,
  );
  assert.equal(res.code, 502);
} finally {
  globalThis.fetch = originalFetch;
}
console.log(
  "FAA tile proxy checks passed: allowed source bounds, binary image signatures, misleading upstream MIME and non-image rejection.",
);
