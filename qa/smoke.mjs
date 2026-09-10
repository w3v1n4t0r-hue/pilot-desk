import fs from 'node:fs';
import vm from 'node:vm';

const mustExist=[
  'index.html','calculator.html','weight-balance.html','weather.html','aircraft.html','feedback.html',
  'vercel.json','site.webmanifest','sw.js','package.json','api/weather.js',
  'assets/styles.css','assets/site.js','assets/safety.js','assets/ad-config.js','assets/ads.js',
  'assets/analytics.js','assets/brand.js','assets/home-fix.js','assets/features.js','assets/weather-fixed.js',
  'assets/calculator-config.js','assets/dynamic-calculator.js','assets/weight-balance.js','assets/icon.svg'
];
const failures=[];
const ok=(cond,msg)=>{if(!cond)failures.push(msg)};
for(const p of mustExist)ok(fs.existsSync(p),`Missing ${p}`);

const read=p=>fs.readFileSync(p,'utf8');
const packageJson=JSON.parse(read('package.json'));
ok(packageJson.dependencies?.['@vercel/analytics']==='2.0.1','@vercel/analytics 2.0.1 is not installed in package.json');
JSON.parse(read('site.webmanifest'));
const vercel=JSON.parse(read('vercel.json'));
ok(JSON.stringify(vercel.rewrites||[]).includes('weight-balance-builder'),'Weight & Balance Builder rewrite missing');
ok(JSON.stringify(vercel.rewrites||[]).includes('/calculator.html'),'Dynamic calculator rewrite missing');

const context={window:{}};
vm.createContext(context);
vm.runInContext(read('assets/calculator-config.js'),context);
const calcs=context.window.PD_CALCS||[];
ok(calcs.length===47,`Expected 47 standard calculators, found ${calcs.length}`);
const slugs=calcs.map(c=>c[0]);
ok(new Set(slugs).size===slugs.length,'Duplicate calculator slug found');
for(const c of calcs){
  ok(Array.isArray(c)&&c.length===6,`Malformed calculator config for ${c?.[0]}`);
  ok(c[0]&&c[1]&&c[2],`Missing calculator identity fields for ${c?.[0]}`);
  ok(Array.isArray(c[4])&&c[4].length>0,`No fields for ${c?.[0]}`);
  ok(Array.isArray(c[5])&&c[5].length>0,`No results for ${c?.[0]}`);
}

const ads=read('assets/ads.js');
for(const helper of ['brand.js','home-fix.js','features.js','analytics.js'])ok(ads.includes(helper),`ads.js is not loading ${helper}`);
const analytics=read('assets/analytics.js');
ok(analytics.includes('/_vercel/insights/script.js'),'Vercel Analytics script is not wired');
const weather=read('weather.html');
ok(weather.indexOf('/assets/weather-fixed.js')<weather.indexOf('/assets/ads.js'),'weather-fixed.js must load before ads.js');
ok(weather.includes('/assets/site.js')&&weather.includes('/assets/ad-config.js'),'Weather page missing common site scripts');
const weatherFix=read('assets/weather-fixed.js');
ok(weatherFix.includes("fetch('/api/weather?station="),'Weather page is not using same-origin weather proxy');
ok(weatherFix.includes('stopImmediatePropagation'),'Weather fix is not blocking the old direct-browser request');
const weatherApi=read('api/weather.js');
ok(weatherApi.includes('aviationweather.gov/api/data'),'Weather proxy does not call Aviation Weather Center');
ok(weatherApi.includes("'User-Agent'"),'Weather proxy is missing custom User-Agent');
const sw=read('sw.js');
ok(sw.includes("startsWith('/api/')"),'Service worker must not cache live API responses');
ok(read('assets/brand.js').includes('<svg'),'Wireframe header logo is missing');
ok(read('assets/icon.svg').includes('stroke="#d8dbe0"'),'Wireframe app icon is missing');
ok(read('assets/home-fix.js').includes('weight-balance-builder'),'Homepage 48th calculator fix missing');

if(failures.length){
  console.error(`PilotDesk smoke check failed (${failures.length})`);
  failures.forEach(x=>console.error(' - '+x));
  process.exit(1);
}
console.log(`PilotDesk smoke check passed: ${calcs.length} standard calculators + Weight & Balance Builder = 48 tools.`);
console.log('Weather proxy, PWA files, analytics wiring, ad helpers, routing, and wireframe branding are present.');
