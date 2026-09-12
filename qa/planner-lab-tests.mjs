import fs from 'node:fs';
import {createRequire} from 'node:module';

const require=createRequire(import.meta.url);
const nav=require('../assets/navlog-core.js');
const near=(a,b,t,m)=>{if(!Number.isFinite(a)||Math.abs(a-b)>t)throw new Error(`${m}: ${a} vs ${b}`)};

let g=nav.distanceCourse({lat:47.95,lon:-97.18},{lat:47.95,lon:-97.18});
near(g.distance,0,.001,'zero distance');
let w=nav.windTriangle(180,120,270,20);
if(!w||!(w.gs>0))throw new Error('wind triangle failed');
let n=nav.build([{id:'A',lat:47,lon:-97},{id:'B',lat:48,lon:-97}],{tas:120,burn:10,windFrom:270,windSpeed:0,variation:0});
near(n.totalDistance,60.04,.2,'one degree latitude');
near(n.totalHours,n.totalDistance/120,.001,'ETE');
near(n.totalFuel,n.totalHours*10,.001,'fuel');

const required=['planner.html','route-planner.html','procedures.html','poh-chart-studio.html','checklist-trainer.html','assets/navlog-core.js','assets/route-planner.js','assets/procedures.js','assets/global-nav.js','assets/checklist-trainer.css','assets/procedure-viewer.css','assets/planner-suite.css','assets/weather.css','assets/weather-fixed.js','assets/checklist-trainer.js','assets/aircraft-training.js','assets/poh-chart-studio.js','api/navdata.js','api/weather.js','api/procedures.js','api/procedure-pdf.js'];
for(const p of required)if(!fs.existsSync(p))throw new Error(`Missing ${p}`);

const ct=fs.readFileSync('assets/checklist-trainer.js','utf8');
for(const s of ['pd-training-library-v2','pd-aircraft','speechSynthesis',"category:'normal'",'emergency','maneuver',"state.mode==='flow'"])if(!ct.includes(s))throw new Error(`Checklist library missing ${s}`);
const trainingLink=fs.readFileSync('assets/aircraft-training.js','utf8');
if(!trainingLink.includes('/checklist-trainer.html?aircraft='))throw new Error('Aircraft cards do not link into the training library');

const pcs=fs.readFileSync('assets/poh-chart-studio.js','utf8');
if(!pcs.includes('function interp')||!pcs.includes('xCal')||!pcs.includes('yCal')||!pcs.includes('will not extrapolate'))throw new Error('POH chart calibration/interpolation safeguards missing');

const rp=fs.readFileSync('route-planner.html','utf8');
const rpjs=fs.readFileSync('assets/route-planner.js','utf8');
if(!rp.includes('FAA CHART + NAVLOG')||!rp.includes('not used for the enroute wind calculation'))throw new Error('Route source/wind boundary missing');
for(const s of ['VFR_Sectional','IFR_AreaLow','chartCache','updateWhenIdle:true','loadContext','/api/procedures?ident=','pd-route-procedures','/procedures.html?ident='])if(!rpjs.includes(s))throw new Error(`Route optimization/integration missing ${s}`);

const proc=fs.readFileSync('api/procedures.js','utf8');
const proxy=fs.readFileSync('api/procedure-pdf.js','utf8');
const procPage=fs.readFileSync('procedures.html','utf8');
for(const s of ['d-tpp_Metafile.xml','airport_name','pdfName','viewUrl','DELETED_JOB'])if(!proc.includes(s))throw new Error(`FAA metafile lookup missing ${s}`);
if(!proxy.includes('aeronav.faa.gov/d-tpp/')||!proxy.includes('application/pdf'))throw new Error('Same-origin FAA PDF proxy missing');
if(!procPage.includes('procViewer')||!procPage.includes('procFilters')||!procPage.includes('FAA d-TPP'))throw new Error('FAA plate viewer missing');

const gn=fs.readFileSync('assets/global-nav.js','utf8');
const order=['Calculators','Planner','Aircraft','Weather','Guides','About','Sources','Privacy'];
let pos=-1;
for(const item of order){const next=gn.indexOf(`'${item}'`);if(next<0||next<=pos)throw new Error(`Top navigation order is wrong at ${item}`);pos=next}
if((gn.match(/'Planner'/g)||[]).length!==1)throw new Error('Top navigation should contain Planner once');
if(!gn.includes('pd-global-nav')||!gn.includes("max-width:820px"))throw new Error('Global navigation/mobile behavior missing');

const wx=fs.readFileSync('api/weather.js','utf8');
const wxClient=fs.readFileSync('assets/weather-fixed.js','utf8');
for(const marker of ["const NOAA=",'Promise.all','fetchJson(','fetchText(','stale-while-revalidate=300'])if(!wx.includes(marker))throw new Error(`Weather fallback/resilience missing ${marker}`);
if(!wxClient.includes("cache:'no-store'")||!wxClient.includes('Weather could not be loaded')||!wxClient.includes('Retry'))throw new Error('Weather client retry/failure state missing');

const sw=fs.readFileSync('sw.js','utf8');
const swVersion=Number(sw.match(/CACHE='pilotdesk-v(\d+)'/)?.[1]||0);
if(swVersion<20)throw new Error('Service worker version not advanced');
for(const x of ['/planner.html','/route-planner.html','/procedures.html','/poh-chart-studio.html','/checklist-trainer.html','/assets/navlog-core.js','/assets/procedures.js','/assets/global-nav.js','/assets/checklist-trainer.css','/assets/procedure-viewer.css','/assets/aircraft-training.js'])if(!sw.includes(x))throw new Error(`Offline shell missing ${x}`);
if(!sw.includes("url.pathname.startsWith('/api/')"))throw new Error('Live APIs must bypass service worker cache');

const sitemap=fs.readFileSync('sitemap.xml','utf8');
if(!sitemap.includes('/procedures.html'))throw new Error('Procedures page missing from sitemap');
console.log('PilotDesk planner, FAA chart, procedure viewer, training library, navigation, and weather tests passed.');
