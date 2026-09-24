import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const dist = path.join(root, 'dist');
const failures = [];
const need = (rel) => {
  const full = path.join(dist, rel);
  if (!fs.existsSync(full)) failures.push(`missing dist/${rel}`);
  return full;
};

for (const rel of [
  'index.html',
  'tools.html',
  'written-prep.html',
  'account.html',
  'weather.html',
  'daily/index.html',
  'calculators/crosswind/index.html',
  'guides/crosswind-component.html',
  'assets/styles.css',
  'assets/global-nav.js',
  'assets/home-desk.js',
  'assets/home-desk.css',
  'assets/navigation-data.js',
  'sw.js',
  'site.webmanifest',
  'robots.txt',
  'sitemap.xml'
]) need(rel);

const home = fs.existsSync(path.join(dist, 'index.html')) ? fs.readFileSync(path.join(dist, 'index.html'), 'utf8') : '';
const tools = fs.existsSync(path.join(dist, 'tools.html')) ? fs.readFileSync(path.join(dist, 'tools.html'), 'utf8') : '';

for (const marker of ['data-pd-astro-native="1"', 'Plan a Flight', 'Use a Calculator', 'Study for a Written', 'Three daily questions', 'pdHomeDesk']) {
  if (!home.includes(marker)) failures.push(`Astro homepage missing ${marker}`);
}
for (const marker of ['data-pd-astro-native="1"', 'pdToolDirectorySearch', 'pdToolDirectory']) {
  if (!tools.includes(marker)) failures.push(`Astro tools page missing ${marker}`);
}
if (fs.existsSync(path.join(dist, 'api'))) failures.push('api/ must remain a Vercel function source, not a public build artifact');

if (failures.length) {
  console.error('Astro build verification failed:');
  failures.forEach((failure) => console.error(` - ${failure}`));
  process.exit(1);
}

console.log('Astro build verified: shared shell pages are native Astro and legacy PilotDesk routes remain intact.');
