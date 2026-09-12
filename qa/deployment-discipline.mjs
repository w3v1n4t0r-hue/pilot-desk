import fs from 'node:fs';

const read=p=>fs.readFileSync(p,'utf8');
const failures=[];
const check=(ok,msg)=>{if(!ok)failures.push(msg)};

const vercel=JSON.parse(read('vercel.json'));
const generator=read('.github/workflows/generate-calculators.yml');
const indexnow=read('.github/workflows/indexnow-submit.yml');

const deploy=vercel.git?.deploymentEnabled||{};
check(deploy['*']===false,'Vercel must keep non-production branches disabled');
check(deploy.main===true,'Vercel must allow exactly one production branch: main');

check(!/contents:\s*write/.test(generator),'generated-page workflow must not have repository write permission');
check(!/\bgit\s+push\b/.test(generator),'generated-page workflow must never push a second commit to main');
check(!/\bgit\s+commit\b/.test(generator),'generated-page workflow must never create an automatic production commit');
check(generator.includes('pull_request:'),'generated-page verification should run before merge');
check(generator.includes('git diff --quiet'),'generated-page workflow should verify committed output instead of mutating main');

check(!/contents:\s*write/.test(indexnow),'IndexNow workflow must not mutate repository content');
check(indexnow.includes('schedule:'),'IndexNow should retry discovery without needing extra production commits');

if(failures.length){
  console.error(`Deployment discipline checks failed with ${failures.length} issue(s):`);
  failures.forEach(x=>console.error(' - '+x));
  process.exit(1);
}
console.log('Deployment discipline checks passed: branch builds disabled, generated pages verify pre-merge, and post-release search submission cannot create extra production commits.');
