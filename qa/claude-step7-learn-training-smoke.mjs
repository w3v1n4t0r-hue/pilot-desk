import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8');
const failures=[];const check=(ok,msg)=>{if(!ok)failures.push(msg)};
const gap=read('skill-gap.html'),gapJs=read('assets/skill-gap.js'),prep=read('written-prep.html'),training=read('flight-training.html'),progress=read('assets/training-progress.js');
const acs=read('training/acs-far-reference.html'),cert=read('training/certificates-ratings.html'),step7=read('assets/learn-step7.js'),css=read('assets/learn-2026.css');
const site=read('assets/site.js'),boot=read('assets/app-bootstrap.js'),sw=read('sw.js');

check(gap.includes('This is not another quiz.'),'Weak Subjects still reads like a second diagnostic');
check(gap.includes('WRITTEN PREP · WEAK SUBJECTS')&&gap.includes('pdGapWeakList'),'Weak Subjects written-prep view missing');
for(const track of ['ppl','ira','cpl','cfi','cfii','atp'])check(gap.includes('data-track="'+track+'"'),'Weak Subjects missing '+track);
check(gapJs.includes("functions.invoke(name,{method:'GET'})")&&gapJs.includes("'written-prep?track='")&&!gapJs.includes('/functions/v1/pilot-skill-gap'),'Weak Subjects is not driven only by Written Prep history');
check(gapJs.includes('x.mastery<80||x.misses>0'),'Weak Subjects does not filter to review signals');
check(prep.includes('pdPrepWeakLink'),'Written Prep does not link prominently to Weak Subjects');
check(step7.includes('OPEN WEAK SUBJECTS')&&step7.includes('pdPrepSummary'),'Written Prep result handoff to Weak Subjects missing');

check(training.includes('CERTIFICATE SELECTOR')&&training.includes('/training/atp.html'),'Flight Training certificate/rating selector incomplete');
check(progress.includes("atp:'/training/atp.html'"),'ATP selector does not open ATP hub');
check(acs.includes('pd-source-matrix')&&acs.includes('STANDARD → RULE → GUIDANCE → AIRCRAFT'),'ACS/FAR page is not scan-first');
check(cert.includes('pd-certificate-roadmap')&&cert.includes('COMMON AIRPLANE PATH')&&cert.includes('INSTRUCTOR PATH'),'Certificate visual roadmap missing');

check(step7.includes('ct-guide-rail')&&step7.includes('Recall, then reveal')&&step7.includes('Complete + advance'),'Checklist guided sequence missing');
check(step7.includes('pdOralSubjectStrip')&&step7.includes('data-step7-subject'),'Oral subjects-by-rating strip missing');
check(step7.includes('pd-guide-reader-rail')&&step7.includes("path.startsWith('/guides/')"),'Long-form guide reading rail missing');
check(site.includes('/assets/learn-step7.js')&&boot.includes('/assets/learn-step7.js'),'Step 7 enhancement layer is not loaded on all required routes');

const step7Css=css.slice(css.indexOf('Claude Step 7 — Learn / Training'));
for(const bad of ['linear-gradient','radial-gradient','backdrop-filter'])check(!step7Css.includes(bad),'Step 7 introduced SaaS decoration: '+bad);
for(const cls of ['.pd-gap-weak-row','.pd-certificate-path','.pd-source-matrix','.pd-oral-subject-strip','.pd-guide-reader-rail'])check(css.includes(cls),'Step 7 visual system missing '+cls);
check(sw.includes("CACHE='pilotdesk-v50'")&&sw.includes('/assets/learn-step7.js'),'Service worker did not advance for Step 7');

if(failures.length){console.error('Claude Step 7 Learn/Training smoke failed ('+failures.length+')');failures.forEach(x=>console.error(' - '+x));process.exit(1)}
console.log('Claude Step 7 Learn/Training smoke passed.');
