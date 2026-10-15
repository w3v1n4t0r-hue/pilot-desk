import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {chromium} from 'playwright';
const base=process.env.PILOTDESK_BASE_URL||'http://127.0.0.1:4173';
const browser=await chromium.launch({headless:true});
await fs.mkdir('qa-artifacts/competitive-copy',{recursive:true});
try {
 const desktop=await browser.newContext({viewport:{width:1440,height:900},serviceWorkers:'block'});
 const page=await desktop.newPage();
 const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base+'/',{waitUntil:'networkidle'});
 assert.equal(await page.locator('.pd-sc-flight').count(),1);
 assert.equal(await page.locator('#pdHomeDeparture').count(),1,'real route form preserved');
 assert.equal(await page.locator('#pdHomeWind').count(),1,'crosswind tool preserved');
 assert.equal(await page.evaluate(()=>window.ScrollCraft?.instances?.length),1,'Scrollcraft mounted');
 await page.locator('.pd-sc-flight').scrollIntoViewIfNeeded();
 await page.waitForTimeout(200);
 const chart=page.locator('.pd-sc-chart-image');
 assert(await chart.evaluate(el=>el.complete&&el.naturalWidth>0),'first-party chart overview loads');
 const frame=async fraction=>{
   await page.evaluate(f=>{
     const act=document.querySelector('.pd-sc-flight');
     window.scrollTo({top:act.getBoundingClientRect().top+scrollY+innerHeight*f,behavior:'instant'});
   },fraction);
   await page.waitForTimeout(180);
   return await page.evaluate(()=>({
     progress:parseFloat(document.querySelector('.pd-sc-flight').style.getPropertyValue('--sc-p')),
     transform:getComputedStyle(document.querySelector('.pd-sc-chart-image')).transform,
     chartTop:document.querySelector('.pd-sc-chart-image').getBoundingClientRect().top,
     overflow:document.documentElement.scrollWidth>innerWidth
   }));
 };
 const before=await frame(.2),after=await frame(.95);
 assert(Number.isFinite(before.progress)&&Number.isFinite(after.progress));
 assert(after.progress>before.progress+.2,'scroll advances the actual product preview');
 assert.notEqual(after.transform,before.transform,'chart layer moves with Scrollcraft');
 assert(Math.abs(after.chartTop-before.chartTop)>7,'chart parallax visible, not merely declared');
 assert(!after.overflow,'no horizontal overflow');
 await page.screenshot({path:'qa-artifacts/competitive-copy/scrollcraft-desktop.png'});
 assert.deepEqual(errors,[],'no JS page errors');
 await desktop.close();
 const mobile=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block',isMobile:true,hasTouch:true});
 const phone=await mobile.newPage();
 await phone.goto(base+'/',{waitUntil:'networkidle'});
 await phone.locator('.pd-sc-chart-image').scrollIntoViewIfNeeded();
 await phone.locator('.pd-sc-chart-image').evaluate(el=>el.decode());
 await phone.waitForTimeout(260);
 const m=await phone.evaluate(()=>({
   engine:window.ScrollCraft?.instances?.length||0,
   overflow:document.documentElement.scrollWidth>innerWidth,
   sticky:getComputedStyle(document.querySelector('.pd-sc-stage')).position,
   imageLoaded:document.querySelector('.pd-sc-chart-image').naturalWidth>0,
   fallback:getComputedStyle(document.querySelector('.pd-sc-chart-viewport')).backgroundImage.includes('sectional.webp'),
   usefulLinks:document.querySelectorAll('.pd-sc-workspace a[href^="/"]').length
 }));
 assert.equal(m.engine,0,'no scroll engine on phone');
 assert.equal(m.overflow,false,'no horizontal phone overflow');
 assert.notEqual(m.sticky,'sticky','no pinned stage on phone');
 assert(m.imageLoaded&&m.fallback,'mobile has decoded chart and painted fallback');
 assert(m.usefulLinks>=3,'real product actions available');
 await phone.screenshot({path:'qa-artifacts/competitive-copy/scrollcraft-mobile.png'});
 await mobile.close();
 const reduced=await browser.newContext({viewport:{width:1280,height:800},reducedMotion:'reduce',serviceWorkers:'block'});
 const quiet=await reduced.newPage();
 await quiet.goto(base+'/',{waitUntil:'networkidle'});
 assert.equal(await quiet.evaluate(()=>window.ScrollCraft?.instances?.length||0),0,'reduced motion honored');
 assert.notEqual(await quiet.locator('.pd-sc-stage').evaluate(el=>getComputedStyle(el).position),'sticky');
 await reduced.close();
 console.log('Product-led Scrollcraft browser QA passed: loaded first-party chart, real scroll movement, phone, reduced motion.');
} finally {await browser.close();}
