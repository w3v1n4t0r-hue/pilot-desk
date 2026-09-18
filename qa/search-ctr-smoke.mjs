import fs from 'node:fs';

const failures=[];
const check=(ok,msg)=>{if(!ok)failures.push(msg)};
const read=p=>fs.readFileSync(p,'utf8');

const targets=[
 ['calculators/isa-temperature/index.html','ISA Temperature Calculator | Standard Atmosphere | PilotDesk','Free ISA temperature calculator for pilots.'],
 ['guides/pilot-math-formulas.html','Pilot Math Formulas: Aviation Formula Cheat Sheet | PilotDesk','Pilot math formulas in one aviation cheat sheet:'],
 ['guides/feathering-vs-windmilling-propeller.html','Windmilling vs Feathered Propeller: Drag Explained | PilotDesk','Why does a windmilling propeller create so much drag?'],
 ['guides/vmc-vs-vyse.html','VMC vs VYSE Explained: Red Line, Blue Line & Meaning | PilotDesk','What do VMC and VYSE mean?'],
 ['guides/accelerated-stall-load-factor.html','Accelerated Stall Speed: Bank Angle & Load Factor | PilotDesk','Learn accelerated stall speed, the √load-factor relationship'],
 ['guides/weight-balance-envelope.html','Aircraft CG Envelope: Weight & Balance Limits Explained | PilotDesk','Learn how to read an aircraft CG envelope']
];

for(const [file,title,descStart] of targets){
 const html=read(file);
 check(html.includes('<title>'+title+'</title>'),file+': CTR title missing');
 check(html.includes('content="'+descStart),file+': CTR description missing');
 const titleLen=title.length;
 check(titleLen>=40&&titleLen<=68,file+': title length outside intentional CTR range ('+titleLen+')');
}

const gen=read('scripts/generate-calculator-pages.mjs');
check(gen.includes("'isa-temperature':'ISA Temperature Calculator | Standard Atmosphere | PilotDesk'"),'ISA title optimization must live in calculator generator');
check(gen.includes("'isa-temperature':'Free ISA temperature calculator for pilots."),'ISA description optimization must live in calculator generator');

const e6b=read('e6b-flight-computer.html');
check(e6b.includes('<title>Free Online E6B Flight Computer & E6B Calculator | PilotDesk</title>'),'Existing strong E6B exact-match title should remain intact');

if(failures.length){
 console.error('Search-result CTR checks failed with '+failures.length+' issue(s):');
 failures.forEach(x=>console.error(' - '+x));
 process.exit(1);
}
console.log('Search-result CTR checks passed across six Search Console opportunity pages; ISA generator durability and the existing E6B exact-match snippet are preserved.');
