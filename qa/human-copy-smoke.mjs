import fs from 'node:fs';

const failures=[];
const ok=(condition,message)=>{if(!condition)failures.push(message)};
const curated=[
  'calculators/glide-range/index.html',
  'flight-training.html',
  'guides/glide-range.html',
  'guides/how-far-can-an-airplane-glide.html',
  'guides/best-glide-speed-vs-glide-ratio.html',
  'guides/emergency-glide-planning.html',
  'guides/checkride-study-guides.html',
  'guides/pilot-checkride-math.html',
  'guides/multiengine-checkride-study-guide.html',
  'guides/critical-engine-multiengine.html',
  'guides/multiengine-vmc-factors.html',
  'guides/vmc-vs-vyse.html',
  'guides/accelerate-stop-accelerate-go.html',
  'guides/feathering-vs-windmilling-propeller.html',
  'guides/identify-verify-feather.html',
  'guides/past-critical-engine.html',
  'guides/single-engine-climb-performance.html',
  'guides/single-engine-service-ceiling.html',
  'guides/vmc-demonstration-explained.html',
  'guides/zero-sideslip-multiengine.html',
  'guides/avgas-weight-per-gallon.html',
  'guides/cessna-172-glide-distance.html',
  'guides/crosswind-component-chart.html',
  'guides/seminole-vmc-study.html',
  'guides/three-degree-descent-rate-chart.html'
];

const boilerplate=[
  /data-pd-guide-depth=["']1["']/i,
  /data-pd-core-depth=["']1["']/i,
  /How .{0,90} fits into pilot training/i,
  /A practical way to study this topic/i,
  /Use this reference as part of a larger planning or training workflow/i,
  /Whether you['’]re a/i,
  /In today['’]s fast[- ]paced/i,
  /\bHow How\b/i
];

for(const file of curated){
  ok(fs.existsSync(file),`Missing curated page: ${file}`);
  if(!fs.existsSync(file))continue;
  const html=fs.readFileSync(file,'utf8');
  ok(/<h1\b/i.test(html),`${file}: missing H1`);
  ok(/rel=["']canonical["']/i.test(html),`${file}: missing canonical`);
  for(const re of boilerplate)ok(!re.test(html),`${file}: generic generated copy matched ${re}`);
}

const training=fs.readFileSync('flight-training.html','utf8');
for(const value of ['For instructors','/for-flight-schools.html','/training/private-pilot.html','/training/instrument-rating.html','/training/commercial-pilot.html','/training/multiengine.html','/training/cfi.html']){
  ok(training.includes(value),`flight-training.html: missing ${value}`);
}

const glide=fs.readFileSync('calculators/glide-range/index.html','utf8');
ok(/still[- ]air/i.test(glide),'Glide calculator lost its still-air limitation language');
ok(/glide ratio/i.test(glide),'Glide calculator lost glide-ratio explanation');
ok(/POH|AFM/i.test(glide),'Glide calculator lost aircraft-source warning');

if(failures.length){
  console.error(`Human-copy smoke failed (${failures.length})`);
  failures.forEach(x=>console.error(' - '+x));
  process.exit(1);
}
console.log(`Human-copy smoke passed across ${curated.length} hand-edited aviation pages.`);
