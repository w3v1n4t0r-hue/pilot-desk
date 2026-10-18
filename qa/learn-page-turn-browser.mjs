import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)(process.env.PILOTDESK_PLAYWRIGHT||'playwright');
const base=process.env.SITE_URL||'http://127.0.0.1:4190',out=process.env.LEARN_SHOTS||'../../outputs/learn-preview';fs.mkdirSync(out,{recursive:true});
const b=await chromium.launch({executablePath:process.env.PILOTDESK_BROWSER_PATH||(process.platform==='win32'?'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe':undefined)});
try{
 for(const width of [390,1440]){
  const p=await b.newPage({viewport:{width,height:1000},reducedMotion:'reduce'}),errors=[],requests=[];
  p.on('request',r=>requests.push(r.url()));p.on('pageerror',e=>errors.push(e.message));
  const now=Date.now();await p.clock.install({time:now});await p.clock.pauseAt(new Date(now+1000));
  await p.goto(base+'/flight-training.html');await p.waitForSelector('.learn-stage.has-scene');
  const host=p.locator('.learn-canvas-host'),read=()=>host.evaluate(e=>({...e.dataset}));
  assert.equal(await host.getAttribute('data-texture-size'),'1536x2048');assert(Number(await host.getAttribute('data-render-scale'))>=1.5);
  assert.equal(await host.getAttribute('data-left-topic'),'Weather');assert.equal(await host.getAttribute('data-right-topic'),'Medical factors');
  await p.screenshot({path:out+'/page-topics-'+width+'.png'});
  if(width===1440){const r=await p.locator('.learn-stage').boundingBox();await p.screenshot({path:out+'/book-clean-poster.png',clip:{x:r.x,y:r.y+35,width:r.width,height:r.height-35}})}
  // Freeze the middle of the first turn; screenshot/render speed cannot finish it.
  await p.clock.runFor(1600);const interrupted=await read();assert(Number(interrupted.pageTurn)>.02,'the already-open book must begin turning promptly');assert(Number(interrupted.pageTurn)<1);
  await p.screenshot({path:out+'/page-turn-'+width+'.png'});
  await p.locator('.learn-reference').evaluate(e=>e.scrollIntoView({behavior:'instant'}));await p.waitForTimeout(100);
  const paused=await read();assert.equal(paused.pageTurn,interrupted.pageTurn,'offscreen interruption must preserve the exact page-turn position');
  await p.clock.runFor(7000);assert.equal((await read()).pageTurn,paused.pageTurn,'offscreen page stays frozen');assert.equal((await read()).pageTurns,paused.pageTurns);
  await p.locator('.learn-stage').evaluate(e=>e.scrollIntoView({behavior:'instant'}));await p.waitForTimeout(100);await p.clock.runFor(2200);
  const completed=await read();assert.equal(Number(completed.pageTurns),1);assert.equal(completed.leftTopic,'Aerodynamics');assert.equal(completed.rightTopic,'Navigation');
  await p.clock.runFor(7000);assert.equal(Number((await read()).pageTurns),2,'autoplay continues and wraps');assert.equal((await read()).leftTopic,'Weather');
  assert(!requests.some(url=>url.includes('lesson-cards')),'floating card model must not load');assert.deepEqual(errors,[]);
  console.log('PASS',width,'prompt startup, exact offscreen pause/resume, completion and wraparound');await p.close();
 }
}finally{await b.close()}
