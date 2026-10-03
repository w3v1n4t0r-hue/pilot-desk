"""Generate small, georeferenced CONUS overviews from FAA's published tile cache.
Run manually when refreshing chart imagery; never manufacture missing coverage.
Requires Pillow in the build environment only.
"""
import concurrent.futures,datetime,io,json,math,pathlib,urllib.request,urllib.error
from PIL import Image
ROOT='https://tiles.arcgis.com/tiles/ssFJjBXIUyZDrSYZ/arcgis/rest/services/'
OUT=pathlib.Path('assets/chart-overviews');OUT.mkdir(parents=True,exist_ok=True)
manifest={}
def tilexy(lon,lat,z):
 n=2**z;return (lon+180)/360*n,(1-math.asinh(math.tan(math.radians(lat)))/math.pi)/2*n
def lat(y,z):return math.degrees(math.atan(math.sinh(math.pi*(1-2*y/2**z))))
for key,service,z in [('sectional','VFR_Sectional',8)]:
 metadata=json.load(urllib.request.urlopen(ROOT+service+'/MapServer?f=json',timeout=20))
 x0,y0=map(math.floor,tilexy(-126,51,z));x1,y1=map(math.ceil,tilexy(-65,23,z));scale=48
 canvas=Image.new('RGBA',((x1-x0)*scale,(y1-y0)*scale));jobs=[(x,y) for y in range(y0,y1) for x in range(x0,x1)];bad=[];valid=0
 def get(c):
  x,y=c;url=ROOT+service+f'/MapServer/tile/{z}/{y}/{x}'
  try:
   raw=urllib.request.urlopen(url,timeout=12).read();im=Image.open(io.BytesIO(raw)).convert('RGBA');im.thumbnail((scale,scale));return c,im,None
  except urllib.error.HTTPError as e:
   if e.code==404:return c,None,None
   return c,None,str(e)
  except Exception as e:return c,None,str(e)
 with concurrent.futures.ThreadPoolExecutor(max_workers=24) as pool:
  for i,(c,im,error) in enumerate(pool.map(get,jobs)):
   if im:canvas.paste(im,((c[0]-x0)*scale,(c[1]-y0)*scale));valid+=1
   if error:bad.append((c,error))
   if (i+1)%100==0:print(key,i+1,'/',len(jobs),'tiles',flush=True)
 if bad or not valid:raise RuntimeError(f'{key}: {len(bad)} failed requests; refuse incomplete refresh. {bad[:3]}')
 filename=key+'.webp';canvas.save(OUT/filename,'WEBP',quality=76,method=6)
 manifest[key]={'url':'/assets/chart-overviews/'+filename,'bounds':[[lat(y1,z),x0/2**z*360-180],[lat(y0,z),x1/2**z*360-180]],'sourceUpdated':metadata.get('documentInfo',{}).get('subject',''),'generatedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'tiles':valid}
 print(key,'saved',canvas.size,(OUT/filename).stat().st_size,flush=True)
(OUT/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
