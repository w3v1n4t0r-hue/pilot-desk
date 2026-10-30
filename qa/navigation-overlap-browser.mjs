import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {sharedShell} from '../scripts/shared-shell.mjs';

const {chromium}=createRequire(import.meta.url)(process.env.PILOTDESK_PLAYWRIGHT||'playwright');
const root=path.resolve(process.env.PILOTDESK_TEST_ROOT||'dist');
const browser=await chromium.launch({headless:true,...(process.env.PILOTDESK_BROWSER_PATH?{executablePath:process.env.PILOTDESK_BROWSER_PATH}:{})});
try{
 const page=await browser.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',route=>{
  const u=new URL(route.request().url());
  if(u.hostname!=='pd.test')return route.abort();
  const file=path.resolve(root,'.'+u.pathname+(u.pathname.endsWith('/')?'index.html':''));
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file))return route.fulfill({status:404});
  if(file.endsWith('.html')){
   const html=fs.readFileSync(file,'utf8');
   return route.fulfill({body:root===process.cwd()?sharedShell(html,u.pathname):html,contentType:'text/html'});
  }
  return route.fulfill({path:file,contentType:/\.(js|mjs)$/.test(file)?'application/javascript':file.endsWith('.css')?'text/css':undefined});
 });
 for(const route of ['/','/weather.html','/calculators/crosswind/']){
  for(const width of [320,360,375,390,414,430,768,820,1024,1440]){
   await page.setViewportSize({width,height:844});
   await page.goto('https://pd.test'+route);
   await page.locator('#pdMainNav').waitFor({state:'attached'});
   if(width<=820){
    assert(await page.locator('.pd-search-toggle').evaluate(button=>{const r=button.getBoundingClientRect(),h=button.closest('header').getBoundingClientRect();return r.top>=h.top&&r.bottom<=h.bottom&&r.right<=innerWidth}),'Search control stays inside the header row');
    await page.getByRole('button',{name:'Open navigation',exact:true}).click();
    await page.getByRole('button',{name:'Plan',exact:true}).click();
    await page.locator('#pdMainNav').evaluate(nav=>Promise.all(nav.getAnimations().map(a=>a.finished)));
    const layout=await page.locator('#pdMainNav').evaluate(nav=>{
     const r=nav.getBoundingClientRect(),h=document.querySelector('header.topbar').getBoundingClientRect();
     return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,headerBottom:h.bottom,width:innerWidth,height:innerHeight,background:getComputedStyle(nav).backgroundColor};
    });
    assert(layout.left>=0&&layout.right<=width,`Mobile drawer stays inside viewport: ${JSON.stringify({route,width,layout})}`);
    assert(Math.abs(layout.top-layout.headerBottom)<=1,`Drawer starts below actual header: ${JSON.stringify({route,width,layout})}`);
    assert(!layout.background.startsWith('rgba'),`Drawer must obscure underlying page: ${layout.background}`);
    assert(layout.bottom<=layout.height,`Drawer stays within screen: ${JSON.stringify({route,width,layout})}`);
    if(process.env.PILOTDESK_SHOTS&&route==='/'&&width===390){
     fs.mkdirSync(process.env.PILOTDESK_SHOTS,{recursive:true});
     await page.screenshot({path:path.join(process.env.PILOTDESK_SHOTS,'navigation-mobile.png')});
    }
    await page.getByRole('button',{name:'Open search',exact:true}).click();
    await page.locator('#pdMainNav').waitFor({state:'hidden'});
    await page.getByRole('searchbox',{name:'Search PilotDesk'}).fill('crosswind');
    await page.locator('[data-pd-search-result]').first().waitFor();
    const search=await page.evaluate(()=>{
     const input=document.querySelector('.pd-site-search input').getBoundingClientRect(),box=document.querySelector('.pd-site-search').getBoundingClientRect(),results=document.querySelector('.pd-search-results').getBoundingClientRect();
     return {input:input.toJSON(),box:box.toJSON(),results:results.toJSON()};
    });
    assert(search.input.top>=search.box.top&&search.input.bottom<=search.box.bottom,`Search input stays inside field: ${JSON.stringify({route,width,search})}`);
    assert(search.results.top>=search.input.bottom,`Search results do not overlap input at ${width}px`);
    assert(search.results.left>=0&&search.results.right<=width,`Search results stay on screen at ${width}px`);
    if(process.env.PILOTDESK_SHOTS&&route==='/'&&width===390)await page.screenshot({path:path.join(process.env.PILOTDESK_SHOTS,'search-mobile.png')});
    await page.keyboard.press('Escape');
   }else{
    await page.getByRole('button',{name:'Learn',exact:true}).click();
    assert(await page.locator('[data-section="Learn"] .pd-nav-menu').isVisible());
    await page.keyboard.press('Escape');
   }
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`No page overflow: ${route} at ${width}px`);
  }
 }
 await page.setViewportSize({width:320,height:844});
 await page.goto('https://pd.test/');
 await page.locator('header.topbar').evaluate(header=>{header.style.setProperty('height','120px','important');header.style.setProperty('min-height','120px','important')});
 await page.getByRole('button',{name:'Open navigation',exact:true}).click();
 await page.getByRole('button',{name:'Plan',exact:true}).click();
 await page.locator('#pdMainNav').evaluate(nav=>Promise.all(nav.getAnimations().map(animation=>animation.finished)));
 assert(await page.locator('#pdMainNav').evaluate(nav=>nav.getBoundingClientRect().bottom<=innerHeight),'Expanded drawer fits below a taller header');
 await page.route(/\/assets\/(?:navigation-search|search-intelligence)(?:\.[\da-f]+)?\.js$/,async route=>{
  await new Promise(resolve=>setTimeout(resolve,1600));
  await route.fallback();
 });
 await page.setViewportSize({width:1440,height:900});
 await page.goto('https://pd.test/');
 await page.getByRole('searchbox',{name:'Search PilotDesk'}).fill('private pilot');
 await page.locator('.pd-search-results a[href="/training/private-pilot.html"]').waitFor({state:'visible',timeout:5000});
 assert.deepEqual(errors,[]);
 console.log('PASS navigation/search overlap checks on home, weather and calculator pages at 320–1440px.');
}finally{await browser.close()}
