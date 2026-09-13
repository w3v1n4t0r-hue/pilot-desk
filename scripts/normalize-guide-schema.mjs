import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const logo = 'https://www.pilot-desk.com/assets/icon.svg';
const image = 'https://www.pilot-desk.com/assets/aviation-guide-reference.svg';
const folders = ['guides', 'training'];

function metaDescription(html) {
  return (html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["'][^>]*>/i) || [])[1] || '';
}

function canonical(html) {
  return (html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["'][^>]*>/i) || [])[1] || '';
}

for (const folder of folders) {
  const dir = path.join(root, folder);
  if (!fs.existsSync(dir)) continue;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith('.html')) continue;
    const file = path.join(dir, entry.name);
    let html = fs.readFileSync(file, 'utf8');
    const before = html;
    const pageUrl = canonical(html);
    const desc = metaDescription(html);

    html = html.replace(/<script\s+type=["']application\/ld\+json["']([^>]*)>([\s\S]*?)<\/script>/gi, (whole, attrs, body) => {
      let data;
      try { data = JSON.parse(body); } catch { return whole; }
      const nodes = data?.['@graph'] || [data];
      const article = nodes.find(node => node && node['@type'] === 'Article');
      if (!article) return whole;

      if (pageUrl) {
        article.url ||= pageUrl;
        article.mainEntityOfPage ||= pageUrl;
      }
      if (desc) article.description ||= desc;
      article.image ||= image;
      article.author = {
        '@type': 'Organization',
        name: 'PilotDesk',
        url: 'https://www.pilot-desk.com/',
        logo: { '@type': 'ImageObject', url: logo }
      };
      article.publisher = {
        '@type': 'Organization',
        name: 'PilotDesk',
        url: 'https://www.pilot-desk.com/',
        logo: { '@type': 'ImageObject', url: logo }
      };
      return `<script type="application/ld+json"${attrs}>${JSON.stringify(data)}</script>`;
    });

    if (html !== before) fs.writeFileSync(file, html);
  }
}
