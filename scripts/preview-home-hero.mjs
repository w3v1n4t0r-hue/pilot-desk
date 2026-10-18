import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('dist');
const port = Number(process.env.PORT || 4188);
const mime = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.json': 'application/json', '.webp': 'image/webp', '.woff2': 'font/woff2', '.png': 'image/png', '.webmanifest': 'application/manifest+json' };
if (!fs.existsSync(root)) throw new Error('Run npm run build before previewing.');
http.createServer((request, response) => {
  let pathname;
  try { pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname); }
  catch { response.writeHead(400).end(); return; }
  if (['/_vercel/insights/script.js', '/_vercel/speed-insights/script.js'].includes(pathname)) { response.writeHead(200, { 'Content-Type': 'application/javascript' }).end(); return; }
  const candidate = path.resolve(root, '.' + pathname);
  if (candidate !== root && !candidate.startsWith(root + path.sep)) { response.writeHead(403).end(); return; }
  // Astro's production build uses file URLs; expose the prototype's friendly URL locally.
  const file = [candidate, path.join(candidate, 'index.html'), candidate.replace(/[\\/]$/, '') + '.html'].find(file => fs.existsSync(file) && fs.statSync(file).isFile());
  if (!file) { response.writeHead(404).end('Not found'); return; }
  response.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
  fs.createReadStream(file).pipe(response);
}).listen(port, '127.0.0.1', () => console.log(`Hero prototype: http://127.0.0.1:${port}/prototypes/home-hero/`));
