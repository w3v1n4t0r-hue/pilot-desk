import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)(process.env.PILOTDESK_PLAYWRIGHT||'playwright');
const base=process.env.PILOTDESK_BASE_URL||'http://127.0.0.1:4173';
const browser=await chromium.launch({headless:true,...(process.env.PILOTDESK_BROWSER_PATH?{executablePath:process.env.PILOTDESK_BROWSER_PATH}:{})});
await fs.mkdir('qa-artifacts/competitive-copy',{recursive:true});
try{
 const context=await browser.newContext({serviceWorkers:'block'});
 const page=await context.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(e.stack||e.message));
 for(const width of [320,390,768,1280,1920]){
  await page.setViewportSize({width,height:900});
  for(const path of ['/','/pricing.html','/written-prep.html','/learn/checkride-lab/','/route-planner.html','/about.html','/for-flight-schools.html','/for-cfis.html','/embed.html','/aircraft.html','/flights.html','/flight-training.html']){
   const response=await page.goto(base+path,{waitUntil:'networkidle'});
   assert.equal(response.status(),200,path);
   assert.equal(await page.locator('h1').count(),1,path+' has one heading');
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`${path} overflows at ${width}px`);
   if(path==='/'){
    await page.locator('.hp.is-ready').waitFor();
    assert.deepEqual(await page.locator('[data-slide] .hp-cta').evaluateAll(xs=>xs.map(x=>x.getAttribute('href'))),['/route-planner.html','/tools.html','/flight-training.html','/weather.html']);
    assert.equal(await page.locator('[data-hero-motion]').count(),0,'Approved homepage plays without a playback button');
    assert.match(await page.locator('#plans').textContent(),/\$5\/month/);
    assert.match(await page.locator('#plans').textContent(),/do not sync automatically/);
    if(width===390||width===1280){
     await page.screenshot({path:`qa-artifacts/competitive-copy/home-${width}.png`,fullPage:true});
    }
   }
   if(path==='/route-planner.html'){
    await page.waitForFunction(()=>document.querySelector('#rpEditorToggle').getAttribute('aria-expanded')!==null);
    if(await page.locator('#rpCanvasDrawer').isVisible())await page.locator('#rpEditorToggle').click();
    await page.locator('#rpCanvasDrawer').waitFor({state:'hidden'});
    await page.locator('#rpEditorToggle').click();
    await page.locator('#rpCanvasDrawer').waitFor({state:'visible'});
    await page.locator('#rpPowerSetting').fill('Cruise');
    assert.equal(await page.locator('#rpPowerSetting').inputValue(),'Cruise');
    await page.locator('#rpCanvasView').selectOption('navlog');
    await page.locator('#rpNavlogPanel').waitFor({state:'visible'});
    await page.evaluate(()=>location.hash='rpNavlogPanel');
    assert.equal(await page.evaluate(()=>location.hash),'#rpNavlogPanel');
   }
   if(path==='/flight-training.html'){
    await page.locator('.pd-learn-subnav').waitFor();
    assert(await page.locator('.pd-learn-subnav').evaluate(el=>el.getBoundingClientRect().top<document.querySelector('.pd-training-goals').getBoundingClientRect().top));
    assert(await page.locator('.pd-learn-subnav').evaluate(el=>[...el.children].every(a=>a.scrollWidth<=a.clientWidth+1)),'Study tab text fits its own control');
    assert(await page.locator('.pd-training-ratings .pd-hub-card').last().evaluate(el=>Math.abs(el.getBoundingClientRect().width-el.parentElement.getBoundingClientRect().width)<3),'Last rating fills the final row');
    assert(await page.locator('.pd-training-goals').evaluate(el=>el.getBoundingClientRect().top<document.querySelector('#pdTrainingProgress').getBoundingClientRect().top));
    if(width===390||width===1280)await page.screenshot({path:`qa-artifacts/competitive-copy/study-${width}.png`,fullPage:true});
   }
   if(path==='/about.html'){
    assert.equal(await page.getByRole('link',{name:'Open calculators',exact:true}).getAttribute('href'),'/tools.html');
   }
   if(path==='/for-flight-schools.html'){
    assert.match(await page.locator('main').textContent(),/Written Prep sessions need a free account/);
    assert.match(await page.locator('main').textContent(),/are not offered/);
   }
   if(path==='/pricing.html'){
    assert.equal(await page.locator('#pdStartPro').count(),1);
    await page.getByText('Do aircraft and flights sync automatically?',{exact:true}).click();
    assert.match(await page.locator('.pd-pricing-faq').textContent(),/stay in this browser/);
   }
   console.log(`PASS ${width}px ${path}`);
  }
 }
 // Exercise a real return visit without an account or synthetic progress score.
 await page.goto(base+'/flight-training.html');
 await page.locator('#pdTrainingGoalLocal').selectOption('cfi');
 await page.locator('#pdTrainingSaveLocal').click();
 await page.goto(base+'/flight-training.html');
 assert.equal(await page.locator('#pdTrainingGoalLocal').inputValue(),'cfi','Saved study goal survives a return visit');
 await page.goto(base+'/calculators/crosswind/');
 await page.getByRole('button',{name:'Pin tool',exact:false}).click();
 await page.reload();
 assert(await page.getByRole('button',{name:'Pinned',exact:false}).isVisible(),'Pinned tool survives a return visit');
 const other=await context.newPage();
 await other.goto(base+'/flight-training.html');
 await other.locator('#pdTrainingGoalLocal').selectOption('multi');
 await other.locator('#pdTrainingSaveLocal').click();
 await page.goto(base+'/flight-training.html');
 assert.equal(await page.locator('#pdTrainingGoalLocal').inputValue(),'multi','Study goal saved in another tab is restored');
 await other.close();
 console.log('PASS study goal, calculator pin, return visit, and cross-tab persistence');
 await page.setViewportSize({width:390,height:900});
 await page.goto(base+'/');
 await page.locator('[data-menu]').click();
 assert.equal(await page.locator('[data-menu]').getAttribute('aria-expanded'),'true');
 await page.keyboard.press('Escape');
 assert.equal(await page.locator('[data-menu]').getAttribute('aria-expanded'),'false');
 assert.deepEqual(errors,[],'No uncaught browser errors');
 await context.close();
}finally{await browser.close();}
