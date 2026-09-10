from pathlib import Path
import re, json

SITE='https://www.pilot-desk.com'
PUBLISH='2026-09-10'

extras={
'guides/density-altitude.html': '''<h2>Worked example</h2><p>Say an airport is at 5,000 feet and the altimeter setting is 30.12. The quick pressure-altitude estimate is about 4,800 feet. If the temperature is 30°C, ISA temperature near that altitude is only about 5°C. The day is roughly 25°C warmer than standard. Using the common 120-feet-per-degree shortcut puts density altitude near 7,800 feet. That estimate is useful for a reasonableness check; use the airplane's current POH or AFM charts for takeoff, climb, and landing performance.</p><h2>Common mistakes</h2><p>Watch the sign when correcting field elevation for altimeter setting, use the actual outside-air temperature, and do not treat density altitude by itself as a takeoff-distance answer. Two airplanes at the same density altitude can have very different performance because of weight, configuration, runway surface, wind, and aircraft-specific limitations.</p>''',
'guides/pressure-altitude.html': '''<h2>Worked examples</h2><p>At a 2,500-foot airport with an altimeter setting of 30.12, the setting is 0.20 inHg above standard. The quick estimate subtracts about 200 feet, giving roughly 2,300 feet pressure altitude. With an altimeter setting of 29.72, the setting is 0.20 below standard, so the quick estimate adds about 200 feet and gives roughly 2,700 feet.</p><h2>A quick sign check</h2><p>Lower pressure should produce a higher pressure altitude, and higher pressure should produce a lower pressure altitude. If your answer moves the other way, check the subtraction before using it. For aircraft performance planning, use the pressure-altitude method and corrections specified by the current POH or AFM.</p>''',
'guides/three-degree-descent.html': '''<h2>Worked example</h2><p>At 120 knots groundspeed, the common cockpit shortcut is 120 × 5, or about 600 feet per minute. The trigonometric value for an exact 3° path is about 636 feet per minute. The shortcut is easy to do mentally; the exact calculation is useful when you want a tighter cross-check.</p><h2>Groundspeed is the input that matters</h2><p>A headwind or tailwind changes groundspeed and therefore changes the vertical speed needed to hold the same path angle. At 90 knots the quick estimate is about 450 feet per minute; at 150 knots it is about 750. Recheck the number when groundspeed changes substantially during descent.</p><h2>Distance check</h2><p>A 3° path is close to 3 nautical miles for every 1,000 feet you need to lose. That is a planning shortcut, not clearance to descend and not a substitute for published procedure restrictions.</p>''',
'guides/fuel-planning.html': '''<h2>Worked example</h2><p>If the planned flight time is 2.4 hours and cruise fuel burn is 9 gallons per hour, cruise fuel is 21.6 gallons. A 30-minute reserve at the same burn rate adds 4.5 gallons, bringing that simple total to 26.1 gallons before any separate allowance for start, taxi, climb, holding, an alternate, or other required fuel.</p><h2>Do not mix time and fuel units</h2><p>Convert minutes to hours before multiplying by gallons per hour. Thirty minutes is 0.5 hour, not 0.30 hour. Also make sure the burn rate matches the phase of flight you are calculating; climb fuel flow can differ significantly from cruise.</p><h2>Build margin from real aircraft data</h2><p>Use current POH or AFM performance information, actual usable fuel, forecast winds, routing, expected delays, and the fuel requirements that apply to the flight. A calculator can total the numbers, but the quality of the plan still depends on the inputs.</p>''',
'guides/pivotal-altitude.html': '''<h2>Worked examples</h2><p>Using the common knots formula, 100 knots groundspeed gives about 885 feet AGL because 100² ÷ 11.3 is about 885. At 120 knots, the result rises to about 1,274 feet AGL. The squared term matters: a modest groundspeed increase produces a much larger pivotal-altitude increase.</p><h2>Why wind changes the picture</h2><p>Pivotal altitude depends on groundspeed, not indicated airspeed. During a maneuver around a point, groundspeed changes as the airplane moves between upwind and downwind portions. That means the pivotal altitude is not one fixed number for the entire maneuver. The calculator gives a starting estimate for a particular groundspeed; use the visual relationship, aircraft limitations, and instructor guidance while flying the maneuver.</p>''',
'guides/wind-triangle.html': '''<h2>Worked example</h2><p>Suppose true course is 090°, true airspeed is 100 knots, and the wind is from 180° at 20 knots. That is essentially a pure crosswind from the right. The wind-correction angle is about 11.5° into the wind, so the required true heading is about 102°. Groundspeed is about 98 knots. This is a useful check because a pure crosswind should change heading more than groundspeed.</p><h2>Common wind-triangle mistakes</h2><p>Aviation winds are reported as the direction they come <em>from</em>, not the direction they are blowing toward. Keep true course with true wind unless you deliberately convert both to magnetic. Also check that the wind speed is realistic relative to true airspeed; when the crosswind component approaches or exceeds TAS, the normal small-angle mental shortcuts stop being useful.</p><h2>Recheck when the forecast changes</h2><p>Heading, groundspeed, time, and fuel are linked. A different wind can change all four, so update the wind triangle when the forecast or planned altitude changes.</p>'''
}

org={'@type':'Organization','name':'PilotDesk','url':SITE+'/','logo':{'@type':'ImageObject','url':SITE+'/assets/icon.svg'}}
for path,extra in extras.items():
    p=Path(path); s=p.read_text()
    if extra.split('</h2>')[0].replace('<h2>','') not in s:
        s=s.replace('<div class="pd-actions">',extra+'<div class="pd-actions">',1)
    title=re.search(r'<title>(.*?)</title>',s).group(1).replace(' | PilotDesk','')
    desc=re.search(r'<meta name="description" content="([^"]*)">',s).group(1)
    schema={'@context':'https://schema.org','@type':'Article','headline':title,'description':desc,'image':SITE+'/assets/icon.svg','datePublished':PUBLISH,'dateModified':PUBLISH,'mainEntityOfPage':SITE+'/'+path,'author':org,'publisher':org}
    tag=f'<script type="application/ld+json" data-pd-guide-schema="1">{json.dumps(schema,separators=(",",":"))}</script>'
    old=re.search(r'<script type="application/ld\+json" data-pd-guide-schema="1">.*?</script>',s)
    if old: s=s[:old.start()]+tag+s[old.end():]
    else: s=s.replace('</head>',tag+'</head>',1)
    p.write_text(s)

# Give two useful tools clearer search-result titles.
for path,old,new in [
('planner.html','<title>Flight Planner | PilotDesk</title>','<title>Pilot Flight Planner &amp; Aviation Tools | PilotDesk</title>'),
('poh-chart-studio.html','<title>POH Chart Studio | PilotDesk</title>','<title>Aircraft POH Performance Chart Practice | PilotDesk</title>')]:
    p=Path(path); s=p.read_text(); p.write_text(s.replace(old,new,1))

# The calculator descriptions from the config are already descriptive. Do not append boilerplate that pushes snippets over Google's usual display length.
g=Path('scripts/generate-calculator-pages.mjs'); s=g.read_text()
s=s.replace('<meta name="description" content="${esc(desc)} Pilot calculator with the formula, sample inputs, and references.">','<meta name="description" content="${esc(desc)}">')
g.write_text(s)
print('SEO content pass applied')
