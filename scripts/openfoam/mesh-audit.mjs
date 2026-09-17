import fs from 'node:fs';
import crypto from 'node:crypto';
import { pathToFileURL } from 'node:url';

export const sha256 = data => crypto.createHash('sha256').update(data).digest('hex');

export function readMesh(bytes) {
  if (bytes.subarray(0, 4).toString() === 'PDM1') {
    const count = bytes.readUInt32LE(4);
    if (!count || count % 3 || bytes.length !== 8 + count * 24) throw Error('Invalid PDM1 size');
    return Array.from({ length: count * 3 }, (_, i) => bytes.readFloatLE(8 + i * 4));
  }
  if (bytes.length < 84) throw Error('Binary STL required');
  const triangles = bytes.readUInt32LE(80);
  if (!triangles || bytes.length !== 84 + triangles * 50) throw Error('Invalid binary STL size');
  const positions = [];
  for (let face = 0; face < triangles; face++) {
    for (let i = 0; i < 9; i++) positions.push(bytes.readFloatLE(84 + face * 50 + 12 + i * 4));
  }
  return positions;
}

// Conservative topology screen, not a substitute for OpenFOAM surfaceCheck.
// Never silently repair, close holes, or assume physical dimensions for user assets.
export function auditMesh(positions) {
  if (!positions.length || positions.length % 9 || !positions.every(Number.isFinite)) throw Error('Invalid triangle coordinates');
  const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
  positions.forEach((v, i) => { min[i % 3] = Math.min(min[i % 3], v); max[i % 3] = Math.max(max[i % 3], v); });
  const extent = max.map((v, i) => v - min[i]), tolerance = Math.max(...extent) * 1e-7;
  if (!tolerance) throw Error('Zero-size mesh');
  const vertices = new Map(), edges = new Map(), faces = new Set();
  let degenerateFaces = 0, duplicateFaces = 0, signedVolume = 0;
  const parents = Array.from({ length: positions.length / 9 }, (_, i) => i);
  const root = i => { while (parents[i] !== i) { parents[i] = parents[parents[i]]; i = parents[i]; } return i; };
  for (let offset = 0; offset < positions.length; offset += 9) {
    const points = [0, 3, 6].map(i => positions.slice(offset + i, offset + i + 3));
    const ids = points.map(p => {
      const key = p.map(v => Math.round(v / tolerance)).join(',');
      if (!vertices.has(key)) vertices.set(key, vertices.size);
      return vertices.get(key);
    });
    const [a, b, c] = points, ab = b.map((v, i) => v - a[i]), ac = c.map((v, i) => v - a[i]);
    const cross = [ab[1]*ac[2]-ab[2]*ac[1], ab[2]*ac[0]-ab[0]*ac[2], ab[0]*ac[1]-ab[1]*ac[0]];
    if (new Set(ids).size < 3 || Math.hypot(...cross) <= tolerance*tolerance) degenerateFaces++;
    signedVolume += (a[0]*(b[1]*c[2]-b[2]*c[1]) + a[1]*(b[2]*c[0]-b[0]*c[2]) + a[2]*(b[0]*c[1]-b[1]*c[0])) / 6;
    const faceKey = [...ids].sort((x, y) => x - y).join(',');
    if (faces.has(faceKey)) duplicateFaces++;
    faces.add(faceKey);
    for (let i = 0; i < 3; i++) {
      const start = ids[i], end = ids[(i + 1) % 3], key = [Math.min(start, end), Math.max(start, end)].join(',');
      const edge = edges.get(key) || { count: 0, orientation: 0, face: offset / 9 };
      parents[root(offset / 9)] = root(edge.face);
      edge.count++; edge.orientation += start < end ? 1 : -1; edges.set(key, edge);
    }
  }
  const counts = [...edges.values()];
  const boundaryEdges = counts.filter(e => e.count === 1).length;
  const nonManifoldEdges = counts.filter(e => e.count > 2).length;
  const inconsistentEdges = counts.filter(e => e.count === 2 && e.orientation !== 0).length;
  return { triangles: positions.length / 9, weldedVertices: vertices.size, bounds: { min, max, extent }, weldTolerance: tolerance,
    boundaryEdges, nonManifoldEdges, inconsistentEdges, degenerateFaces, duplicateFaces,
    connectedShells: new Set(parents.map((_, i) => root(i))).size, signedVolume,
    passesTopologyScreen: !boundaryEdges && !nonManifoldEdges && !inconsistentEdges && !degenerateFaces && !duplicateFaces,
    limitations: 'Model units and aircraft identity are unverified. Intersections, nested shells and aerodynamic fidelity require separate inspection and surfaceCheck.' };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const bytes = fs.readFileSync(process.argv[2]);
  console.log(JSON.stringify({ sha256: sha256(bytes), ...auditMesh(readMesh(bytes)) }, null, 2));
}
