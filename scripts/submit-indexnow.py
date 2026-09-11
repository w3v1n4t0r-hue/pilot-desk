from pathlib import Path
import json
import xml.etree.ElementTree as ET

KEY='c731d63e44f2d52fcd122041601cfb22'
HOST='www.pilot-desk.com'
SITEMAP=Path('sitemap.xml')
root=ET.parse(SITEMAP).getroot()
ns={'sm':'http://www.sitemaps.org/schemas/sitemap/0.9'}
urls=[n.text.strip() for n in root.findall('sm:url/sm:loc',ns) if n.text and n.text.strip()]
payload={
    'host':HOST,
    'key':KEY,
    'keyLocation':f'https://{HOST}/{KEY}.txt',
    'urlList':urls,
}
Path('indexnow-payload.json').write_text(json.dumps(payload,separators=(',',':')))
print(f'Prepared {len(urls)} canonical URLs for IndexNow')
