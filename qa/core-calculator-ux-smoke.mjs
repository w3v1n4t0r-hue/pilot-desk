import fs from 'node:fs';
import vm from 'node:vm';

const failures=[];
const check=(ok,msg)=>{if(!ok)failures.push(msg)};
const ux=fs.readFileSync('assets/calculator-ux.js','utf8');
const css=fs.readFileSync('assets/calculators-2026.css','utf8');
const wb=fs.readFileSync('weight-balance.html','utf8');
const crosswind=fs.readFileSync('assets/crosswind-mfd.js','utf8');
const safety=fs.readFileSync('assets/safety.js','utf8');

for(const key of ['crosswind','densityAltitude','fuelRequired','windTriangle','tasApprox','climbGradient','threeDegree','momentCg','rateTurn','turnRadius']){
  check(ux.includes(key+':'),`Core calculator quick guidance missing: ${key}`);
}
check(ux.includes("pd-calc-quick-help"),'Calculator quick-help block missing');
check(ux.includes("pd-calc-result-summary"),'Calculator quick-read summary missing');
check(ux.includes("pd-calc-workbench")&&ux.includes("pd-calc-output-panel"),'Output-first calculator workbench missing');
check(ux.includes("data-pd-save-calculation")&&ux.includes("PilotDeskSavedCalculations"),'Account-backed Save calculation action missing');
check(ux.includes("pd-calc-section-head"),'Calculator Inputs/Results hierarchy missing');
check(ux.includes("resultSummary.hidden=true"),'Reset must clear quick-read summary');
check(css.includes('.pd-calc-quick-help')&&css.includes('.pd-calc-output-panel'),'Calculator guidance/output styling missing');
check(css.includes('.result.primary'),'Primary result emphasis missing');
check(css.includes('@media(max-width:650px)'),'Calculator narrow-screen hierarchy guard missing');
check(wb.includes('<img src="/assets/icon.svg"'),'Weight & Balance must use official PilotDesk logo');
check(wb.includes('wb-result-deck')&&wb.indexOf('wb-result-deck')<wb.indexOf('wb-cabin-card'),'W&B result deck must appear ahead of loading inputs');
check(wb.includes('id="wbSaveAccount"'),'W&B account save action missing');
check(!wb.includes('data-pd-wireframe="1"'),'Retired W&B wireframe logo returned');
check(!wb.includes('viewBox="0 0 64 40"'),'Retired W&B airplane SVG returned');
check(crosswind.includes('data-calc-optional id="gustSpeed"'),'Gust input must be marked optional');
const warning={textContent:'',classList:{toggle(){}}};
const inputs=[['runway','180'],['windDir','220'],['windSpeed','20'],['gustSpeed','']].map(([id,value])=>({id,value,hasAttribute:name=>id==='gustSpeed'&&name==='data-calc-optional',closest:()=>({querySelector:()=>({textContent:id})})}));
const context={URL,window:{},location:{href:'http://localhost/'},document:{scripts:[{src:'http://localhost/assets/app-bootstrap.js'}],getElementById:id=>id==='safetyWarning'?warning:null,querySelectorAll:()=>inputs}};
vm.runInNewContext(safety,context);
check(context.window.PilotDeskSafety.validate('crosswind')===true,'Blank optional gust must not block crosswind calculation');
inputs[3].value='300';
check(context.window.PilotDeskSafety.validate('crosswind')===false&&warning.textContent.includes('supported range'),'Entered gust must be validated against its range');

if(failures.length){
  console.error(`Core calculator UX checks failed with ${failures.length} issue(s):`);
  failures.forEach(x=>console.error(' - '+x));
  process.exit(1);
}
console.log('Core calculator UX checks passed: guidance, quick-read results, hierarchy, mobile guard, reset behavior, and W&B branding verified.');
