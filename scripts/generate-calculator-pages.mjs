import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const context={window:{}};
vm.createContext(context);
vm.runInContext(fs.readFileSync('assets/calculator-config.js','utf8'),context);
const calcs=context.window.PD_CALCS||[];

const categories={
  'Flight Planning':['crosswind','wind-triangle','time-speed-distance','fuel-required','endurance-range','top-of-descent','three-degree-descent','holding-leg-distance'],
  'Atmosphere & Weather':['pressure-altitude','density-altitude','isa-temperature','cloud-base','speed-of-sound','mach-number'],
  'Performance':['true-airspeed','climb-gradient','fpm-to-gradient','gradient-angle','glide-range','maneuvering-speed-weight','accelerated-stall','hydroplaning','wing-loading','power-loading','obstacle-gradient'],
  'Maneuvers & Turns':['pivotal-altitude','standard-rate-bank','load-factor','turn-radius','rate-of-turn'],
  'Navigation':['reciprocal-heading','true-magnetic','arc-distance','great-circle-distance','dms-decimal','nm-per-minute'],
  'Weight & Balance':['moment-cg','percent-mac','ballast','fuel-weight'],
  'Conversions':['speed-conversion','distance-conversion','temperature-conversion','weight-conversion','volume-conversion','pressure-conversion','vertical-speed-conversion']
};

const calcBySlug=new Map(calcs.map(c=>[c[0],c[2]]));
const categoryFor=slug=>Object.entries(categories).find(([,items])=>items.includes(slug))?.[0]||'Aviation';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const unit=u=>u?`<span>${esc(u)}</span>`:'';

const formulas={
  crosswind:'Crosswind = wind speed × sin(relative wind angle). Headwind or tailwind = wind speed × cos(relative wind angle).',
  windTriangle:'The wind triangle resolves the wind vector against the aircraft true-airspeed vector to solve wind-correction angle, heading and groundspeed.',
  tsd:'Distance = speed × time. Rearranging the same relationship gives time = distance ÷ speed and speed = distance ÷ time.',
  fuelRequired:'Trip fuel = fuel flow × trip time. Total required fuel adds the entered reserve quantity before comparing the result with fuel on board.',
  endurance:'Maximum endurance = usable fuel ÷ fuel flow. Reserve-adjusted endurance subtracts the entered reserve time before range is estimated from groundspeed.',
  tod:'Top-of-descent distance = altitude to lose ÷ selected descent gradient. Descent time then follows from groundspeed.',
  threeDegree:'Vertical speed = groundspeed × 6,076.1 ÷ 60 × tan(3°). The familiar groundspeed × 5 rule is a cockpit approximation.',
  holdDistance:'Distance = groundspeed × time, with knots converted from nautical miles per hour to nautical miles per second.',
  pressureAltitude:'Pressure altitude ≈ field elevation + (29.92 − altimeter setting) × 1,000 for the common training approximation.',
  densityAltitude:'PilotDesk derives dry-air density from pressure altitude and temperature, then converts that density to an ISA-equivalent altitude.',
  isaTemp:'In the lower standard atmosphere, ISA temperature decreases from 15°C at sea level at roughly 1.98°C per 1,000 feet.',
  cloudBase:'The convective cloud-base shortcut uses surface temperature/dew-point spread and a standard training approximation; it is not a ceiling forecast.',
  speedSound:'Local speed of sound is calculated from absolute temperature using the ideal-gas relationship for air.',
  mach:'Mach number = true airspeed ÷ local speed of sound, with local sound speed calculated from temperature.',
  tasApprox:'The 2% rule estimates TAS by increasing CAS about 2% per 1,000 feet. It is a training shortcut, not a precision air-data solution.',
  climbGradient:'Vertical speed (ft/min) = climb gradient (ft/NM) × groundspeed (NM/min).',
  fpmGradient:'Climb gradient (ft/NM) = vertical speed (ft/min) ÷ groundspeed (NM/min).',
  gradientAngle:'Flight-path gradient and angle are connected by tangent geometry; percent grade and feet per nautical mile are different ways to express the same slope.',
  glide:'Still-air glide distance = altitude available × glide ratio, then the horizontal distance is converted to nautical miles.',
  vaWeight:'Adjusted Va ≈ published Va × √(current weight ÷ published reference weight).',
  stallBank:'Accelerated stall speed = 1-G stall speed × √load factor, with coordinated level-turn load factor based on bank angle.',
  hydro:'FAA dynamic hydroplaning speed estimate ≈ 8.6 × √main tire pressure in psi. The commonly rounded 9 × √psi rule is a different approximation; neither establishes a safe speed or stopping distance.',
  wingLoading:'Wing loading = aircraft weight ÷ wing area.',
  powerLoading:'Power loading = aircraft weight ÷ horsepower.',
  obstacleGradient:'Required geometric gradient = obstacle height plus desired margin ÷ horizontal distance, with consistent units.',
  pivotal:'Pivotal altitude (ft AGL) ≈ groundspeed² ÷ 11.3 for the common knots-and-feet training rule.',
  stdRate:'A standard-rate turn changes heading about 3° per second. The exact coordinated bank depends on true airspeed.',
  loadFactor:'Load factor in a coordinated level turn = 1 ÷ cos(bank angle).',
  turnRadius:'Coordinated turn radius is determined by true airspeed and bank angle.',
  rateTurn:'Coordinated turn rate is determined by true airspeed and bank angle.',
  reciprocal:'A reciprocal direction is 180° opposite the original direction, normalized to the 001°–360° convention.',
  trueMag:'True and magnetic direction differ by magnetic variation; the sign convention must stay consistent through the conversion.',
  arcDistance:'Arc length equals the selected fraction of a circle multiplied by the circumference at the entered DME radius.',
  greatCircle:'Great-circle distance uses spherical geometry to estimate the shortest path between two latitude/longitude points.',
  dms:'Decimal degrees = degrees + minutes ÷ 60 + seconds ÷ 3,600, with the appropriate north/south or east/west sign.',
  nmMinute:'Nautical miles per minute = groundspeed in knots ÷ 60.',
  momentCg:'Moment = weight × arm. Loaded center of gravity = total moment ÷ total weight.',
  percentMac:'Percent MAC = (CG − LEMAC) ÷ MAC length × 100.',
  ballast:'The ballast equation balances the existing aircraft moment against the target CG and selected ballast arm.',
  fuelWeight:'Fuel weight = volume × entered fuel density.',
  speedConv:'One knot equals one nautical mile per hour, approximately 1.15078 mph, 1.852 km/h or 0.51444 m/s.',
  distanceConv:'One nautical mile equals 1.15078 statute miles, 1.852 kilometers or about 6,076.1 feet.',
  tempConv:'Celsius and Fahrenheit use different zero points and scale sizes; Kelvin is an absolute temperature scale.',
  weightConv:'One pound equals approximately 0.453592 kilograms.',
  volumeConv:'One U.S. gallon equals approximately 3.78541 liters.',
  pressureConv:'29.92 inHg is approximately 1013.25 hPa; the calculator applies the standard pressure-unit conversion.',
  verticalConv:'Vertical-speed units are converted from feet per minute into feet per second and meters per second.'
};

const guideFor={
  'crosswind':'/guides/crosswind-component.html','wind-triangle':'/guides/wind-triangle.html','time-speed-distance':'/guides/time-speed-distance.html','fuel-required':'/guides/fuel-planning.html','endurance-range':'/guides/fuel-planning.html#endurance-range','top-of-descent':'/guides/top-of-descent.html','three-degree-descent':'/guides/three-degree-descent.html','holding-leg-distance':'/guides/holding-leg-distance.html',
  'pressure-altitude':'/guides/pressure-altitude.html','density-altitude':'/guides/density-altitude.html','isa-temperature':'/guides/isa-temperature.html','cloud-base':'/guides/cloud-base-estimate.html','speed-of-sound':'/guides/mach-speed-of-sound.html','mach-number':'/guides/mach-speed-of-sound.html',
  'true-airspeed':'/guides/true-airspeed-rule.html','climb-gradient':'/guides/climb-gradient.html','fpm-to-gradient':'/guides/climb-rate-vs-climb-gradient.html','gradient-angle':'/guides/flight-path-gradient-angle.html','glide-range':'/guides/glide-range.html','maneuvering-speed-weight':'/guides/maneuvering-speed-weight.html','accelerated-stall':'/guides/accelerated-stall-load-factor.html','hydroplaning':'/guides/hydroplaning-speed.html','wing-loading':'/guides/wing-loading.html','power-loading':'/guides/power-loading.html','obstacle-gradient':'/guides/obstacle-climb-gradient.html',
  'pivotal-altitude':'/guides/pivotal-altitude.html','standard-rate-bank':'/guides/turn-radius-rate.html#standard-rate-turn','load-factor':'/guides/accelerated-stall-load-factor.html','turn-radius':'/guides/turn-radius-rate.html','rate-of-turn':'/guides/turn-radius-rate.html',
  'reciprocal-heading':'/guides/reciprocal-heading.html','true-magnetic':'/guides/true-magnetic-heading.html','arc-distance':'/guides/dme-arc-distance.html','great-circle-distance':'/guides/great-circle-distance.html','dms-decimal':'/guides/dms-coordinates.html','nm-per-minute':'/guides/nautical-miles-per-minute.html',
  'moment-cg':'/guides/moment-center-of-gravity.html','percent-mac':'/guides/percent-mac.html','ballast':'/guides/ballast-cg.html','fuel-weight':'/guides/avgas-weight-per-gallon.html#fuel-types',
  'speed-conversion':'/guides/aviation-speed-conversions.html','distance-conversion':'/guides/aviation-distance-conversions.html','temperature-conversion':'/guides/aviation-temperature-conversions.html','weight-conversion':'/guides/aircraft-weight-conversions.html','volume-conversion':'/guides/aviation-volume-conversions.html','pressure-conversion':'/guides/altimeter-pressure-conversions.html','vertical-speed-conversion':'/guides/vertical-speed-conversions.html'
};

const hubFor={
  'Flight Planning':['/e6b-flight-computer.html','Online E6B flight computer'],
  'Atmosphere & Weather':['/guides/aviation-weather-reference.html','Aviation weather reference'],
  'Performance':['/guides/aircraft-performance-reference.html','Aircraft performance reference'],
  'Maneuvers & Turns':['/guides/aircraft-performance-reference.html','Aircraft performance reference'],
  'Navigation':['/guides/navigation-reference.html','Pilot navigation reference'],
  'Weight & Balance':['/guides/aircraft-performance-reference.html','Aircraft performance and W&B reference'],
  'Conversions':['/guides/aviation-conversions.html','Aviation conversion reference']
};

// Keep the explanatory copy tied to the calculation on the page. Broad category
// advice made unrelated tools sound interchangeable and added little value.
const pageGuidance={
  'accelerated-stall':['Compare the calculated stall speed at the selected bank with the wings-level value. The increase comes from load factor; it does not account for aircraft-specific configuration or technique.','The multiplier shows how load factor raises the one-G stall speed. Use the aircraft’s published speeds and limitations for flight planning.','Do not enter a maneuvering speed where the calculator asks for one-G stall speed. Va and accelerated stall speed describe different things.'],
  'arc-distance':['Enter the DME radius and the angle swept along the arc. This gives the idealized path length around the station.','The arc length is useful for a geometry problem or a rough timing exercise. Actual DME is slant range, and published procedure instructions take precedence.','Use the angle change along the arc, not the difference between two DME readings. Keep radius in nautical miles and angle in degrees.'],
  'ballast':['Enter the current loading condition, target CG, and the arm where ballast would be placed. The result depends strongly on that arm.','The answer estimates ballast needed to reach the selected CG. Check the new total weight and the approved envelope before treating the loading as acceptable.','A ballast weight that moves CG in the right direction can still put the aircraft over a weight limit. Recalculate all stations and flight phases.'],
  'climb-gradient':['Enter the required climb gradient and groundspeed to find the vertical speed needed over the ground.','The FPM result is the climb rate needed to meet the entered ft/NM at that groundspeed. Compare aircraft capability using current performance data.','A climb rate in feet per minute is not the same as a climb gradient. Gradient changes with groundspeed even when vertical speed stays constant.'],
  'cloud-base':['Use the surface temperature and dew point to estimate a possible convective cloud base. Add field elevation only when you want the rough estimate expressed MSL.','This is a training shortcut based on a simplified rising-air model. It does not predict a ceiling or show cloud layers along a route.','Keep temperature and dew point in the same unit. A small spread can support low cloud or fog, but does not guarantee either.'],
  'crosswind':['Enter the runway direction and reported wind direction and speed. The angle between them determines how much wind acts across the runway.','Crosswind and headwind/tailwind components describe the reported wind relative to the runway. Compare them with the aircraft guidance and conditions at the time of use.','Runway numbers are rounded magnetic directions. Use the runway heading convention shown by the tool, and check gusts as a separate condition.'],
  'density-altitude':['Enter pressure altitude and outside-air temperature. The result compares the air density with the standard atmosphere.','Density altitude summarizes how thin the air is for performance thinking; it does not calculate takeoff distance or climb for a particular airplane.','Use pressure altitude rather than indicated altitude, and verify the temperature unit. Get aircraft performance from the correct POH or AFM chart.'],
  'distance-conversion':['Choose the source distance unit and enter the value you want converted. The page shows common aviation equivalents together.','All outputs describe the same distance in different units. Nautical miles are standard for most aviation route distances.','Check whether a chart or source uses nautical or statute miles before copying a number. The labels matter as much as the digits.'],
  'dms-decimal':['Enter degrees, minutes, seconds, and hemisphere, or provide decimal degrees for the reverse conversion.','The signed decimal result carries the hemisphere: north/east are positive and south/west are negative. The DMS output is normalized into minutes and seconds.','Minutes and seconds must be below 60. Confirm latitude and longitude were not swapped, and preserve the west/south sign when moving coordinates between systems.'],
  'endurance-range':['Enter usable fuel, fuel flow, reserve, and groundspeed. The remaining endurance and range are estimates for those assumptions.','Maximum endurance uses all entered usable fuel; reserve-adjusted range removes the reserve first. Neither result accounts for every taxi, climb, diversion, or regulatory requirement.','Use usable fuel and a realistic fuel flow, then keep the reserve definition consistent. Do not treat the displayed maximum as dispatch fuel.'],
  'fpm-to-gradient':['Enter vertical speed and groundspeed to convert a climb rate into feet per nautical mile and percent grade.','The gradient describes height gained over ground distance. The same FPM produces a smaller ft/NM value as groundspeed increases.','Use groundspeed for the conversion. Substituting indicated airspeed can materially overstate or understate the path over the terrain.'],
  'fuel-required':['Enter trip time, fuel flow, reserve, and fuel on board when available. Keep the time and fuel units consistent with the labels.','Trip fuel is the planned en-route burn; required fuel adds the entered reserve. The margin compares that amount with the fuel entered.','Do not omit taxi, climb, approach, alternate, or required reserve fuel just because the route-time calculation covers cruise. Apply the rules for the flight.'],
  'fuel-weight':['Enter the fuel volume and the density appropriate to the fuel and temperature assumption. The conversion is only as good as that density.','Fuel weight helps with loading calculations; it does not determine usable capacity or the correct fuel quantity for a specific airplane.','Do not assume every fuel type weighs the same per gallon. Use the aircraft documentation and the density or planning value appropriate to the situation.'],
  'glide-range':['Enter height available above the landing area and the glide ratio assumed for the exercise. The tool converts the still-air horizontal distance into useful units.','The result is geometric reach in still air. Wind, turns, maneuvering room, obstacles, speed control, and the airplane’s actual glide performance reduce the practical area.','Use height above the intended landing area, not simply indicated altitude. A generic glide ratio is not a substitute for the aircraft’s published best-glide procedure.'],
  'gradient-angle':['Enter either the angle or gradient to convert between slope descriptions. Percent grade and ft/NM are also shown for comparison.','The outputs express the same straight-line slope in different units. They do not include acceleration, wind, or aircraft performance.','Distinguish percent grade from feet per nautical mile. One nautical mile is about 6,076 feet, so the numeric values are not interchangeable.'],
  'great-circle-distance':['Enter the two latitude/longitude positions to estimate the shortest surface path on a spherical Earth.','Distance and initial bearing describe the direct great-circle path between the coordinates, not a cleared or terrain-checked route.','Check coordinate order and hemisphere signs before calculating. A swapped latitude and longitude can still produce a plausible-looking answer.'],
  'holding-leg-distance':['Enter groundspeed and leg time to estimate distance covered during that straight segment.','The result is the distance flown during the timed portion of a hold. Wind correction and turns affect the actual pattern and protected airspace.','Use groundspeed rather than indicated or true airspeed. The timing and entry procedure still come from current instructions and training.'],
  'hydroplaning':['Enter main-tire pressure to evaluate the FAA dynamic hydroplaning speed estimate. The output is a condition worth understanding, not a target speed.','The estimate concerns dynamic hydroplaning. Other forms can occur under different conditions, and this formula does not predict braking or stopping distance.','Do not use the result as a safe landing speed. Runway reports, aircraft guidance, contamination, and braking action remain central.'],
  'isa-temperature':['Enter altitude and compare its standard-atmosphere temperature with the actual air temperature you observed.','ISA temperature is a reference value. The deviation helps describe nonstandard temperature but does not by itself predict aircraft performance.','Check whether the altitude is feet or meters and temperature is Celsius. The standard lapse relationship applies only within the modeled atmospheric layer.'],
  'load-factor':['Enter bank angle for the idealized load factor in a coordinated, level turn.','Load factor rises as bank steepens. The stall multiplier shows the corresponding increase over the one-G stall speed.','This assumes a coordinated level turn. Pulling, turbulence, or other maneuvering can change load factor; respect aircraft limitations.'],
  'mach-number':['Enter true airspeed and local temperature to estimate Mach using the local speed of sound.','Mach is the ratio of true airspeed to sound speed in the surrounding air. Temperature changes the denominator, so the same TAS can produce a different Mach.','Use true airspeed, not indicated airspeed, and a representative air temperature. This simplified result is not a substitute for aircraft instruments or limits.'],
  'maneuvering-speed-weight':['Enter the published reference Va, its associated weight, and the current weight. The estimate scales Va with the square root of the weight ratio.','The output is an estimated weight adjustment to the published value. Use the exact aircraft documentation and applicable operating guidance.','Do not apply the adjustment outside the aircraft’s published assumptions or use Va as permission to make abrupt control inputs.'],
  'moment-cg':['Add each item’s weight and arm from the aircraft datum. The tool totals moments and divides total moment by total weight.','The loaded CG is the balance point for the entered items. Compare it with the aircraft’s approved envelope for the relevant loading condition.','Use arms from the same datum and current empty-weight records. A correct sum with one wrong station can put the result on the wrong side of the envelope.'],
  'nm-per-minute':['Enter groundspeed in knots to see the distance traveled each minute and the time needed for one nautical mile.','This is a quick mental-math bridge between speed and distance. It can help estimate timing, but not account for turns or changing groundspeed.','Knots are nautical miles per hour. Divide by 60 for NM per minute; do not read the knot value as distance per minute.'],
  'obstacle-gradient':['Enter obstacle height, any desired clearance margin, and horizontal distance. Keep all distance units consistent.','The answer is the geometric climb gradient needed to gain the entered height over the entered distance. It does not establish that an aircraft can achieve it.','Use the correct obstacle reference and add the margin required by the applicable procedure or planning method. Confirm performance with approved aircraft data.'],
  'percent-mac':['Enter loaded CG arm, LEMAC, and MAC length using the aircraft’s weight-and-balance references.','Percent MAC locates CG along the mean aerodynamic chord. Use the aircraft’s published envelope to decide whether that location is acceptable.','LEMAC and CG must use the same datum and units. A valid percentage alone says nothing about whether the aircraft is within limits.'],
  'pivotal-altitude':['Enter groundspeed for the training-rule estimate used in eights on pylons. Use groundspeed, not airspeed.','The output is an approximate AGL pivotal altitude for the selected groundspeed. It is a maneuver-training aid, not a terrain clearance altitude.','Keep knots and feet with the stated rule, and adjust for the actual wind and groundspeed. Follow the instructor’s procedure and maintain safe clearance.'],
  'power-loading':['Enter aircraft weight and horsepower to compare pounds per horsepower. Use figures that refer to the same aircraft and configuration.','Power loading is a broad comparison of installed power against weight. It cannot account for drag, propeller efficiency, density altitude, or actual climb capability.','Do not infer takeoff or climb performance from this ratio alone. Use current POH/AFM charts for the specific loading and conditions.'],
  'pressure-altitude':['Enter field elevation and the current altimeter setting. The pressure correction shows why the standard-setting altitude differs from field elevation.','Pressure altitude is a common reference for performance charts and density-altitude work. It is not the altimeter indication with the local setting.','The 1,000-feet-per-inch relationship is an approximation. Use the chart’s prescribed method and confirm the altimeter setting is current.'],
  'pressure-conversion':['Enter a pressure value and select its unit to see equivalent common pressure units.','The converted values express the same pressure. This is useful when aviation references or instruments present different units.','Check the source unit carefully; hPa and millibars are numerically equivalent, while inches of mercury and kilopascals use different scales.'],
  'rate-of-turn':['Enter true airspeed and bank angle to estimate turn rate, time for a full circle, and radius.','The outputs describe an idealized coordinated turn. They show how speed and bank change turn geometry.','Do not use the estimate as procedure guidance. Wind changes the ground track, and the calculation assumes coordinated flight at constant speed and bank.'],
  'reciprocal-heading':['Enter a heading or course to find the direction 180 degrees opposite.','The reciprocal is the opposite direction around the compass, normalized to the aviation 001°–360° convention.','A heading of 360° reciprocates to 180°; zero should be treated as north/360° under this display convention.'],
  'speed-conversion':['Enter a speed and choose its source unit. The page returns equivalents commonly used in aviation and general measurement.','The outputs are unit conversions, not wind corrections or airspeed corrections. The underlying speed remains unchanged.','Check whether the original value is knots, mph, km/h, or meters per second before copying it into another tool.'],
  'speed-of-sound':['Enter air temperature to estimate local sound speed and see how a selected Mach fraction relates to it.','Sound speed changes with absolute temperature. The Mach reference is therefore tied to the air temperature entered.','Use a temperature representative of the flight condition and the correct scale. Do not treat this as an aircraft operating limit.'],
  'standard-rate-bank':['Enter true airspeed to estimate the bank angle needed for a three-degree-per-second turn.','The exact value comes from turn geometry; the FAA quick estimate is shown for comparison. The two can differ as speed changes.','Use true airspeed for the geometric calculation. This is a study reference; follow the aircraft and instructor guidance for actual maneuvering.'],
  'temperature-conversion':['Enter a temperature in Celsius, Fahrenheit, or Kelvin to convert it to the other scales.','Celsius and Fahrenheit have different zero points; Kelvin starts at absolute zero. The outputs are equivalent temperatures.','Confirm the source scale before entering a value. A Celsius/Fahrenheit mix-up can be large enough to invalidate weather or performance work.'],
  'three-degree-descent':['Enter groundspeed to calculate the vertical speed for a three-degree path and compare it with the common groundspeed-times-five estimate.','The exact geometric rate and cockpit shortcut should be close at ordinary approach speeds, but are not identical.','Use groundspeed because the airplane covers ground distance at that rate. Follow published vertical guidance and procedure constraints.'],
  'time-speed-distance':['Enter any two of speed, distance, or time to solve for the third. For route timing, use groundspeed and keep time in hours or convert minutes first.','The three outputs are rearrangements of the same relationship. In flight planning, groundspeed connects route distance to estimated time.','Knots are per hour. Convert 30 minutes to 0.5 hour before multiplying, and use groundspeed rather than TAS for time over the ground.'],
  'top-of-descent':['Enter altitude to lose, groundspeed, and descent rate or gradient assumptions to estimate when to begin down.','The distance is a planning estimate for a steady descent. Winds, ATC, aircraft configuration, and required crossing restrictions change the actual profile.','Include the altitude you need to reach and allow time to slow or level. A simple calculation does not replace procedure or ATC constraints.'],
  'true-airspeed':['Enter calibrated airspeed and pressure altitude for the common 2% rule estimate. This shortcut illustrates why TAS rises with altitude.','The estimate is useful for mental-math practice. It is not a precise conversion from indicated airspeed or a replacement for aircraft instruments.','The rule is rough and degrades outside typical training conditions. Use the aircraft’s approved data and account for instrument and position errors.'],
  'true-magnetic':['Enter a direction and its reference, then apply the local magnetic variation with a consistent east/west sign.','The two outputs show the equivalent true and magnetic direction under the selected variation convention.','Confirm whether the source is true or magnetic before applying variation. A sign reversal can shift the answer by twice the variation.'],
  'turn-radius':['Enter true airspeed and bank angle to estimate the radius and diameter of a coordinated level turn.','The radius is the horizontal distance around the idealized turn. The calculated rate is included to show the same geometry from another angle.','The estimate excludes wind and assumes a coordinated level turn. Ground track radius will differ when wind is present.'],
  'vertical-speed-conversion':['Enter a vertical speed and its unit to convert between feet per minute, feet per second, and meters per second.','Each result represents the same climb or descent rate in another unit. This can help compare instruments, charts, or technical references.','Check whether the original figure is a rate or a total altitude change. The calculator converts units; it does not infer a descent profile.'],
  'volume-conversion':['Enter a volume and select the original unit to convert among U.S. gallons, liters, quarts, and imperial gallons.','The outputs are equivalent volumes. U.S. and imperial gallons differ, which matters when reading non-U.S. references.','Check the gallon type before using a fuel or capacity figure. A U.S. gallon is not the same as an imperial gallon.'],
  'weight-conversion':['Enter a weight and choose its source unit to convert among pounds, kilograms, and ounces.','The converted values represent the same mass/weight quantity under the units shown. Use the unit expected by the aircraft records or calculation.','Aircraft weight-and-balance data commonly uses pounds, but some references use kilograms. Confirm the unit at every transfer.'],
  'wind-triangle':['Enter true course, true airspeed, wind direction, and wind speed to solve for heading and groundspeed.','Wind correction angle shows how far to point into the wind to hold course; groundspeed shows progress along the route.','Pair true course with true wind direction and use groundspeed for ETA. If the wind exceeds the airplane’s ability to hold course, no steady solution exists.'],
  'wing-loading':['Enter aircraft weight and wing area using matching units for the airplane being considered.','Wing loading compares weight with planform area. It can help frame stall-speed and design comparisons, but does not predict performance by itself.','Use the correct wing area and loading weight. Do not compare published figures that were calculated under different definitions.']
};

const faqBySlug={
  crosswind:[
    ['How is crosswind component calculated?','The wind is resolved into components relative to the runway. Crosswind uses the sine of the relative angle; the along-runway headwind or tailwind component uses the cosine.'],
    ['How should I think about gusts?','If you want to examine the gust condition, run a separate scenario using the reported gust speed while keeping the wind direction consistent with the source. Compare the result with the aircraft and operating guidance that applies.'],
    ['Is demonstrated crosswind automatically a hard limitation?','Not always. Use the exact wording in the current POH or AFM and any operator or personal limits that apply to the flight.']
  ],
  'density-altitude':[
    ['Why does density altitude matter?','Higher density altitude means lower air density and can reduce engine, propeller, wing and climb performance. Use the aircraft performance charts for actual takeoff and landing planning.'],
    ['Is density altitude the same as pressure altitude?','No. Pressure altitude corrects for nonstandard pressure. Density altitude expresses the density of the air as an equivalent standard-atmosphere altitude and is strongly affected by temperature.'],
    ['Can this replace a POH performance chart?','No. The calculator explains and estimates the atmospheric quantity; aircraft-specific performance comes from approved aircraft data.']
  ],
  'pressure-altitude':[
    ['What is pressure altitude used for?','Pressure altitude is a standard reference used in aircraft performance calculations, density-altitude work and many POH or AFM charts.'],
    ['Why is 29.92 inHg important?','29.92 inHg is standard sea-level pressure in the U.S. altimeter system and is the reference setting used to define pressure altitude.'],
    ['Is the 1,000-feet-per-inch formula exact?','No. It is a common training approximation. Use the method specified by the aircraft or chart when precision matters.']
  ],
  'wind-triangle':[
    ['What does a wind triangle solve?','It combines course, true airspeed and wind to solve the heading needed to hold course, the resulting groundspeed and the wind-correction angle.'],
    ['Why must direction references be consistent?','A true course should be paired with a true wind reference, while magnetic values should be paired consistently. Mixing references can introduce an error roughly equal to local magnetic variation.'],
    ['What if the entered wind is stronger than the airplane can overcome?','Some combinations have no steady solution for the requested course. PilotDesk warns when the entered crosswind relationship makes the wind-triangle solution impossible.']
  ]
};

const seoTitleBySlug={
  'isa-temperature':'ISA Temperature Calculator | Standard Atmosphere | PilotDesk',
  'density-altitude':'Density Altitude Calculator for Pilots | PilotDesk',
  'rate-of-turn':'Rate 1 Turn Calculator | Turn Rate & Radius | PilotDesk',
  'turn-radius':'Aircraft Turn Radius Calculator | Speed & Bank Angle | PilotDesk',
  'true-airspeed':'True Airspeed Calculator | 2% TAS Rule Estimate | PilotDesk',
  'pivotal-altitude':'Pivotal Altitude Calculator | Eights on Pylons | PilotDesk',
  'glide-range':'Aircraft Glide Distance Calculator | Glide Ratio to NM | PilotDesk',
  'climb-gradient':'Climb Gradient Calculator | ft/NM to FPM | PilotDesk',
  'crosswind':'Crosswind Component Calculator & Chart | PilotDesk',
  'moment-cg':'Aircraft CG Calculator | Weight × Arm, Moment & CG | PilotDesk',
  'standard-rate-bank':'Standard Rate Turn Calculator | Rate 1 Bank Angle | PilotDesk',
  'wind-triangle':'Groundspeed & Wind Triangle Calculator | PilotDesk',
  'three-degree-descent':'3 Degree Descent Rate Calculator | FPM from Groundspeed | PilotDesk'
};

const seoDescriptionBySlug={
  'density-altitude':'Free aviation density altitude calculator. Enter pressure altitude and OAT to calculate density altitude, ISA temperature, and ISA deviation.',
  'rate-of-turn':'Free rate 1 turn and aircraft turn-rate calculator. Enter true airspeed and bank angle to calculate degrees per second, turn time, and turn radius.',
  'turn-radius':'Free aircraft turn radius calculator. Enter true airspeed and bank angle to calculate turn radius, turn diameter, and rate of turn.',
  'true-airspeed':'Free true airspeed calculator using the common 2% TAS rule. Estimate TAS from calibrated airspeed and pressure altitude for pilot training.',
  'pivotal-altitude':'Free pivotal altitude calculator for eights on pylons. Enter groundspeed in knots and calculate pivotal altitude in feet AGL with the GS² ÷ 11.3 formula.',
  'glide-range':'Free aircraft glide distance calculator. Enter height available and glide ratio to estimate still-air glide distance in nautical miles, feet, and statute miles.',
  'climb-gradient':'Free climb gradient calculator. Convert feet per nautical mile (ft/NM) and groundspeed into the required feet per minute (FPM) vertical speed.',
  'crosswind':'Free crosswind component calculator and quick chart. Enter runway heading, wind direction, and wind speed to calculate crosswind and headwind or tailwind.',
  'moment-cg':'Free aircraft CG calculator using weight × arm = moment. Calculate station moment, total moment, loaded center of gravity, and moment/1000.',
  'isa-temperature':'Free ISA temperature calculator and standard-atmosphere reference for pilots. Calculate ISA temperature by altitude using the lapse rate and formula.',
  'standard-rate-bank':'Free standard-rate turn calculator. Enter true airspeed to calculate the bank angle for a rate 1 turn at 3 degrees per second.',
  'wind-triangle':'Free groundspeed and wind triangle calculator. Solve wind-corrected heading, groundspeed, and wind correction angle from course, TAS, and wind.',
  'three-degree-descent':'Free 3 degree descent rate calculator. Enter groundspeed to calculate required feet per minute (FPM) and compare it with the groundspeed × 5 rule.'
};

const seoH1BySlug={
  'isa-temperature':'ISA Temperature Calculator by Altitude',
  'glide-range':'Aircraft Glide Distance Calculator'
};

const guideClusters={
  'glide-range':[
    ['/guides/how-far-can-an-airplane-glide.html','How far can an airplane glide?'],
    ['/guides/best-glide-speed-vs-glide-ratio.html','Best glide speed vs glide ratio'],
    ['/guides/emergency-glide-planning.html','Emergency glide planning']
  ]
};

const sourceNotes={
  'glide-range':'<p>Still-air estimate only. Confirm best-glide speed and performance for the exact aircraft in its current POH or AFM. Wind, turns, obstacles, and the landing area available can all reduce practical reach.</p>',
  'hydroplaning':'<p>The FAA Airplane Flying Handbook gives the dynamic estimate as 8.6 × √(main-tire pressure in PSI). At 36 PSI, that is 51.6 knots. This estimate does not predict a safe speed or stopping distance; viscous hydroplaning can occur below it. See the FAA <a href="https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/airplane_handbook/10_afh_ch9.pdf" target="_blank" rel="noopener">Airplane Flying Handbook, Chapter 9</a>.</p>'
};

for(const [slug,key,title,desc,fields,results] of calcs){
  const category=categoryFor(slug);
  const dir=path.join('calculators',slug);
  const file=path.join(dir,'index.html');
  fs.mkdirSync(dir,{recursive:true});

  const formula=formulas[key]||`${title} uses the entered values to compute the displayed outputs with the standard arithmetic relationship for this aviation problem.`;
  const fieldNames=fields.map(x=>x[1]);
  const resultNames=results;
  const metaCandidate=desc.length<118?`${desc} Free browser-based aviation calculator for pilots and flight students.`:desc;
  const defaultMetaDesc=metaCandidate.length>158?metaCandidate.slice(0,155).replace(/\s+\S*$/,'')+'…':metaCandidate;
  const metaDesc=seoDescriptionBySlug[slug]||defaultMetaDesc;
  const titleTag=seoTitleBySlug[slug]||`${title} Calculator for Pilots | PilotDesk`;

  const siblings=(categories[category]||[]).filter(x=>x!==slug);
  const position=Math.max(0,(categories[category]||[]).indexOf(slug));
  const relatedSlugs=[...siblings.slice(position,position+4),...siblings.slice(0,4)].slice(0,4);
  const relatedLinks=relatedSlugs.map(x=>`<a href="/calculators/${x}/">${esc(calcBySlug.get(x)||x)}</a>`).join('');
  const guideLink=guideFor[slug]?`<a href="${guideFor[slug]}">Read the ${esc(title)} guide</a>`:'';
  const guideClusterLinks=(guideClusters[slug]||[]).map(([href,label])=>`<a href="${href}">${esc(label)}</a>`).join('');
  const [hubUrl,hubLabel]=hubFor[category]||['/guides.html','Aviation guides'];
  const hubLink=`<a href="${hubUrl}">${esc(hubLabel)}</a>`;
  const mathLink='<a href="/guides/pilot-math-formulas.html">Pilot math formula reference</a>';
  const e6bLink='<a href="/e6b-flight-computer.html">Online E6B flight computer</a>';
  const sourcesLink='<a href="/sources.html">Sources and methods</a>';
  const supportLinks=[hubLink,mathLink,e6bLink,sourcesLink].filter((link,index,all)=>{
    const href=link.match(/href="([^"]+)"/)?.[1];
    return href&&all.findIndex(x=>x.includes(`href="${href}"`))===index;
  }).join('');
  // Keep FAQs only where we have answers written for this specific calculation.
  // The repeated category-wide questions added length without helping pilots use the tool.
  const faq=faqBySlug[slug]||[];
  const faqHtml=faq.map(([q,a])=>`<details><summary><strong>${esc(q)}</strong></summary><p>${esc(a)}</p></details>`).join('');

  const inputList=fields.map(([,label,,u])=>`<li><strong>${esc(label)}</strong>${u?` — enter the value in ${esc(u)}.`:'.'}</li>`).join('');
  const guidance=pageGuidance[slug];
  if(!guidance) throw new Error(`Missing page-specific calculator guidance for ${slug}`);
  const educational=`<div class="info-card" data-pd-seo-depth="1">
    <h2>How to use the ${esc(title)} calculator</h2>
    <p>${esc(guidance[0])}</p>
    <h3>Inputs</h3><ul>${inputList}</ul>
    <h2>Formula and method</h2>
    <p>${esc(formula)}</p>
    <h2>What the result means</h2>
    <p>${esc(guidance[1])}</p>
    <h2>Common mistakes to avoid</h2>
    <p>${esc(guidance[2])}</p>
    ${sourceNotes[slug]||''}</div>
  ${faq.length?`<section class="info-card" data-pd-faq><h2>${esc(title)} questions</h2>${faqHtml}</section>`:''}`;

  const appSchema={'@context':'https://schema.org','@type':'WebApplication',name:`${title} Calculator`,applicationCategory:'UtilitiesApplication',operatingSystem:'Any',isAccessibleForFree:true,offers:{'@type':'Offer',price:'0',priceCurrency:'USD'},url:`https://www.pilot-desk.com/calculators/${slug}/`,description:metaDesc,featureList:[...fieldNames,...resultNames],audience:{'@type':'Audience',audienceType:'Pilots, flight students, and aviation educators'},isPartOf:{'@type':'WebSite',name:'PilotDesk',url:'https://www.pilot-desk.com/'},publisher:{'@type':'Organization',name:'PilotDesk',url:'https://www.pilot-desk.com/',logo:{'@type':'ImageObject',url:'https://www.pilot-desk.com/favicon.svg'}}};
  const crumbSchema={'@context':'https://schema.org','@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'Calculators',item:'https://www.pilot-desk.com/'},{'@type':'ListItem',position:2,name:category,item:`https://www.pilot-desk.com/#${encodeURIComponent(category.toLowerCase())}`},{'@type':'ListItem',position:3,name:title,item:`https://www.pilot-desk.com/calculators/${slug}/`} ]};
  const schemas=`<script type="application/ld+json" data-pd-static-calc-schema="1">${JSON.stringify(appSchema)}</script><script type="application/ld+json" data-pd-static-breadcrumbs="1">${JSON.stringify(crumbSchema)}</script>`;

  let html=`<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(titleTag)}</title><meta name="description" content="${esc(metaDesc)}"><meta name="robots" content="index,follow,max-image-preview:large"><meta name="theme-color" content="#08090b"><meta name="color-scheme" content="dark light"><meta property="og:title" content="${esc(titleTag)}"><meta property="og:description" content="${esc(metaDesc)}"><meta property="og:type" content="website"><meta property="og:url" content="https://www.pilot-desk.com/calculators/${slug}/"><meta property="og:image" content="https://www.pilot-desk.com/assets/pilot-math-reference.svg"><meta name="twitter:card" content="summary_large_image"><link rel="canonical" href="https://www.pilot-desk.com/calculators/${slug}/"><link rel="stylesheet" href="/assets/styles.css"><link rel="manifest" href="/site.webmanifest"><link rel="icon" href="/favicon.svg" type="image/svg+xml"><script defer src="/assets/safety.js"></script><script defer src="/assets/site.js"></script><script defer src="/assets/ad-config.js"></script><script defer src="/assets/ads.js"></script>${schemas}</head><body data-calc="${esc(key)}"><a class="skip-link" href="#main-content">Skip to main content</a><header class="topbar"><a class="brand" href="/"><span class="brandmark" aria-hidden="true"><img src="/favicon.svg" alt="" width="36" height="36"></span><span><b>PilotDesk</b><small>FLIGHT TOOLS</small></span></a><nav><a href="/">Calculators</a><a href="/airport.html">Airports</a><a href="/weather.html">Weather</a><a href="/aircraft.html">Hangar</a><a href="/guides.html">Guides</a><a href="/about.html">About</a></nav></header><main class="shell" id="main-content"><div class="breadcrumbs"><a href="/">Calculators</a> / ${esc(category)} / ${esc(title)}</div><div class="safety-strip"><strong>Verify before flight.</strong> Check the POH/AFM for aircraft-specific limits and performance.</div><div class="calculator-layout"><section class="calc-main"><div class="calc-hero"><span class="badge">${esc(category)}</span><h1>${esc(seoH1BySlug[slug]||(`${title} Calculator`))}</h1><p>${esc(desc)}</p></div><div class="calc-box"><div class="fields">${fields.map(([id,label,value,u])=>`<div class="field"><label for="${esc(id)}">${esc(label)}</label><div class="input-wrap"><input data-calc-input id="${esc(id)}" step="any" type="number" value="${esc(value)}">${unit(u)}</div></div>`).join('')}</div><button class="calc-btn" data-calculate type="button">Calculate</button><div class="results">${results.map((r,i)=>`<div class="result${i===0?' primary':''}"><small>${esc(r)}</small><strong id="out${i}">—</strong></div>`).join('')}</div></div><div class="ad-wrap" style="margin-top:32px;margin-bottom:32px"><div class="ad-label">ADVERTISEMENT</div><div class="ad-slot" data-ad-slot="content"><span>Ad space</span></div></div>${educational}</section><aside class="sidebar"><div class="side-card"><h3>Related pilot tools</h3><div class="related">${relatedLinks}${guideLink}${guideClusterLinks}${supportLinks}</div></div><div class="ad-wrap"><div class="ad-label">ADVERTISEMENT</div><div class="ad-slot" data-ad-slot="sidebar"><span>Ad space</span></div></div></aside></div></main><footer><div><b>PilotDesk</b><p>Free pilot calculators, aviation weather tools and training references.</p></div><div class="footer-links"><a href="/guides.html">Guides</a><a href="/flight-training.html">Flight training</a><a href="/about.html">About</a><a href="/legal/privacy.html">Privacy</a><a href="/legal/terms.html">Terms</a><a href="/legal/disclaimer.html">Disclaimer</a><a href="/legal/safety.html">Safety</a><a href="/sources.html">Sources</a></div></footer></body></html>`;

  fs.writeFileSync(file,html);
}

console.log(`Generated ${calcs.length} calculator pages with deeper educational content, semantic internal links, social metadata and structured data.`);
