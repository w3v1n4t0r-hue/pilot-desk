import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const target = path.join(root, '.astro-public');
const migratedPages = new Set(['index.html', 'tools.html']);
const excludedDirs = new Set([
  '.git', '.github', '.astro', '.astro-public', 'dist', 'node_modules',
  'api', 'supabase', 'scripts', 'qa', 'src'
]);
const publicRootNames = new Set(['robots.txt', 'ads.txt', 'sw.js', 'site.webmanifest']);

fs.rmSync(target, { recursive: true, force: true });
fs.mkdirSync(target, { recursive: true });

for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
  const source = path.join(root, entry.name);
  const destination = path.join(target, entry.name);

  if (entry.isDirectory()) {
    if (excludedDirs.has(entry.name)) continue;
    fs.cpSync(source, destination, { recursive: true });
    continue;
  }

  if (!entry.isFile() || migratedPages.has(entry.name)) continue;
  const isPublicRootFile = publicRootNames.has(entry.name)
    || entry.name.endsWith('.html')
    || entry.name.endsWith('.xml');
  if (isPublicRootFile) fs.copyFileSync(source, destination);
}

console.log('Prepared Astro public passthrough while preserving legacy PilotDesk URLs.');
