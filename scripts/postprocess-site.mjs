import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const brand=`<span class="brandmark" aria-label="PilotDesk"><svg viewBox="0 0 64 40" role="img" aria-label="PilotDesk airplane logo" xmlns="http://www.w3.org/2000/svg"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M32 5v9"/><path d="M32 14c-4.8 0-8 3.8-8 8.5S27.2 31 32 31s8-3.8 8-8.5S36.8 14 32 14Z"/><path d="M25 19 8 15l2 5 14 3"/><path d="m39 23 15-3 2-5-17 4"/><path d="M28 18.5h8"/><path d="M29 18.5v3.5m6-3.5V22"/><circle cx="18" cy="30" r="3.5"/><circle cx="46" cy="30" r="3.5"/><path d="M21.5 27 25 24m21.5 3L39 24"/></g></svg></span>`;

const faqs={
  crosswind:[
    ['How is crosswind component calculated?','PilotDesk resolves the wind into components relative to the runway using trigonometry. The crosswind component is wind speed multiplied by the sine of the angle between the runway heading and wind direction; the along-runway component uses the cosine.'],
    ['Should gusts be considered?','Use current wind information and apply the aircraft, operator, instructor, or airport limits that govern the flight. A generic calculator cannot determine whether a crosswind is acceptable for a specific aircraft or pilot.'],
    ['Does this replace the POH or AFM?','No. Use the current POH or AFM and approved operating information for aircraft-specific demonstrated crosswind information, limitations, and procedures.']
  ],
  'density-altitude':[
    ['Why does density altitude matter?','Higher density altitude reduces air density and can reduce aircraft, engine, and propeller performance. Actual takeoff, climb, and landing performance must be determined from current approved aircraft performance data.'],
    ['Is density altitude the same as pressure altitude?','No. Pressure altitude corrects altitude for nonstandard pressure. Density altitude further accounts for air density, including temperature effects.'],
    ['Can I use this instead of the POH performance charts?','No. This calculator is a study and cross-check tool. Use the aircraft POH or AFM performance procedure for operational planning.']
  ],
  'pressure-altitude':[
    ['What is pressure altitude?','Pressure altitude is the altitude indicated when the altimeter is set to 29.92 inHg. It is commonly used as an input to performance calculations and charts.'],
    ['Why is the result an estimate?','The common field-elevation formula uses about 1,000 feet per inch of mercury. It is useful for planning math, but aircraft performance should follow the approved charting method.'],
    ['What if the altimeter setting looks unusual?','Verify the source. PilotDesk flags settings outside a broad sanity range, but the warning is not a substitute for current weather or airport information.']
  ],
  'three-degree-descent':[
    ['What is the common 3 degree descent rule?','A common cockpit approximation is groundspeed multiplied by 5 for vertical speed in feet per minute. PilotDesk also shows a trigonometric 3-degree result.'],
    ['Is groundspeed or airspeed used?','Groundspeed is used because vertical speed required for a geometric path depends on how quickly the aircraft moves across the ground.'],
    ['Does this guarantee a stabilized approach?','No. A stabilized approach also depends on configuration, power, wind, aircraft procedures, and operator criteria.']
  ],
  'top-of-descent':[
    ['How is top of descent estimated?','PilotDesk divides altitude to lose by the selected descent gradient to estimate descent distance, then uses groundspeed to estimate vertical speed and time.'],
    ['What descent gradient should I use?','Use a value appropriate to the operation, procedure, aircraft, and conditions. A common 3-degree path is about 318 feet per nautical mile, but it is not universally applicable.'],
    ['Does this replace published procedure guidance?','No. Published restrictions, ATC instructions, charted procedures, and aircraft operating guidance take priority.']
  ],
  'climb-gradient':[
    ['How do I convert ft/NM to FPM?','Multiply the required gradient in feet per nautical mile by groundspeed in nautical miles per minute.'],
    ['Why does groundspeed matter?','A faster groundspeed covers more nautical miles each minute, so a greater vertical speed is required to maintain the same climb gradient.'],
    ['Can this prove obstacle clearance?','No. Use the applicable procedure, aircraft performance data, weather, and regulatory requirements for operational obstacle-clearance planning.']
  ],
  'pivotal-altitude':[
    ['What affects pivotal altitude?','Pivotal altitude changes with groundspeed. The common training approximation in feet is groundspeed squared divided by 11.3.'],
    ['Why can pivotal altitude change during a maneuver?','Wind changes groundspeed around the maneuver, so the pivotal altitude can change as the aircraft changes direction relative to the wind.'],
    ['Is this a target altitude for every airplane?','No. It is a training calculation. Fly the maneuver according to instructor guidance, aircraft limitations, and the applicable training standards.']
  ],
  'standard-rate-bank':[
    ['What is a standard-rate turn?','A standard-rate turn is 3 degrees of heading change per second, or 360 degrees in about two minutes.'],
    ['Why is there a quick estimate and an exact value?','Training uses rules of thumb for mental math, while PilotDesk also calculates the coordinated-turn bank corresponding to 3 degrees per second.'],
    ['Should I chase the calculated bank angle in turbulence?','No. Use the aircraft instruments, procedures, and safe pilot technique. The calculation is an educational reference.']
  ],
  'maneuvering-speed-weight':[
    ['Why does maneuvering speed change with weight?','The commonly taught relationship adjusts maneuvering speed with the square root of the weight ratio. A lower operating weight generally produces a lower calculated value.'],
    ['Can I calculate an unpublished Va and treat it as a limitation?','No. Use the current POH or AFM. PilotDesk labels this as an estimate and does not create an approved operating limitation.'],
    ['What weight should I enter?','Use the relevant current aircraft weight when doing a training cross-check, and verify the manufacturer procedure for the actual aircraft.']
  ],
  'accelerated-stall':[
    ['Why does stall speed increase in a level turn?','In a coordinated level turn, load factor increases with bank angle. Stall speed increases approximately with the square root of load factor when configuration is otherwise unchanged.'],
    ['Does bank angle alone always determine stall speed?','No. Configuration, load factor, maneuvering, turbulence, and aircraft-specific characteristics matter. The calculator models a coordinated level-turn relationship.'],
    ['Where should I get actual stall speeds?','Use the current aircraft POH or AFM and applicable operating guidance.']
  ],
  'fuel-required':[
    ['What does this fuel calculator include?','It adds trip fuel and the entered reserve fuel, then compares the requirement with fuel on board.'],
    ['Does the reserve box automatically know the legal reserve?','No. You enter the reserve. Determine the applicable regulatory and operational fuel requirements for the flight before using the result.'],
    ['Should I use planned or actual fuel burn?','Use aircraft-specific approved or otherwise appropriate planning data, adjusted as required by the operating situation.']
  ],
  'wind-triangle':[
    ['What does a wind triangle solve?','It relates true course, true airspeed, wind direction, and wind speed to wind-corrected heading and groundspeed.'],
    ['What happens if the wind is too strong?','PilotDesk rejects combinations where a steady solution for the requested course is not physically possible.'],
    ['Does this replace current navigation data?','No. Verify winds, navigation data, magnetic variation where applicable, and operational planning with current sources.']
  ],
  'moment-cg':[
    ['How is center of gravity calculated?','Total center of gravity is total moment divided by total weight. A station moment is weight multiplied by arm.'],
    ['Does a calculated CG mean the aircraft is within limits?','No. A CG value must be compared with the current approved loading envelope and limitations for the exact aircraft.'],
    ['What units should I use?','Keep weight, arm, and moment units consistent with the aircraft loading data. Do not mix unit systems without converting them first.']
  ],
  'percent-mac':[
    ['What does percent MAC mean?','Percent MAC expresses the center-of-gravity position relative to the leading edge of the mean aerodynamic chord.'],
    ['What values do I need?','You need CG location, LEMAC, and mean aerodynamic chord length from appropriate aircraft data.'],
    ['Does a percent MAC result prove the loading is legal?','No. Compare the result with the approved aircraft envelope and limitations.']
  ],
  hydroplaning:[
    ['What is the dynamic hydroplaning rule of thumb?','A commonly taught estimate for minimum dynamic hydroplaning speed is about 9 times the square root of tire pressure in psi, producing a speed in knots.'],
    ['Is this a guaranteed hydroplaning speed?','No. Runway condition, tire condition, water depth, braking, and other factors matter. Treat it as an educational estimate, not a go/no-go value.'],
    ['Where should runway decisions come from?','Use current runway-condition information, aircraft guidance, airport data, and applicable operational procedures.']
  ]
};

function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){if(e.name==='.git'||e.name==='node_modules')continue;const p=path.join(dir,e.name);if(e.isDirectory())walk(p);else if(e.isFile()&&e.name.endsWith('.html'))processHtml(p)}}
function processHtml(file){let html=fs.readFileSync(file,'utf8'),before=html;
  html=html.replace(/<span class="brandmark">PD<\/span>/g,brand);
  html=html.replace(/<span class="brandmark"[^>]*>PD<\/span>/g,brand);
  const rel=path.relative(root,file).replaceAll('\\','/');
  const m=rel.match(/^calculators\/([^/]+)\/index\.html$/);if(m&&faqs[m[1]]&&!html.includes('data-pd-faq')){
    const items=faqs[m[1]].map(([q,a])=>`<details><summary><strong>${q}</strong></summary><p>${a}</p></details>`).join('');
    const block=`<section class="info-card" data-pd-faq><h2>Common questions</h2>${items}<p class="fine">General references: FAA pilot-training publications and the current aircraft POH/AFM where aircraft-specific information is required. PilotDesk is not FAA approved and does not replace approved flight information.</p></section>`;
    html=html.replace('</section><aside class="sidebar">',`${block}</section><aside class="sidebar">`);
  }
  if(before!==html)fs.writeFileSync(file,html);
}
walk(root);
console.log('Applied static PilotDesk branding and calculator FAQ content.');
