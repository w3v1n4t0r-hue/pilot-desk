import fs from 'node:fs';

const file='index.html';
let html=fs.readFileSync(file,'utf8');
const replacements=[
  ['<title>PilotDesk Aviation Calculators</title>','<title>Free Aviation Calculators for Pilots | PilotDesk</title>'],
  ['Free aviation calculators and pilot tools for flight planning, weather, weight and balance, performance, navigation, and training.','Free aviation calculators and pilot tools for crosswind, glide distance, density altitude, fuel, navigation, weight and balance, weather, and training.'],
  ['<meta content="PilotDesk Aviation Calculators" property="og:title"/>','<meta content="Free Aviation Calculators for Pilots | PilotDesk" property="og:title"/>'],
  ['Free aviation calculators for crosswind, fuel, altitude, performance, navigation, weight and balance, and conversions.','Pilot calculators for crosswind, glide distance, density altitude, fuel, navigation, weight and balance, weather, and training.'],
  ['<h1>The calculations you actually need.</h1>','<h1>Aviation calculators built for real flight planning.</h1>'],
  ['Crosswind, fuel, altitude, turns, weight and balance, and more. Fast, free, no account.','Crosswind, glide distance, density altitude, fuel, navigation, weight and balance, and more. Fast, free, no account.'],
  ['<b>Glide Range</b><p>No-wind glide distance from height and glide ratio.</p>','<b>Aircraft Glide Distance Calculator</b><p>No-wind glide distance from height and glide ratio.</p>']
];
for(const [before,after] of replacements){
  if(!html.includes(before))throw new Error(`Homepage SEO source text not found: ${before}`);
  html=html.replaceAll(before,after);
}
fs.writeFileSync(file,html);
console.log('Focused homepage metadata, heading, and glide-distance anchor text.');
