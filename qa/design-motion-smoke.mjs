import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const code = fs.readFileSync('src/scripts/design-motion.js','utf8').replace(/^import .*?;\n/,'');
function run({ reduced=false, page='pd-tools-page', empty=false }={}) {
  const calls=[],listeners={},observer={};
  const groups=empty?[]:[{},{}];
  const host={querySelectorAll:()=>groups};
  const context={
    window:{matchMedia:query=>({matches:query.includes('reduced')?reduced:false,addEventListener:(type,fn)=>listeners.reduce=fn}),addEventListener:(type,fn)=>listeners[type]=fn},
    document:{hidden:false,readyState:'complete',body:{classList:{contains:value=>value===page}},getElementById:id=>id==='pdToolDirectory'?host:null,querySelector:()=>null},
    navigator:{},animate:(elements,frames,options)=>{calls.push({elements,frames,options});return {finished:Promise.resolve(),complete:()=>calls.push('completed')}},
    inView:()=>()=>{},hover:()=>()=>{},press:()=>()=>{},stagger:()=>0,
    requestAnimationFrame:fn=>{observer.frame=fn;return 1},cancelAnimationFrame:()=>{},
    MutationObserver:class {constructor(fn){observer.mutate=fn} observe(){} disconnect(){observer.disconnected=true}}
  };
  vm.runInNewContext(code,context);
  return {calls,listeners,observer};
}
let result=run({reduced:true});
assert.equal(result.calls.length,0,'reduced motion must not animate');
assert.equal(result.observer.mutate,undefined,'reduced motion must not observe results');
result=run(); result.observer.mutate(); result.observer.frame();
assert.equal(result.calls.length,1,'new filter results animate once');
assert.equal(result.calls[0].elements.length,2);
result.listeners.reduce({matches:true});
assert(result.observer.disconnected,'turning on reduced motion releases observers');
assert(result.calls.includes('completed'),'finish active animations so controls do not remain scaled');
result=run({empty:true});result.observer.mutate();result.observer.frame();
assert.equal(result.calls.length,0,'empty search results must not be passed to Motion');
result=run({page:'route-planner'});
assert.equal(result.calls.length,0,'chart page receives no new animations');
assert.equal(result.observer.mutate,undefined,'chart page receives no new observers');
console.log('Design motion behavior passed: reduced motion, filter updates, empty search, cleanup and chart isolation.');
