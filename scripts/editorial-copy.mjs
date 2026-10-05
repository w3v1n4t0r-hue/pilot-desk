// Exact editorial replacements for legacy guide copy. Run by the public-copy
// normalization pass so regeneration cannot reintroduce these introductions.
const headings={
 "e6b-flight-computer.html":{"Worked E6B-style example": "90 NM at 105 knots"},
 "guides/navigation-reference.html":{"Worked wind-triangle example": "Course 090°, wind from 180°"},
 "guides/e6b-wind-side.html":{"Typical workflow": "Plot the wind and true airspeed"},
 "guides/course-heading-track.html":{"Worked concept": "A northbound course with wind from the west", "Why pilots care": "Course, heading and track in a navlog"},
 "guides/pilot-math-formulas.html":{"Worked flight-planning chain": "How groundspeed changes time, fuel and climb rate"},
 "guides/crosswind-component.html":{"Worked crosswind example": "Wind components for the selected runway"},
 "guides/metar-taf.html":{"Worked TAF timeline": "Reading TEMPO and FM periods in UTC"},
 "guides/ifr-alternate-requirements.html":{"Worked weather example": "A 2,300-foot ceiling and 4-mile visibility"},
 "guides/flight-planning.html":{"A Practical Flight Planning Workflow": "Plan the route, loading and fuel"},
 "guides/useful-load-payload-fuel.html":{"Worked concept": "900 pounds of useful load, 650 pounds of payload"},
 "guides/vx-vy-altitude.html":{"Worked study example: read the chart, then explain the choice": "Choosing a speed for obstacle clearance"},
 "guides/climb-gradient.html":{"Worked climb-gradient example": "200 ft/NM at 90 and 120 knots"},
 "guides/hydroplaning-speed.html":{"FAA relationship and worked examples": "The FAA estimate at 24 and 36 PSI"},
 "guides/top-of-descent.html":{"Worked planning check": "Losing 6,000 feet on a 3° path"},
 "guides/aircraft-performance-reference.html":{"A repeatable performance-chart workflow": "Read the chart inputs and corrections"},
 "guides/three-degree-descent.html":{"Worked descent example": "Descent rate on a 3° path"},

 'guides/density-altitude.html':{'Worked example':'5,000 ft pressure altitude at 30°C'},
 'guides/maneuvering-speed-weight.html':{'Worked example':'Va at a lower weight'},
 'guides/climb-rate-vs-climb-gradient.html':{'Worked example in both directions':'500 fpm at 90 knots'},
 'guides/weight-and-balance.html':{'Worked example: add the moments':'Add the station moments'},
 'guides/types-of-altitude.html':{'Worked example':'A 5,000-foot airport on a hot day'},
 'guides/wing-loading.html':{'Worked example: the same airplane at two weights':'The same wing at 2,400 and 2,000 pounds'},
 'guides/great-circle-distance.html':{'Worked example: a short coordinate change':'One degree north and east'},
 'guides/cloud-base-estimate.html':{'Worked example':'24°C temperature, 14°C dew point'},
 'guides/wind-triangle.html':{'Worked example: hold an eastbound true course':'Course 090°, wind from 020°'},
 'guides/cg-shift-fuel-burn.html':{'Worked example: fuel burn and CG shift':'Burning 20 pounds of fuel'},
 'guides/fuel-planning.html':{'Worked example: separate trip fuel from reserve':'Trip fuel and a 45-minute reserve'},
 'guides/time-speed-distance.html':{'Worked example: time':'90 NM at 120 knots','Worked example: distance':'24 minutes at 105 knots'},
 'guides/isa-temperature.html':{'Worked example':'ISA +20 at 7,000 feet'},
 'guides/percent-mac.html':{'Worked example':'CG 15 inches aft of LEMAC'},
 'guides/dme-arc-distance.html':{'Worked example':'60° along a 10 DME arc'},
 'guides/poh-performance-chart-interpolation.html':{'Worked example':'A midpoint between chart values','Worked example: interpolate one variable':'Between 3,000 and 5,000 feet'},
 'guides/pressure-altitude.html':{'Worked examples':'A 2,500-foot airport at two pressure settings'},
 'guides/altimeter-pressure-conversions.html':{'Worked example':'30.00 inHg in hectopascals'},
 'written-prep.html':{'Worked lesson: climb rate versus climb gradient':'200 ft/NM at 90 knots','Get more from each question.':'Review the answer and its source','A study session that teaches the subject':'Reviewing missed questions'}
};
// Each match is an entire paragraph starting with a known legacy sentence.
const paragraphs={
 'poh-chart-studio.html':[['Pick known chart points first,','Start with known chart points. Estimate a value between them, check it against the plotted result, then change one input and repeat. Check the scales and units before accepting the answer.']],
 'e6b-flight-computer.html':[['A digital E6B can cover more than the classic wheel.','PilotDesk also includes climb-gradient, descent-rate, glide-distance and turn calculations. Use the linked guide for the calculation you need.'],['Suppose a training cross-country leg','At 105 kt groundspeed, a 90 NM leg takes 90 ÷ 105 = 0.857 hours, or about 51 minutes. At 9 gal/hr, trip fuel is about 7.7 gal. Add the applicable start, taxi, climb, alternate, reserve and contingency fuel separately.']],
 'for-flight-schools.html':[['Calculator URLs can keep the entered values,','Calculator links retain the entered values. Send a student the setup from a lesson, then have them change one input and explain the result.']],
 'training/private-pilot.html':[['The Private Pilot for Airplane Category ACS','The Private Pilot for Airplane Category ACS (FAA-S-ACS-6C) covers knowledge, risk management and flying skill. Pick a route and airplane, then work through the applicable regulations, weather, loading and performance. Be ready to explain your decisions.']],
 'guides/checkride-study-guides.html':[['Private-pilot preparation usually rewards','Start with time, speed and distance, crosswind components, fuel planning, pressure altitude, density altitude and weight and balance. For each problem, explain the inputs, calculation and aircraft-specific limits.']],
 'guides/multiengine-checkride-study-guide.html':[['Multi-engine questions become easier','An engine failure changes both control and performance. Study VMC, critical-engine effects, zero sideslip, propeller drag and single-engine climb separately, then explain how they interact.'],['A useful way to study is','For an engine-failure scenario, explain the yaw from asymmetric thrust, the rudder and bank needed for control, and the drag from the failed-engine propeller. Then use the aircraft performance chart to assess the remaining climb capability at the specified weight and density altitude.']],
 'guides/fuel-planning.html':[["If you're trying to calculate fuel burn",'Calculate each flight segment using its expected time and fuel flow. Add taxi, climb, alternate, reserve and other allowances required for the flight. A cruise-burn calculation alone is not a complete fuel plan.']],
 'guides/aircraft-performance-reference.html':[['Aircraft performance is a connected system.','Weight, CG, pressure altitude, temperature, wind, runway condition and configuration affect aircraft performance. Identify the required inputs, then use the applicable POH/AFM chart and its corrections. Keep generic calculations separate from aircraft-specific performance.']],
 'guides/navigation-reference.html':[['Use this simplified illustration','For a true course of 090° at 100 kt TAS, wind from 180° at 20 kt pushes the airplane north, left of course. A heading of about 101.5° true supplies a southward airspeed component to offset that wind. Groundspeed is about 98 kt.']],
 'guides/identify-verify-feather.html':[['The broader lesson is priorities.','Maintain control and follow the approved engine-failure procedure for the airplane. Identification and verification guard against securing the operating engine. This page is an explanation, not an emergency checklist.']],
 'guides/emergency-glide-planning.html':[['A useful training exercise is','After calculating still-air glide distance, check landing-area elevation, wind, intervening terrain and the height needed for turns and landing. Each can reduce the distance you can actually use.']],
 'guides/obstacle-climb-gradient.html':[['A useful relationship is','Required FPM = climb gradient × groundspeed ÷ 60. At 120 knots groundspeed, 300 ft/NM requires 600 fpm. At 90 knots, it requires 450 fpm.']],
 'guides/feathering-vs-windmilling-propeller.html':[["If you're comparing a windmilling propeller",null]],
 'guides/vmc-vs-vyse.html':[["If you're asking",null],['VMC is a controllability reference. VYSE is a performance reference.',null]]
};
export function editPublicCopy(html,file){
 file=file.replace(/^\.\//,'');
 for(const [old,title] of Object.entries(headings[file]||{}))html=html.replaceAll(`>${old}</h2>`,`>${title}</h2>`).replaceAll(`>${old}</h3>`,`>${title}</h3>`);
 for(const [start,replacement] of paragraphs[file]||[])html=html.replace(/<p\b[^>]*>[\s\S]*?<\/p>/g,p=>{
   const text=p.replace(/<[^>]*>/g,'').trim();
   if(!text.startsWith(start))return p;
   return replacement===null?'':`<p>${replacement}</p>`;
 });
 if(file==='guides/vmc-vs-vyse.html')html=html.replace('<h2>What does VYSE mean?</h2>','');
 return html;
}
