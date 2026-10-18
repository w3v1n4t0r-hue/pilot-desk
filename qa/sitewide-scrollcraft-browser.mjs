import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PILOTDESK_PLAYWRIGHT||'playwright-core');
const base=process.env.SITE_URL||'http://127.0.0.1:4189';
const out=process.env.SITE_SHOTS||'../../outputs/sitewide-scrollcraft';fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'});
const routes=['/calculators/crosswind/','/calculators/density-altitude/','/calculators/fuel-required/','/weight-balance.html','/tools.html','/weather.html','/route-planner.html','/flight-training.html','/pricing.html','/about.html','/guides/crosswind-component.html','/account.html'];
try{
 const results=[];
 for(const width of[390,1440]){
  const page=await browser.newPage({viewport:{width,height:1000},reducedMotion:'no-preference'});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  for(const route of routes){
   const response=await page.goto(base+route,{waitUntil:'domcontentloaded'});assert.equal(response.status(),200,route);await page.waitForSelector('[data-pd-cinematic][data-pd-cinema-mounted]');
   const hero=page.locator('[data-pd-cinematic]');assert.equal(await hero.count(),1,route);assert.equal(await page.locator('h1').count(),1,route+' must retain one original heading');await page.waitForTimeout(180);
   const start=await hero.evaluate(e=>({progress:e.style.getPropertyValue('--sc-p'),width:document.documentElement.scrollWidth,viewport:innerWidth,art:getComputedStyle(e.querySelector('.pd-sc-art')).transform}));assert(start.width<=start.viewport+1,route+' overflows at '+width+' '+JSON.stringify(start));
   const name=route.replace(/^\//,'').replace(/\/$/,'').replaceAll('/','-').replace('.html','');
   await page.screenshot({path:path.join(out,name+'-'+width+'-open.png')});
   await page.evaluate(()=>scrollTo({top:innerHeight*.55,behavior:'instant'}));await page.waitForTimeout(140);
   const middle=await hero.evaluate(e=>({progress:e.style.getPropertyValue('--sc-p'),art:getComputedStyle(e.querySelector('.pd-sc-art')).transform}));assert.notEqual(start.progress,middle.progress,route+' progress must follow scroll');assert.notEqual(start.art,middle.art,route+' visual planes must move');
   await page.screenshot({path:path.join(out,name+'-'+width+'-middle.png')});
   await page.locator('.pd-sc-enter').click();await page.waitForTimeout(250);assert.equal(await page.evaluate(()=>document.activeElement.id),'pdWorkSurface',route+' direct workspace handoff');
   await page.screenshot({path:path.join(out,name+'-'+width+'-work.png')});
   results.push({route,width,family:await hero.getAttribute('data-pd-cinematic'),start:start.progress,middle:middle.progress});console.log('PASS cinematic opening, scroll depth and workspace handoff',route,width);
  }
  fs.writeFileSync(path.join(out,'browser-errors-'+width+'.json'),JSON.stringify(errors,null,2));assert.deepEqual(errors,[],'Representative pages must have no runtime errors');await page.close();
 }
 const staticPage=await browser.newPage({javaScriptEnabled:false,viewport:{width:390,height:1000}});await staticPage.goto(base+'/calculators/crosswind/');assert(await staticPage.locator('h1').isVisible());assert(await staticPage.locator('.pd-sc-enter').isVisible());await staticPage.close();
 fs.writeFileSync(path.join(out,'browser-results.json'),JSON.stringify(results,null,2));
}finally{await browser.close()}
