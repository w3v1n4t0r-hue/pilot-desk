/* One store for planner, saved flights and briefs. Legacy data stays as backup. */
(()=>{'use strict';const key='pd-saved-flights';
function read(k,fallback=[]){try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(fallback))}catch{return fallback}}
function list(){const v=read(key);return Array.isArray(v)?v:[]}
function write(v){localStorage.setItem(key,JSON.stringify(v));document.dispatchEvent(new CustomEvent('pilotdesk:flights-changed'))}
function migrate(){if(read('pd-flight-migration-v2',false))return;const current=list(),old=read('pd-flights-v1');if(Array.isArray(old))for(const f of old){if(!f?.id||current.some(x=>x.id===f.id))continue;current.push({...f,burn:f.burn??f.fuelBurn??'',createdAt:f.createdAt||f.updatedAt||Date.now()})}write(current);localStorage.setItem('pd-flight-migration-v2','true')}
try{migrate()}catch{}
window.PilotDeskFlights={list,write,get:id=>list().find(f=>f.id===id),upsert:f=>{const all=list(),old=all.find(x=>x.id===f.id);write([{...old,...f},...all.filter(x=>x.id!==f.id)])}};
})();
