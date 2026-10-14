export const stationModes=new Set(['category','surfacewind','dewpointspread','temperature','visibility','ceiling','coverage']);
export function number(value){if(value===null||value===undefined||value===''||typeof value==='boolean')return null;const n=Number(value);return Number.isFinite(n)?n:null}
export function stationLabel(p,mode){
  const temp=number(p.temp),dewp=number(p.dewp),wind=number(p.wspd),dir=number(p.wdir),vis=number(p.visib),ceil=number(p.ceil);
  switch(mode){
    case 'category':return typeof p.fltcat==='string'?p.fltcat:null;
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
export function navLevel(p,level){const keys=level==='high'?['US_HIGH','AK_HIGH']:['US_LOW','AK_LOW','US_AREA'];return keys.some(k=>number(p[k])===1)}
export function airportCategory(p){if(number(p.PRIVATEUSE)===1)return 'privateAP';return p.TYPE_CODE==='AD'?'airports':p.TYPE_CODE==='HP'?'heli':p.TYPE_CODE==='SP'?'seaplane':'other'}
export function hazardKind(p){const h=String(p.hazard||p.hazardType||p.wxPhenomenon||'').toUpperCase();return /ICE|ICING/.test(h)?'icing':/TURB/.test(h)?'turb':/IFR|MT_OBSC|MTN/.test(h)?'ifr':/CONV|TS|TSTM/.test(h)?'convective':'other'}
export function hazardMatches(p,filters){if(!filters.length)return true;const kind=hazardKind(p);return filters.some(id=>{if(kind!=='turb')return id.endsWith('/'+kind);const base=number(p.base),top=number(p.top);return id.endsWith('lowturb')&&base!==null&&base<18000||id.endsWith('highturb')&&top!==null&&top>=18000})}
export function safeBounds(bounds){const west=bounds.getWest(),east=bounds.getEast();if(west<-180||east>180||west>=east)return null;return [Math.max(-85,bounds.getSouth()),west,Math.min(85,bounds.getNorth()),east]}
