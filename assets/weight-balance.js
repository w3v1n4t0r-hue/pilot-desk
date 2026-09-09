(() => {
  const rows=document.getElementById('wbRows');
  if(!rows)return;
  const outW=document.getElementById('wbW'), outM=document.getElementById('wbM'), outCG=document.getElementById('wbCG');
  let warning=document.getElementById('wbSafetyWarning');
  function setWarning(msg){warning.textContent=msg;warning.classList.toggle('show',Boolean(msg));}
  function calcWB(){
    let W=0,M=0,msg='';
    const data=[...document.querySelectorAll('.wb-data')];
    if(!data.length)msg='Add at least one loading station.';
    for(const r of data){
      const ins=r.querySelectorAll('input');
      const w=Number(ins[1].value), a=Number(ins[2].value);
      if(ins[1].value.trim()===''||ins[2].value.trim()===''||!Number.isFinite(w)||!Number.isFinite(a)){msg='Every station needs a valid weight and arm.';r.querySelector('.moment').textContent='—';break;}
      if(w<0||w>1000000||a<-10000||a>10000){msg='A station contains an implausible weight or arm. Recheck the aircraft loading data.';r.querySelector('.moment').textContent='—';break;}
      const m=w*a;W+=w;M+=m;r.querySelector('.moment').textContent=m.toFixed(0);
    }
    if(!msg && W<=0)msg='Total weight must be greater than zero.';
    if(msg){setWarning(msg);outW.textContent=outM.textContent=outCG.textContent='—';return;}
    setWarning('');outW.textContent=W.toFixed(1)+' lb';outM.textContent=M.toFixed(0)+' lb-in';outCG.textContent=(M/W).toFixed(2)+' in';
  }
  function add(n='Station',w=0,a=0){
    const r=document.createElement('div');r.className='wb-row wb-data';
    const name=document.createElement('input');name.value=n;name.setAttribute('aria-label','Station name');name.maxLength=80;
    const weight=document.createElement('input');weight.type='number';weight.step='any';weight.value=w;weight.setAttribute('aria-label','Station weight in pounds');
    const arm=document.createElement('input');arm.type='number';arm.step='any';arm.value=a;arm.setAttribute('aria-label','Station arm in inches');
    const moment=document.createElement('span');moment.className='moment';moment.textContent='0';
    const remove=document.createElement('button');remove.type='button';remove.className='remove';remove.textContent='×';remove.setAttribute('aria-label','Remove station');
    [weight,arm].forEach(i=>i.addEventListener('input',calcWB));remove.addEventListener('click',()=>{r.remove();calcWB()});
    r.append(name,weight,arm,moment,remove);rows.appendChild(r);calcWB();
  }
  function activeProfile(){try{const all=JSON.parse(localStorage.getItem('pd-aircraft')||'[]'),id=localStorage.getItem('pd-aircraft-active');return all.find(x=>x.id===id)||null}catch{return null}}
  function loadProfile(){const p=activeProfile();if(!p)return false;rows.innerHTML='';let count=0;if(p.emptyWeight!==''&&p.emptyArm!==''&&Number.isFinite(Number(p.emptyWeight))&&Number.isFinite(Number(p.emptyArm))){add('Basic Empty Weight',Number(p.emptyWeight),Number(p.emptyArm));count++}String(p.wbStations||'').split(/\r?\n/).forEach(line=>{const parts=line.split(',').map(x=>x.trim());if(parts.length<3)return;const w=Number(parts[1]),a=Number(parts[2]);if(parts[0]&&Number.isFinite(w)&&Number.isFinite(a)){add(parts[0],w,a);count++}});if(count){const note=document.createElement('div');note.className='notice';note.textContent=`Loaded ${p.name||'active aircraft'} profile. Verify every station and arm against current approved aircraft data.`;rows.parentElement?.insertBefore(note,rows);return true}return false}
  if(!loadProfile()){add('Basic Empty Weight',1600,85);add('Front seats',360,80.5);add('Fuel',240,95);}
  document.getElementById('addStation')?.addEventListener('click',()=>add());
})();
