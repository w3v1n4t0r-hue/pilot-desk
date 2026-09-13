import fs from 'node:fs';

const errors=[];
const fail=x=>errors.push(x);
const newGuides=[
  'guides/how-far-can-an-airplane-glide.html',
  'guides/best-glide-speed-vs-glide-ratio.html',
  'guides/emergency-glide-planning.html',
  'guides/checkride-study-guides.html',
  'guides/pilot-checkride-math.html'
];

for(const file of newGuides){
  if(!fs.existsSync(file)){fail(`${file}: missing`);continue}
  const h=fs.readFileSync(file,'utf8');
  if(!h.includes('rel="canonical"'))fail(`${file}: canonical missing`);
  if(!h.includes('data-pd-guide-schema'))fail(`${file}: Article schema missing`);
  if(!h.includes('data-pd-guide-breadcrumbs'))fail(`${file}: breadcrumb schema missing`);
  if(!h.includes('property="og:image"'))fail(`${file}: social image missing`);
  if(!h.includes('"datePublished"'))fail(`${file}: datePublished missing`);
  if(!h.includes('"logo":{"@type":"ImageObject"'))fail(`${file}: organization logo missing`);
}

const calc=fs.readFileSync('calculators/glide-range/index.html','utf8');
if(!/<title>[^<]*Glide Distance Calculator[^<]*<\/title>/i.test(calc))fail('glide calculator: search-intent title missing');
if(!/<h1>[^<]*Glide Distance Calculator[^<]*<\/h1>/i.test(calc))fail('glide calculator: search-intent H1 missing');
for(const href of ['/guides/glide-range.html','/guides/how-far-can-an-airplane-glide.html','/guides/best-glide-speed-vs-glide-ratio.html','/guides/emergency-glide-planning.html'])if(!calc.includes(`href="${href}"`))fail(`glide calculator: missing cluster link ${href}`);

const glide=fs.readFileSync('guides/glide-range.html','utf8');
for(const href of ['/calculators/glide-range/','/guides/how-far-can-an-airplane-glide.html','/guides/best-glide-speed-vs-glide-ratio.html','/guides/emergency-glide-planning.html','/guides/pilot-checkride-math.html'])if(!glide.includes(`href="${href}"`))fail(`glide guide: missing cluster link ${href}`);

const multi=fs.readFileSync('guides/multiengine-checkride-study-guide.html','utf8');
if(!multi.includes('"datePublished"'))fail('multi-engine guide: datePublished missing');
if(!multi.includes('"logo":{"@type":"ImageObject"'))fail('multi-engine guide: organization logo missing');
if(!multi.includes('href="/guides/checkride-study-guides.html"'))fail('multi-engine guide: checkride hub link missing');
if(!multi.includes('href="/guides/pilot-checkride-math.html"'))fail('multi-engine guide: checkride math link missing');

const growth=fs.readFileSync('sitemap-growth.xml','utf8');
for(const file of newGuides){const u=`https://www.pilot-desk.com/${file}`;if(!growth.includes(`<loc>${u}</loc>`))fail(`sitemap-growth.xml: missing ${u}`)}
if(!growth.includes('<loc>https://www.pilot-desk.com/calculators/glide-range/</loc>'))fail('sitemap-growth.xml: glide calculator missing');

const robots=fs.readFileSync('robots.txt','utf8');
if(!robots.includes('Sitemap: https://www.pilot-desk.com/sitemap-growth.xml'))fail('robots.txt: growth sitemap missing');

const indexnow=fs.readFileSync('scripts/submit-indexnow.py','utf8');
if(!indexnow.includes("glob('sitemap*.xml')"))fail('IndexNow script: all-sitemap discovery missing');

if(errors.length){console.error('SEO growth cluster check failed:');for(const e of errors)console.error(' - '+e);process.exit(1)}
console.log(`SEO growth cluster PASS: ${newGuides.length} new guides, glide intent cluster, checkride cluster, growth sitemap and IndexNow coverage verified.`);
