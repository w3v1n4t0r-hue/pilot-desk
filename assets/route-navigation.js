(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.PilotDeskRouteNavigation = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";
  const snapshot = { requests: {}, sources: [] };
  const responseCache = new Map(), pendingRequests = new Map();
  function expand(legs, from, to) {
    const match = (l, p) =>
        l.point &&
        l.point.id === p.id &&
        Math.abs(l.point.lat - p.lat) < 0.00001 &&
        Math.abs(l.point.lon - p.lon) < 0.00001,
      starts = legs
        .map((l, i) => (match(l, from) ? i : -1))
        .filter((i) => i >= 0),
      ends = legs.map((l, i) => (match(l, to) ? i : -1)).filter((i) => i >= 0);
    if (starts.length !== 1 || ends.length !== 1)
      throw Error(
        "Airway endpoints must each match one published fix on the airway.",
      );
    const a = starts[0],
      b = ends[0];
    if (a === b) throw Error("Airway entry and exit must differ.");
    const direction = b > a ? 1 : -1,
      path = [];
    for (let i = a; i !== b; i += direction) {
      const lower = Math.min(i, i + direction),
        edge = legs[lower];
      if (edge.end)
        throw Error(
          "Airway has a published discontinuity between those fixes.",
        );
      if (
        edge.direction &&
        !(direction > 0 && edge.direction === "F") &&
        !(direction < 0 && edge.direction === "B")
      )
        throw Error(
          "Airway direction restriction prevents this route; verify published routing.",
        );
      if (!legs[i + direction].point)
        throw Error("Airway includes an unresolved fix; expansion stopped.");
      path.push({
        ...legs[i + direction].point,
        airwayMinimum: edge.minimum,
        airwayMaximum: edge.maximum,
      });
    }
    return path;
  }
  async function request(product, ident) {
    const at =
        typeof document === "object"
          ? document.getElementById("rpDepartureUtc")?.value
          : "",
      key = product + ":" + ident + ":" + (at || "current");
    let data;
    if (typeof navigator === "object" && !navigator.onLine) {
      data = await window.PilotDeskOfflinePacks?.navigation(key);
      if (!data)
        throw Error(
          "This navigation item was not downloaded in a current offline pack.",
        );
    } else {
      const cached = responseCache.get(key);
      if (cached && Date.now() - cached.at < 60000) data = cached.data;
      else {
        let pending = pendingRequests.get(key);
        if (!pending) {
          pending = (async () => {
            const r = await fetch(
              "/api/navigation?product=" +
                product +
                "&ident=" +
                encodeURIComponent(ident) +
                (at ? "&at=" + encodeURIComponent(at + "Z") : ""),
              { signal: AbortSignal.timeout(55000) },
            );
            data = await r.json();
            if (!r.ok) throw Error(data.error || "FAA navigation unavailable.");
            if (responseCache.size >= 300) responseCache.delete(responseCache.keys().next().value);
            responseCache.set(key, { data, at: Date.now() });
            return data;
          })().finally(() => pendingRequests.delete(key));
          pendingRequests.set(key, pending);
        }
        data = await pending;
      }
    }
    snapshot.requests[key] = data;
    if (!snapshot.sources.some((s) => s.url === data.source.url))
      snapshot.sources.push(data.source);
    return data;
  }
  async function resolve(raw, fallback) {
    snapshot.requests = {};
    snapshot.sources = [];
    const points = [];
    for (let i = 0; i < raw.length; i++) {
      const token = raw[i].toUpperCase();
      if (token === "DCT") {
        if (
          !points.length ||
          i === raw.length - 1 ||
          raw[i - 1].toUpperCase() === "DCT" ||
          raw[i + 1].toUpperCase() === "DCT" ||
          /^[VJTQ]\d{1,4}$/.test(raw[i + 1])
        )
          throw Error("DCT must separate two waypoints.");
        continue;
      }
      if (/^[VJTQ]\d{1,4}$/.test(token)) {
        if (
          !points.length ||
          !raw[i + 1] ||
          /^(DCT|[VJTQ]\d{1,4})$/.test(raw[i + 1].toUpperCase())
        )
          throw Error("Use airway entry, airway name, then exit fix.");
        const exit = await point(raw[++i], fallback),
          data = await request("airway", token);
        points.push(
          ...expand(data.legs, points[points.length - 1], exit).map((p) => ({
            ...p,
            airway: token,
          })),
        );
      } else points.push(await point(raw[i], fallback));
      if (points.length > 300)
        throw Error("Expanded route exceeds 300 points.");
    }
    if (points.length < 2) throw Error("Enter at least two waypoints.");
    return points;
  }
  async function point(token, fallback) {
    if (token.includes(",")) return fallback(token);
    try {
      return (await request("point", token.toUpperCase())).point;
    } catch (e) {
      if (typeof navigator === "object" && !navigator.onLine) {
        const p = await window.PilotDeskOfflinePacks?.point(
          token.toUpperCase(),
        );
        if (p) return p;
      }
      throw e;
    }
  }
  function tokens(points) {
    return points.map(
      (p) => `${p.id},${Number(p.lat).toFixed(7)},${Number(p.lon).toFixed(7)}`,
    );
  }
  function init() {
    const host = document.getElementById("rpNavigation");
    if (!host) return;
    const status = document.getElementById("rpNavigationStatus"),
      airport = document.getElementById("rpProcedureAirport"),
      select = document.getElementById("rpProcedureSegment"),
      legs = document.getElementById("rpProcedureLegs");
    let groups = [],
      source = null,
      selected = null;
    document.addEventListener("pilotdesk:route-built", () => {
      status.textContent =
        snapshot.sources
          .map(
            (s) =>
              "FAA CIFP " +
              s.cycle +
              " · " +
              s.validFrom.slice(0, 10) +
              " through " +
              s.validUntil.slice(0, 10),
          )
          .join("; ") || "Manual coordinates: verify every waypoint.";
      const points = window.PilotDeskRoutePlanner?.getPoints() || [],
        airwayPoints = points.filter((p) => p.airway);
      if (airwayPoints.length)
        status.textContent +=
          " · Published airway limits: " +
          airwayPoints
            .map(
              (p) =>
                p.airway +
                " to " +
                p.id +
                " min " +
                (p.airwayMinimum || "not specified") +
                " / max " +
                (p.airwayMaximum || "not specified"),
            )
            .join("; ") +
          ". Verify all chart restrictions.";
      airport.value =
        window.PilotDeskRoutePlanner?.getPoints().at(-1)?.id || "";
    });
    document.getElementById("rpLoadProcedureSegments").onclick = async () => {
      status.textContent = "Loading FAA procedure segments…";
      try {
        const data = await request(
          "procedures",
          airport.value.trim().toUpperCase(),
        );
        groups = data.procedures;
        source = data.source;
        select.replaceChildren(
          new Option("Select procedure segment", ""),
          ...groups.map(
            (p, i) =>
              new Option(
                `${p.type === "PD" ? "Departure" : p.type === "PE" ? "Arrival" : "Approach"} · ${p.id} · ${p.transition || "common"} · type ${p.routeType}`,
                String(i),
              ),
          ),
        );
        status.textContent = `FAA CIFP ${source.cycle}: ${groups.length} segments. Select and review the complete published chart.`;
        legs.replaceChildren();
        selected = null;
        document.getElementById("rpInsertProcedureSegment").disabled = true;
      } catch (e) {
        status.textContent = e.message;
      }
    };
    select.onchange = () => {
      selected = groups[+select.value];
      if (select.value === "") selected = null;
      legs.replaceChildren();
      if (!selected) return;
      const table = document.createElement("table"),
        header = document.createElement("tr");
      for (const label of [
        "Fix",
        "Path",
        "Altitude code / ft or FL",
        "Speed kt",
        "Status",
      ]) {
        const th = document.createElement("th");
        th.textContent = label;
        header.append(th);
      }
      table.append(header);
      for (const l of selected.legs) {
        const tr = document.createElement("tr");
        for (const value of [
          l.id || "No fix",
          l.path,
          [l.altitudeDescription, l.altitude1, l.altitude2]
            .filter(Boolean)
            .join(" / ") || "—",
          l.speed || "—",
          l.missed
            ? "Missed approach"
            : !l.point
              ? "Unresolved fix"
              : !["IF", "TF", "DF"].includes(l.path)
                ? "Requires chart interpretation"
                : l.flyOver
                  ? "Fly over"
                  : "Fix geometry",
        ]) {
          const td = document.createElement("td");
          td.textContent = value;
          tr.append(td);
        }
        table.append(tr);
      }
      legs.append(table);
      document.getElementById("rpInsertProcedureSegment").disabled =
        !selected.supported;
      status.textContent = selected.supported
        ? "This selected segment supports fix geometry. Course, altitude, speed, turns and clearance still require chart verification."
        : "Segment contains vectors, holds, curved paths, missed approach, or unresolved fixes. Review the chart; automatic insertion is unavailable.";
    };
    document.getElementById("rpInsertProcedureSegment").onclick = () => {
      if (!selected?.supported) return;
      const rp = window.PilotDeskRoutePlanner,
        old = rp.getPoints();
      if (old.length < 2) {
        status.textContent = "Build a route first.";
        return;
      }
      const part = selected.legs.map((l) => l.point),
        same = (a, b) =>
          a &&
          b &&
          a.id === b.id &&
          Math.abs(a.lat - b.lat) < 0.00001 &&
          Math.abs(a.lon - b.lon) < 0.00001;
      let next;
      if (selected.type === "PD") {
        if (!same(old[0], part[0])) {
          status.textContent =
            "Departure segment must start at the route departure fix. No connector was invented.";
          return;
        }
        next = [...part, ...old.slice(1)];
      } else {
        if (!same(old.at(-1), part[0])) {
          status.textContent =
            "Route must end at this segment’s first fix. Add that fix first; no connector was invented.";
          return;
        }
        next = [...old, ...part.slice(1)];
      }
      rp.setRoute(tokens(next).join(" "));
    };
  }
  if (typeof document === "object")
    document.readyState === "loading"
      ? document.addEventListener("DOMContentLoaded", init, { once: true })
      : init();
  return {
    expand,
    resolve,
    request,
    tokens,
    getSnapshot: () => JSON.parse(JSON.stringify(snapshot)),
  };
});
