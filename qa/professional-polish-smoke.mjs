import fs from 'node:fs';

const read=p=>fs.readFileSync(p,'utf8');
const css=read('assets/professional-polish.css');
const bootstrap=read('assets/app-bootstrap.js');
const sw=read('sw.js');
const failures=[];
const check=(ok,msg)=>{if(!ok)failures.push(msg)};

check(css.length>5000,'professional polish stylesheet is unexpectedly small');
for(const selector of ['.topbar','.hero','.tool-card','.calc-box','.input-wrap','.result','.content-page','.pd-app-dock','footer']){
  check(css.includes(selector),`professional polish is missing ${selector}`);
}
check(css.includes('@media(max-width:760px)'),'professional polish needs explicit mobile treatment');
check(css.includes('@media(prefers-reduced-motion:reduce)'),'professional polish must respect reduced motion');
check(css.includes(':focus-visible'),'professional polish must preserve visible keyboard focus');
check(css.includes('min-height:44px')||css.includes('min-height:50px'),'professional polish should preserve touch-friendly control sizing');
check(!css.includes('display:none!important'),'professional polish must not hide core interface sections');
check(!css.includes('position:fixed')||css.includes('body:before'),'professional polish should not introduce new fixed interactive overlays');
check(bootstrap.includes("loadStyle('/assets/professional-polish.css','pd-professional-polish')"),'app bootstrap is not loading professional polish');
check(sw.includes("'/assets/professional-polish.css'"),'professional polish is not cached for installed/offline use');

if(failures.length){
  console.error(`Professional polish checks failed with ${failures.length} issue(s):`);
  failures.forEach(x=>console.error(' - '+x));
  process.exit(1);
}
console.log('Professional polish checks passed: visual layer is isolated, responsive, accessible, and cached without hiding core product UI.');
