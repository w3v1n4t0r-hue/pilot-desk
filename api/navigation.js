"use strict";
const { load } = require("../src/server/cifp.cjs");
module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "GET")
    return res.status(405).json({ error: "GET required." });
  const product = String(req.query.product || "point"),
    ident = String(req.query.ident || "").toUpperCase();
  if (
    !["point", "airway", "procedures"].includes(product) ||
    !/^[-A-Z0-9]{2,8}$/.test(ident)
  )
    return res
      .status(400)
      .json({ error: "Enter a valid navigation identifier." });
  try {
    const data = await load(req.query.at || Date.now());
    if (product === "airway") {
      const legs = data.airways.get(ident);
      if (!legs)
        return res
          .status(404)
          .json({ error: "Airway not found in this FAA edition." });
      return res.json({ source: data.source, ident, legs });
    }
    if (product === "procedures")
      return res.json({
        source: data.source,
        procedures: [...data.procedures.values()].filter(
          (p) => p.airport === ident,
        ),
      });
    const found = data.identifiers.get(ident) || [],
      unique = [
        ...new Map(found.map((p) => [p.lat + "," + p.lon, p])).values(),
      ];
    if (unique.length !== 1)
      return res
        .status(unique.length ? 409 : 404)
        .json({
          error: unique.length
            ? "Identifier is ambiguous; select a specific fix or use verified coordinates."
            : "Identifier not found in FAA CIFP.",
        });
    return res.json({ source: data.source, point: unique[0] });
  } catch (e) {
    return res
      .status(503)
      .json({ error: e.message || "Current FAA navigation data unavailable." });
  }
};
