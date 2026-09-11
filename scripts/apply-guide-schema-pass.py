from pathlib import Path
import json,re

IMG='https://www.pilot-desk.com/assets/aviation-guide-reference.svg'
pat=re.compile(r'<script type="application/ld\+json" data-pd-guide-schema="1">(.*?)</script>',re.S)
count=0
for p in Path('guides').glob('*.html'):
    s=p.read_text()
    m=pat.search(s)
    if not m:
        continue
    try:
        data=json.loads(m.group(1))
    except Exception as e:
        raise SystemExit(f'{p}: invalid guide JSON-LD: {e}')
    if data.get('@type')!='Article':
        continue
    data.setdefault('image',IMG)
    image=data['image']
    repl='<script type="application/ld+json" data-pd-guide-schema="1">'+json.dumps(data,separators=(',',':'))+'</script>'
    s=s[:m.start()]+repl+s[m.end():]
    title=(re.search(r'<title>(.*?)</title>',s,re.S) or [None,'PilotDesk Aviation Guide'])[1]
    desc=(re.search(r'<meta name="description" content="([^"]*)">',s,re.S) or [None,'PilotDesk aviation guide'])[1]
    canonical=(re.search(r'<link rel="canonical" href="([^"]*)">',s,re.S) or [None,'https://www.pilot-desk.com/guides.html'])[1]
    if 'property="og:image"' not in s:
        og=f'<meta property="og:title" content="{title}"><meta property="og:description" content="{desc}"><meta property="og:type" content="article"><meta property="og:url" content="{canonical}"><meta property="og:image" content="{image}"><meta name="twitter:card" content="summary_large_image">'
        s=s.replace('</title>','</title>'+og,1)
    p.write_text(s)
    count+=1

# Keep search snippets comfortably inside normal display ranges on the two long descriptions.
shorten={
'guides/flight-planning.html':'VFR and IFR flight planning workflow covering route, weather, NOTAMs, fuel, performance, procedures, alternates, and final verification.',
'guides/metar-taf.html':'Learn how to read METAR and TAF aviation weather reports, including wind, visibility, clouds, altimeter settings, and forecast change groups.'
}
for path,desc in shorten.items():
    p=Path(path); s=p.read_text()
    s=re.sub(r'<meta name="description" content="[^"]*">',f'<meta name="description" content="{desc}">',s,count=1)
    m=pat.search(s)
    if m:
        data=json.loads(m.group(1)); data['description']=desc; data.setdefault('image',IMG)
        repl='<script type="application/ld+json" data-pd-guide-schema="1">'+json.dumps(data,separators=(',',':'))+'</script>'
        s=s[:m.start()]+repl+s[m.end():]
    s=re.sub(r'<meta property="og:description" content="[^"]*">',f'<meta property="og:description" content="{desc}">',s,count=1)
    p.write_text(s)

p=Path('procedures.html'); s=p.read_text()
s=re.sub(r'<meta name="description" content="[^"]*">','<meta name="description" content="Search FAA approach plates and procedures by airport, then open current official chart PDFs for flight planning and training.">',s,count=1)
p.write_text(s)
print(f'Normalized Article image/social metadata for {count} guide pages')
