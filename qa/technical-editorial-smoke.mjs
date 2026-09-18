import fs from 'node:fs';

const failures=[];
const check=(ok,msg)=>{if(!ok)failures.push(msg)};
const reviewed=[
  'guides/accelerated-stall-load-factor.html',
  'guides/feathering-vs-windmilling-propeller.html',
  'guides/vmc-vs-vyse.html',
  'guides/density-altitude.html',
  'guides/weight-balance-envelope.html',
  'guides/pilot-math-formulas.html'
];

for(const file of reviewed){
  check(fs.existsSync(file),`Missing technical-review page: ${file}`);
  if(!fs.existsSync(file))continue;
  const html=fs.readFileSync(file,'utf8');
  check(/rel=["']canonical["']/i.test(html),`${file}: canonical missing`);
  check(/faa\.gov/i.test(html),`${file}: primary FAA source link missing`);
  check(/Technical basis|Technical sources/i.test(html),`${file}: technical-basis section missing`);
  check(/POH|AFM|approved/i.test(html),`${file}: aircraft-specific/approved-source boundary missing`);
  check(!/How .{0,90} fits into pilot training/i.test(html),`${file}: generic generated training boilerplate returned`);
  check(!/A practical way to study this topic/i.test(html),`${file}: generic study boilerplate returned`);
  check(!/data-pd-guide-depth=["']1["']/i.test(html),`${file}: generator depth block returned`);
}

const stall=fs.readFileSync('guides/accelerated-stall-load-factor.html','utf8');
check(stall.includes('critical angle of attack'),'Accelerated-stall guide lost critical-AOA definition');
check(stall.includes('n = L/W = 1 ÷ cos'),'Accelerated-stall guide lost force-balance equation');
check(stall.includes('Bank angle is not the fundamental variable'),'Accelerated-stall guide lost load-factor distinction');

const feather=fs.readFileSync('guides/feathering-vs-windmilling-propeller.html','utf8');
check(feather.includes('aerodynamic torque'),'Feathering guide lost aerodynamic-torque explanation');
check(feather.includes('Feathering does not create thrust'),'Feathering guide lost no-thrust clarification');

const vmc=fs.readFileSync('guides/vmc-vs-vyse.html','utf8');
check(vmc.includes('certification datum'),'VMC/VYSE guide lost certification-datum distinction');
check(vmc.includes('best single-engine rate-of-climb speed'),'VMC/VYSE guide lost VYSE definition');
check(vmc.includes('does not guarantee a positive climb')||vmc.includes('not a promise that the vertical rate is positive'),'VMC/VYSE guide lost climb-performance limitation');

const da=fs.readFileSync('guides/density-altitude.html','utf8');
check(da.includes('same density'),'Density-altitude guide lost physical definition');
check(da.includes('1.98°C per 1,000 feet'),'Density-altitude guide lost ISA lapse precision');
check(da.includes('does not mean “the wing makes less lift at the same IAS”'),'Density-altitude guide lost IAS/TAS precision point');

const wb=fs.readFileSync('guides/weight-balance-envelope.html','utf8');
check(wb.includes('Moment = Weight × Arm'),'Weight-and-balance guide lost moment identity');
check(wb.includes('Loaded CG = Total Moment ÷ Total Weight'),'Weight-and-balance guide lost CG identity');
check(wb.includes('Aircraft-specific data are mandatory'),'Weight-and-balance guide lost aircraft-data boundary');

const math=fs.readFileSync('guides/pilot-math-formulas.html','utf8');
for(const label of ['Type: identity','Type: model','Type: atmosphere model','Type: empirical rule of thumb']){
  check(math.includes(label),`Pilot-math reference lost classification: ${label}`);
}
check(math.includes('What should not be reduced to a generic formula'),'Pilot-math reference lost generic-formula boundary');

const policy=fs.readFileSync('editorial-policy.html','utf8');
check(policy.includes('AI is not a technical source'),'Editorial policy lost AI-source rule');
check(policy.includes('Physics before memorization'),'Editorial policy lost derivation standard');
check(policy.includes('Assumptions must be visible'),'Editorial policy lost assumption standard');
check(policy.includes('Exact, approximate, empirical, and aircraft-specific'),'Editorial policy lost information classification');

if(failures.length){
  console.error(`Technical editorial review failed (${failures.length})`);
  failures.forEach(x=>console.error(' - '+x));
  process.exit(1);
}
console.log(`Technical editorial review passed across ${reviewed.length} professionally reviewed aviation pages.`);
