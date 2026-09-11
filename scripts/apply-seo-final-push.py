from pathlib import Path
import json, re

# Improve search snippets at the source so regenerated calculator pages keep them.
p=Path('assets/calculator-config.js')
s=p.read_text()
replacements={
'Estimate stall speed at bank angle from 1-G stall speed.':'Estimate accelerated stall speed and load factor from 1-G stall speed and bank angle for coordinated level-turn training.',
'Calculate arc length for a given radius and number of degrees flown.':'Calculate DME arc distance from radius and degrees flown, with circumference and fraction-of-circle outputs for navigation practice.',
'Convert vertical speed and groundspeed into ft/NM climb gradient.':'Convert vertical speed and groundspeed into climb gradient in ft/NM, percent grade, and climb angle for departure planning checks.',
'Calculate trip fuel, reserve fuel, required fuel, and fuel remaining.':'Calculate trip fuel, reserve fuel, total fuel required, and remaining fuel margin from fuel burn, time, and fuel on board.',
'Convert common aviation fuel volume to approximate weight.':'Convert aviation fuel volume to approximate weight using an entered fuel density, with pounds, kilograms, and liters shown.',
'Convert flight-path angle to gradient and gradient to angle.':'Convert flight-path angle to ft/NM gradient and percent grade, or convert an entered gradient back to an angle.',
'Estimate distance flown during a timed holding leg.':'Estimate holding-leg distance from groundspeed and leg time, with nautical miles per minute and feet traveled.',
'Rule-of-thumb dynamic hydroplaning speed from tire pressure.':'Estimate dynamic hydroplaning speed from tire pressure using the common aviation rule of thumb for training and planning.',
'Calculate coordinated level-turn load factor at a bank angle.':'Calculate coordinated level-turn load factor, stall-speed multiplier, and lift increase from the selected bank angle.',
'Estimate Mach number from true airspeed and temperature.':'Estimate Mach number from true airspeed and outside air temperature, including the local speed of sound.',
'Calculate moment from a station and CG from total moment/weight.':'Calculate station moment and aircraft center of gravity from weight, arm, total moment, and total weight.',
'Calculate center of gravity as percent mean aerodynamic chord.':'Calculate aircraft center of gravity as percent mean aerodynamic chord from CG location, LEMAC, and MAC length.',
'Calculate aircraft power loading and horsepower per 1,000 lb.':'Calculate aircraft power loading in pounds per horsepower and horsepower per 1,000 pounds from weight and engine power.',
'Convert inches of mercury to hPa/millibars and kPa.':'Convert aviation pressure between inches of mercury, hPa or millibars, and kPa for altimeter and weather checks.',
'Find the reciprocal of any heading or course.':'Find the reciprocal heading or course for any entered direction and verify the 180-degree opposite direction.',
'Convert knots, mph, km/h, and meters per second.':'Convert aviation speed between knots, miles per hour, kilometers per hour, and meters per second.',
'Estimate local speed of sound from outside air temperature.':'Estimate the local speed of sound from outside air temperature and compare the result with a Mach 0.80 reference.',
'Convert Celsius to Fahrenheit and Kelvin.':'Convert temperature between Celsius, Fahrenheit, and Kelvin for aviation weather and performance calculations.',
'Estimate vertical speed required for a 3-degree flight path.':'Estimate vertical speed for a 3-degree descent from groundspeed and compare the exact result with the groundspeed-times-five rule.',
'Solve flight time, distance, or groundspeed.':'Solve flight time, distance, and groundspeed together for quick cross-country planning and time-speed-distance checks.',
'Convert feet per minute to feet per second and meters per second.':'Convert vertical speed from feet per minute to feet per second and meters per second for climb and descent calculations.',
'Convert U.S. gallons to liters, quarts, and imperial gallons.':'Convert U.S. gallons to liters, U.S. quarts, and imperial gallons for aviation fuel and volume planning.',
'Convert pounds to kilograms and ounces.':'Convert aircraft and payload weight between pounds, kilograms, and ounces for aviation loading and planning.',
'Calculate aircraft wing loading.':'Calculate aircraft wing loading in pounds per square foot from aircraft weight and wing area.'
}
for old,new in replacements.items():
    if old not in s:
        raise SystemExit(f'missing calculator description: {old}')
    s=s.replace(old,new,1)
p.write_text(s)

# Tighten the guide hub title/snippet.
p=Path('guides.html'); s=p.read_text()
s=s.replace('<title>Aviation Guides | PilotDesk</title>','<title>Pilot Aviation Guides & Flight Training Reference | PilotDesk</title>')
s=re.sub(r'<meta name="description" content="[^"]*">','<meta name="description" content="Aviation guides for METARs, flight planning, crosswind, altitude, climb, descent, fuel, weight and balance, navigation, and pilot math.">',s,count=1)
p.write_text(s)

# Add useful page-type schema where the live audit found none.
def add_jsonld(path, data, marker):
    p=Path(path); s=p.read_text()
    if marker in s: return
    tag=f'<script type="application/ld+json" {marker}>{json.dumps(data,separators=(",",":"))}</script>'
    s=s.replace('</head>',tag+'</head>',1)
    p.write_text(s)

org={'@type':'Organization','name':'PilotDesk','url':'https://www.pilot-desk.com/','logo':{'@type':'ImageObject','url':'https://www.pilot-desk.com/assets/icon.svg'}}
add_jsonld('about.html',{'@context':'https://schema.org','@type':'AboutPage','name':'About PilotDesk','url':'https://www.pilot-desk.com/about.html','description':'About PilotDesk aviation calculators, weather, planning, aircraft, and training tools.','about':org},'data-pd-about-schema="1"')
add_jsonld('sources.html',{'@context':'https://schema.org','@type':'WebPage','name':'PilotDesk Aviation Sources and Methods','url':'https://www.pilot-desk.com/sources.html','description':'FAA references, aviation formulas, live weather sources, and calculation methods used by PilotDesk.','publisher':org},'data-pd-sources-schema="1"')
add_jsonld('aircraft.html',{'@context':'https://schema.org','@type':'WebApplication','name':'PilotDesk Aircraft Profiles and Hangar','url':'https://www.pilot-desk.com/aircraft.html','applicationCategory':'UtilitiesApplication','operatingSystem':'Any','isAccessibleForFree':True,'offers':{'@type':'Offer','price':'0','priceCurrency':'USD'},'publisher':org},'data-pd-aircraft-schema="1"')
add_jsonld('procedures.html',{'@context':'https://schema.org','@type':'WebApplication','name':'PilotDesk FAA Procedures Viewer','url':'https://www.pilot-desk.com/procedures.html','applicationCategory':'UtilitiesApplication','operatingSystem':'Any','isAccessibleForFree':True,'offers':{'@type':'Offer','price':'0','priceCurrency':'USD'},'publisher':org},'data-pd-procedures-schema="1"')
add_jsonld('embed.html',{'@context':'https://schema.org','@type':'WebPage','name':'Embed a PilotDesk Aviation Calculator','url':'https://www.pilot-desk.com/embed.html','description':'Instructions for embedding free PilotDesk aviation calculator widgets on flight-school, club, and aviation websites.','publisher':org},'data-pd-embed-schema="1"')
add_jsonld('weight-balance.html',{'@context':'https://schema.org','@type':'WebApplication','name':'Aircraft Weight & Balance Calculator','url':'https://www.pilot-desk.com/calculators/weight-balance-builder/','description':'Calculate aircraft departure and landing weight, moment, and center of gravity with custom stations, fuel, and entered envelope limits.','applicationCategory':'UtilitiesApplication','operatingSystem':'Any','isAccessibleForFree':True,'offers':{'@type':'Offer','price':'0','priceCurrency':'USD'},'publisher':org},'data-pd-wb-schema="1"')
add_jsonld('weight-balance.html',{'@context':'https://schema.org','@type':'BreadcrumbList','itemListElement':[{'@type':'ListItem','position':1,'name':'Calculators','item':'https://www.pilot-desk.com/'},{'@type':'ListItem','position':2,'name':'Weight & Balance Builder','item':'https://www.pilot-desk.com/calculators/weight-balance-builder/'}]},'data-pd-wb-breadcrumbs="1"')

# Keep local-state pages out of search results so discovery is focused on durable public content.
for path in ['flights.html','flight-brief.html','changelog.html']:
    p=Path(path); s=p.read_text()
    s=re.sub(r'<meta\s+name=["\']robots["\']\s+content=["\'][^"\']*["\']\s*/?>','<meta name="robots" content="noindex,follow">',s,count=1,flags=re.I)
    if 'name="robots"' not in s and "name='robots'" not in s:
        s=s.replace('</title>','</title><meta name="robots" content="noindex,follow">',1)
    p.write_text(s)

# Make the Sources title more descriptive without padding the page.
p=Path('sources.html'); s=p.read_text().replace('<title>Sources & Methods | PilotDesk</title>','<title>Aviation Sources, Formulas & Methods | PilotDesk</title>'); p.write_text(s)

# Add social-preview metadata to the two pillar pages.
for path in ['guides/pilot-math-formulas.html','guides/aviation-math-glossary.html']:
    p=Path(path); s=p.read_text()
    if 'property="og:image"' not in s:
        title=re.search(r'<title>(.*?)</title>',s).group(1)
        desc=re.search(r'<meta name="description" content="([^"]*)">',s).group(1)
        canonical=re.search(r'<link rel="canonical" href="([^"]*)">',s).group(1)
        social=f'<meta property="og:title" content="{title}"><meta property="og:description" content="{desc}"><meta property="og:type" content="article"><meta property="og:url" content="{canonical}"><meta property="og:image" content="https://www.pilot-desk.com/assets/pilot-math-reference.svg"><meta name="twitter:card" content="summary_large_image">'
        s=s.replace('</title>','</title>'+social,1)
        p.write_text(s)

print('Final SEO quality pass applied')
