import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { chromium } from 'playwright';
const base = process.env.PILOTDESK_BASE_URL || 'http://127.0.0.1:4173';
const browser = await chromium.launch({headless:true});
await fs.mkdir('qa-artifacts/competitive-copy', {recursive:true});
try {
  const desktop = await browser.newContext({viewport:{width:1440,height:900},serviceWorkers:'block'});
  const page = await desktop.newPage();
  let errors = [];
  page.on('pageerror',error => errors.push(error.message));
  await page.goto(base+'/', {waitUntil:'networkidle'});
  assert.equal(await page.locator('.pd-sc-flight').count(),1,'flight sequence visible');
  assert.equal(await page.locator('#pdHomeDeparture').count(),1,'real route entry preserved');
  assert.equal(await page.locator('#pdHomeWind').count(),1,'working wind control preserved');
  assert.equal(await page.evaluate(() => window.ScrollCraft?.instances?.length),1,'Scrollcraft mounted');
  const progressAt = async fraction => {
    await page.evaluate((fraction)=>{
      const act=document.querySelector('.pd-sc-flight');
      window.scrollTo({top:act.getBoundingClientRect().top+window.scrollY+innerHeight*fraction,behavior:'instant'});
    },fraction);
    await page.waitForTimeout(150);
    return page.evaluate(() => ({
      p:Number.parseFloat(document.querySelector('.pd-sc-flight').style.getPropertyValue('--sc-p')),
      plane:document.querySelector('.pd-sc-plane').getBoundingClientRect().left,
      stage:document.querySelector('.pd-sc-stage').getBoundingClientRect().top,
      viewport:window.innerHeight,
      overflow:document.documentElement.scrollWidth>innerWidth
    }));
  };
  const before = await progressAt(.2);
  const after = await progressAt(1.05);
  assert(Number.isFinite(before.p) && Number.isFinite(after.p));
  assert(after.p > before.p+.3,'scroll progress increases');
  assert(after.plane>before.plane+120,'airplane moves on scroll, not only in markup');
  assert.equal(after.overflow,false,'no desktop overflow');
  await page.screenshot({path:'qa-artifacts/competitive-copy/scrollcraft-desktop.png',fullPage:false});
  assert.deepEqual(errors,[],'no JavaScript page errors');
  await desktop.close();

  const mobile = await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block',isMobile:true,hasTouch:true});
  const phone = await mobile.newPage();
  await phone.goto(base+'/',{waitUntil:'networkidle'});
  assert.equal(await phone.locator('.pd-sc-flight').count(),1);
  const metrics=await phone.evaluate(()=>({
    engine:window.ScrollCraft?.instances?.length||0,
    overflow:document.documentElement.scrollWidth>innerWidth,
    sticky:getComputedStyle(document.querySelector('.pd-sc-stage')).position,
    cards:document.querySelectorAll('.pd-sc-workflows a').length,
  }));
  assert.equal(metrics.engine,0,'do not mount the scroll engine on phone');
  assert.equal(metrics.overflow,false,'no phone horizontal overflow');
  assert.notEqual(metrics.sticky,'sticky','no long phone pin');
  assert.equal(metrics.cards,3,'three real action links remain usable');
  await phone.locator('.pd-sc-flight').scrollIntoViewIfNeeded();
  await phone.screenshot({path:'qa-artifacts/competitive-copy/scrollcraft-mobile.png'});
  await mobile.close();

  const reduced = await browser.newContext({viewport:{width:1280,height:800},reducedMotion:'reduce',serviceWorkers:'block'});
  const quiet=await reduced.newPage();
  await quiet.goto(base+'/',{waitUntil:'networkidle'});
  assert.equal(await quiet.evaluate(()=>window.ScrollCraft?.instances?.length||0),0,'honor reduced motion');
  assert.notEqual(await quiet.locator('.pd-sc-stage').evaluate(x=>getComputedStyle(x).position),'sticky','reduced motion is readable');
  await reduced.close();
  console.log('Scrollcraft browser verification passed: actual motion, desktop/phone layout, and reduced motion.');
} finally { await browser.close(); }
