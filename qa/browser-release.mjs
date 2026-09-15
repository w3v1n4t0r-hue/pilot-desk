import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import fs from 'node:fs';
const {chromium}=await import(pathToFileURL(process.env.PD_PLAYWRIGHT_MODULE).href);
const browser=await chromium.launch({headless:true});
const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
const base=process.env.PD_TEST_URL||'http://127.0.0.1:4173';fs.mkdirSync('qa-output',{recursive:true});
try{
 for(const width of [320,360,390,430,768,1280]){
  await page.setViewportSize({width,height:900});
  for(const route of ['/','/account.html','/learn/oral-exam/','/learn/oral-exam/private.html','/learn/oral-exam/instrument.html']){
   const response=await page.goto(base+route);assert.equal(response.status(),200,route);
   await page.locator('h1').waitFor();await page.waitForTimeout(600);
   const size=await page.evaluate(()=>({page:document.documentElement.scrollWidth,view:innerWidth,overflow:[...document.querySelectorAll('body *')].map(el=>({tag:el.tagName,class:el.className,left:el.getBoundingClientRect().left,right:el.getBoundingClientRect().right,width:el.getBoundingClientRect().width})).filter(el=>el.right>innerWidth+1||el.left< -1)}));
   if(size.page>size.view+1){console.error(JSON.stringify(size));await page.screenshot({path:`qa-output/overflow-${width}.png`,fullPage:true});}
   assert.ok(size.page<=size.view+1,`${route} overflows at ${width}: ${size.page}`);
   if(route==='/')assert.equal(await page.locator('#pdHomeTitle span').count(),0,'Headline must use normal word wrapping');
   if(width===390||width===1280)await page.screenshot({path:`qa-output/${width}-${route.replace(/[^a-z]/g,'')||'home'}.png`});
  }
 }
 await page.goto(base+'/account.html');await page.waitForFunction(()=>!document.querySelector('#pdAccountRoot').classList.contains('pd-account-disabled'));
 assert.equal(await page.locator('#pdAuthEmail').count(),1);
 await page.locator('[data-auth-mode=signup]').click();assert.equal(await page.locator('#pdAuthConfirm').isVisible(),true);
 await page.locator('[data-auth-mode=recover]').click();assert.equal(await page.locator('#pdAuthPassword').isVisible(),false);assert.equal(await page.locator('#pdAuthSubmit').innerText(),'Send reset link');
 await page.locator('[data-auth-mode=login]').click();assert.equal(await page.locator('#pdAuthConfirm').isVisible(),false);
 await page.goto(base+'/learn/oral-exam/private.html');await page.locator('#inoperative summary').first().click();assert.equal(await page.locator('#inoperative details').first().getAttribute('open'),'');
 await page.locator('#inoperative [data-mark=understood]').click();await page.reload();assert.equal(await page.locator('#inoperative [data-mark=understood]').getAttribute('aria-pressed'),'true');
 await page.locator('#oralSearch').fill('landing light');assert.equal(await page.locator('.oral-topic:visible').count(),1);
 await page.locator('#oralSearch').fill('no-such-question');assert.equal(await page.locator('#oralEmpty').isVisible(),true);
 await page.locator('#oralSearch').fill('');await page.locator('#oralFilter').selectOption('understood');assert.equal(await page.locator('.oral-topic:visible').count(),1);
 assert.deepEqual(errors,[],'Uncaught browser exceptions');
 console.log('Browser release PASS: six viewport widths, five routes, account modes, study reveal/search/filter/persistence, zero uncaught exceptions. No signup emails or password changes sent.');
}finally{await browser.close()}
