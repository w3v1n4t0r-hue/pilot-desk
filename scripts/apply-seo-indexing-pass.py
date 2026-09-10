from pathlib import Path
import re, json

SITE='https://www.pilot-desk.com'

def replace_description(path, description):
    p=Path(path); s=p.read_text()
    s2,n=re.subn(r'<meta name="description" content="[^"]*">', f'<meta name="description" content="{description}">', s, count=1)
    if not n:
        s2,n=re.subn(r'<meta content="[^"]*" name="description"\s*/?>', f'<meta content="{description}" name="description"/>', s, count=1)
    if n: p.write_text(s2)

def add_schema(path, data, marker='data-pd-static-schema'):
    p=Path(path); s=p.read_text()
    if marker in s: return
    tag=f'<script type="application/ld+json" {marker}="1">{json.dumps(data,separators=(",",":"))}</script>'
    if '</head>' not in s: raise SystemExit(f'No head in {path}')
    p.write_text(s.replace('</head>',tag+'</head>',1))

# Keep important search snippets short and descriptive.
descriptions={
'index.html':'Free aviation calculators and pilot tools for flight planning, weather, weight and balance, performance, navigation, and training.',
'planner.html':'Plan flights with airport search, weather, routes, saved flights, aircraft profiles, briefs, procedures, and pilot calculators.',
'airport.html':'Search airports by identifier, city, or name and view METARs, TAFs, nearby stations, runway wind, FAA procedures, and planning links.',
'weather.html':'Check current METARs and TAFs with decoded conditions, nearby stations, observation age, and links to official aviation weather sources.',
'route-planner.html':'Build an FAA chart route and navlog with weather checks, procedures, distance, time, and fuel estimates for flight planning and study.',
'metar-decoder.html':'Decode METAR aviation weather reports group by group, or load a current station report and see what each code means.',
'weight-balance.html':'Calculate aircraft weight, moment, and center of gravity with custom stations and limits. Verify loading with the current POH or AFM.',
'poh-chart-studio.html':'Practice reading aircraft POH performance charts with custom chart points, interpolation, and worked training scenarios.'
}
for p,d in descriptions.items(): replace_description(p,d)

org={'@type':'Organization','name':'PilotDesk','url':SITE+'/','logo':{'@type':'ImageObject','url':SITE+'/assets/icon.svg'}}
add_schema('index.html',{'@context':'https://schema.org','@graph':[{'@type':'WebSite','name':'PilotDesk','url':SITE+'/','description':descriptions['index.html']},org]})
for path,name in [
('flight-training.html','PilotDesk for Flight Training'),
('planner.html','PilotDesk Flight Planner'),
('route-planner.html','PilotDesk FAA Chart Route Planner'),
('checklist-trainer.html','PilotDesk Aircraft Checklist Trainer'),
('poh-chart-studio.html','PilotDesk POH Chart Studio')]:
    desc=descriptions.get(path,'Free PilotDesk aviation planning and training tool.')
    add_schema(path,{'@context':'https://schema.org','@type':'WebApplication','name':name,'url':SITE+'/'+path,'description':desc,'applicationCategory':'UtilitiesApplication','operatingSystem':'Any','isAccessibleForFree':True,'publisher':org})

# Generated calculator pages should carry static schema so crawlers can understand them before JS runs.
g=Path('scripts/generate-calculator-pages.mjs'); s=g.read_text()
if 'data-pd-static-calc-schema' not in s:
    s=s.replace('const html=`<!DOCTYPE html>', 'let html=`<!DOCTYPE html>',1)
    tail=';fs.writeFileSync(file,html)}\nconsole.log(`Generated ${calcs.length} calculator pages with static educational content and formula disclosures.`);'
    repl=';const appSchema={\'@context\':\'https://schema.org\',\'@type\':\'WebApplication\',name:`${title} Calculator`,applicationCategory:\'UtilitiesApplication\',operatingSystem:\'Any\',isAccessibleForFree:true,url:`https://www.pilot-desk.com/calculators/${slug}/`,description:desc,publisher:{\'@type\':\'Organization\',name:\'PilotDesk\',url:\'https://www.pilot-desk.com/\',logo:{\'@type\':\'ImageObject\',url:\'https://www.pilot-desk.com/assets/icon.svg\'}}};const crumbSchema={\'@context\':\'https://schema.org\',\'@type\':\'BreadcrumbList\',itemListElement:[{\'@type\':\'ListItem\',position:1,name:\'Calculators\',item:\'https://www.pilot-desk.com/\'},{\'@type\':\'ListItem\',position:2,name:title,item:`https://www.pilot-desk.com/calculators/${slug}/`} ]};const staticSchema=`<script type="application/ld+json" data-pd-static-calc-schema="1">${JSON.stringify(appSchema)}</script><script type="application/ld+json" data-pd-static-breadcrumbs="1">${JSON.stringify(crumbSchema)}</script>`;html=html.replace(\'</head>\',staticSchema+\'</head>\');fs.writeFileSync(file,html)}\nconsole.log(`Generated ${calcs.length} calculator pages with static educational content and formula disclosures.`);'
    if tail not in s: raise SystemExit('generator tail not found')
    g.write_text(s.replace(tail,repl,1))

# Fix the one Article schema that the live audit flagged, and make the guide more useful.
p=Path('guides/crosswind-component.html'); s=p.read_text()
old=re.search(r'<script type="application/ld\+json">.*?</script>',s)
article={'@context':'https://schema.org','@type':'Article','headline':'How to Calculate Crosswind Component','description':'Learn how to calculate crosswind and headwind components from runway heading and reported wind, with a free calculator.','image':SITE+'/assets/icon.svg','datePublished':'2026-09-10','dateModified':'2026-09-10','mainEntityOfPage':SITE+'/guides/crosswind-component.html','publisher':org}
if old: s=s[:old.start()]+f'<script type="application/ld+json">{json.dumps(article,separators=(",",":"))}</script>'+s[old.end():]
if 'Quick mental checks' not in s:
    extra='<h2>Quick mental checks</h2><p>You can estimate a crosswind before reaching for a calculator. At 30 degrees off the runway, the crosswind is about half the wind speed. At 45 degrees it is about 70 percent, at 60 degrees about 87 percent, and at 90 degrees the full wind speed is crosswind. These are useful reasonableness checks, not a replacement for using the actual wind and runway values when the number matters.</p><h2>Which runway gives the lower crosswind?</h2><p>If more than one runway is available, compare the relative wind angle for each runway before doing the full math. The runway pointed more nearly into the wind will usually have the smaller crosswind and larger headwind component. Runway availability, traffic flow, runway condition, aircraft limits, and ATC instructions still matter, so the smallest calculated crosswind is not automatically the runway you will use.</p>'
    s=s.replace('<div class="pd-actions">',extra+'<div class="pd-actions">',1)
p.write_text(s)
print('SEO indexing pass applied')
