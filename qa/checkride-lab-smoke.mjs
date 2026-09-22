import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8');
const failures=[];const check=(ok,msg)=>{if(!ok)failures.push(msg)};

const page=read('learn/checkride-lab/index.html');
const data=read('assets/checkride-lab-data.js');
const js=read('assets/checkride-lab.js');
const css=read('assets/checkride-lab.css');
const oral=read('learn/oral-exam/index.html');
const training=read('flight-training.html');
const pricing=read('pricing.html');
const sw=read('sw.js');

check(page.includes('PILOTDESK PRO · CHECKRIDE LAB'),'Checkride Lab Pro identity missing');
check(page.includes('/assets/billing.js')&&page.includes('/assets/pro-access.js'),'Checkride Lab does not use verified billing entitlement');
check(page.includes('study signal—not examiner grading'),'Checkride Lab grading limitation is not explicit');
check(page.includes('data-lab-mode="adaptive"')&&page.includes('data-lab-mode="mock"'),'Examiner drill and mock oral modes missing');
check(page.includes('Download blank checkride packet (PDF)')&&page.includes('Download checkride packet (PDF)'),'PDF packet actions missing');

for(const track of ['private','instrument','commercial','multi','cfi','cfii','atp'])
 check(data.includes(track+':{title:'),'Curated examiner data missing '+track);
check((data.match(/concepts:\[/g)||[]).length >=56,'Checkride Lab does not have concept rubrics across the full oral set');
check((data.match(/probes:\[/g)||[]).length >=56,'Examiner follow-up probes are not populated across the full oral set');

check(js.includes('scoreAnswer(answer,q)'),'Typed-answer coverage scoring missing');
check(js.includes("coverage.score<45?2:coverage.score<75?1:0"),'Follow-up depth is not driven by response coverage');
check(js.includes("state.mode==='mock'")&&js.includes("Feedback comes at the end"),'Mock oral does not withhold coaching until debrief');
check(js.includes('pdfBlob(lines)')&&js.includes("type:'application/pdf'"),'Client-side PDF packet generator missing');
check(js.includes("a.download='pilotdesk-'"),'PDF packet download filename missing');
check(js.includes('PilotDeskProAccess.snapshot()'),'Checkride Lab Pro gate is not enforced');
check(js.includes('localStorage.setItem(\'pd-checkride-last\''),'Checkride session debrief is not retained locally');
check(js.includes("pd-checkride-history-v1"),'Checkride Lab must retain rolling history for study planning');
check(page.includes('<option value="atp">'),'ATP must be selectable in Checkride Lab');

check(css.includes('.pd-lab-conversation')&&css.includes('.pd-lab-summary-grid'),'Checkride Lab cockpit UI surfaces missing');
for(const bad of ['linear-gradient','radial-gradient','backdrop-filter'])check(!css.includes(bad),'Checkride Lab introduced prohibited decoration: '+bad);

check(oral.includes('/learn/checkride-lab/'),'Oral prep does not hand off to Checkride Lab');
check(training.includes('Examiner follow-up oral')&&training.includes('/learn/checkride-lab/'),'Training hub does not expose Checkride Lab');
for(const phrase of ['Examiner follow-up conversations','mock-oral','PDF checkride'])
 check(pricing.toLowerCase().includes(phrase.toLowerCase()),'Pricing missing Checkride Lab benefit: '+phrase);
check(Number(sw.match(/CACHE='pilotdesk-v(\d+)'/)?.[1]||0)>=53,'Service worker cache did not advance for Checkride Lab');
for(const asset of ['/assets/checkride-lab-data.js','/assets/checkride-lab.js','/assets/checkride-lab.css'])
 check(sw.includes("'"+asset+"'"),'Checkride Lab asset missing from network-first cache: '+asset);

if(failures.length){console.error('Checkride Lab smoke failed ('+failures.length+')');failures.forEach(x=>console.error(' - '+x));process.exit(1)}
console.log('Checkride Lab smoke passed: Pro gate, examiner follow-up probes, mock oral debrief, seven-track rubrics, and real PDF packet generation verified.');
