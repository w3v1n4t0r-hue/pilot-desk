import assert from 'node:assert/strict';import{createRequire}from'node:module';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PILOTDESK_PLAYWRIGHT||'playwright-core');
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'});
const url=process.env.HERO_URL||'http://127.0.0.1:4188/prototypes/home-hero/';
try{
 const p=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.addInitScript(()=>sessionStorage.setItem('pilotdesk.hero.motion','on'));await p.goto(url);await p.waitForSelector('.hp.is-ready');await p.locator('.hp').focus();await p.waitForTimeout(4500);
 assert.equal(await p.locator('.hp-track').evaluate(e=>getComputedStyle(e).transitionProperty),'transform');
 assert.equal(await p.locator('.hp-track').evaluate(e=>getComputedStyle(e).transitionDuration),'0.95s');
 console.log('PASS explicit motion opt-in preserves a real horizontal transition');
 for(let i=1;i<=4;i++){
  await p.locator('.hp').evaluate(e=>e.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true})));
  await p.waitForTimeout(120);
  const start=await p.locator('.hp').evaluate(e=>({transition:e.dataset.transitioning,state:e._heroSceneStats,settled:e.querySelectorAll('[data-slide]')[Number(e.dataset.heroIndex)].classList.contains('is-settled'),opening:e.querySelectorAll('[data-slide]')[Number(e.dataset.heroIndex)]._heroOpening?.currentTime}));
  assert.equal(start.transition,'true');assert.equal(start.settled,false);assert.equal(start.state.openingAge,0);assert.equal(start.state.sceneTime,0);
  assert.equal(await p.locator('[data-slide] .hp-cta').nth(i%4).isVisible(),false);
  await p.waitForTimeout(330);
  const overlap=await p.locator('.hp').evaluate(e=>{const viewport=e.querySelector('.hp-viewport').getBoundingClientRect();return[...e.querySelectorAll('.hp-track>.hp-slide')].map(s=>s.getBoundingClientRect()).filter(r=>r.right>viewport.left+20&&r.left<viewport.right-20).length});
  assert.equal(overlap,2);console.log('PASS both slides remain visible in physical transition',i);
  await p.waitForTimeout(700);
  assert.equal(await p.locator('.hp').getAttribute('data-transitioning'),'false');
  const opening=await p.locator('.hp').evaluate(e=>({time:e._heroSceneStats.sceneTime,age:e._heroSceneStats.openingAge,index:Number(e.dataset.heroIndex)}));
  assert.equal(opening.index,i%4);assert(opening.age<1.5);assert(opening.time<.8);
  await p.waitForTimeout(2200);
 }
 assert.equal(await p.locator('.hp').evaluate(e=>e.style.getPropertyValue('--hp-index')),'1');
 console.log('PASS all scene clocks restart, actions stay hidden during entry, and wrap normalizes without reverse travel');assert.deepEqual(errors,[]);
}finally{await browser.close()}
