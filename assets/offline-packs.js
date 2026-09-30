(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.PilotDeskOfflinePacks = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";
  const PREFIX = "pd-flight-pack-",
    MANIFEST = "/__pilotdesk_pack_manifest__",
    LIMIT = 100 * 1024 * 1024,
    MAX_TILES = 800;
  let controller = null,
    cancelRequested = false;
  function tiles(bounds, chart, min, max) {
    if (
      ![bounds.west, bounds.east, bounds.north, bounds.south].every(
        Number.isFinite,
      ) ||
      bounds.west > bounds.east ||
      bounds.east - bounds.west > 180
    )
      throw Error(
        "Choose a chart area that does not cross the date line and spans at most 180°.",
      );
    if (
      !Number.isInteger(min) ||
      !Number.isInteger(max) ||
      min < chart.minNativeZoom ||
      max > chart.maxNativeZoom ||
      min > max
    )
      throw Error("Choose supported chart resolution levels.");
    const output = [],
      x = (lon, z) => Math.floor(((lon + 180) / 360) * 2 ** z),
      y = (lat, z) =>
        Math.floor(
          ((1 -
            Math.asinh(
              Math.tan(
                (Math.max(-85.0511, Math.min(85.0511, lat)) * Math.PI) / 180,
              ),
            ) /
              Math.PI) /
            2) *
            2 ** z,
        );
    for (let z = min; z <= max; z++) {
      const count = 2 ** z;
      for (
        let row = Math.max(0, y(bounds.north, z));
        row <= Math.min(count - 1, y(bounds.south, z));
        row++
      )
        for (
          let col = Math.max(0, x(bounds.west, z));
          col <= Math.min(count - 1, x(bounds.east, z));
          col++
        ) {
          output.push({ z, x: col, y: row });
          if (output.length > MAX_TILES)
            throw Error(
              "Area exceeds 800 tiles. Zoom in or lower the download resolution.",
            );
        }
    }
    return output;
  }
  function valid(manifest, now = Date.now()) {
    return (
      manifest?.complete === true &&
      Number.isFinite(Date.parse(manifest.expires)) &&
      Date.parse(manifest.expires) > now
    );
  }
  async function list() {
    if (typeof caches === "undefined") return [];
    const out = [];
    for (const key of await caches.keys()) {
      if (!key.startsWith(PREFIX)) continue;
      const cache = await caches.open(key),
        r = await cache.match(MANIFEST);
      if (r)
        try {
          out.push({ ...(await r.json()), cache: key });
        } catch {}
    }
    return out.sort((a, b) => b.createdAt - a.createdAt);
  }
  async function navigation(key) {
    for (const p of await list())
      if (valid(p) && p.navigation?.requests?.[key])
        return p.navigation.requests[key];
    return null;
  }
  async function point(id) {
    for (const p of await list())
      if (valid(p)) {
        const found = p.points.filter((p) => p.id === id),
          unique = [
            ...new Map(found.map((p) => [p.lat + "," + p.lon, p])).values(),
          ];
        if (unique.length === 1) return unique[0];
      }
    return null;
  }
  async function download() {
    if (controller) throw Error("A pack is already downloading.");
    cancelRequested = false;
    if (
      !("serviceWorker" in navigator) ||
      !("caches" in window) ||
      !navigator.serviceWorker.controller
    )
      throw Error(
        "Offline storage needs an active service worker. Reload after accepting any available update.",
      );
    if (!navigator.onLine) throw Error("Connect before downloading a pack.");
    await new Promise((resolve, reject) => {
      const channel = new MessageChannel(),
        timer = setTimeout(
          () =>
            reject(
              Error(
                "Accept the available PilotDesk update and reload before downloading offline packs.",
              ),
            ),
          2500,
        );
      channel.port1.onmessage = (e) => {
        clearTimeout(timer);
        channel.port1.close();
        e.data?.version >= 1
          ? resolve()
          : reject(Error("Update PilotDesk before downloading offline packs."));
      };
      navigator.serviceWorker.controller.postMessage(
        { type: "OFFLINE_PACK_SUPPORT" },
        [channel.port2],
      );
    });
    const rp = window.PilotDeskRoutePlanner,
      points = rp.getPoints(),
      map = rp.getMap();
    if (points.length < 2 || !window.pdNavlogResult || !map)
      throw Error("Build a route and select a chart area first.");
    const chartKey = rp.getChart(),
      chart = window.PilotDeskChartTiles.charts[chartKey],
      area = map.getBounds(),
      bounds = {
        west: area.getWest(),
        east: area.getEast(),
        north: area.getNorth(),
        south: area.getSouth(),
      },
      max = Number(document.getElementById("rpOfflineResolution").value),
      selected = tiles(bounds, chart, chart.minNativeZoom, max),
      navigationData = window.PilotDeskRouteNavigation.getSnapshot(),
      sources = navigationData.sources;
    const now = Date.now(),
      expires = sources.length
        ? Math.min(
            now + 7 * 86400000,
            ...sources.map((s) => Date.parse(s.validUntil)),
          )
        : now + 7 * 86400000;
    if (!(expires > now))
      throw Error(
        "Navigation edition has expired. Rebuild using current data.",
      );
    const capacity = await navigator.storage?.estimate?.();
    if (capacity && capacity.quota - capacity.usage < 10 * 1024 * 1024)
      throw Error(
        "Not enough available browser storage. Remove an older pack.",
      );
    const id = Date.now() + "-" + Math.random().toString(36).slice(2, 8),
      name = PREFIX + id,
      cache = await caches.open(name);
    controller = new AbortController();
    if (cancelRequested) controller.abort();
    const signal = controller.signal;
    let bytes = 0,
      done = 0;
    const status = document.getElementById("rpOfflineStatus"),
      queue = [],
      seen = new Set(),
      base = location.origin;
    try {
      const add = (url, key = url) => {
        url = new URL(url, base).href;
        key = new URL(key, base).href;
        if (!seen.has(key)) {
          seen.add(key);
          queue.push({ url, key });
        }
      };
      const originAllowed = (url) =>
        (url.origin === base &&
          !url.pathname.startsWith("/_vercel/") &&
          !url.pathname.startsWith("/api/")) ||
        (url.origin === "https://unpkg.com" &&
          url.pathname.startsWith("/leaflet@1.9.4/dist/"));
      add("/route-planner.html");
      add("/assets/offline-precache.js");
      add("/favicon.svg");
      for (const el of document.querySelectorAll(
        'script[src],link[rel="stylesheet"][href]',
      )) {
        const url = new URL(el.src || el.href, base);
        if (originAllowed(url)) add(url.href);
      }
      // All local scripts/styles are modest and include dynamically loaded shared navigation dependencies.
      const manifest = await fetch("/assets/release-manifest.json", {
        signal,
        cache: "no-store",
      })
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null);
      if (manifest?.assets) {
        const entries = Array.isArray(manifest.assets)
          ? manifest.assets
          : Object.values(manifest.assets);
        for (const entry of entries) {
          const path = typeof entry === "string" ? entry : entry.path;
          if (path && /\.(js|css)$/.test(path)) add(path);
        }
      }
      let attachments = [];
      try {
        attachments = JSON.parse(
          localStorage.getItem("pd-route-procedures") || "[]",
        );
      } catch {}
      for (const p of attachments) {
        if (
          p.cycle &&
          sources.length &&
          !sources.some((s) => s.cycle === p.cycle)
        )
          throw Error(
            "Attached procedure " +
              p.name +
              " belongs to a different edition. Remove it and attach the current chart.",
          );
        if (p.viewUrl?.startsWith("/api/procedure-pdf?")) add(p.viewUrl);
      }
      const root =
        "https://tiles.arcgis.com/tiles/ssFJjBXIUyZDrSYZ/arcgis/rest/services/";
      for (const t of selected) {
        const url =
          root +
          chart.service +
          "/MapServer/tile/" +
          t.z +
          "/" +
          t.y +
          "/" +
          t.x;
        add(
          "/api/chart-tile?chart=" +
            chartKey +
            "&z=" +
            t.z +
            "&x=" +
            t.x +
            "&y=" +
            t.y,
          url,
        );
      }
      const fetchOne = async (item) => {
        const response = await fetch(item.url, { signal, cache: "no-store" });
        if (!response.ok || response.type === "opaque")
          throw Error(
            "Download failed: " +
              new URL(item.url).pathname +
              " (" +
              response.status +
              ").",
          );
        const blob = await response.blob();
        bytes += blob.size;
        if (bytes > LIMIT)
          throw Error(
            "Pack exceeds the 100 MB storage limit. Choose a smaller chart area.",
          );
        if (!blob.size) throw Error("Downloaded an empty resource.");
        if (
          new URL(item.url).pathname === "/api/chart-tile" &&
          !/^image\//.test(blob.type)
        )
          throw Error("FAA tile response is not an image.");
        await cache.put(
          item.key,
          new Response(blob, {
            status: response.status,
            headers: response.headers,
          }),
        );
        if (/^text\/css/.test(blob.type)) {
          const css = await blob.text();
          for (const m of css.matchAll(
            /(?:url\(\s*["']?([^\s"')]+)|@import\s+["']([^"']+))/g,
          )) {
            const value = m[1] || m[2];
            if (value.startsWith("data:")) continue;
            const url = new URL(value, item.url);
            if (originAllowed(url)) add(url.href);
          }
        }
        done++;
        status.textContent = `Downloading ${done}/${queue.length} resources · ${(bytes / 1048576).toFixed(1)} MB`;
      };
      for (let offset = 0; offset < queue.length; offset += 4)
        await Promise.all(queue.slice(offset, offset + 4).map(fetchOne));
      const values = Object.fromEntries(
          [
            "rpRoute",
            "rpTas",
            "rpBurn",
            "rpWindDir",
            "rpWindSpeed",
            "rpVariation",
          ].map((k) => [k, document.getElementById(k).value]),
        ),
        planning = window.PilotDeskRoutePerformance.getSettings();
      planning.forecast = null;
      const record = {
        id,
        name: points[0].id + " → " + points.at(-1).id,
        createdAt: now,
        expires: new Date(expires).toISOString(),
        complete: true,
        bytes,
        tiles: selected.length,
        chart: chartKey,
        bounds,
        maxZoom: max,
        points,
        navigation: navigationData,
        values,
        planning,
        attachments,
        urls: [...seen],
        chartEditionNote:
          "FAA live raster captured " +
          new Date(now).toISOString() +
          ". Verify the printed chart edition. Navigation expiration does not validate chart edition.",
      };
      await cache.put(
        MANIFEST,
        new Response(JSON.stringify(record), {
          headers: { "Content-Type": "application/json" },
        }),
      );
      navigator.storage?.persist?.().catch(() => {});
      return record;
    } catch (e) {
      controller.abort();
      await caches.delete(name);
      throw e;
    } finally {
      controller = null;
    }
  }
  async function remove(id) {
    await caches.delete(PREFIX + id);
  }
  function init() {
    const $ = (id) => document.getElementById(id);
    if (!$("rpOfflinePacks")) return;
    const status = $("rpOfflineStatus"),
      host = $("rpOfflineList");
    async function render() {
      host.replaceChildren();
      for (const p of await list()) {
        const row = document.createElement("div"),
          text = document.createElement("p");
        text.textContent = `${p.name} · ${p.tiles} tiles · ${(p.bytes / 1048576).toFixed(1)} MB · ${valid(p) ? "available until " + p.expires.slice(0, 10) : "expired; download again"}`;
        row.append(text);
        for (const [label, action] of [
          [
            "Open",
            async () => {
              if (!valid(p)) {
                status.textContent =
                  "Pack expired; download current navigation and charts.";
                return;
              }
              for (const [key, value] of Object.entries(p.values))
                if ($(key)) $(key).value = value;
              window.PilotDeskRoutePerformance.setSettings(p.planning);
              localStorage.setItem(
                "pd-route-procedures",
                JSON.stringify(p.attachments),
              );
              window.PilotDeskRoutePlanner.refreshPack();
              window.PilotDeskRoutePlanner.setOfflinePack(p);
              $("rpChartLayer").value = p.chart;
              $("rpChartLayer").dispatchEvent(
                new Event("change", { bubbles: true }),
              );
              window.PilotDeskRoutePlanner.getMap()?.fitBounds(
                [
                  [p.bounds.south, p.bounds.west],
                  [p.bounds.north, p.bounds.east],
                ],
                { animate: false },
              );
              window.PilotDeskRoutePlanner.invalidate();
              await window.PilotDeskRoutePlanner.rebuild();
              status.textContent = navigator.onLine
                ? "Downloaded pack restored. Rebuild and refresh briefing data before flight."
                : "Offline pack restored. Weather, NOTAMs, TFRs and live overlays are unavailable.";
            },
          ],
          [
            "Delete",
            async () => {
              await remove(p.id);
              await render();
            },
          ],
        ]) {
          const b = document.createElement("button");
          b.type = "button";
          b.className = "pd-btn secondary";
          b.textContent = label;
          b.onclick = action;
          row.append(b);
        }
        host.append(row);
      }
    }
    const resolutions = () => {
      const chart =
        window.PilotDeskChartTiles.charts[
          window.PilotDeskRoutePlanner?.getChart() || "sectional"
        ];
      $("rpOfflineResolution").replaceChildren(
        ...Array.from(
          { length: chart.maxNativeZoom - chart.minNativeZoom + 1 },
          (_, i) =>
            new Option(
              "FAA source level " + (chart.minNativeZoom + i),
              String(chart.minNativeZoom + i),
            ),
        ),
      );
      $("rpOfflineResolution").value = String(chart.maxNativeZoom);
    };
    $("rpChartLayer")?.addEventListener("change", resolutions);
    resolutions();
    $("rpDownloadOffline").onclick = async () => {
      $("rpDownloadOffline").disabled = true;
      try {
        const p = await download();
        status.textContent = `Pack downloaded and verified: ${p.tiles} tiles. Only the selected chart area and resolution are available offline.`;
        await render();
      } catch (e) {
        status.textContent =
          e.name === "AbortError"
            ? "Download cancelled. No incomplete pack was marked ready."
            : e.message;
      } finally {
        $("rpDownloadOffline").disabled = false;
      }
    };
    $("rpCancelOffline").onclick = () => {
      cancelRequested = true;
      controller?.abort();
    };
    const network = () => {
      if (!navigator.onLine)
        status.textContent =
          "Offline: use a downloaded pack. No current weather, NOTAMs, TFRs or live overlays.";
    };
    window.addEventListener("offline", network);
    network();
    render().catch((e) => {
      status.textContent = "Offline storage unavailable: " + e.message;
    });
  }
  if (typeof document === "object")
    document.readyState === "complete"
      ? init()
      : document.addEventListener("DOMContentLoaded", init, { once: true });
  return {
    tiles,
    valid,
    list,
    navigation,
    point,
    download,
    remove,
    cancel: () => {
      cancelRequested = true;
      controller?.abort();
    },
  };
});
