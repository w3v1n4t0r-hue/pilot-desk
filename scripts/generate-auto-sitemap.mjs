import fs from 'node:fs';
import path from 'node:path';

const DIST = path.resolve('dist');
const HOST = 'www.pilot-desk.com';
const BASE = 'https://www.pilot-desk.com';
const AUTO_NAME = 'sitemap-auto.xml';
const INDEX_NAME = 'sitemap-index.xml';

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

function attrs(tag) {
  const map = new Map();
  const re = /([:\w-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
  let m;
  while ((m = re.exec(tag))) map.set(m[1].toLowerCase(), m[2] ?? m[3] ?? '');
  return map;
}

function canonicalFrom(html) {
  for (const tag of html.match(/<link\b[^>]*>/gi) || []) {
    const a = attrs(tag);
    const rel = (a.get('rel') || '').toLowerCase().split(/\s+/);
    if (rel.includes('canonical') && a.get('href')) return a.get('href').trim();
  }
  return null;
}

function isNoIndex(html) {
  for (const tag of html.match(/<meta\b[^>]*>/gi) || []) {
    const a = attrs(tag);
    if ((a.get('name') || '').toLowerCase() !== 'robots') continue;
    const rules = (a.get('content') || '').toLowerCase().split(',').map(x => x.trim());
    if (rules.some(x => x === 'noindex' || x.startsWith('noindex '))) return true;
  }
  return false;
}

function esc(s) {
  return s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
          .replaceAll('"', '&quot;').replaceAll("'", '&apos;');
}

if (!fs.existsSync(DIST)) throw new Error('dist/ does not exist; run Astro build first.');

const urls = new Set();
for (const file of walk(DIST).filter(f => f.endsWith('.html'))) {
  if (path.basename(file).toLowerCase() === '404.html') continue;
  const html = fs.readFileSync(file, 'utf8');
  if (isNoIndex(html)) continue;
  const canonical = canonicalFrom(html);
  if (!canonical) continue;
  let u;
  try { u = new URL(canonical); } catch { continue; }
  if (u.protocol !== 'https:' || u.hostname !== HOST) continue;
  u.hash = '';
  urls.add(u.toString());
}

if (urls.size < 50) {
  throw new Error(`Refusing to publish unexpectedly small auto sitemap (${urls.size} URLs).`);
}

const sorted = [...urls].sort();
const sitemap = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...sorted.map(u => `  <url><loc>${esc(u)}</loc></url>`),
  '</urlset>',
  ''
].join('\n');
fs.writeFileSync(path.join(DIST, AUTO_NAME), sitemap);

const staticNames = [
  'sitemap.xml',
  'sitemap-core.xml',
  'sitemap-daily.xml',
  'sitemap-growth.xml',
  'sitemap-retention.xml',
  'sitemap-seo-expansion.xml',
  'sitemap-seo-expansion-2.xml',
  'sitemap-written-prep.xml',
  AUTO_NAME
].filter(name => fs.existsSync(path.join(DIST, name)));

const index = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...staticNames.map(name => `  <sitemap><loc>${BASE}/${name}</loc></sitemap>`),
  '</sitemapindex>',
  ''
].join('\n');
fs.writeFileSync(path.join(DIST, INDEX_NAME), index);

console.log(`Generated ${AUTO_NAME} with ${sorted.length} canonical indexable URLs.`);
console.log(`Generated ${INDEX_NAME} with ${staticNames.length} child sitemaps.`);
