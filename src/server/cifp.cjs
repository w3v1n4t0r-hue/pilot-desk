"use strict";
const { inflateRawSync } = require("node:zlib");
const PAGE =
  "https://www.faa.gov/air_traffic/flight_info/aeronav/digital_products/cifp/download/";
let discovery = null;
const datasets = new Map();
function coordinate(value, latitude) {
  const pattern = latitude
      ? /^([NS])(\d{2})(\d{2})(\d{4})$/
      : /^([EW])(\d{3})(\d{2})(\d{4})$/,
    m = value.match(pattern);
  if (!m) return null;
  const d = +m[2],
    minutes = +m[3],
    seconds = +m[4] / 100,
    max = latitude ? 90 : 180;
  if (
    minutes >= 60 ||
    seconds >= 60 ||
    d > max ||
    (d === max && (minutes || seconds))
  )
    return null;
  return (d + minutes / 60 + seconds / 3600) * (/[SW]/.test(m[1]) ? -1 : 1);
}
function crc32(bytes) {
  let crc = 0xffffffff;
  for (const b of bytes) {
    crc ^= b;
    for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function unzip(bytes) {
  const b = Buffer.from(bytes);
  let end = -1;
  for (let i = b.length - 22; i >= Math.max(0, b.length - 65557); i--)
    if (b.readUInt32LE(i) === 0x06054b50) {
      end = i;
      break;
    }
  if (end < 0) throw Error("Invalid FAA archive.");
  let pos = b.readUInt32LE(end + 16);
  const count = b.readUInt16LE(end + 10);
  for (let n = 0; n < count; n++) {
    if (pos + 46 > b.length || b.readUInt32LE(pos) !== 0x02014b50)
      throw Error("Invalid FAA archive index.");
    const method = b.readUInt16LE(pos + 10),
      crc = b.readUInt32LE(pos + 16),
      size = b.readUInt32LE(pos + 20),
      rawSize = b.readUInt32LE(pos + 24),
      nameLen = b.readUInt16LE(pos + 28),
      extra = b.readUInt16LE(pos + 30),
      comment = b.readUInt16LE(pos + 32),
      offset = b.readUInt32LE(pos + 42),
      name = b.toString("utf8", pos + 46, pos + 46 + nameLen);
    pos += 46 + nameLen + extra + comment;
    if (name.split("/").pop() !== "FAACIFP18") continue;
    if (
      rawSize > 80000000 ||
      offset + 30 > b.length ||
      b.readUInt32LE(offset) !== 0x04034b50
    )
      throw Error("Invalid FAA dataset size.");
    const start =
      offset + 30 + b.readUInt16LE(offset + 26) + b.readUInt16LE(offset + 28);
    if (start + size > b.length) throw Error("Truncated FAA dataset.");
    const content =
      method === 8
        ? inflateRawSync(b.subarray(start, start + size), {
            maxOutputLength: 80000000,
          })
        : method === 0
          ? b.subarray(start, start + size)
          : null;
    if (!content || content.length !== rawSize || crc32(content) !== crc)
      throw Error("FAA dataset integrity check failed.");
    return content.toString("ascii");
  }
  throw Error("FAA archive has no CIFP dataset.");
}
function parse(text, source) {
  if (
    !text.startsWith("HDR01FAACIFP18") ||
    !text.slice(0, 132).includes(source.cycle)
  )
    throw Error("FAA cycle header does not match the published edition.");
  const points = new Map(),
    identifiers = new Map(),
    airways = new Map(),
    procedures = new Map();
  let records = 0;
  const addPoint = (r, type, id, airport = "") => {
    const lat = coordinate(r.slice(32, 41), true),
      lon = coordinate(r.slice(41, 51), false);
    if (lat === null || lon === null || !id) return;
    const region = ["PA", "PG"].includes(type)
        ? r.slice(10, 12)
        : r.slice(19, 21),
      key = [type, region, id, airport].join(":"),
      p = {
        id,
        lat,
        lon,
        type,
        region,
        airport,
        source: "FAA CIFP " + source.cycle,
      };
    const previous = points.get(key);
    if (
      points.has(key) &&
      (!previous || previous.lat !== p.lat || previous.lon !== p.lon)
    )
      points.set(key, null);
    else points.set(key, p);
    if (!identifiers.has(id)) identifiers.set(id, []);
    identifiers.get(id).push(p);
  };
  for (const r of text.split(/\r?\n/)) {
    if (r[0] !== "S" || r.length < 132) continue;
    records++;
    const type = r[4] === "P" ? "P" + r[12] : r.slice(4, 6),
      cont = r[["ER", "PD", "PE", "PF"].includes(type) ? 38 : 21];
    if (!["0", "1"].includes(cont)) continue;
    if (["PA", "EA", "PC", "PG", "D ", "DB"].includes(type)) {
      addPoint(
        r,
        type,
        (type === "PA"
          ? r.slice(6, 10)
          : r.slice(13, type === "D " || type === "DB" ? 17 : 18)
        ).trim(),
        ["PC", "PG"].includes(type) ? r.slice(6, 10).trim() : "",
      );
      continue;
    }
    if (type === "ER") {
      const id = r.slice(13, 18).trim(),
        leg = {
          sequence: +r.slice(25, 29),
          id: r.slice(29, 34).trim(),
          region: r.slice(34, 36),
          type: r.slice(36, 38),
          end: r[40] === "E",
          direction: r[46].trim(),
          minimum: r.slice(83, 88).trim(),
          minimum2: r.slice(88, 93).trim(),
          maximum: r.slice(93, 98).trim(),
        };
      if (!airways.has(id)) airways.set(id, []);
      airways.get(id).push(leg);
      continue;
    }
    if (["PD", "PE", "PF"].includes(type)) {
      const airport = r.slice(6, 10).trim(),
        id = r.slice(13, 19).trim(),
        transition = r.slice(20, 25).trim(),
        routeType = r[19],
        key = [airport, type, id, routeType, transition].join(":"),
        leg = {
          sequence: +r.slice(26, 29),
          id: r.slice(29, 34).trim(),
          region: r.slice(34, 36),
          type: r.slice(36, 38),
          path: r.slice(47, 49),
          missed: r[41] === "M",
          flyOver: ["Y", "B"].includes(r[40]),
          altitudeDescription: r[82].trim(),
          altitude1: r.slice(84, 89).trim(),
          altitude2: r.slice(89, 94).trim(),
          speed: r.slice(99, 102).trim(),
          course: r.slice(70, 74).trim(),
        };
      if (!procedures.has(key))
        procedures.set(key, {
          key,
          airport,
          id,
          type,
          routeType,
          transition,
          legs: [],
        });
      procedures.get(key).legs.push(leg);
    }
  }
  const resolve = (leg) => {
    const exact = points.get([leg.type, leg.region, leg.id, ""].join(":"));
    if (exact) return exact;
    const candidates = (identifiers.get(leg.id) || []).filter(
      (p) =>
        p.type === leg.type &&
        p.region === leg.region &&
        (!p.airport || p.airport === leg.airport),
    );
    const unique = [
      ...new Map(candidates.map((p) => [p.lat + "," + p.lon, p])).values(),
    ];
    return unique.length === 1 ? unique[0] : null;
  };
  for (const legs of airways.values()) {
    legs.sort((a, b) => a.sequence - b.sequence);
    for (const l of legs) l.point = resolve(l);
  }
  for (const p of procedures.values()) {
    p.legs.sort((a, b) => a.sequence - b.sequence);
    for (const l of p.legs) l.point = resolve({ ...l, airport: p.airport });
    p.supported =
      p.legs.length > 1 &&
      p.legs.every(
        (l, i) =>
          l.point &&
          ["IF", "TF", "DF"].includes(l.path) &&
          !(i > 0 && l.path === "IF") &&
          !l.missed,
      );
  }
  if (records < 10000 || airways.size < 10 || points.size < 1000)
    throw Error("FAA dataset failed completeness checks.");
  return { source, points, identifiers, airways, procedures, records };
}
async function get(url, max, timeout = 35000) {
  const response = await fetch(url, { signal: AbortSignal.timeout(timeout) });
  if (!response.ok)
    throw Error("FAA source unavailable (" + response.status + ").");
  const bytes = await response.arrayBuffer();
  if (bytes.byteLength > max) throw Error("FAA response too large.");
  return bytes;
}
async function editions() {
  if (discovery && Date.now() - discovery.at < 1200000) return discovery.value;
  const html = Buffer.from(await get(PAGE, 2000000, 12000)).toString(),
    links = [
      ...html.matchAll(
        /https:\/\/aeronav\.faa\.gov\/Upload_313-d\/cifp\/CIFP_(\d{6})\.zip/gi,
      ),
    ];
  const value = [
    ...new Map(
      links.map((m) => {
        const d = m[1],
          start = Date.UTC(
            2000 + +d.slice(0, 2),
            +d.slice(2, 4) - 1,
            +d.slice(4, 6),
            9,
            1,
          );
        return [
          m[0],
          {
            url: m[0],
            validFrom: new Date(start).toISOString(),
            validUntil: new Date(start + 28 * 86400000).toISOString(),
            date: d,
            cycle: "",
          },
        ];
      }),
    ).values(),
  ];
  if (!value.length)
    throw Error("FAA has not published a readable navigation edition.");
  discovery = { at: Date.now(), value };
  return value;
}
async function load(at = Date.now()) {
  const time = typeof at === "number" ? at : Date.parse(at);
  if (!Number.isFinite(time)) throw Error("Invalid navigation date.");
  const source = (await editions()).find(
    (s) => time >= Date.parse(s.validFrom) && time < Date.parse(s.validUntil),
  );
  if (!source)
    throw Error(
      "No published FAA navigation edition covers that departure date.",
    );
  if (!datasets.has(source.url)) {
    const task = (async () => {
      const text = unzip(await get(source.url, 16000000)),
        header = text.slice(0, 132);
      const m = header.match(/\d{6}(\d{4})\s+\d{2}-[A-Z]{3}-\d{4}/);
      if (!m) throw Error("FAA dataset cycle header unavailable.");
      return parse(text, {
        ...source,
        cycle: m[1],
        publisher: "FAA",
        downloadPage: PAGE,
      });
    })();
    datasets.set(source.url, task);
    task.catch(() => datasets.delete(source.url));
    while (datasets.size > 2) datasets.delete(datasets.keys().next().value);
  }
  return datasets.get(source.url);
}
module.exports = { coordinate, crc32, unzip, parse, load };
