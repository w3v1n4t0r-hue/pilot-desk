import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PILOTDESK_PLAYWRIGHT||'playwright-core');
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'});
const url=process.env.HERO_URL||'http://127.0.0.1:4188/prototypes/home-hero/';
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'no-preference'}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(url);await page.waitForSelector('.hp.is-ready');
 assert.equal(await page.locator('[data-slide] .hp-cta').first().isVisible(),false);
 assert.equal(await page.locator('[data-slide]').first().evaluate(e=>e._heroOpening.effect.getTiming().duration),1500);await page.locator('[data-slide] .hp-cta').first().waitFor({state:'visible',timeout:6000});
 console.log('PASS action appears after 1.5-second unfold');
 assert.deepEqual(await page.locator('.pd-nav-item').evaluateAll(xs=>xs.map(x=>x.dataset.section)),['Tools','Plan','Weather','Learn']);
 assert.equal(await page.locator('h1').count(),1);assert.equal((await page.locator('meta[name=robots]').getAttribute('content')).includes('noindex'),new URL(url).pathname.startsWith('/prototypes/'));
 assert.equal(await page.locator('.hp button').count(),2);
 assert(!/illustrative|demonstration|anatomy of|auto.*5 seconds|hover.*pause|local preview|pilot.s workspace/i.test(await page.locator('.hp').innerText()));
 assert.deepEqual(await page.locator('[data-slide] .hp-cta').evaluateAll(xs=>xs.map(x=>x.getAttribute('href'))),['/route-planner.html','/tools.html','/flight-training.html','/weather.html']);
 for(const route of ['/route-planner.html','/tools.html','/flight-training.html','/weather.html'])assert.equal((await page.request.get(new URL(route,url).href)).status(),200);
 await page.getByRole('button',{name:'Next slide',exact:true}).click();await page.waitForTimeout(1100);assert.equal(await page.locator('.hp').getAttribute('data-hero-index'),'1');
 await page.getByRole('button',{name:'Previous slide',exact:true}).click();await page.waitForTimeout(1100);assert.equal(await page.locator('.hp').getAttribute('data-hero-index'),'0');
 await page.mouse.move(1050,500);await page.mouse.down();await page.mouse.move(750,500,{steps:12});assert(await page.locator('.hp').evaluate(e=>e.classList.contains('is-dragging')));await page.mouse.up();await page.waitForTimeout(1100);assert.equal(await page.locator('.hp').getAttribute('data-hero-index'),'1');
 await page.getByRole('button',{name:'Next slide',exact:true}).focus();
 await page.keyboard.press('Space');await page.waitForTimeout(1100);
 assert.equal(await page.locator('.hp').getAttribute('data-hero-index'),'2','Space on Next must activate the button rather than toggle autoplay');
 await page.keyboard.press('Enter');await page.waitForTimeout(1100);
 assert.equal(await page.locator('.hp').getAttribute('data-hero-index'),'3','Enter on Next must activate the button');
 console.log('PASS side arrows, mouse dragging and native keyboard activation');
 await page.screenshot({path:'../../outputs/hero-v6/hero-controls-desktop.png'});
 console.log('PASS header order, one heading, clean scenes, four working destinations, side navigation controls');
 for(const width of[320,390,650,768,1100,1440,1920]){
  await page.setViewportSize({width,height:1000});await page.waitForTimeout(100);
  const layout=await page.evaluate(()=>{const nav=document.querySelector('.pd-main-nav'),s=getComputedStyle(nav),pro=document.querySelector('.pd-plans-link').getBoundingClientRect(),searchWrap=document.querySelector('.pd-search-wrap').getBoundingClientRect(),search=searchWrap.width?searchWrap:document.querySelector('.pd-search-toggle').getBoundingClientRect();return{overflow:document.documentElement.scrollWidth-innerWidth,navVisible:s.opacity==='1'&&s.display!=='none',navWidth:nav.getBoundingClientRect().width,proLeft:pro.left,searchLeft:search.left,headerHeight:document.querySelector('.topbar').offsetHeight,heroWidth:document.querySelector('.hp').offsetWidth}});
  assert(layout.overflow<=1,JSON.stringify({width,layout}));if(width>1100)assert(layout.navVisible);assert(layout.proLeft<layout.searchLeft);assert.equal(layout.heroWidth,width);if(width<=650)assert(layout.headerHeight<180);
 }
 console.log('PASS full-width composition and usable header at 320–1920px');
 await page.setViewportSize({width:390,height:1000});await page.getByRole('button',{name:'Open navigation',exact:true}).click();await page.getByRole('button',{name:'Tools',exact:true}).click();assert(await page.locator('.pd-nav-menu a[href="/e6b-flight-computer.html"]').isVisible());await page.keyboard.press('Escape');await page.keyboard.press('Escape');await page.getByRole('button',{name:'Open search',exact:true}).click();
 await page.locator('.pd-site-search input').fill('crosswind');await page.waitForTimeout(450);assert(await page.locator('[data-pd-search-result]').count()>0);await page.keyboard.press('Escape');
 await page.screenshot({path:'../../outputs/hero-v6/hero-controls-mobile.png'});
 console.log('PASS mobile Tools dropdown and search');
 const staticPage=await browser.newPage({javaScriptEnabled:false});await staticPage.goto(url);for(const a of await staticPage.locator('[data-slide] .hp-cta').all())assert(await a.isVisible());await staticPage.close();console.log('PASS all four static destinations without JavaScript');
 assert.deepEqual(errors,[]);console.log('PASS no runtime errors');
}finally{await browser.close()}
