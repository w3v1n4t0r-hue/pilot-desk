(()=>{
  if(location.pathname!=='/aircraft.html')return;
  document.addEventListener('DOMContentLoaded',()=>{
    const panel=document.querySelector('#aircraftList')?.closest('.pd-panel');if(!panel)return;
    const wrap=document.createElement('div');wrap.className='pd-actions';wrap.innerHTML='<button class="pd-btn secondary" type="button" id="pdExportAircraft">Export profiles</button><label class="pd-btn secondary" style="cursor:pointer">Import profiles<input id="pdImportAircraft" type="file" accept="application/json,.json" hidden></label>';
    panel.insertBefore(wrap,panel.querySelector('#aircraftList'));
    document.getElementById('pdExportAircraft').addEventListener('click',()=>{
      let profiles=[];try{profiles=JSON.parse(localStorage.getItem('pd-aircraft')||'[]')}catch{}
      const payload={format:'PilotDesk-aircraft-profiles',version:1,exportedAt:new Date().toISOString(),profiles,active:localStorage.getItem('pd-aircraft-active')||null};
      const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='pilotdesk-aircraft-profiles.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);window.toast?.('Aircraft profiles exported');
    });
    document.getElementById('pdImportAircraft').addEventListener('change',async e=>{
      const file=e.target.files?.[0];if(!file)return;
      try{const data=JSON.parse(await file.text());if(data?.format!=='PilotDesk-aircraft-profiles'||!Array.isArray(data.profiles))throw new Error('Invalid PilotDesk profile file');
        const clean=data.profiles.filter(p=>p&&typeof p.id==='string'&&typeof p.name==='string').slice(0,50);localStorage.setItem('pd-aircraft',JSON.stringify(clean));if(data.active&&clean.some(p=>p.id===data.active))localStorage.setItem('pd-aircraft-active',data.active);else localStorage.removeItem('pd-aircraft-active');location.reload();
      }catch(err){window.toast?.('That profile file could not be imported')}
    });
  });
})();
