import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const home=fs.readFileSync('assets/home-desk.js','utf8');
const nav=fs.readFileSync('assets/global-nav.js','utf8');
const handlers={},search={dataset:{},addEventListener:(name,fn)=>handlers[name]=fn};
let open=false;
const document={getElementById:id=>({pdHomeDesk:{addEventListener(){}},pdHomeDeskItems:{replaceChildren(){}},pdHomeSearch:search}[id]||null),querySelector:()=>({select(){}}),dispatchEvent(){open=true}};
vm.runInNewContext(home,{document,location:{pathname:'/'},localStorage:{getItem:()=>null},window:{addEventListener(){}},CustomEvent:class{},URLSearchParams});
// Execute the shipped outside-click listener after the launcher's bubbling click.
const listener=nav.match(/document\.addEventListener\('click',e=>\{if\(!header\.contains\(e\.target\)\)\{[^\n]+/)[0];
let outside;
vm.runInNewContext(listener,{document:{addEventListener:(_name,fn)=>outside=fn},header:{contains:()=>false},closeMenus(){},setMobileNavOpen(){},nav:{},menu:{},closeSearch(){open=false}});
const event={target:search,stopped:false,stopPropagation(){this.stopped=true;}};
handlers.click(event);if(!event.stopped)outside(event);
assert.equal(open,true,'homepage Search all tools must remain open after the launch click bubbles');
outside({target:{}});assert.equal(open,false,'ordinary outside clicks still close search');
console.log('Homepage search launcher stays open; ordinary outside clicks close it.');
