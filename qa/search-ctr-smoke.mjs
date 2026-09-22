import fs from 'node:fs';

const failures=[];
const check=(ok,msg)=>{if(!ok)failures.push(msg)};
const read=p=>fs.readFileSync(p,'utf8');

const targets=[
 ['calculators/isa-temperature/index.html','ISA Temperature Calculator | Standard Atmosphere | PilotDesk','Free ISA temperature calculator and standard-atmosphere reference for pilots.'],
 ['calculators/moment-cg/index.html','Aircraft CG Calculator | Weight × Arm, Moment &amp; CG | PilotDesk','Free aircraft CG calculator using weight × arm = moment.'],
 ['calculators/rate-of-turn/index.html','Rate 1 Turn Calculator | Turn Rate &amp; Radius | PilotDesk','Free rate 1 turn and aircraft turn-rate calculator.'],
 ['calculators/three-degree-descent/index.html','3 Degree Descent Rate Calculator | FPM from Groundspeed | PilotDesk','Free 3 degree descent rate calculator.'],
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
check(gen.includes("'isa-temperature':'Free ISA temperature calculator and standard-atmosphere reference for pilots."),'ISA description optimization must live in calculator generator');
for(const needle of [
  "'moment-cg':'Aircraft CG Calculator | Weight × Arm, Moment & CG | PilotDesk'",
  "'rate-of-turn':'Rate 1 Turn Calculator | Turn Rate & Radius | PilotDesk'",
  "'three-degree-descent':'3 Degree Descent Rate Calculator | FPM from Groundspeed | PilotDesk'",
  "'moment-cg':'Free aircraft CG calculator using weight × arm = moment.",
  "'rate-of-turn':'Free rate 1 turn and aircraft turn-rate calculator.",
  "'three-degree-descent':'Free 3 degree descent rate calculator."
]) check(gen.includes(needle),'Search Console calculator optimization must live in generator: '+needle);

const e6b=read('e6b-flight-computer.html');
check(e6b.includes('<title>Free Online E6B Flight Computer & E6B Calculator | PilotDesk</title>'),'Existing strong E6B exact-match title should remain intact');

if(failures.length){
 console.error('Search-result CTR checks failed with '+failures.length+' issue(s):');
 failures.forEach(x=>console.error(' - '+x));
 process.exit(1);
}
console.log('Search-result CTR checks passed across Search Console opportunity pages; calculator generator durability and the existing E6B exact-match snippet are preserved.');
