import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)(process.env.PILOTDESK_PLAYWRIGHT||'playwright'),root=path.resolve(process.env.PILOTDESK_TEST_ROOT||'dist');
const browser=await chromium.launch({headless:true,...(process.env.PILOTDESK_BROWSER_PATH?{executablePath:process.env.PILOTDESK_BROWSER_PATH}:{})});
try{
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',route=>{const u=new URL(route.request().url());if(u.hostname!=='pd.test')return route.abort();const file=path.resolve(root,'.'+u.pathname+(u.pathname.endsWith('/')?'index.html':''));if(!file.startsWith(root+path.sep)||!fs.existsSync(file))return route.fulfill({status:404});return route.fulfill({path:file,contentType:/\.(js|mjs)$/.test(file)?'application/javascript':file.endsWith('.css')?'text/css':undefined})});
 let count=0;
 for(const entry of fs.readdirSync('calculators',{withFileTypes:true})){
  const file='calculators/'+entry.name+'/index.html';if(!entry.isDirectory()||!fs.existsSync(file)||!/<body[^>]*data-calc=/.test(fs.readFileSync(file,'utf8')))continue;
  await page.goto('https://pd.test/calculators/'+entry.name+'/',{waitUntil:'networkidle'});
  await page.locator('[data-calculate]').click();
  const result=await page.evaluate(()=>({calc:document.body.dataset.calc,scripts:[...document.scripts].map(s=>s.src),results:document.querySelector('.results')?.textContent||''}));
  assert.ok(result.results.trim(),entry.name+' retains results');
  assert.equal(result.scripts.some(s=>/metar-model[.]/.test(s)),false,entry.name+' skips weather runtime');
  assert.equal(result.scripts.some(s=>/crosswind-mfd[.]/.test(s)),result.calc==='crosswind');
  if(result.calc==='crosswind')assert.equal(await page.locator('.pd-crosswind-display').count(),1);
  assert.deepEqual(errors,[],entry.name+' browser errors');count++;
 }
 console.log('Browser startup passed for '+count+' calculator pages: calculate/results, correct runtime loading, crosswind display, no script errors.');
}finally{await browser.close()}
