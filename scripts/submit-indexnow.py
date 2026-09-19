from pathlib import Path
import argparse
import json
import urllib.request
import xml.etree.ElementTree as ET
from urllib.parse import urlparse

KEY='c731d63e44f2d52fcd122041601cfb22'
HOST='www.pilot-desk.com'
BASE=f'https://{HOST}'
KNOWN_SITEMAPS=[
    '/sitemap.xml',
    '/sitemap-core.xml',
    '/sitemap-daily.xml',
    '/sitemap-growth.xml',
    '/sitemap-retention.xml',
    '/sitemap-seo-expansion.xml',
    '/sitemap-seo-expansion-2.xml',
    '/sitemap-written-prep.xml',
]
NS={'sm':'http://www.sitemaps.org/schemas/sitemap/0.9'}

def canonical(url):
    try:
        p=urlparse(url)
    except ValueError:
        return False
    return p.scheme=='https' and p.hostname==HOST

def parse_xml(data):
    root=ET.fromstring(data)
    kind=root.tag.rsplit('}',1)[-1]
    if kind=='urlset':
        return 'urls',[n.text.strip() for n in root.findall('sm:url/sm:loc',NS) if n.text and n.text.strip()]
    if kind=='sitemapindex':
        return 'sitemaps',[n.text.strip() for n in root.findall('sm:sitemap/sm:loc',NS) if n.text and n.text.strip()]
    return 'unknown',[]

def fetch(url):
    req=urllib.request.Request(url,headers={'User-Agent':'PilotDesk-IndexNow/1.0'})
    with urllib.request.urlopen(req,timeout=20) as r:
        return r.read()

def from_repo():
    sitemaps=sorted(Path('.').glob('sitemap*.xml'))
    urls=[]
    for sitemap in sitemaps:
        try:
            kind,locs=parse_xml(sitemap.read_bytes())
        except ET.ParseError:
            continue
        if kind=='urls':
            urls.extend(locs)
    return list(dict.fromkeys(u for u in urls if canonical(u))),len(sitemaps)

def from_live():
    candidates=[BASE+p for p in KNOWN_SITEMAPS]
    try:
        robots=fetch(BASE+'/robots.txt').decode('utf-8',errors='replace')
        for line in robots.splitlines():
            if line.lower().startswith('sitemap:'):
                candidates.append(line.split(':',1)[1].strip())
    except Exception as exc:
        print(f'robots discovery warning: {exc}')

    queue=list(dict.fromkeys(candidates))
    seen=set()
    urls=[]
    fetched=0
    while queue and len(seen)<50:
        sitemap_url=queue.pop(0)
        if sitemap_url in seen or not canonical(sitemap_url):
            continue
        seen.add(sitemap_url)
        try:
            kind,locs=parse_xml(fetch(sitemap_url))
            fetched+=1
        except Exception as exc:
            print(f'sitemap fetch warning: {sitemap_url}: {exc}')
            continue
        if kind=='urls':
            urls.extend(locs)
        elif kind=='sitemaps':
            queue.extend(locs)

    urls=list(dict.fromkeys(u for u in urls if canonical(u)))
    if not urls:
        raise SystemExit('No live canonical URLs could be read from production sitemaps.')
    return urls,fetched

parser=argparse.ArgumentParser()
parser.add_argument('--live',action='store_true')
args=parser.parse_args()

urls,source_count=from_live() if args.live else from_repo()
payload={'host':HOST,'key':KEY,'keyLocation':f'{BASE}/{KEY}.txt','urlList':urls}
Path('indexnow-payload.json').write_text(json.dumps(payload,separators=(',',':')))
source='live production' if args.live else 'repository'
print(f'Prepared {len(urls)} canonical URLs from {source_count} {source} sitemap file(s) for IndexNow')
