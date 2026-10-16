import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const M=createRequire(import.meta.url)('../assets/metar-model.js');
const raw='KGFK 150931Z 33015G25KT 1 1/2SM -SN BKN007 OVC020 M02/M05 A2996';
const d=M.normalize({rawOb:raw,icaoId:'KGFK'});
assert.equal(d.temperature,-2);assert.equal(d.dewpoint,-5);assert.equal(d.visibility,1.5);assert.equal(d.ceiling,700);assert.equal(d.sky,'OVC');assert.equal(d.speed,15);assert.equal(d.gust,25);assert.equal(d.direction,330);assert.equal(d.category,'IFR');assert.equal(d.time,'09:31Z');
assert.match(M.model({rawOb:raw}).html,/rotate\(330\)/);assert.match(M.model({rawOb:raw}).html,/007/);assert.match(M.model({rawOb:raw}).html,/29\.96/);assert.match(M.model({rawOb:raw}).html,/#f26868/);
assert.equal(M.normalize({rawOb:'KAAA 151000Z 00000KT 10SM CLR 00/M02 A3000'}).speed,0);assert.equal(M.normalize({rawOb:'KAAA 151000Z VRB03KT 10SM SKC 10/02 Q1013'}).variable,true);
assert.equal(M.normalize({rawOb:'KAAA 151000Z 18005KT 1SM VV002 05/04 A2992'}).ceiling,200);
assert.equal(M.normalize({rawOb:'KAAA 151000Z 18005KT 1SM BKN/// 05/04 A2992'}).ceiling,null);
assert.equal(M.normalize({}).temperature,null);assert.equal(M.normalize({}).pressure,null);assert.equal(M.normalize({}).sky,'M');assert.equal(M.normalize({}).category,'UNKNOWN');
assert.equal(M.normalize({temp:0,dewp:0,wspd:0,visib:0,ceil:0}).visibility,0);
assert.match(M.card({rawOb:raw},{units:{temperature:'F',visibility:'km',pressure:'hPa'}}),/°F · km · hPa/);
assert.ok(!M.card({id:'<img src=x onerror=alert(1)>'}).includes('<img'));
console.log('METAR model checks passed: missing and zero values, raw parsing, UTC, unit conversion, vertical visibility, category, wind direction/gusts and escaped station labels.');

const geoModel=M.normalize({id:"KGFK",site:"Grand Forks Intl",fltcat:"VFR",ceil:31,cover:"OVC",clouds:[{base:31,cover:"BKN"},{base:55,cover:"OVC"}],rawOb:"METAR KGFK 151753Z 29017G28KT 10SM BKN031 OVC055 11/03 A3001"});assert.equal(geoModel.ceiling,3100);assert.equal(geoModel.id,"KGFK");

const symbols=createRequire(import.meta.url)('../assets/chart-symbols.js');
for(const category of ['VFR','MVFR','IFR','LIFR','UNKNOWN'])for(const key of ['fltcat','fltCat','flightCategory','flight_category']){const report={[key]:category,cover:'OVC'};assert.equal(M.normalize(report).category,category);assert.ok(M.model(report).html.includes('fill="'+symbols.metarColor(report)+'"'),'Detailed METAR and flight-category circle must match for '+key+' '+category)}
