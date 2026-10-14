import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {chromium} from 'playwright';
const base=process.env.PILOTDESK_BASE_URL||'http://127.0.0.1:4173';
const browser=await chromium.launch({headless:true});
await fs.mkdir('qa-artifacts/competitive-copy',{recursive:true});
try{
 const context=await browser.newContext({serviceWorkers:'block'});
 const page=await context.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 for(const width of [320,390,768,1280,1920]){
  await page.setViewportSize({width,height:900});
  for(const path of ['/','/pricing.html','/written-prep.html','/learn/checkride-lab/','/route-planner.html']){
   const response=await page.goto(base+path,{waitUntil:'networkidle'});
   assert.equal(response.status(),200,path);
   assert.equal(await page.locator('h1').count(),1,path+' has one heading');
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`${path} overflows at ${width}px`);
   if(path==='/'){
    await page.locator('#pdHomeWind').fill('30');
    assert.equal(await page.locator('#pdHomeCross').textContent(),'15.0 kt');
    assert.equal(await page.locator('#pdHomeHead').textContent(),'26.0 kt');
    assert.match(await page.locator('#pdHomeWindLink').getAttribute('href'),/windSpeed=30/);
    assert.match(await page.locator('#plans').textContent(),/\$5\/month/);
    assert.match(await page.locator('#plans').textContent(),/do not sync automatically/);
    await page.locator('#pdHomeDeparture').fill('KGFK');
    await page.locator('#pdHomeDestination').fill('KFAR');
    assert.equal(await page.locator('.pd-home-route-form').evaluate(form=>form.checkValidity()),true);
    if(width===390||width===1280){
     await page.screenshot({path:`qa-artifacts/competitive-copy/home-${width}.png`,fullPage:true});
    }
   }
   if(path==='/route-planner.html'){
    await page.waitForFunction(()=>document.querySelector('#rpEditorToggle').getAttribute('aria-expanded')!==null);
    if(await page.locator('#rpRouteEditor').isVisible())await page.locator('#rpEditorToggle').click();
    await page.locator('#rpRouteEditor').waitFor({state:'hidden'});
    await page.locator('a[href="#rpRouteEditor"]').click();
    await page.locator('#rpRouteEditor').waitFor({state:'visible'});
    await page.locator('a[href="#rpPlanningValues"]').click();
    assert.equal(await page.locator('#rpPlanningValues').evaluate(el=>el.closest('details').open),true);
    await page.locator('a[href="#rpNavlogPanel"]').click();
    assert.equal(await page.evaluate(()=>location.hash),'#rpNavlogPanel');
   }
   if(path==='/pricing.html'){
    assert.equal(await page.locator('#pdStartPro').count(),1);
    await page.getByText('Do aircraft and flights sync automatically?',{exact:true}).click();
    assert.match(await page.locator('.pd-pricing-faq').textContent(),/stay in this browser/);
   }
   console.log(`PASS ${width}px ${path}`);
  }
 }
 await page.setViewportSize({width:390,height:900});
 await page.goto(base+'/');
 await page.locator('[data-menu]').click();
 assert.equal(await page.locator('[data-menu]').getAttribute('aria-expanded'),'true');
 await page.keyboard.press('Escape');
 assert.equal(await page.locator('[data-menu]').getAttribute('aria-expanded'),'false');
 assert.deepEqual(errors,[],'No uncaught browser errors');
 await context.close();
}finally{await browser.close();}
