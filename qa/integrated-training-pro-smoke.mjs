import fs from 'node:fs';import vm from 'node:vm';
const read=p=>fs.readFileSync(p,'utf8'),fail=[];const check=(ok,msg)=>{if(!ok)fail.push(msg)};
const standards=read('assets/training-standards-data.js'),coverage=read('learn/coverage/index.html'),coverageJs=read('assets/training-coverage.js'),coverageCss=read('assets/training-coverage.css');
const prep=read('written-prep.html'),prepJs=read('assets/written-prep.js'),prepCss=read('assets/written-prep.css');
const gap=read('skill-gap.html'),gapJs=read('assets/skill-gap.js');
const lab=read('learn/checkride-lab/index.html'),labData=read('assets/checkride-lab-data.js'),labJs=read('assets/checkride-lab.js');
const study=read('learn/study-plan/index.html'),studyJs=read('assets/study-plan.js'),studyCss=read('assets/study-plan.css');
const preflight=read('preflight-brief.html'),preflightJs=read('assets/pro-preflight.js'),preflightCss=read('assets/pro-preflight.css');
const pricing=read('pricing.html'),training=read('flight-training.html'),sw=read('sw.js');

const ctx={window:{}};vm.runInNewContext(standards,ctx);const matrix=ctx.window.PilotDeskTrainingStandards;
check(Boolean(matrix),'training standards data did not initialize');
for(const track of ['ppl','ira','cpl','multi','cfi','cfii','atp']){
 const t=matrix?.tracks?.[track];check(Boolean(t),`coverage matrix missing ${track}`);
 check((t?.clusters?.length||0)>=6,`${track} coverage matrix is too shallow`);
 check((t?.questionTarget||0)>=150,`${track} does not carry a serious authoring target`);
}
check(matrix?.tracks?.ppl?.standard==='FAA-S-ACS-6C','PPL standard mismatch');
check(matrix?.tracks?.ira?.standard==='FAA-S-ACS-8C','IRA standard mismatch');
check(matrix?.tracks?.cpl?.standard==='FAA-S-ACS-7B','CPL standard mismatch');
check(matrix?.tracks?.cfi?.standard==='FAA-S-ACS-25','CFI standard mismatch');
check(matrix?.tracks?.cfii?.standard==='FAA-S-8081-9E','CFII standard mismatch');
check(matrix?.tracks?.atp?.standard==='FAA-S-ACS-11A','ATP standard mismatch');
check(matrix?.tracks?.multi?.knowledgeTest===false&&matrix.tracks.multi.testCode==='NO SEPARATE KNOWLEDGE TEST','Multi must not invent a separate FAA knowledge test');

check(coverage.includes('Every training question needs a place in the standard.'),'coverage page purpose missing');
check(coverage.includes('Volume does not count as coverage.'),'coverage page authoring gate missing');
check(coverageJs.includes("const order=['ppl','ira','cpl','multi','cfi','cfii','atp']"),'coverage UI does not expose all seven tracks');
check(!/linear-gradient|radial-gradient|backdrop-filter/.test(coverageCss),'coverage page violates Claude visual rules');

check(prepJs.includes('data-figure-viewer')&&prepJs.includes('<iframe'),'Written Prep does not embed the official FAA supplement viewer');
check(prepJs.includes('Page placement can change when the FAA republishes a supplement'),'figure viewer must not guess PDF page numbers');
check(prep.includes('/learn/study-plan/')&&prep.includes('/learn/coverage/'),'Written Prep does not connect to plan + coverage matrix');
check(prepCss.includes('.pd-prep-figure-viewer iframe'),'embedded FAA figure viewer is not styled');

check(gap.includes('pdGapOralLink')&&gap.includes('pdGapPlanLink')&&gap.includes('pdGapCoverageLink'),'Weak Subjects cross-training actions missing');
check(gapJs.includes('matchCluster')&&gapJs.includes('Checkride Lab'),'Weak Subjects is not mapping written weakness into oral/source workflows');
check(lab.includes('<option value="atp">ATP / Type Rating</option>'),'Checkride Lab missing ATP');
check(labData.includes("atp:{title:'ATP / Type Rating'"),'Checkride Lab ATP rubric missing');
check(labJs.includes('pd-checkride-history-v1'),'Checkride Lab rolling history missing');

check(study.includes('PILOTDESK PRO · STUDY PLAN')&&study.includes('/assets/pro-access.js'),'Study Plan is not a Pro workflow');
for(const track of ['ppl','ira','cpl','multi','cfi','cfii','atp'])check(study.includes(`value="${track}"`),`Study Plan missing ${track}`);
check(studyJs.includes('writtenDashboard(track)')&&studyJs.includes('pd-checkride-history-v1')&&studyJs.includes('clusterSignals'),'Study Plan does not combine Written Prep, oral history, and matrix coverage');
check(studyJs.includes("if(!t?.knowledgeTest)return null"),'Study Plan must handle Multi without a fake written test');
check(studyJs.includes('Print / save PDF')||study.includes('Print / save PDF'),'Study Plan printable/PDF workflow missing');
check(!/linear-gradient|radial-gradient|backdrop-filter/.test(studyCss),'Study Plan violates Claude visual rules');

check(preflight.includes('PILOTDESK PRO · PREFLIGHT WORKSPACE')&&preflight.includes('/assets/pro-access.js'),'Pro Preflight gate missing');
check(preflight.includes('Not an official briefing, dispatch release, or safety determination.'),'Pro Preflight safety boundary missing');
for(const field of ['minCeiling','minVisibility','maxSurfaceWind','maxCrosswind','maxTailwind','minRunwayLength','maxDensityAltitude'])check(preflight.includes(`name="${field}"`),`personal planning limit missing ${field}`);
check(preflightJs.includes('/api/weather?station=')&&preflightJs.includes('/api/notams?station=')&&preflightJs.includes('/api/tfrs?bbox='),'Pro Preflight is not using existing live FAA/weather endpoints');
check(preflightJs.includes("pd-wb-v2-draft")&&preflightJs.includes("pd-aircraft"),'Pro Preflight does not include W&B/aircraft context');
check(preflightJs.includes('WITHIN STORED LIMIT')&&preflightJs.includes('REVIEW · EXCEEDS STORED LIMIT'),'personal planning-limit comparison states missing');
check(preflightJs.includes('does not mean the flight is safe, legal, or recommended'),'Pro Preflight must not make go/no-go decisions');
check(preflight.includes('Personal planning limits')&&preflight.includes('Print / save PDF'),'Pro Preflight limit/PDF controls missing');
check(!/linear-gradient|radial-gradient|backdrop-filter/.test(preflightCss),'Pro Preflight violates Claude visual rules');

for(const phrase of ['source-based Study Plans','Pro Preflight workspace','FAA coverage matrices'])check(pricing.includes(phrase),`pricing missing ${phrase}`);
check(training.includes('/learn/study-plan/')&&training.includes('/learn/coverage/')&&training.includes('/preflight-brief.html'),'training hub missing integrated workflow links');
check(Number(sw.match(/CACHE='pilotdesk-v(\d+)'/)?.[1]||0)>=58,'service worker cache not advanced for integrated training release');
for(const asset of ['/assets/training-standards-data.js','/assets/training-coverage.js','/assets/study-plan.js','/assets/pro-preflight.js'])check(sw.includes("'"+asset+"'"),`network-first cache missing ${asset}`);

if(fail.length){console.error('Integrated training + Pro checks failed ('+fail.length+')');fail.forEach(x=>console.error(' - '+x));process.exit(1)}
console.log('Integrated training + Pro checks passed: seven-track FAA matrix, inline FAA figures, Written→Weak→Oral handoff, Pro Study Plan, and Pro Preflight are connected.');
