import fs from 'node:fs';

const failures=[];
const check=(ok,msg)=>{if(!ok)failures.push(msg)};
const hub=fs.readFileSync('flight-training.html','utf8');
const css=fs.readFileSync('assets/experience.css','utf8');
const oral=fs.readFileSync('learn/oral-exam/index.html','utf8');
const oralJs=fs.readFileSync('assets/oral-exam-workbench.js','utf8');
const ratingPages=[
  'training/private-pilot.html',
  'training/instrument-rating.html',
  'training/commercial-pilot.html',
  'training/multiengine.html',
  'training/cfi.html',
  'training/cfii.html'
];

for(const needle of ['What are you studying for today?','Written prep','Oral exam prep','ACS & FAR reference','id="pdTrainingRatingsTitle"']){
  check(hub.includes(needle),`Flight-training hub missing goal-first element: ${needle}`);
}
check(!hub.includes('style="margin:22px 0"'),'Old inline training-grid spacing returned');
check(hub.includes('/training/cfii.html'),'CFII study page is not discoverable from training');
for(const track of ['private','instrument','commercial','multi','cfi','cfii','atp'])check(oral.includes(`data-track="${track}"`)&&oralJs.includes(`${track}:{title:`),`Oral guide missing ${track} track`);
check(oral.includes('Reviewed with the source')||oralJs.includes('Reviewed with the source'),'Oral guide lost source-review progress');

for(const file of ratingPages){
  const html=fs.readFileSync(file,'utf8');
  check(html.includes('class="pd-training-path"'),`${file}: cross-rating training path missing`);
  check(html.includes('class="pd-training-next"'),`${file}: practice-next section missing`);
  check(html.includes('/written-prep.html'),`${file}: Written Prep path missing`);
  check(html.includes('/learn/oral-exam/'),`${file}: oral-exam path missing`);
  check(html.includes('/training/acs-far-reference.html'),`${file}: ACS/FAR source path missing`);
  check(html.includes('aria-current="page"'),`${file}: active training rating not identified`);
  check(html.includes('Use these sources first')||html.includes('Check the current FAA references'),`${file}: controlling-source section lost`);
  check(/faa\.gov/.test(html),`${file}: FAA source link missing`);
}

for(const needle of ['.pd-training-goal-grid','.pd-training-path','.pd-training-next','@media(max-width:760px)']){
  check(css.includes(needle),`Training UX styling missing: ${needle}`);
}

if(failures.length){
  console.error(`Training-system checks failed with ${failures.length} issue(s):`);
  failures.forEach(x=>console.error(' - '+x));
  process.exit(1);
}
console.log(`Training-system checks passed across the main hub and ${ratingPages.length} rating hubs: goal-first routes, written/oral/source workflow, active rating navigation, FAA-source boundaries, and mobile layout verified.`);

