// This contract is shared by the browser, exporter and regression tests.
export function validateDataset(data) {
  const fail = () => { throw Error('This file is not a supported, reviewed OpenFOAM Flight Lab dataset.'); };
  const finite = (n, min, max) => typeof n === 'number' && Number.isFinite(n) && n >= min && n <= max;
  const array = (a, max, minValue, maxValue) => Array.isArray(a) && a.length > 0 && a.length <= max && a.every(n => finite(n, minValue, maxValue));
  if (data?.schema !== 'pilotdesk.openfoam.v1' || data.units !== 'SI' || data.frame !== 'x-downstream,y-span,z-up') fail();
  const p = data.provenance, c = data.conditions, s = data.surface;
  if (p?.solver !== 'simpleFoam' || p.version !== 'v2312' || p.reviewStatus !== 'reviewed' || !/^[a-f0-9]{64}$/.test(p.geometrySha256) || !/^[a-f0-9]{64}$/.test(p.caseSha256)) fail();
  if (!Number.isFinite(Date.parse(p.solvedAt)) || !Number.isFinite(Date.parse(p.reviewedAt)) || typeof p.reviewedBy !== 'string' || !p.reviewedBy.trim() || p.reviewedBy.length > 160) fail();
  if (!finite(c?.speedMs, 1, 100) || !finite(c.densityKgM3, 0.2, 2) || !finite(c.aoaDeg, -10, 20) || !finite(c.sideslipDeg, -15, 15)) fail();
  if (!array(s?.positions, 1800000, -1000, 1000) || s.positions.length % 9 || !array(s.normals, 1800000, -1.01, 1.01) || s.normals.length !== s.positions.length || !array(s.pressurePa, 600000, -1e7, 1e7) || s.pressurePa.length * 3 !== s.positions.length) fail();
  let extent = 0;
  for (let i=0;i<s.positions.length;i+=3) {
    extent=Math.max(extent,Math.hypot(s.positions[i]-s.positions[0],s.positions[i+1]-s.positions[1],s.positions[i+2]-s.positions[2]));
    if (!finite(Math.hypot(s.normals[i],s.normals[i+1],s.normals[i+2]),.9,1.1)) fail();
  }
  if (extent < .001) fail();
  if (!Array.isArray(data.streamlines) || !data.streamlines.length || data.streamlines.length > 1000) fail();
  let points = 0;
  for (const line of data.streamlines) {
    if (!array(line.points, 30000, -1000, 1000) || line.points.length < 6 || line.points.length % 3 || !array(line.speedMs, 10000, 0, 1000) || line.speedMs.length * 3 !== line.points.length) fail();
    points += line.speedMs.length;
  }
  if (points > 100000) fail();
  return data;
}
