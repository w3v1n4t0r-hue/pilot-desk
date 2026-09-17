import fs from 'node:fs';
import vm from 'node:vm';
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';

const base=(process.env.PILOTDESK_BASE_URL||'http://127.0.0.1:4321').replace(/\/$/,'');
const browser=await chromium.launch({
  headless:true,
  ...(process.env.PILOTDESK_BROWSER_CHANNEL?{channel:process.env.PILOTDESK_BROWSER_CHANNEL}:{})
});
const failures=[];
const results=[];
const check=async(name,fn)=>{
  try{await fn();results.push(`PASS ${name}`)}
  catch(error){const message=error instanceof Error?error.message:String(error);failures.push(`${name}: ${message}`);results.push(`FAIL ${name}: ${message}`)}
};

function calculatorInventory(){
  const context={window:{}};
  vm.runInNewContext(fs.readFileSync('assets/calculator-config.js','utf8'),context);
  const rows=context.window.PD_CALCS;
  if(!Array.isArray(rows)||rows.length!==47)throw new Error(`Expected 47 standard calculators, found ${rows?.length??0}`);
  return rows.map(([slug,key,title,_description,fields])=>({slug,key,title,fields}));
}

function monitor(page){
  const errors=[];
  page.on('pageerror',error=>errors.push(`pageerror: ${error.message}`));
  page.on('console',message=>{if(message.type()==='error'&&!message.text().startsWith('Failed to load resource:'))errors.push(`console: ${message.text()}`)});
  page.on('response',response=>{const url=new URL(response.url());if(url.origin===base&&response.status()>=400&&!url.pathname.startsWith('/_vercel/'))errors.push(`HTTP ${response.status()}: ${response.url()}`)});
  page.on('requestfailed',request=>{const url=new URL(request.url());if(url.origin===base&&!url.pathname.startsWith('/_vercel/'))errors.push(`request failed: ${request.url()} (${request.failure()?.errorText||'unknown error'})`)});
  return errors;
}

async function goto(page,path){
  const response=await page.goto(base+path,{waitUntil:'domcontentloaded',timeout:30000});
  if(!response?.ok())throw new Error(`${path} returned HTTP ${response?.status()??'no response'}`);
}

function assert(condition,message){if(!condition)throw new Error(message)}

await check('all 47 calculator interfaces calculate, validate, reset, and fit mobile',async()=>{
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true});
  const page=await context.newPage();
  page.setDefaultTimeout(10000);
  const browserErrors=monitor(page);
  for(const calculator of calculatorInventory()){
    browserErrors.length=0;
    const path=`/calculators/${calculator.slug}/`;
    await goto(page,path);
    await page.locator('[data-pd-reset]').waitFor({state:'visible'});
    const expectedIds=calculator.fields.map(([id])=>id);
    const actualInputs=await page.locator('[data-calc-input]').evaluateAll(inputs=>inputs.map(input=>({id:input.id,optional:input.hasAttribute('data-calc-optional')})));
    assert(expectedIds.every(id=>actualInputs.some(input=>input.id===id)),`${calculator.slug}: an inventory input is missing from the rendered calculator`);
    assert(actualInputs.filter(input=>!expectedIds.includes(input.id)).every(input=>input.optional),`${calculator.slug}: an undeclared required input was injected at runtime`);
    const labelled=await page.locator('[data-calc-input]').evaluateAll(inputs=>inputs.every(input=>Boolean(input.id&&document.querySelector(`label[for="${CSS.escape(input.id)}"]`))));
    assert(labelled,`${calculator.slug}: an input is missing its visible label`);
    assert(await page.locator('[data-calc-input][inputmode="decimal"]').count()===actualInputs.length,`${calculator.slug}: mobile decimal keyboards are not requested for every input`);
    await page.locator('[data-calculate]').click();
    const output=await page.locator('.result strong').allTextContents();
    assert(output.length>0,`${calculator.slug}: result cards are missing`);
    assert(output.every(value=>value.trim()&&value.trim()!=='—'),`${calculator.slug}: default calculation did not populate every result`);
    assert(output.every(value=>!/(?:NaN|Infinity|undefined|null)/i.test(value)),`${calculator.slug}: default calculation produced a non-finite result`);
    const first=page.locator('[data-calc-input]').first();
    const original=await first.inputValue();
    await first.fill('');
    await page.locator('[data-calculate]').click();
    assert(await page.locator('#safetyWarning.show').isVisible(),`${calculator.slug}: empty input did not expose an accessible validation message`);
    assert((await page.locator('#safetyWarning').innerText()).includes('required'),`${calculator.slug}: empty-input guidance is not actionable`);
    await first.fill(original);
    await first.press('Enter');
    await page.waitForFunction(()=>[...document.querySelectorAll('.result strong')].every(node=>node.textContent?.trim()&&node.textContent.trim()!=='—'));
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+1);
    assert(!overflow,`${calculator.slug}: page overflows horizontally at 390px`);
    assert(browserErrors.length===0,`${calculator.slug}: ${browserErrors.join(' | ')}`);
  }
  await context.close();
});

await check('calculator URL state and reset behavior are stable',async()=>{
  const page=await browser.newPage({viewport:{width:1280,height:800}});
  await goto(page,'/calculators/crosswind/?runway=350&windDir=320&windSpeed=18');
  await page.locator('[data-pd-reset]').waitFor({state:'visible'});
  assert(await page.locator('#runway').inputValue()==='350','query-string runway value was not restored');
  await page.waitForFunction(()=>document.querySelector('#out0')?.textContent?.includes('kt'));
  assert((await page.locator('#out0').innerText()).includes('kt'),'query-string calculation did not run automatically');
  await page.locator('#windSpeed').fill('22.5');
  await page.locator('#windSpeed').press('Enter');
  await page.waitForFunction(()=>new URL(location.href).searchParams.get('windSpeed')==='22.5');
  assert(new URL(page.url()).searchParams.get('windSpeed')==='22.5','changed input was not reflected in the shareable URL');
  await page.reload({waitUntil:'domcontentloaded'});
  await page.locator('[data-pd-reset]').waitFor({state:'visible'});
  assert(await page.locator('#windSpeed').inputValue()==='22.5','URL state did not survive refresh');
  await page.locator('[data-pd-reset]').click();
  assert(new URL(page.url()).search==='', 'reset did not clear calculator URL state');
  assert(await page.locator('#windSpeed').inputValue()==='20','reset did not restore the generated default');
  assert((await page.locator('#out0').innerText()).trim()==='—','reset did not clear the prior result');
  await page.close();
});

await check('major product surfaces expose a usable first action without overflow',async()=>{
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true});
  const page=await context.newPage();
  const cases=[
    ['/', '[data-menu]'],
    ['/tools.html','#pdToolDirectorySearch'],
    ['/weather.html','#station'],
    ['/airport.html','#airportQuery'],
    ['/route-planner.html','#rpRoute'],
    ['/weight-balance.html','#wbScenarioName'],
    ['/flight-planning-workspace.html','#pdWorkspace'],
    ['/checklist-trainer.html','#ctAircraft'],
    ['/written-prep.html','#pdStudySample'],
    ['/daily/','main']
  ];
  for(const [path,selector] of cases){
    await goto(page,path);
    const target=page.locator(selector).first();
    await target.waitFor({state:'visible'});
    const box=await target.evaluate(element=>{const r=element.getBoundingClientRect();return{top:r.top,bottom:r.bottom}});
    assert(box.top<844,`${path}: first useful action begins below the mobile viewport`);
    assert(!await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+1),`${path}: horizontal overflow at 390px`);
  }
  await context.close();
});

await check('homepage search and mobile navigation work from the keyboard',async()=>{
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true});
  const page=await context.newPage();
  await goto(page,'/');
  await page.locator('[data-menu]').focus();
  await page.keyboard.press('Enter');
  assert(await page.locator('header.topbar nav.open').isVisible(),'mobile navigation did not open from the keyboard');
  await page.keyboard.press('Escape');
  assert(!await page.locator('header.topbar nav.open').isVisible(),'Escape did not close mobile navigation');
  const search=page.locator('.pd-site-search input');
  await search.fill('density altitude');
  await search.press('Enter');
  await page.waitForURL('**/calculators/density-altitude/');
  assert(new URL(page.url()).pathname==='/calculators/density-altitude/','keyboard search did not open Density Altitude');
  await page.close();
  await context.close();
});

await check('representative page families have no serious accessibility violations',async()=>{
  const context=await browser.newContext({viewport:{width:1280,height:800},reducedMotion:'reduce'});
  const page=await context.newPage();
  const paths=['/','/tools.html','/calculators/density-altitude/','/weather.html','/route-planner.html','/weight-balance.html','/account.html','/written-prep.html','/daily/'];
  const issues=[];
  for(const path of paths){
    await goto(page,path);
    await page.waitForTimeout(800);
    const report=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze();
    for(const violation of report.violations.filter(item=>['serious','critical'].includes(item.impact||''))){
      const targets=violation.nodes.slice(0,4).map(node=>node.target.join(' ')).join(', ');
      const reason=violation.nodes[0]?.failureSummary?.replace(/\s+/g,' ').trim()||violation.help;
      issues.push(`${path} ${violation.id}: ${violation.nodes.length} node(s) [${targets}] — ${reason}`);
    }
  }
  assert(issues.length===0,issues.join(' | '));
  await context.close();
});

await check('3D Flight Lab loads on demand and preserves calculator boundaries',async()=>{
  const {fixture}=await import('./flight-lab-fixture.mjs');
  const context=await browser.newContext({viewport:{width:1280,height:900},reducedMotion:'no-preference'});
  const page=await context.newPage(),errors=monitor(page);
  for(const slug of ['crosswind','wind-triangle','density-altitude']){
    await goto(page,`/calculators/${slug}/`);
    await page.locator('.pd-flight-lab').waitFor();
    assert(!await page.locator('canvas').isVisible(),'3D lab should start collapsed');
    assert(!await page.evaluate(()=>performance.getEntriesByType('resource').some(r=>r.name.endsWith('trainer.pdm'))),'large mesh loaded before user intent');
    await page.locator('[data-calculate]').click();
    await page.waitForFunction(()=>document.querySelector('.pd-flight-lab')?.dataset.state==='ready');
    await page.locator('[data-lab-open]').click();
    await page.waitForFunction(()=>document.querySelector('[data-lab-status]')?.textContent.includes('Aircraft geometry loaded'));
    assert(await page.locator('[data-lab-pause]').isDisabled(),'flow must be disabled without a solver field');
    assert(await page.locator('[data-lab-pressure]').isDisabled(),'pressure must be disabled without a solver field');
    await page.locator('[data-view="top"]').click();await page.locator('canvas').press('ArrowRight');
    await page.locator('[data-view="top"]').hover();
    const contrast=await page.locator('[data-view="top"]').evaluate(el=>{
      const style=getComputedStyle(el),luminance=color=>{const c=color.match(/[\d.]+/g).slice(0,3).map(Number).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4});return c[0]*.2126+c[1]*.7152+c[2]*.0722};
      const foreground=luminance(style.color),background=luminance(style.backgroundColor);return (Math.max(foreground,background)+.05)/(Math.min(foreground,background)+.05);
    });assert(contrast>=4.5,'secondary camera button loses text contrast on hover');
    await page.locator('[data-view="side"]').click();await page.locator('[data-zoom="-1"]').click();
    const field=page.locator(slug==='density-altitude'?'#oat':'#windDir');
    await field.fill(slug==='density-altitude'?'45':'270');
    assert(await page.locator('.pd-flight-lab').getAttribute('data-state')==='stale','stale calculation was presented as current');
    await page.locator('[data-calculate]').click();
    await page.waitForFunction(()=>document.querySelector('.pd-flight-lab')?.dataset.state==='ready');
    assert((await page.locator('[data-lab-result]').innerText()).includes(await page.locator('#out0').innerText()),'calculator output was lost');
    await page.locator('[data-pd-reset]').click();
    await page.waitForFunction(()=>document.querySelector('.pd-flight-lab')?.dataset.state==='idle');
  }
  // Synthetic fixture tests the import path only; it is never a production CFD dataset.
  await page.locator('[data-lab-file]').setInputFiles({name:'contract-test.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(fixture()))});
  await page.waitForFunction(()=>document.querySelector('[data-lab-status]')?.textContent==='Reviewed solver export loaded');
  await page.locator('[data-lab-pressure]').click();
  assert(await page.locator('[data-lab-legend]').isVisible(),'pressure units/legend missing');
  await page.locator('[data-lab-pause]').click();
  assert(await page.locator('[data-lab-pause]').getAttribute('aria-pressed')==='false','flow did not play');
  await page.locator('[data-lab-pause]').press('Enter');
  assert(await page.locator('[data-lab-pause]').getAttribute('aria-pressed')==='true','flow did not pause');
  await page.locator('[data-lab-file]').setInputFiles({name:'invalid.json',mimeType:'application/json',buffer:Buffer.from('{"solver":"fake"}')});
  await page.waitForFunction(()=>document.querySelector('[data-lab-status]')?.textContent==='CFD import rejected');
  assert((await page.locator('[data-lab-detail]').innerText()).includes('previous field'),'failed import discarded previous field');
  await page.locator('#oat').fill('20');await page.locator('[data-calculate]').click();
  assert((await page.locator('[data-lab-result]').innerText()).includes('conditions remain fixed'),'calculator silently changed the CFD case');
  await page.locator('[data-lab-open]').click();
  assert(!await page.locator('canvas').isVisible(),'closing viewer failed');
  await goto(page,'/calculators/wind-triangle/');
  await page.locator('#course').fill('0');await page.locator('#windDir').fill('90');await page.locator('#tas').fill('100');await page.locator('#windSpeed').fill('150');await page.locator('[data-calculate]').click();
  await page.waitForFunction(()=>document.querySelector('.pd-flight-lab')?.dataset.state==='invalid');
  assert(errors.length===0,errors.join(' | '));await context.close();
});

await check('3D Flight Lab fits narrow screens, handles reduced motion and graphics failure',async()=>{
  const {fixture}=await import('./flight-lab-fixture.mjs');
  const context=await browser.newContext({locale:'de-DE',viewport:{width:390,height:844},reducedMotion:'reduce'});
  const page=await context.newPage();
  await goto(page,'/calculators/density-altitude/');
  await page.locator('[data-lab-open]').click();
  await page.waitForFunction(()=>document.querySelector('[data-lab-status]')?.textContent.includes('Aircraft geometry loaded'));
  await page.locator('[data-lab-file]').setInputFiles({name:'contract-test.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(fixture()))});
  await page.waitForFunction(()=>document.querySelector('[data-lab-status]')?.textContent==='Reviewed solver export loaded');
  assert(await page.locator('[data-lab-pause]').isDisabled(),'reduced motion should prevent automatic trace animation');
  for(const width of [320,360,375,390,414,430,768,1280,1920]){
    await page.setViewportSize({width,height:900});
    assert(!await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),`3D lab overflows at ${width}px`);
    const bounds=await page.locator('canvas').boundingBox();assert(bounds&&bounds.width>200,'3D canvas collapsed');
    const toolbar=await page.locator('[aria-label="Aircraft view"]').boundingBox();assert(toolbar&&toolbar.height<150,'camera toolbar takes over the mobile viewport');
  }
  const axe=await new AxeBuilder({page}).include('.pd-flight-lab').withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
  assert(!axe.violations.some(v=>['serious','critical'].includes(v.impact)),JSON.stringify(axe.violations));
  await context.close();
  const fallback=await browser.newContext();
  await fallback.addInitScript(()=>{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return type==='webgl2'?null:original.call(this,type,...args)}});
  const p=await fallback.newPage();await goto(p,'/calculators/density-altitude/');await p.locator('[data-lab-open]').click();
  await p.waitForFunction(()=>document.querySelector('[data-lab-status]')?.textContent==='3D viewer unavailable');
  await p.locator('[data-calculate]').click();assert((await p.locator('#out0').innerText())!=='—','graphics failure broke calculator');
  await fallback.close();
});

await browser.close();
for(const result of results)console.log(result);
if(failures.length){
  console.error(`\n${failures.length} interaction regression failure(s):`);
  failures.forEach(failure=>console.error(` - ${failure}`));
  process.exit(1);
}
console.log('\nPilotDesk interaction regression suite passed.');
