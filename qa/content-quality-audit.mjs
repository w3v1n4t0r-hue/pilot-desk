import fs from 'node:fs';
import assert from 'node:assert/strict';
const read=p=>fs.readFileSync(p,'utf8');
const v=JSON.parse(read('vercel.json'));
for(const [source,destination] of [['/guides/how-far-can-an-airplane-glide.html','/guides/glide-range.html'],['/guides/cessna-172-glide-distance.html','/guides/glide-range.html#aircraft-data']]){
 assert(v.redirects.some(r=>r.source===source&&r.destination===destination&&r.permanent));
 const h=read(source.slice(1));assert(h.includes('noindex,follow'));assert(h.includes(`url=${destination}`));
 for(const file of fs.readdirSync('.').filter(f=>/^sitemap.*\.xml$/.test(f)))assert(!read(file).includes(`<loc>https://www.pilot-desk.com${source}</loc>`));
}
const sheet=read('guides/pilot-math-cheat-sheet.html');assert(sheet.includes('8.6 × √main-tire pressure'));assert(sheet.includes('51.6 kt'));assert(!sheet.includes('Common FAA training estimate'));
assert(read('sources.html').includes('8.6 × √main-tire pressure'));
assert(read('guides/density-altitude.html').includes('<h2>5,000 ft field elevation at 30°C</h2>'));
assert(read('guides/climb-rate-vs-climb-gradient.html').includes('<h2>300 ft/NM at 120 and 140 knots</h2>'));
const pivotal=read('guides/pivotal-altitude.html');assert(pivotal.includes('pylon appears to move ahead, decrease altitude'));assert(pivotal.includes('pylon appears to move behind, increase altitude'));assert(pivotal.includes('MPH² ÷ 15'));
const privacy=read('legal/privacy.html');for(const term of ['Stripe Checkout','account email','subscription identifiers','Stripe’s hosted checkout'])assert(privacy.includes(term));assert(!privacy.includes('If paid features are introduced'));
for(const f of fs.readdirSync('calculators')){
 const p=`calculators/${f}/index.html`;if(!fs.existsSync(p))continue;
 const related=read(p).match(/<div class="related">([\s\S]*?)<\/div>/)?.[1]||'';
 const hrefs=[...related.matchAll(/href="([^"]+)"/g)].map(m=>m[1]);assert.equal(new Set(hrefs).size,hrefs.length,`${p}: duplicated related link`);
}
console.log('Content corrections passed: FAA coefficient, example inputs, pivotal sight picture, billing disclosure, consolidated redirects and distinct related links.');
