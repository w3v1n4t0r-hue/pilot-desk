(()=>{
'use strict';
const groups={
 'Flight Planning':[['crosswind','Crosswind Component'],['wind-triangle','Wind Triangle'],['time-speed-distance','Time / Speed / Distance'],['fuel-required','Fuel Required'],['endurance-range','Endurance & Range'],['top-of-descent','Top of Descent'],['three-degree-descent','3° Descent Rate'],['holding-leg-distance','Holding Leg Distance']],
 'Atmosphere & Weather':[['pressure-altitude','Pressure Altitude'],['density-altitude','Density Altitude'],['isa-temperature','ISA Temperature'],['cloud-base','Estimated Cloud Base'],['speed-of-sound','Speed of Sound'],['mach-number','Mach Number']],
 'Performance':[['true-airspeed','Approximate True Airspeed'],['climb-gradient','Climb Gradient to FPM'],['fpm-to-gradient','FPM to Climb Gradient'],['gradient-angle','Gradient / Angle Converter'],['glide-range','Glide Distance'],['maneuvering-speed-weight','Maneuvering Speed at Weight'],['accelerated-stall','Accelerated Stall Speed'],['hydroplaning','Dynamic Hydroplaning Speed'],['wing-loading','Wing Loading'],['power-loading','Power Loading'],['obstacle-gradient','Obstacle Climb Gradient']],
 'Maneuvers & Turns':[['pivotal-altitude','Pivotal Altitude'],['standard-rate-bank','Standard-Rate Bank'],['load-factor','Bank Angle Load Factor'],['turn-radius','Turn Radius'],['rate-of-turn','Rate of Turn']],
 'Navigation':[['reciprocal-heading','Reciprocal Heading'],['true-magnetic','True / Magnetic Heading'],['arc-distance','DME Arc Distance'],['great-circle-distance','Great-Circle Distance'],['dms-decimal','DMS / Decimal Degrees'],['nm-per-minute','NM per Minute']],
 'Weight & Balance':[['moment-cg','Moment & CG'],['percent-mac','Percent MAC'],['ballast','Ballast Required'],['fuel-weight','Fuel Weight']],
 'Conversions':[['speed-conversion','Speed Conversion'],['distance-conversion','Distance Conversion'],['temperature-conversion','Temperature Conversion'],['weight-conversion','Weight Conversion'],['volume-conversion','Volume Conversion'],['pressure-conversion','Pressure Conversion'],['vertical-speed-conversion','Vertical Speed Conversion']]
};
const extra=[['/weight-balance.html','Weight & Balance Builder','Build a complete loading table and calculate CG.'],['/e6b-flight-computer.html','E6B Flight Computer','A consolidated flight-math tool for common planning calculations.']];
const copy={
 crosswind:'Resolve wind into headwind, tailwind, and crosswind components.',
 'density-altitude':'Estimate density altitude from pressure altitude and temperature.',
 'glide-range':'Estimate no-wind glide distance from altitude and glide ratio.',
 'fuel-required':'Calculate trip fuel, reserve, and fuel remaining.',
 'top-of-descent':'Estimate descent distance, time, and vertical speed.',
 'moment-cg':'Calculate moment and center of gravity from loading data.'
};
function description(slug,name){return copy[slug]||`Open the ${name.toLowerCase()} calculator.`}
function render(q=''){
 const host=document.getElementById('pdToolDirectory');if(!host)return;const query=String(q).trim().toLowerCase();let shown=0;host.innerHTML='';
 const featured=document.createElement('section');featured.className='category';featured.innerHTML=`<div class="category-head"><h2>Featured tools</h2><span>Full workspaces</span></div><div class="grid">${extra.filter(x=>!query||`${x[1]} ${x[2]}`.toLowerCase().includes(query)).map(([href,name,desc])=>{shown++;return `<a class="tool-card" href="${href}"><b>${name}</b><p>${desc}</p></a>`}).join('')}</div>`;if(featured.querySelector('.tool-card'))host.appendChild(featured);
 for(const [group,items] of Object.entries(groups)){
  const matches=items.filter(([slug,name])=>!query||`${slug} ${name} ${group} ${description(slug,name)}`.toLowerCase().includes(query));if(!matches.length)continue;shown+=matches.length;const section=document.createElement('section');section.className='category';section.innerHTML=`<div class="category-head"><h2>${group}</h2><span>${matches.length} tool${matches.length===1?'':'s'}</span></div><div class="grid">${matches.map(([slug,name])=>`<a class="tool-card" href="/calculators/${slug}/"><b>${name}</b><p>${description(slug,name)}</p></a>`).join('')}</div>`;host.appendChild(section)
 }
 document.getElementById('pdToolCount').textContent=query?`${shown} match${shown===1?'':'es'}`:'47 calculators + 2 workspaces';if(!shown)host.innerHTML='<section class="category"><p>No calculator matched that search.</p></section>';
}
function init(){const input=document.getElementById('pdToolDirectorySearch');render();input?.addEventListener('input',()=>render(input.value));const q=new URL(location.href).searchParams.get('q');if(q&&input){input.value=q;render(q);input.focus()}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();