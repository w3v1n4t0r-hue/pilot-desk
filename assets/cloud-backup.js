(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.PilotDeskCloudBackup=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 function stable(value){if(Array.isArray(value))return value.map(stable);if(value&&typeof value==='object')return Object.fromEntries(Object.keys(value).sort().map(k=>[k,stable(value[k])]));return value;}
 function signature(record){const copy={...record};for(const key of ['id','updatedAt','createdAt','_pilotdesk_local_id','_pilotdesk_copy_signature'])delete copy[key];return JSON.stringify(stable(copy));}
 function hash(value){let n=2166136261;for(const c of value){n^=c.charCodeAt(0);n=Math.imul(n,16777619);}return (n>>>0).toString(16);}
 function records(value){if(!Array.isArray(value)||value.some(x=>!x||typeof x!=='object'||Array.isArray(x)||typeof x.id!=='string'||!x.id))throw Error('Saved records could not be read. Export your device data before retrying.');return value;}
 function merge(existing,incoming,label='cloud copy'){
  const result=records(existing).map(x=>({...x})),ids=new Map();let conflicts=0;
  for(const item of records(incoming)){
   const old=result.find(x=>x.id===item.id),sig=signature(item);
   if(!old){result.push({...item});ids.set(item.id,item.id);continue;}
   if(signature(old)===sig){ids.set(item.id,item.id);continue;}
   const prior=result.find(x=>x._pilotdesk_copy_signature===sig&&x.id.startsWith(item.id+'~'));
   if(prior){ids.set(item.id,prior.id);continue;}
   let id=item.id+'~'+hash(sig),index=1;while(result.some(x=>x.id===id))id=item.id+'~'+hash(sig)+'-'+index++;
   result.push({...item,id,name:String(item.name||'Saved item')+' ('+label+')',_pilotdesk_copy_signature:sig});ids.set(item.id,id);conflicts++;
  }
  return {records:result,ids,conflicts};
 }
 function fromRows(rows,kind){return (rows||[]).map(row=>{const data=row.data&&typeof row.data==='object'?row.data:{};return {...data,id:String(data._pilotdesk_local_id||data.id||row.id),name:data.name||row.name,...(!Object.keys(data).length?(kind==='aircraft'?{makeModel:row.make_model||'',tailNumber:row.tail_number||''}:{route:row.route||''}):{})};});}
 function restore(storage,aircraft,flights){
  const a=merge(JSON.parse(storage.getItem('pd-aircraft')||'[]'),aircraft),mapped=flights.map(f=>({...f,aircraftId:a.ids.get(f.aircraftId)||f.aircraftId}));
  const f=merge(JSON.parse(storage.getItem('pd-saved-flights')||'[]'),mapped);
  const keys=['pd-aircraft','pd-saved-flights','pd-aircraft-active'],before=keys.map(key=>storage.getItem(key));
  // Persist the previous lists before changing either live list; recover even after storage failure.
  storage.setItem('pd-before-cloud-restore',JSON.stringify({aircraft:before[0],flights:before[1],active:before[2],at:Date.now()}));
  try{storage.setItem(keys[0],JSON.stringify(a.records));storage.setItem(keys[1],JSON.stringify(f.records));if(!a.records.some(x=>x.id===before[2])){if(a.records[0])storage.setItem(keys[2],a.records[0].id);else storage.removeItem(keys[2]);}}
  catch(error){for(let i=0;i<keys.length;i++){try{before[i]===null?storage.removeItem(keys[i]):storage.setItem(keys[i],before[i]);}catch{}}throw Error('Restore could not be saved. Previous lists are retained in the device recovery snapshot.');}
  return {aircraft:a.records,flights:f.records,conflicts:a.conflicts+f.conflicts};
 }
 return {merge,fromRows,restore,records};
});
