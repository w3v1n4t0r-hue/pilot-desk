"use strict";
const charts = {
  sectional: ["VFR_Sectional", 8, 12],
  terminal: ["VFR_Terminal", 10, 12],
  low: ["IFR_AreaLow", 7, 12],
  high: ["IFR_High", 5, 9],
};
module.exports = async (req, res) => {
  if (req.method !== "GET")
    return res.status(405).json({ error: "GET required." });
  const chart = charts[req.query.chart],
    z = Number(req.query.z),
    x = Number(req.query.x),
    y = Number(req.query.y);
  if (
    !chart ||
    ![z, x, y].every(Number.isInteger) ||
    z < chart[1] ||
    z > chart[2] ||
    x < 0 ||
    y < 0 ||
    x >= 2 ** z ||
    y >= 2 ** z
  )
    return res.status(400).json({ error: "Invalid chart tile." });
  try {
    const url = `https://tiles.arcgis.com/tiles/ssFJjBXIUyZDrSYZ/arcgis/rest/services/${chart[0]}/MapServer/tile/${z}/${y}/${x}`,
      r = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!r.ok) throw Error("FAA chart tile unavailable.");
    const bytes = Buffer.from(await r.arrayBuffer()),
      type =
        bytes.length >= 8 &&
        bytes
          .subarray(0, 8)
          .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
          ? "image/png"
          : bytes.length >= 4 &&
              bytes[0] === 255 &&
              bytes[1] === 216 &&
              bytes[2] === 255
            ? "image/jpeg"
            : null;
    if (!type || bytes.length > 1048576)
      throw Error("Invalid FAA chart tile response.");
    res.setHeader("Content-Type", type);
    res.setHeader("Cache-Control", "public, max-age=0, s-maxage=3600");
    return res.status(200).send(bytes);
  } catch (e) {
    return res.status(502).json({ error: e.message });
  }
};
