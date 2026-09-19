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

const required=['planner.html','route-planner.html','procedures.html','poh-chart-studio.html','checklist-trainer.html','assets/navlog-core.js','assets/route-planner.js','assets/efb-layers.js','assets/procedures.js','assets/global-nav.js','assets/checklist-trainer.css','assets/procedure-viewer.css','assets/planner-suite.css','assets/weather.css','assets/weather-fixed.js','assets/checklist-trainer.js','assets/aircraft-training.js','assets/poh-chart-studio.js','api/navdata.js','api/weather.js','api/aviation-layers.js','api/faa-map-features.js','api/tfrs.js','api/notams.js','api/procedures.js','api/procedure-pdf.js'];
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
const efb=fs.readFileSync('assets/efb-layers.js','utf8');
for(const s of ['Auto by zoom','NOAA MRMS','/api/tfrs?bbox=','/api/notams?station=','SIGMET INTERSECTION','DESTINATION NOTAM','Automatic flags describe data relationships only','L.DomEvent.disableClickPropagation'])if(!efb.includes(s))throw new Error(`EFB route layer integration missing ${s}`);
if(!rp.includes('/assets/efb-layers.js'))throw new Error('Route planner does not load the EFB layer controller');
const layerApi=fs.readFileSync('api/aviation-layers.js','utf8');
const faaMapApi=fs.readFileSync('api/faa-map-features.js','utf8');
const tfrApi=fs.readFileSync('api/tfrs.js','utf8');
const notamApi=fs.readFileSync('api/notams.js','utf8');
for(const s of ['metar','pirep','airsigmet','gairmet','cwa','obstacle'])if(!layerApi.includes(`'${s}'`))throw new Error(`AWC overlay proxy missing ${s}`);
for(const s of ['US_Airport','NAVAIDSystem','DesignatedPoints','ATS_Route','Special_Use_Airspace','Class_Airspace'])if(!faaMapApi.includes(s))throw new Error(`FAA map overlay proxy missing ${s}`);
if(!tfrApi.includes('TFR:V_TFR_LOC')||!tfrApi.includes('Federal Aviation Administration TFR GeoServer'))throw new Error('FAA TFR integration missing');
if(!notamApi.includes('FAA_NOTAM_CLIENT_ID')||!notamApi.includes('FAA_NOTAM_CLIENT_SECRET')||notamApi.includes('process.env.NEXT_PUBLIC'))throw new Error('FAA NOTAM credentials must remain server-side');

const proc=fs.readFileSync('api/procedures.js','utf8');
const proxy=fs.readFileSync('api/procedure-pdf.js','utf8');
const procPage=fs.readFileSync('procedures.html','utf8');
for(const s of ['d-tpp_Metafile.xml','airport_name','pdfName','viewUrl','DELETED_JOB'])if(!proc.includes(s))throw new Error(`FAA metafile lookup missing ${s}`);
if(!proxy.includes('aeronav.faa.gov/d-tpp/')||!proxy.includes('application/pdf'))throw new Error('Same-origin FAA PDF proxy missing');
if(!procPage.includes('procViewer')||!procPage.includes('procFilters')||!procPage.includes('FAA d-TPP'))throw new Error('FAA plate viewer missing');

const siteData=fs.readFileSync('src/data/site.mjs','utf8');
const header=fs.readFileSync('src/components/Header.astro','utf8');
const gn=fs.readFileSync('assets/global-nav.js','utf8');
const navCss=fs.readFileSync('assets/pilotdesk-architecture-2026.css','utf8');
const order=["label: 'Tools'","label: 'Plan'","label: 'Weather'","label: 'Learn'"];
let pos=-1;
for(const item of order){const next=siteData.indexOf(item);if(next<0||next<=pos)throw new Error(`Top navigation order is wrong at ${item}`);pos=next}
for(const target of ['/route-planner.html','/airport.html','/procedures.html','/aircraft.html','/flights.html'])if(!siteData.includes(`'${target}'`))throw new Error(`Plan navigation missing ${target}`);
if(!siteData.includes("['/daily/', 'Daily challenge'"))throw new Error('Daily must remain discoverable in shared Learn navigation');
if(!header.includes('navSections.map'))throw new Error('Astro header must render shared navigation data');
if(!gn.includes('PILOTDESK_NAV_CORE')||!gn.includes('data-pd-account-link')||!gn.includes('/assets/navigation-search.js'))throw new Error('Lightweight shared navigation/account hydration missing');
if(!navCss.includes('@media(max-width:860px)')||!navCss.includes('.pd-main-nav.open{display:grid}')||!navCss.includes('.menu-btn{display:grid!important'))throw new Error('Global navigation/mobile behavior missing');

const wx=fs.readFileSync('api/weather.js','utf8');
const wxClient=fs.readFileSync('assets/weather-fixed.js','utf8');
for(const marker of ["const NOAA=",'Promise.all','fetchJson(','fetchText(','stale-while-revalidate=300'])if(!wx.includes(marker))throw new Error(`Weather fallback/resilience missing ${marker}`);
if(!wxClient.includes("cache:'no-store'")||!wxClient.includes('Weather could not be loaded')||!wxClient.includes('Retry'))throw new Error('Weather client retry/failure state missing');

const sw=fs.readFileSync('sw.js','utf8');
const swVersion=Number(sw.match(/CACHE='pilotdesk-v(\d+)'/)?.[1]||0);
if(swVersion<20)throw new Error('Service worker version not advanced');
for(const x of ['/assets/navigation-core.js','/assets/global-nav.js','/assets/app-bootstrap.js'])if(!sw.includes(x))throw new Error(`Offline core missing ${x}`);
for(const x of ['/planner.html','/route-planner.html','/procedures.html','/poh-chart-studio.html','/checklist-trainer.html','/assets/aircraft-training.js'])if(sw.includes(`'${x}'`))throw new Error(`Route-specific planning asset returned to the core precache: ${x}`);
if(!sw.includes('staleWhileRevalidate')||!sw.includes("req.mode==='navigate'"))throw new Error('Planning pages must remain runtime-cacheable without bloating the install precache');
if(!sw.includes('const networkOnlyPath=')||!sw.includes("pathname.startsWith('/api/')")||!sw.includes("pathname.startsWith('/_vercel/')"))throw new Error('Live APIs must bypass service worker cache');

const sitemap=fs.readFileSync('sitemap.xml','utf8');
if(!sitemap.includes('/procedures.html'))throw new Error('Procedures page missing from sitemap');
console.log('PilotDesk planner, FAA chart, procedure viewer, training library, navigation, and weather tests passed.');
