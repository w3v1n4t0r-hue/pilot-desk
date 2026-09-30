import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url),
  { chromium } = require("playwright"),
  C = require("../src/server/cifp.cjs"),
  root = path.resolve("dist");
const source = {
    cycle: "2609",
    url: "https://aeronav.faa.gov/Upload_313-d/cifp/CIFP_260903.zip",
    validFrom: "2026-09-03T09:01:00.000Z",
    validUntil: "2026-10-01T09:01:00.000Z",
  },
  data = process.env.PILOTDESK_CIFP_FIXTURE
    ? C.parse(
        fs.readFileSync(process.env.PILOTDESK_CIFP_FIXTURE, "ascii"),
        source,
      )
    : null;
if (!data)
  throw Error(
    "Provide a current FAA fixture to verify navigation integration.",
  );
const image = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jR1kAAAAASUVORK5CYII=",
  "base64",
);
let tileFailure = false;
const server = http.createServer((req, res) => {
  const url = new URL(req.url, "http://localhost");
  const send = (status, type, body) => {
    res.writeHead(status, { "Content-Type": type });
    res.end(body);
  };
  if (url.pathname === "/api/navigation") {
    const id = url.searchParams.get("ident"),
      product = url.searchParams.get("product");
    if (product === "airway")
      return send(
        200,
        "application/json",
        JSON.stringify({ source, legs: data.airways.get(id) }),
      );
    if (product === "procedures")
      return send(
        200,
        "application/json",
        JSON.stringify({
          source,
          procedures: [...data.procedures.values()].filter(
            (p) => p.airport === id,
          ),
        }),
      );
    return send(
      200,
      "application/json",
      JSON.stringify({ source, point: data.identifiers.get(id)?.[0] }),
    );
  }
  if (url.pathname === "/api/chart-tile")
    return send(
      tileFailure ? 502 : 200,
      tileFailure ? "application/json" : "image/png",
      tileFailure ? "{}" : image,
    );
  if (url.pathname === "/api/procedure-pdf")
    return send(200, "application/pdf", Buffer.from("%PDF-1.7\nQA fixture"));
  if (url.pathname.startsWith("/api/"))
    return send(
      200,
      "application/json",
      JSON.stringify({
        geojson: { type: "FeatureCollection", features: [] },
        error: "QA weather intentionally unavailable",
      }),
    );
  if (url.pathname.startsWith("/test-leaflet")) {
    if (url.pathname.endsWith(".js"))
      return send(
        200,
        "application/javascript",
        fs.readFileSync(process.env.PILOTDESK_LEAFLET_JS),
      );
    if (url.pathname.endsWith(".css"))
      return send(
        200,
        "text/css",
        fs.readFileSync(process.env.PILOTDESK_LEAFLET_CSS),
      );
    return send(200, "image/png", image);
  }
  const file = path.resolve(
    root,
    "." + (url.pathname === "/" ? "/index.html" : url.pathname),
  );
  if (
    !file.startsWith(root + "/") ||
    !fs.existsSync(file) ||
    !fs.statSync(file).isFile()
  )
    return send(404, "text/plain", "Missing");
  let body = fs.readFileSync(file);
  const type = file.endsWith(".html")
    ? "text/html"
    : file.endsWith(".js")
      ? "application/javascript"
      : file.endsWith(".css")
        ? "text/css"
        : file.endsWith(".json")
          ? "application/json"
          : "application/octet-stream";
  if (type === "text/html")
    body = body
      .toString()
      .replaceAll("https://unpkg.com/leaflet@1.9.4/dist/", "/test-leaflet/");
  send(200, type, body);
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const origin = "http://127.0.0.1:" + server.address().port,
  browser = await chromium.launch({ headless: true });
try {
  const context = await browser.newContext(),
    page = await context.newPage(),
    errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(origin + "/route-planner.html");
  await page.waitForFunction(() => window.PilotDeskRoutePlanner?.getMap());
  await page.evaluate(async () => {
    await navigator.serviceWorker.register("/sw.js");
    await navigator.serviceWorker.ready;
  });
  await page.waitForFunction(() => navigator.serviceWorker.controller, {
    timeout: 30000,
  });
  await page.locator("#rpRoute").fill("CTB V430 AGRYN");
  await page.locator("#rpBuild").click();
  await page.waitForFunction(() => window.pdNavlogResult?.totalDistance > 0);
  assert.deepEqual(
    await page.evaluate(() =>
      PilotDeskRoutePlanner.getPoints().map((p) => p.id),
    ),
    ["CTB", "HEKIT", "AGRYN"],
  );
  assert.ok(
    (await page.textContent("#rpNavigationStatus")).includes("CIFP 2609"),
  );
  // Editing an expanded route must target the selected expanded point, not the raw airway token.
  await page.evaluate(() =>
    PilotDeskRoutePlanner.insertPoint(2, { lat: 48.565, lng: -112 }),
  );
  await page.waitForFunction(
    () => PilotDeskRoutePlanner.getPoints().length === 4,
  );
  assert.ok((await page.inputValue("#rpRoute")).includes("HEKIT,"));
  await page.locator("#rpRoute").fill("KGFK DCT KFAR");
  await page.locator("#rpBuild").click();
  await page.waitForFunction(
    () => PilotDeskRoutePlanner.getPoints()[0]?.id === "KGFK",
  );
  await page.evaluate(() => {
    const rows = [];
    for (const pressureAltitude of [0, 6000])
      for (const oat of [0, 30])
        for (const weight of [2000, 3000])
          rows.push({
            pressureAltitude,
            oat,
            weight,
            cruiseTas: 110,
            cruiseBurn: 8,
            climbTas: 90,
            climbBurn: 12,
            climbRate: 600 - pressureAltitude / 30,
            descentTas: 120,
            descentBurn: 6,
            descentRate: 600,
          });
    PilotDeskRoutePerformance.setSettings({
      phases: {
        enabled: true,
        cruiseAltitude: 3000,
        departureElevation: 1000,
        destinationElevation: 1000,
      },
      aircraftPerformance: {
        table: {
          source: "QA analytic fixture — not aircraft data",
          configuration: "Test only",
          rows,
        },
        conditions: { weight: 2500, oat: 10, pressureOffset: 0, lapseRate: 2 },
      },
    });
    PilotDeskRoutePlanner.invalidate();
  });
  await page.locator("#rpBuild").click();
  await page.waitForFunction(() => window.pdNavlogResult?.phaseSummary);
  assert.ok(
    (await page.textContent("#rpPhaseResults")).includes("Top of climb"),
  );
  assert.equal(
    await page.evaluate(() => PilotDeskRoutePlanner.getLegs()[0].tas),
    110,
  );
  await page.locator("#rpProcedureAirport").fill("KGFK");
  await page.locator("#rpLoadProcedureSegments").click();
  await page.waitForFunction(
    () => document.querySelector("#rpProcedureSegment").options.length > 1,
  );
  await page.selectOption("#rpProcedureSegment", "0");
  assert.ok((await page.locator("#rpProcedureLegs tr").count()) > 1);
  await page.evaluate(() => {
    PilotDeskRoutePlanner.getMap().setView([47.95, -97.18], 11, {
      animate: false,
    });
    document.getElementById("rpOfflineResolution").value = "8";
    localStorage.setItem(
      "pd-route-procedures",
      JSON.stringify([
        {
          station: "KGFK",
          name: "QA attached PDF",
          viewUrl: "/api/procedure-pdf?cycle=2609&file=TEST.PDF",
          pdfUrl: "https://aeronav.faa.gov/d-tpp/2609/TEST.PDF",
        },
      ]),
    );
  });
  await page.locator("#rpDownloadOffline").click();
  await page.waitForFunction(
    () => !document.querySelector("#rpDownloadOffline").disabled,
    { timeout: 120000 },
  );
  assert.ok(
    (await page.textContent("#rpOfflineStatus")).startsWith(
      "Pack downloaded and verified",
    ),
    await page.textContent("#rpOfflineStatus"),
  );
  let packs = await page.evaluate(() => PilotDeskOfflinePacks.list());
  assert.equal(packs.length, 1);
  assert.ok(packs[0].complete);
  assert.ok(packs[0].tiles > 0);
  assert.ok(packs[0].urls.some((u) => u.includes("MapServer/tile")));
  // A failed second download must preserve the completed pack and discard the draft cache.
  tileFailure = true;
  await page.locator("#rpDownloadOffline").click();
  await page.waitForFunction(
    () => !document.querySelector("#rpDownloadOffline").disabled,
  );
  assert.equal(
    (await page.evaluate(() => PilotDeskOfflinePacks.list())).length,
    1,
  );
  assert.ok(
    (await page.textContent("#rpOfflineStatus")).includes("Download failed"),
    await page.textContent("#rpOfflineStatus"),
  );
  tileFailure = false;
  await page.locator("#rpDownloadOffline").click();
  await page.locator("#rpCancelOffline").click();
  await page.waitForFunction(
    () => !document.querySelector("#rpDownloadOffline").disabled,
  );
  assert.equal(
    (await page.evaluate(() => PilotDeskOfflinePacks.list())).length,
    1,
  );
  assert.ok(
    (await page.textContent("#rpOfflineStatus")).includes("cancelled"),
    await page.textContent("#rpOfflineStatus"),
  );
  await context.setOffline(true);
  await page.reload();
  await page.waitForFunction(() => window.PilotDeskRoutePlanner?.getMap());
  await page
    .locator("#rpOfflineList button")
    .filter({ hasText: "Open", exact: true })
    .click();
  await page.waitForFunction(
    () => !document.querySelector("#rpBuild").disabled,
  );
  assert.ok(
    await page.evaluate(() => window.pdNavlogResult?.totalDistance > 0),
    await page.textContent("#rpStatus"),
  );
  assert.deepEqual(
    await page.evaluate(() =>
      PilotDeskRoutePlanner.getPoints().map((p) => p.id),
    ),
    ["KGFK", "KFAR"],
  );
  assert.ok(
    (await page.textContent("#rpOfflineStatus")).includes(
      "Weather, NOTAMs, TFRs",
    ),
  );
  console.log(
    "Tile read",
    await page.evaluate(
      async (url) => {
        try {
          const r = await fetch(url);
          const b = await r.blob();
          const img = new Image();
          img.src = URL.createObjectURL(b);
          try {
            await img.decode();
            return {
              status: r.status,
              type: r.type,
              size: b.size,
              decode: true,
            };
          } catch (e) {
            return { status: r.status, size: b.size, error: e.message };
          }
        } catch (e) {
          return { error: e.message };
        }
      },
      packs[0].urls.find((u) => u.includes("MapServer/tile")),
    ),
  );
  await page.evaluate(() => {
    const m = PilotDeskRoutePlanner.getMap();
    m.stop();
    m.setView([47.95, -97.18], 7, { animate: false });
  });
  try {
    await page.waitForFunction(
      () =>
        [...document.querySelectorAll(".leaflet-tile-loaded")].some((t) =>
          t.src.includes("tiles.arcgis.com"),
        ),
      null,
      { timeout: 5000 },
    );
  } catch (e) {
    console.log(
      "Tile failure detail",
      await page.evaluate(() => ({
        zoom: PilotDeskRoutePlanner.getMap().getZoom(),
        tiles: [...document.querySelectorAll(".leaflet-tile")]
          .map((t) => ({
            src: t.src,
            classes: t.className,
            complete: t.complete,
            width: t.naturalWidth,
          }))
          .slice(0, 20),
        status: document.getElementById("rpMapStatus").textContent,
      })),
    );
    throw e;
  }
  assert.equal(
    await page.evaluate(async () => {
      const r = await fetch("/api/procedure-pdf?cycle=2609&file=TEST.PDF");
      return r.ok;
    }),
    true,
  );
  assert.equal(
    await page.evaluate(async () => {
      try {
        await fetch("/api/weather?ident=KGFK");
        return false;
      } catch {
        return true;
      }
    }),
    true,
  );
  assert.deepEqual(errors, []);
  await page.screenshot({ path: "/tmp/pd-offline-flight.png", fullPage: true });
  console.log(
    "Browser flow passed: real FAA route/airway parsing, expanded route editing, procedure constraints, complete pack, cancelled/failed download isolation, POH table restoration, offline reload/navlog/chart/PDF, weather bypass, no runtime errors.",
  );
} finally {
  await browser.close();
  await new Promise((r) => server.close(r));
}
