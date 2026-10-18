const fs=require('fs'),assert=require('node:assert/strict');
const home=fs.readFileSync('src/pages/index.astro','utf8'),hero=fs.readFileSync('src/components/HeroPrototype.astro','utf8'),css=fs.readFileSync('assets/hero-prototype.css','utf8');
assert(home.includes('<HeroPrototype />'));assert(home.includes('<HomePlans />'));
for(const marker of ['data-hero-prev','data-hero-next','/route-planner.html','/tools.html','/flight-training.html','/weather.html'])assert(hero.includes(marker),marker);
assert(css.includes('touch-action:pan-y pinch-zoom'));assert(css.includes('@media(max-width:650px)'));assert(css.includes('focus-visible'));
console.log('Approved homepage hero destinations, navigation and mobile safeguards passed.');
