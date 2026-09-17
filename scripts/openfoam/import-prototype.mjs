import fs from 'node:fs';
import path from 'node:path';
import { auditMesh, readMesh, sha256 } from './mesh-audit.mjs';

const [source, destination] = process.argv.slice(2);
if (!source || !destination) throw Error('Usage: node scripts/openfoam/import-prototype.mjs prototype.html output-directory');
const html = fs.readFileSync(source, 'utf8');
// Parse only the known base64 fields. Never execute attached HTML or JavaScript.
const assets = html.match(/window\.PD_ASSETS\s*=\s*\{single:"([A-Za-z0-9+/=]+)",multi:"([A-Za-z0-9+/=]+)"\}/);
if (!assets) throw Error('Expected the supplied PD_ASSETS single/multi format');
fs.mkdirSync(destination, { recursive: true });
for (const [index, name] of ['trainer', 'jet'].entries()) {
  const bytes = Buffer.from(assets[index + 1], 'base64');
  const report = { source: path.basename(source), mesh: `${name}.pdm`, sha256: sha256(bytes), ...auditMesh(readMesh(bytes)) };
  for (const file of [`${name}.pdm`, `${name}.audit.json`]) if (fs.existsSync(path.join(destination, file))) throw Error(`Refusing to replace ${file}`);
  fs.writeFileSync(path.join(destination, `${name}.pdm`), bytes);
  fs.writeFileSync(path.join(destination, `${name}.audit.json`), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report));
}
