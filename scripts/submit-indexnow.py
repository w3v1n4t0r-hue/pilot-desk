from pathlib import Path
import json
import xml.etree.ElementTree as ET

KEY='c731d63e44f2d52fcd122041601cfb22'
HOST='www.pilot-desk.com'
SITEMAPS=[Path('sitemap.xml'),Path('sitemap-growth.xml')]
NS={'sm':'http://www.sitemaps.org/schemas/sitemap/0.9'}
urls=[]
for sitemap in SITEMAPS:
    if not sitemap.exists():
        continue
    root=ET.parse(sitemap).getroot()
    urls.extend(n.text.strip() for n in root.findall('sm:url/sm:loc',NS) if n.text and n.text.strip())
urls=list(dict.fromkeys(urls))
payload={
    'host':HOST,
    'key':KEY,
    'keyLocation':f'https://{HOST}/{KEY}.txt',
    'urlList':urls,
}
Path('indexnow-payload.json').write_text(json.dumps(payload,separators=(',',':')))
print(f'Prepared {len(urls)} canonical URLs from {sum(p.exists() for p in SITEMAPS)} sitemap file(s) for IndexNow')
