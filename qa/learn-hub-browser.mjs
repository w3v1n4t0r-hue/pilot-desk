import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PILOTDESK_PLAYWRIGHT||'playwright');
const base=process.env.SITE_URL||'http://127.0.0.1:4190',out=process.env.LEARN_SHOTS||'../../outputs/learn-preview';fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.PILOTDESK_BROWSER_PATH||(process.platform==='win32'?'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe':undefined)});
try{
 for(const width of (process.env.LEARN_WIDTHS||'320,390,768,1440,1920').split(',').map(Number)){
  const context=await browser.newContext({viewport:{width,height:1000},reducedMotion:'no-preference'}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'/flight-training.html');await page.waitForSelector('.learn-stage.has-scene');await page.waitForTimeout(300);
  assert.equal(await page.locator('h1').count(),1);assert.equal(await page.locator('.pd-learn-subnav').count(),0);
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'overflow at '+width);
  const initial=Number(await page.locator('.learn-canvas-host').getAttribute('data-progress'));
  await page.screenshot({path:out+'/learn-'+width+'-start.png'});
  const hubHeight=await page.locator('[data-learn-hub]').evaluate(el=>el.getBoundingClientRect().height);assert(hubHeight<(width<=700?3000:2200),'compact Learn content height '+width+' '+hubHeight);console.log('LEARN CONTENT HEIGHT',width,hubHeight); // Shared header/footer typography varies by operating system.
  await page.evaluate(()=>window.scrollTo(0,450));await page.waitForTimeout(700);
  const middle=Number(await page.locator('.learn-canvas-host').getAttribute('data-progress'));
  if(width>700){const boxes=await page.locator('.learn-track').evaluateAll(es=>es.map(e=>e.getBoundingClientRect().top));assert(Math.abs(boxes[0]-boxes[1])<2,'practice choices should sit side by side')}
  assert(middle>=initial,'scene must progress with scroll '+width+' '+initial+' '+middle);
  await page.screenshot({path:out+'/learn-'+width+'-middle.png'});
  await page.locator('.learn-jump a[href="#ratings"]').click();await page.waitForTimeout(500);assert.equal(await page.evaluate(()=>document.activeElement.id),'ratings');
  assert.equal(await page.locator('.learn-rating').count(),7);await page.screenshot({path:out+'/learn-'+width+'-ratings.png'});
  await page.locator('#pdTrainingGoalLocal').selectOption('ira');await page.locator('#pdTrainingDateLocal').fill('2027-01-20');await page.getByRole('button',{name:'Save study goal',exact:true}).click();
  assert.equal(await page.locator('#pdTrainingNextTitle').textContent(),'Instrument Rating');assert.match(await page.locator('#pdTrainingWrittenLink').getAttribute('href'),/track=ira/);
  assert.match(await page.locator('#learn-goal-feedback').textContent(),/saved/);await page.reload();assert.equal(await page.locator('#pdTrainingGoalLocal').inputValue(),'ira');assert.equal(await page.locator('#pdTrainingDateLocal').inputValue(),'2027-01-20');
  assert.equal(await page.locator('.learn-rating[aria-current="true"] .learn-saved-rating').textContent(),'Your rating');
  assert.equal(await page.locator('#learn-continue').getAttribute('href'),'/training/instrument-rating.html');
  await page.evaluate(()=>localStorage.setItem('pd-written-track','cfi'));await page.reload();
  assert.equal(await page.locator('#learn-continue').getAttribute('href'),'/written-prep.html?track=cfi');
  assert.match(await page.locator('#learn-continue-context').textContent(),/CFI/);
  await page.evaluate(()=>{localStorage.removeItem('pd-written-track');localStorage.removeItem('pd-training-goal')});await page.reload();
  assert.equal(await page.locator('.learn-rating[aria-current]').count(),0);assert(await page.locator('#learn-return').isHidden());

  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'goal overflow '+width);await page.locator('.learn-reference summary').click();assert(await page.getByRole('link',{name:/FAA standards & rules/}).isVisible());assert.deepEqual(errors,[]);
  console.log('PASS',width,'layout, scroll scene, anchor focus, rating links, persistent study goal');await context.close();
 }
 const gpuOff=await browser.newContext({viewport:{width:390,height:900}});await gpuOff.addInitScript(()=>{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return /^webgl/.test(type)?null:original.call(this,type,...args)}});const fallback=await gpuOff.newPage();await fallback.goto(base+'/flight-training.html');await fallback.waitForSelector('[data-book-renderer="css"]',{timeout:10000});await fallback.waitForFunction(()=>Number(document.querySelector('.learn-canvas-host').dataset.pageTurns)>=1,null,{timeout:10000});assert(await fallback.getByRole('link',{name:/Start written practice/}).isVisible());await fallback.screenshot({path:out+'/learn-no-webgl.png'});await gpuOff.close();console.log('PASS automatic page turns without WebGL');
 for(const reduced of [true,false]){const ctx=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:reduced?'reduce':'no-preference',javaScriptEnabled:reduced});const p=await ctx.newPage();await p.goto(base+'/flight-training.html');if(reduced){await p.waitForSelector('.learn-stage.has-scene');assert.equal(await p.locator('.learn-canvas-host').getAttribute('data-progress'),'1.000');await p.locator('#oral').scrollIntoViewIfNeeded();await p.waitForTimeout(500);assert.equal(await p.locator('.learn-canvas-host').getAttribute('data-progress'),'1.000')}else{assert(await p.getByRole('link',{name:/Start written practice/}).isVisible());assert.equal(await p.locator('.learn-rating').count(),7);assert(await p.locator('.learn-scene-poster').evaluate(i=>i.complete&&i.naturalWidth>0));}await p.screenshot({path:out+'/learn-'+(reduced?'reduced':'no-js')+'.png'});console.log('PASS',reduced?'reduced motion':'no JavaScript');await ctx.close()}
 const ctx=await browser.newContext(),page=await ctx.newPage();await page.route('**/assets/learn-scenes/*.glb',r=>r.abort());await page.goto(base+'/flight-training.html');await page.waitForTimeout(1200);assert(await page.locator('.learn-scene-poster').evaluate(i=>i.complete&&i.naturalWidth>0));await page.waitForSelector('[data-book-renderer="css"]');await page.waitForFunction(()=>Number(document.querySelector('.learn-canvas-host').dataset.pageTurns)>=1,null,{timeout:10000});assert(await page.getByRole('link',{name:/Start written practice/}).isVisible());console.log('PASS failed model loading preserves automatic page turns and destinations');
 const links=await page.locator('[data-learn-hub] a[href^="/"]').evaluateAll(a=>[...new Set(a.map(x=>x.getAttribute('href')))]);for(const link of links){const response=await page.request.get(base+link);assert(response.ok(),link+' '+response.status())}console.log('PASS',links.length,'destination routes');await ctx.close();
}finally{await browser.close()}
