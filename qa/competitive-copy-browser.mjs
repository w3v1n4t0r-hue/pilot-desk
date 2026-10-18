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
 for(const width of (process.env.PILOTDESK_TEST_WIDTHS||'320,390,768,1280,1920').split(',').map(Number)){
  await page.setViewportSize({width,height:900});
  for(const path of ['/','/pricing.html','/written-prep.html','/learn/checkride-lab/','/route-planner.html','/about.html','/for-flight-schools.html','/for-cfis.html','/embed.html','/aircraft.html','/flights.html','/flight-training.html']){
   const response=await page.goto(base+path,{waitUntil:'networkidle'});
   assert.equal(response.status(),200,path);
   assert.equal(await page.locator('h1').count(),1,path+' has one heading');
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`${path} overflows at ${width}px`);
   if(path==='/'){
    assert.equal(await page.locator('[data-slide]').count(),4);
    const destinations=await page.locator('[data-slide] .hp-cta').evaluateAll(as=>as.map(a=>a.getAttribute('href')));
    assert.deepEqual(destinations,['/route-planner.html','/tools.html','/flight-training.html','/weather.html']);
    await page.locator('[data-slide].is-active').waitFor();
    if(width===390){const first=await page.locator('[data-hero-prototype]').getAttribute('data-hero-index');await page.waitForFunction(first=>document.querySelector('[data-hero-prototype]').dataset.heroIndex!==first,first,{timeout:10000})}
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
    assert.equal(await page.locator('.pd-learn-subnav').count(),0);
    assert.equal(await page.locator('.learn-rating').count(),7);
    assert.equal(await page.locator('.learn-track').count(),2);
    await page.locator('.learn-jump a[href="#ratings"]').click();
    assert.equal(await page.evaluate(()=>document.activeElement.id),'ratings');
    assert(await page.locator('.learn-rating').evaluateAll(as=>as.every(a=>a.scrollWidth<=a.clientWidth+1)),'rating text fits');
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
 // Exercise a rating-guide return without a prior written-prep preference.
 await page.goto(base+'/flight-training.html');
 await page.evaluate(()=>localStorage.removeItem('pd-written-track'));
 await page.locator('#pdTrainingGoalLocal').selectOption('cfi');
 await page.locator('#pdTrainingSaveLocal').click();
 await page.goto(base+'/flight-training.html');
 await page.locator('#learn-return:not([hidden])').waitFor();
 assert.equal(await page.locator('#learn-continue').getAttribute('href'),'/training/cfi.html');
 assert.equal(await page.locator('.learn-rating[aria-current="true"] h3').textContent(),'CFI Your rating');
 await page.goto(base+'/calculators/crosswind/');
 await page.getByRole('button',{name:'Pin tool',exact:false}).click();
 await page.reload();
 await page.getByRole('button',{name:'Pinned',exact:false}).waitFor();
 assert.equal(await page.getByRole('button',{name:'Pinned',exact:false}).getAttribute('aria-pressed'),'true');
 const other=await context.newPage();
 await other.goto(base+'/flight-training.html');
 await other.locator('#pdTrainingGoalLocal').selectOption('multi');
 await other.locator('#pdTrainingSaveLocal').click();
 await page.goto(base+'/flight-training.html');
 assert.equal(await page.locator('#learn-continue').getAttribute('href'),'/training/multiengine.html');
 assert.equal(await page.locator('#pdTrainingGoalLocal').inputValue(),'multi');
 await other.close();
 console.log('PASS study goal, calculator pin, return visit, and shared storage');
 await page.setViewportSize({width:390,height:900});
 await page.goto(base+'/');
 await page.locator('[data-menu]').click();
 assert.equal(await page.locator('[data-menu]').getAttribute('aria-expanded'),'true');
 await page.keyboard.press('Escape');
 assert.equal(await page.locator('[data-menu]').getAttribute('aria-expanded'),'false');
 assert.deepEqual(errors,[],'No uncaught browser errors');
 await context.close();
}finally{await browser.close();}
