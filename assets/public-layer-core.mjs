export const stationModes=new Set(['metar','category','surfacewind','dewpointspread','temperature','visibility','ceiling','coverage']);
export function number(value){if(value===null||value===undefined||value===''||typeof value==='boolean')return null;const n=Number(value);return Number.isFinite(n)?n:null}
export function stationLabel(p,mode){
  const temp=number(p.temp),dewp=number(p.dewp),wind=number(p.wspd),dir=number(p.wdir),vis=number(p.visib),ceil=number(p.ceil);
  switch(mode){
    case 'metar':case 'category':return typeof (p.fltcat??p.fltCat)==='string'?(p.fltcat??p.fltCat):null;
    case 'surfacewind':return wind===null?null:(dir===null?'VRB':String(Math.round(dir)).padStart(3,'0'))+'° '+wind+'kt';
    case 'dewpointspread':return temp===null||dewp===null?null:Math.round((temp-dewp)*10)/10+'°C';
    case 'temperature':return temp===null?null:temp+'°C';
    case 'visibility':return vis!==null?vis+'SM':typeof p.visib==='string'&&/^(?:\d+(?:\.\d+)?\+|P6)$/.test(p.visib)?p.visib+'SM':null;
    case 'ceiling':return ceil===null?null:ceil*100+'ft AGL';
    case 'coverage':return typeof p.cover==='string'?p.cover:null;
    default:return null;
  }
}
export function airspaceBelow(p,limit){const floor=number(p.LOWER_VAL);if(floor===null)return true;if(!['MSL','STD','SFC'].includes(p.LOWER_CODE))return true;return (p.LOWER_UOM==='FL'?floor*100:floor)<=limit}
export function navLevel(p,level){if(p.LEVEL_==='B')return true;if(p.LEVEL_==='U'||p.LEVEL_==='L')return p.LEVEL_===(level==='high'?'U':'L');const keys=level==='high'?['US_HIGH','AK_HIGH']:['US_LOW','AK_LOW','US_AREA'];return keys.some(k=>number(p[k])===1)}
export function airportCategory(p){if(number(p.PRIVATEUSE)===1)return 'privateAP';return p.TYPE_CODE==='AD'?'airports':p.TYPE_CODE==='HP'?'heli':p.TYPE_CODE==='SP'?'seaplane':'other'}
export function hazardKind(p){const h=String(p.hazard||p.hazardType||p.wxPhenomenon||'').toUpperCase();return /ICE|ICING/.test(h)?'icing':/TURB/.test(h)?'turb':/IFR|MT_OBSC|MTN/.test(h)?'ifr':/CONV|TS|TSTM/.test(h)?'convective':'other'}
export function hazardMatches(p,filters){if(!filters.length)return true;const kind=hazardKind(p);return filters.some(id=>{if(kind!=='turb')return id.endsWith('/'+kind);const base=number(p.base),top=number(p.top);return id.endsWith('lowturb')&&base!==null&&base<18000||id.endsWith('highturb')&&top!==null&&top>=18000})}
export function safeBounds(bounds){const west=bounds.getWest(),east=bounds.getEast();if(west<-180||east>180||west>=east)return null;return [Math.max(-85,bounds.getSouth()),west,Math.min(85,bounds.getNorth()),east]}

// Public FAA feature services support anonymous CORS queries.
export function faaQueryUrl(product,bounds){
 const services={airports:'US_Airport',airspace:'Class_Airspace',boundaries:'Boundary_Airspace',sua:'Special_Use_Airspace',mtr:'MTRSegment',airways:'ATS_Route',navaids:'NAVAIDSystem',fixes:'DesignatedPoints'};
 if(!Object.hasOwn(services,product)||bounds.length!==4||bounds.some(n=>!Number.isFinite(n))||bounds[0]<-85||bounds[2]>85||bounds[1]<-180||bounds[3]>180||bounds[0]>=bounds[2]||bounds[1]>=bounds[3])throw Error('Invalid FAA layer or map bounds.');
 if(bounds[2]-bounds[0]>12||bounds[3]-bounds[1]>12)throw Error('Zoom in to load FAA detail (maximum 12° bounds).');
 const params=new URLSearchParams({where:'1=1',geometry:[bounds[1],bounds[0],bounds[3],bounds[2]].join(','),geometryType:'esriGeometryEnvelope',inSR:'4326',outSR:'4326',spatialRel:'esriSpatialRelIntersects',outFields:'*',returnGeometry:'true',resultRecordCount:'2000',f:'geojson'});
 return 'https://services6.arcgis.com/ssFJjBXIUyZDrSYZ/ArcGIS/rest/services/'+services[product]+'/FeatureServer/0/query?'+params;
}
