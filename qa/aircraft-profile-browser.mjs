import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)(process.env.PILOTDESK_PLAYWRIGHT||'playwright');
const root=path.resolve(process.env.PILOTDESK_TEST_ROOT||'dist');
const deadline=setTimeout(()=>{console.error('Aircraft save did not finish: browser may be stuck in a mutation loop.');process.exit(1)},45000);
const browser=await chromium.launch({headless:true,...(process.env.PILOTDESK_BROWSER_PATH?{executablePath:process.env.PILOTDESK_BROWSER_PATH}:{})});
try{
 for(const width of [390,1365]){
  const page=await browser.newPage({viewport:{width,height:900}}),errors=[];
  page.setDefaultTimeout(8000);page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',route=>{
   const u=new URL(route.request().url());if(u.hostname!=='pd.test')return route.abort();
   const file=path.resolve(root,'.'+u.pathname+(u.pathname.endsWith('/')?'index.html':''));
   if(!file.startsWith(root+path.sep)||!fs.existsSync(file))return route.fulfill({status:404});
   return route.fulfill({path:file,contentType:/\.(js|mjs)$/.test(file)?'application/javascript':file.endsWith('.css')?'text/css':undefined});
  });
  await page.goto('https://pd.test/aircraft.html');
  await page.locator('#aircraftList .pd-empty-state').waitFor();
  await page.locator('#acName').fill('QA aircraft');
  await page.locator('#acFuelBurn').fill('10');
  await page.getByRole('button',{name:'Save aircraft',exact:true}).click();
  await page.locator('#aircraftList h3').filter({hasText:'QA aircraft'}).waitFor();
  await page.waitForTimeout(200);
  assert.equal(await page.locator('#aircraftList .pd-training-counts').count(),1);
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('pd-aircraft')).length),1);
  await page.reload();
  await page.locator('#aircraftList h3').filter({hasText:'QA aircraft'}).waitFor();
  await page.locator('#aircraftList [data-edit]').click();
  await page.locator('#acName').fill('Updated QA aircraft');
  await page.getByRole('button',{name:'Save aircraft',exact:true}).click();
  await page.locator('#aircraftList h3').filter({hasText:'Updated QA aircraft'}).waitFor();
  assert.equal(await page.locator('#aircraftList .pd-training-counts').count(),1);
  assert.deepEqual(errors,[]);
  await page.close();
 }
 console.log('PASS aircraft save, reload and edit remain responsive at mobile and desktop widths.');
}finally{await browser.close();clearTimeout(deadline)}
