import fs from 'node:fs';

const failures=[];
const check=(ok,msg)=>{if(!ok)failures.push(msg)};
const read=p=>fs.readFileSync(p,'utf8');

const calc=read('assets/calculator-ux.js');
const share=read('assets/share-enhance.js');
const daily=read('assets/daily.js');
const cfi=read('assets/cfi-toolkit.js');
const pageShare=read('assets/page-share.js');
const bootstrap=read('assets/app-bootstrap.js');
const site=read('assets/site.js');
const css=read('assets/experience.css');

check(calc.includes("utm_source','pilotdesk_calculator_share'"),'Calculator referral attribution missing');
check(calc.includes("resultText(referralUrl())"),'Copied calculator results must carry a referral link');
check(calc.includes("navigator.clipboard.writeText(url)")&&calc.includes('Calculator Link Copied'),'Calculator copy-link attribution/analytics missing');
check(share.includes('pilotdesk_share_card')&&share.includes('pilotdesk-calculation.png'),'Calculator image share card missing');
check(share.includes('navigator.canShare?.({files:[file]})'),'Calculator native image sharing missing');

check(daily.includes('makeDailyShareCard'),'Daily visual score card missing');
check(daily.includes("pilotdesk-daily.png"),'Daily share image file missing');
check(daily.includes('scoreGrid(result)'),'Daily score grid missing from sharing');
check(daily.includes("utm_source','pilotdesk_daily_share'"),'Daily referral attribution missing');
check(daily.includes("method:canFileShare?'image':'link'"),'Daily share-method analytics missing');

check(cfi.includes('CFI Student Prompt Copied')&&cfi.includes('CFI Student Link Copied'),'CFI student handoff sharing missing');
check(cfi.includes('CFI Toolkit Shared'),'CFI toolkit sharing analytics missing');

for(const needle of ['pilotdesk_page_share','organic_share','Page Link Copied','Page Shared','navigator.share']){
 check(pageShare.includes(needle),'Page sharing missing: '+needle);
}
check(pageShare.includes('window.__pilotDeskPageShare'),'Page sharing duplicate guard missing');
check(bootstrap.includes("/assets/page-share.js"),'App bootstrap does not expose page sharing');
check(site.includes("/assets/page-share.js"),'Legacy content shell does not expose page sharing');
check(css.includes('.pd-page-share'),'Page share UI styling missing');
check(css.includes('@media(max-width:560px)'),'Page share mobile guard missing');

for(const file of ['guides/pilot-math-formulas.html','guides/feathering-vs-windmilling-propeller.html','guides/vmc-vs-vyse.html','e6b-flight-computer.html']){
 const html=read(file);
 check(html.includes('/assets/site.js')||html.includes('/assets/app-bootstrap.js')||html.includes('/assets/page-share.js'),file+': no route to page-sharing runtime');
}
for(const file of ['guides/accelerated-stall-load-factor.html','guides/weight-balance-envelope.html']){
 check(read(file).includes('/assets/page-share.js'),file+': high-impression guide must load page sharing directly');
}

if(failures.length){
 console.error('Organic sharing checks failed with '+failures.length+' issue(s):');
 failures.forEach(x=>console.error(' - '+x));
 process.exit(1);
}
console.log('Organic sharing checks passed: calculator referrals/cards, Daily score cards, CFI handoffs, high-value page sharing, attribution, analytics, and mobile fallbacks verified.');
