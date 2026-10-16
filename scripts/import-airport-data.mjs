import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

export function csv(text){
 const rows=[];let row=[],value='',quoted=false;
 for(let i=0;i<text.length;i++){const c=text[i];if(c==='"'){if(quoted&&text[i+1]==='"'){value+='"';i++}else quoted=!quoted}else if(!quoted&&(c===','||c==='\n')){row.push(value.replace(/\r$/,''));value='';if(c==='\n'){rows.push(row);row=[]}}else value+=c}
 if(quoted)throw Error('Unterminated CSV field');if(value||row.length){row.push(value.replace(/\r$/,''));rows.push(row)}
 const headers=rows.shift().map(v=>v.replace(/^\uFEFF/,''));return rows.filter(r=>r.some(Boolean)).map(r=>Object.fromEntries(headers.map((h,i)=>[h,r[i]??''])));
}
const n=v=>v!==''&&v!=null&&Number.isFinite(Number(v))?Number(v):null;
export function assemble(tables){
 const airports={},bySite=new Map(),byFaa=new Map(),aliases={};
 for(const r of tables.APT_BASE){const id=r.ICAO_ID||r.ARPT_ID;if(!/^[A-Z0-9]{2,7}$/.test(id))continue;
  const a={id,faaId:r.ARPT_ID,name:r.ARPT_NAME,city:r.CITY,state:r.STATE_CODE,country:r.COUNTRY_CODE,type:r.SITE_TYPE_CODE,use:r.FACILITY_USE_CODE,status:r.ARPT_STATUS,lat:n(r.LAT_DECIMAL),lon:n(r.LONG_DECIMAL),elevationFt:n(r.ELEV),variationEast:n(r.MAG_VARN)===null?null:r.MAG_HEMIS==='W'?-n(r.MAG_VARN):r.MAG_HEMIS==='E'?n(r.MAG_VARN):null,sectional:r.CHART_NAME,artcc:r.ARTCC_NAME,artccId:r.RESP_ARTCC_ID,fss:r.FSS_NAME,fssPhone:r.TOLL_FREE_NO||r.PHONE_NO,customs:r.CUST_FLAG,fuel:r.FUEL_TYPES,runways:[],frequencies:[],contacts:[],attendance:[]};
  airports[id]=a;bySite.set(r.SITE_NO+'|'+r.SITE_TYPE_CODE,a);byFaa.set(r.ARPT_ID,a);aliases[id]=id;
 }
 for(const [faa,a] of byFaa)if(!aliases[faa])aliases[faa]=a.id;
 const lookup=r=>bySite.get(r.SITE_NO+'|'+r.SITE_TYPE_CODE);
 for(const r of tables.APT_RWY){const a=lookup(r);if(a)a.runways.push({id:r.RWY_ID,lengthFt:n(r.RWY_LEN),widthFt:n(r.RWY_WIDTH),surface:r.SURFACE_TYPE_CODE,condition:r.COND,lighting:r.RWY_LGT_CODE,ends:[]})}
 for(const r of tables.APT_RWY_END){const runway=lookup(r)?.runways.find(x=>x.id===r.RWY_ID);if(runway)runway.ends.push({id:r.RWY_END_ID,trueHeading:n(r.TRUE_ALIGNMENT),rightTraffic:r.RIGHT_HAND_TRAFFIC_PAT_FLAG,latitude:n(r.LAT_DECIMAL),longitude:n(r.LONG_DECIMAL),elevationFt:n(r.RWY_END_ELEV),touchdownFt:n(r.TDZ_ELEV),displacedThresholdFt:n(r.DISPLACED_THR_LEN),vgsi:r.VGSI_CODE,approachLighting:r.APCH_LGT_SYSTEM_CODE,ils:r.ILS_TYPE,toraFt:n(r.TKOF_RUN_AVBL),todaFt:n(r.TKOF_DIST_AVBL),asdaFt:n(r.ACLT_STOP_DIST_AVBL),ldaFt:n(r.LNDG_DIST_AVBL)})}
 for(const r of tables.FRQ){if(r.SERVICED_SITE_TYPE!=='AIRPORT')continue;const a=byFaa.get(r.SERVICED_FACILITY);if(a)a.frequencies.push({service:r.FREQ_USE,frequency:r.FREQ,name:r.TOWER_OR_COMM_CALL||r.PRIMARY_APPROACH_RADIO_CALL||r.FAC_NAME,sector:r.SECTORIZATION,hours:r.TOWER_HRS,remarks:r.REMARK})}
 for(const r of tables.APT_CON||[]){const a=lookup(r);if(a)a.contacts.push({role:r.TITLE,name:r.NAME,phone:r.PHONE_NO,address:[r.ADDRESS1,r.ADDRESS2,r.TITLE_CITY,r.STATE,r.ZIP_CODE].filter(Boolean).join(', ')})}
 for(const r of tables.APT_ATT||[]){const a=lookup(r);if(a)a.attendance.push([r.MONTH,r.DAY,r.HOUR].filter(Boolean).join(' · '))}
 return {airports,aliases};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const [source,out,effective,expires]=process.argv.slice(2);if(!source||!out||!/^\d{4}-\d{2}-\d{2}$/.test(effective)||!/^\d{4}-\d{2}-\d{2}$/.test(expires)||expires<=effective)throw Error('Usage: node scripts/import-airport-data.mjs SOURCE OUTPUT EFFECTIVE EXPIRES');
 const tables={};for(const name of ['APT_BASE','APT_RWY','APT_RWY_END','APT_CON','APT_ATT','FRQ'])tables[name]=csv(fs.readFileSync(path.join(source,name==='FRQ'?'frq':'apt',name+'.csv'),'utf8'));
 if(Object.values(tables).some(rows=>rows.some(r=>r.EFF_DATE.replaceAll('/','-')!==effective)))throw Error('Airport source effective date does not match requested cycle');
 const {airports,aliases}=assemble(tables),shards={};for(const [id,a] of Object.entries(airports))(shards[id.slice(0,2)]??={})[id]=a;
 fs.mkdirSync(out,{recursive:true});for(const [prefix,records] of Object.entries(shards))fs.writeFileSync(path.join(out,prefix+'.json'),JSON.stringify(records));
 fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify({schema:1,effective,expires,source:'FAA NASR',sourceUrl:'https://www.faa.gov/air_traffic/flight_info/aeronav/aero_data/NASR_Subscription/',count:Object.keys(airports).length,locations:Object.values(airports).filter(a=>a.lat!=null&&a.lon!=null).map(a=>[a.id,a.lat,a.lon]),aliases}));
 console.log(JSON.stringify({airports:Object.keys(airports).length,shards:Object.keys(shards).length,effective,expires}));
}
