(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.PilotDeskAircraftPerformanceCore = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";
  const axes = ["pressureAltitude", "oat", "weight"],
    values = [
      "cruiseTas",
      "cruiseBurn",
      "climbTas",
      "climbBurn",
      "climbRate",
      "descentTas",
      "descentBurn",
      "descentRate",
    ];
  function validate(table) {
    if (
      !table ||
      !String(table.source || "").trim() ||
      !String(table.configuration || "").trim()
    )
      throw Error("Enter the POH source and aircraft configuration.");
    if (
      !Array.isArray(table.rows) ||
      !table.rows.length ||
      table.rows.length > 2000
    )
      throw Error("Enter 1–2000 POH table rows.");
    const keys = new Set();
    for (const row of table.rows) {
      if (
        [...axes, ...values].some(
          (k) => typeof row[k] !== "number" || !Number.isFinite(row[k]),
        )
      )
        throw Error("Every table row needs finite numeric columns.");
      if (
        row.weight <= 0 ||
        row.pressureAltitude < -2000 ||
        row.pressureAltitude > 60000 ||
        row.oat < -100 ||
        row.oat > 70 ||
        values.some((k) => (/Burn$/.test(k) ? row[k] < 0 : row[k] <= 0))
      )
        throw Error(
          "Check table weights, temperatures, altitudes, speeds, burns and rates.",
        );
      const key = axes.map((k) => row[k]).join(":");
      if (keys.has(key)) throw Error("Duplicate table conditions.");
      keys.add(key);
    }
    return table;
  }
  function interpolate(table, conditions) {
    validate(table);
    const brackets = axes.map((k) => {
      const x = conditions[k],
        levels = [...new Set(table.rows.map((r) => r[k]))].sort(
          (a, b) => a - b,
        );
      if (!Number.isFinite(x) || x < levels[0] || x > levels.at(-1))
        throw Error(
          k + " is outside this POH table; extrapolation is unavailable.",
        );
      const lo = levels.filter((v) => v <= x).at(-1),
        hi = levels.find((v) => v >= x);
      return lo === hi
        ? [[lo, 1]]
        : [
            [lo, (hi - x) / (hi - lo)],
            [hi, (x - lo) / (hi - lo)],
          ];
    });
    const out = Object.fromEntries(values.map((k) => [k, 0]));
    for (const [alt, a] of brackets[0])
      for (const [oat, t] of brackets[1])
        for (const [weight, w] of brackets[2]) {
          const row = table.rows.find(
            (r) =>
              r.pressureAltitude === alt &&
              r.oat === oat &&
              r.weight === weight,
          );
          if (!row)
            throw Error(
              "POH table lacks an interpolation corner for these conditions.",
            );
          for (const k of values) out[k] += row[k] * a * t * w;
        }
    return out;
  }
  function plan(table, conditions, phases) {
    const c = Object.fromEntries(
        ["weight", "oat", "pressureOffset", "lapseRate"].map((k) => {
          if (
            String(conditions[k] ?? "").trim() === "" ||
            !Number.isFinite(Number(conditions[k]))
          )
            throw Error(
              "Enter weight, cruise OAT, pressure altitude offset and temperature lapse rate.",
            );
          return [k, Number(conditions[k])];
        }),
      ),
      alt = Number(phases.cruiseAltitude);
    if (!Number.isFinite(alt) || !phases.enabled)
      throw Error(
        "Enable climb/descent and enter cruise and endpoint altitudes.",
      );
    const at = (height) =>
      interpolate(table, {
        weight: c.weight,
        pressureAltitude: height + c.pressureOffset,
        oat: c.oat + ((alt - height) / 1000) * c.lapseRate,
      });
    const cruise = at(alt),
      bands = { climb: [], descent: [] };
    for (const kind of ["climb", "descent"]) {
      const low = Number(
        phases[
          kind === "climb" ? "departureElevation" : "destinationElevation"
        ],
      );
      if (!Number.isFinite(low) || low > alt || low < -1500 || alt > 60000)
        throw Error("Check cruise and endpoint altitudes.");
      at(low);
      for (let bottom = low; bottom < alt; bottom += 500) {
        const top = Math.min(alt, bottom + 500);
        at(top);
        const v = at((bottom + top) / 2);
        bands[kind].push({
          bottom,
          top,
          tas: v[kind + "Tas"],
          burn: v[kind + "Burn"],
          hours: (top - bottom) / v[kind + "Rate"] / 60,
        });
      }
    }
    return {
      cruise,
      phases: {
        ...phases,
        ...cruise,
        source:
          table.source +
          " · " +
          table.configuration +
          ` · ${c.weight} lb · cruise ${c.oat}°C · PA offset ${c.pressureOffset} ft · lapse ${c.lapseRate}°C/1000ft; weight held constant; 500ft midpoint bands`,
        bands,
      },
    };
  }
  function csv(text) {
    const lines = String(text)
        .trim()
        .split(/\r?\n/)
        .filter((l) => l.trim()),
      header = lines
        .shift()
        ?.split(",")
        .map((s) => s.trim()),
      columns = [...axes, ...values];
    if (
      !header ||
      header.length !== columns.length ||
      columns.some((k) => !header.includes(k))
    )
      throw Error(
        "CSV header must contain all eleven performance columns exactly once.",
      );
    if (lines.length > 2000) throw Error("CSV exceeds 2000 rows.");
    return lines.map((line) => {
      const cells = line.split(",").map((s) => s.trim());
      if (
        cells.length !== header.length ||
        cells.some((v) => v === "" || !Number.isFinite(Number(v)))
      )
        throw Error(
          "CSV performance values must be numeric, with one value per column.",
        );
      return Object.fromEntries(header.map((k, i) => [k, Number(cells[i])]));
    });
  }
  return { axes, values, validate, interpolate, plan, csv };
});
