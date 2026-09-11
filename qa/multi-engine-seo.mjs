import fs from 'node:fs';
import path from 'node:path';

const read=p=>fs.readFileSync(p,'utf8');
const failures=[];
const check=(ok,msg)=>{if(!ok)failures.push(msg)};

const robots=read('robots.txt');
const sitemap=read('sitemap.xml');
const indexNow=read('.github/workflows/indexnow-submit.yml');
const indexNowScript=read('scripts/submit-indexnow.py');
const key='c731d63e44f2d52fcd122041601cfb22';
const keyFile=`${key}.txt`;

check(/User-agent:\s*\*/i.test(robots),'robots.txt must contain a generic crawler policy');
check(/Allow:\s*\//i.test(robots),'robots.txt must allow the public site');
check(!/Disallow:\s*\/$/im.test(robots),'robots.txt must not block the public site root');
check(robots.includes('Sitemap: https://www.pilot-desk.com/sitemap.xml'),'robots.txt must advertise the canonical sitemap');

check(fs.existsSync(keyFile),`IndexNow key file ${keyFile} is missing`);
check(read(keyFile).trim()===key,'IndexNow key file contents must exactly match the key');
check(indexNowScript.includes("HOST='www.pilot-desk.com'"),'IndexNow payload must use the canonical www host');
check(indexNowScript.includes(`KEY='${key}'`),'IndexNow payload must use the deployed verification key');
check(indexNow.includes('https://api.indexnow.org/indexnow'),'IndexNow workflow must submit to the global IndexNow endpoint');
check(indexNow.includes('Wait for Vercel production success'),'IndexNow must wait until production is actually live');
check(indexNow.includes('statuses: read'),'IndexNow workflow needs read access to the Vercel commit status');
check(indexNow.includes('actions/cache@v4'),'IndexNow workflow must avoid resubmitting unchanged searchable content');
check(indexNow.includes("cron: '17 */2 * * *'"),'IndexNow needs a scheduled recovery pass for delayed deployments');
for(const asset of ['assets/tool-first-layout.js','assets/seo.js','assets/professional-polish.css','assets/performance.css']){
  check(indexNow.includes(asset),`IndexNow workflow should notice shared searchable change: ${asset}`);
}

const urls=[...sitemap.matchAll(/<url>\s*<loc>([^<]+)<\/loc>\s*<lastmod>([^<]+)<\/lastmod>\s*<\/url>/g)].map(m=>({url:m[1],lastmod:m[2]}));
check(urls.length>50,'canonical sitemap unexpectedly contains too few URLs');
check(new Set(urls.map(x=>x.url)).size===urls.length,'canonical sitemap contains duplicate URLs');
for(const {url,lastmod} of urls){
  check(url.startsWith('https://www.pilot-desk.com/'),`sitemap URL is not on the canonical host: ${url}`);
  check(/^\d{4}-\d{2}-\d{2}$/.test(lastmod),`sitemap lastmod is missing or invalid for ${url}`);
  const u=new URL(url);
  let local=u.pathname==='/'?'index.html':u.pathname.replace(/^\//,'');
  if(local.endsWith('/'))local+= 'index.html';
  local=decodeURIComponent(local);
  if(!fs.existsSync(local))continue; // Some canonical URLs are served by rewrites.
  const html=read(local);
  const robotsMeta=(html.match(/<meta[^>]+name=["']robots["'][^>]*>/i)||[])[0]||'';
  check(!/noindex/i.test(robotsMeta),`sitemap includes a noindex page: ${url}`);
  check(!/noarchive|nocache/i.test(robotsMeta),`indexable page blocks richer Bing/Copilot use: ${url}`);
}

if(failures.length){
  console.error(`Multi-engine SEO checks failed with ${failures.length} issue(s):`);
  failures.forEach(x=>console.error(' - '+x));
  process.exit(1);
}
console.log(`Multi-engine SEO checks passed: ${urls.length} canonical URLs are crawlable, freshness-tagged, and wired to production-aware IndexNow submission.`);
