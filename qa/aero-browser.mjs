import { chromium } from 'playwright';
import assert from 'node:assert/strict';
const base=(process.env.PILOTDESK_BASE_URL||'http://127.0.0.1:4173').replace(/\/$/,'');
const browser=await chromium.launch({headless:true});
try {
 const context=await browser.newContext();const page=await context.newPage();const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 const response=await page.goto(base+'/aerodynamic-lab.html');assert.ok(response.ok());
 const lift=page.locator('[data-aero="lift"]');await assert.doesNotReject(()=>lift.waitFor());
 await page.waitForFunction(()=>document.querySelector('[data-aero="lift"]').textContent.includes('14,700'));
 const initialDrag=await page.locator('[data-aero="drag"]').innerText();assert.ok(initialDrag.includes('1,174'));
 await page.locator('[name="speed"]').fill('100');assert.ok((await lift.innerText()).includes('58,800'));
 for(const [name,value] of [['speed',''],['speed','0'],['speed','-1'],['efficiency','1.1'],['density','-1']]){
  await page.getByRole('button',{name:'Reset inputs',exact:true}).click();await page.waitForFunction(()=>document.querySelector('[name="speed"]').value==='50');
  await page.locator(`[name="${name}"]`).fill(value);assert.equal(await lift.innerText(),'—');assert.ok(await page.locator('#aero-error').innerText());
 }
 await page.getByRole('button',{name:'Reset inputs',exact:true}).click();await page.waitForFunction(()=>document.querySelector('[data-aero="lift"]').textContent.includes('14,700'));
 await page.locator('[name="cl"]').fill('-.6');assert.ok((await lift.innerText()).includes('-14,700'));
 assert.ok((await page.locator('#aero-lift').getAttribute('style')).includes('-1.3'));
 await page.getByRole('button',{name:'Reset inputs',exact:true}).click();
 await page.getByRole('button',{name:'Pause airflow',exact:true}).click();assert.equal(await page.locator('#aero-pause').getAttribute('aria-pressed'),'true');
 assert.equal(await page.locator('.aero-flow').evaluate(el=>getComputedStyle(el).animationPlayState),'paused');
 await page.getByRole('button',{name:'Play airflow',exact:true}).click();
 await page.emulateMedia({reducedMotion:'reduce'});assert.equal(await page.locator('.aero-flow').evaluate(el=>getComputedStyle(el).animationName),'none');
 for(const width of [320,360,375,390,414,430,768,1440]){await page.setViewportSize({width,height:900});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'overflow at '+width);}
 assert.ok(await page.getByText('ILLUSTRATIVE AIRFLOW • NOT CFD',{exact:true}).isVisible());
 for(const route of ['load-factor','accelerated-stall']){
  await page.goto(base+'/calculators/'+route+'/');await page.locator('.pd-bank-visual').waitFor();await page.locator('#bank').fill('60');assert.ok((await page.locator('[data-bank-caption]').innerText()).includes('2.00 G'));
  await page.locator('#bank').fill('90');assert.ok((await page.locator('[data-bank-caption]').innerText()).includes('less than 90'));
 }
 assert.deepEqual(errors,[]);console.log('Aerodynamic UI: input responses, invalid values, reset, negative lift, pause, reduced motion, eight widths, bank diagrams and console passed.');
} finally {await browser.close();}
