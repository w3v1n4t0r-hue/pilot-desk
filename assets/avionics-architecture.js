(()=>{
'use strict';
if(window.__pilotDeskAvionicsArchitecture)return;
window.__pilotDeskAvionicsArchitecture=true;

const q=(s,r=document)=>r.querySelector(s);
const qa=(s,r=document)=>[...r.querySelectorAll(s)];
const monoCode=s=>String(s||'CALC').replace(/([a-z])([A-Z])/g,'$1-$2').replace(/[^a-z0-9]+/gi,'-').replace(/^-|-$/g,'').toUpperCase().slice(0,22)||'CALC';

function installOpsBar(){
  qa('header.topbar').forEach(header=>{
    const brand=q('.brand',header);
    if(brand){
      const word=q('b',brand),tag=q('small',brand);
      if(word)word.textContent='PILOT DESK';
      if(tag)tag.textContent='DESK // OPS';
    }
    if(q('.pd-ops-cluster',header))return;
    const cluster=document.createElement('div');
    cluster.className='pd-ops-cluster';
    cluster.setAttribute('aria-label','PilotDesk system status');

    const clock=document.createElement('time');
    clock.className='pd-zulu-clock';
    clock.setAttribute('aria-label','Current UTC time');
    clock.dateTime=new Date().toISOString();

    const density=document.createElement('button');
    density.type='button';
    density.className='pd-density-toggle';
    density.textContent='DENS';
    density.title='Toggle compact instrument density';
    const compact=localStorage.getItem('pd-avionics-density')==='compact';
    document.documentElement.classList.toggle('pd-density-compact',compact);
    density.setAttribute('aria-pressed',String(compact));
    density.addEventListener('click',()=>{
      const next=!document.documentElement.classList.contains('pd-density-compact');
      document.documentElement.classList.toggle('pd-density-compact',next);
      density.setAttribute('aria-pressed',String(next));
      try{localStorage.setItem('pd-avionics-density',next?'compact':'standard')}catch{}
    });

    cluster.append(clock,density);
    header.appendChild(cluster);
    const tick=()=>{
      const d=new Date();
      clock.dateTime=d.toISOString();
      clock.textContent=`${String(d.getUTCHours()).padStart(2,'0')}:${String(d.getUTCMinutes()).padStart(2,'0')}:${String(d.getUTCSeconds()).padStart(2,'0')} Z`;
    };
    tick();
    setInterval(tick,1000);
  });
}

function panelCode(){
  const key=document.body?.dataset?.calc;
  const path=location.pathname.split('/').filter(Boolean).pop()||'HOME';
  return `PANEL // ${monoCode(key||path)}`;
}

function inputSummary(calcBox){
  return qa('input,select,textarea',calcBox).filter(el=>!['button','submit','hidden'].includes(el.type)).map(el=>{
    const field=el.closest('.field,.wb-row')||el.parentElement;
    const label=(field&&q('label',field)?.textContent||el.getAttribute('aria-label')||el.name||el.id||'Input').trim().replace(/\s+/g,' ');
    const unit=(el.closest('.input-wrap')&&q('span',el.closest('.input-wrap'))?.textContent||'').trim();
    const value=el.tagName==='SELECT'?(el.selectedOptions?.[0]?.textContent||el.value):el.value;
    return `${label}: ${value}${unit?` ${unit}`:''}`;
  });
}

function resultSummary(calcBox){
  return qa('.result',calcBox).map(result=>{
    const label=(q('small',result)?.textContent||'Result').trim().replace(/\s+/g,' ');
    const value=(q('strong',result)?.textContent||result.textContent||'—').trim().replace(/\s+/g,' ');
    return `${label}: ${value}`;
  });
}

async function copyText(text){
  if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(text);return}
  const area=document.createElement('textarea');
  area.value=text;area.setAttribute('readonly','');area.style.position='fixed';area.style.opacity='0';document.body.appendChild(area);area.select();document.execCommand('copy');area.remove();
}

function enhanceCalculator(){
  const calcBox=q('.calc-box');
  if(!calcBox||calcBox.dataset.pdAvionics==='1')return;
  calcBox.dataset.pdAvionics='1';
  calcBox.classList.add('pd-instrument-panel');

  const header=document.createElement('div');
  header.className='pd-panel-header';
  const state=document.createElement('span');state.className='pd-panel-state';state.title='Interface ready';
  const title=document.createElement('span');title.className='pd-panel-title';title.textContent=(q('.calc-hero h1')?.textContent||'Flight Computer').trim();
  const id=document.createElement('span');id.className='pd-panel-id';id.textContent=panelCode();
  header.append(state,title,id);
  calcBox.prepend(header);

  const results=q('.results',calcBox);
  if(results){
    results.classList.add('pd-output-console');
    results.dataset.panelTitle='FLIGHT COMPUTER // OUTPUT';
    const formula=q('.info-card .formula');
    if(formula&&!q('.pd-output-method',results)){
      const method=document.createElement('div');
      method.className='pd-output-method';
      const label=document.createElement('small');label.textContent='METHOD / REFERENCE';
      const code=document.createElement('code');code.textContent=formula.textContent.trim().replace(/\s+/g,' ');
      method.append(label,code);
      results.appendChild(method);
    }
  }

  const actions=document.createElement('div');
  actions.className='pd-workbench-actions';
  const copy=document.createElement('button');
  copy.type='button';copy.className='pd-copy-summary';copy.textContent='COPY DATA';copy.title='Copy inputs and calculated results';
  copy.addEventListener('click',async()=>{
    const titleText=(q('.calc-hero h1')?.textContent||'PilotDesk Calculation').trim();
    const lines=[titleText,`UTC: ${new Date().toISOString().replace('T',' ').replace(/\.\d{3}Z$/,' Z')}`,'','INPUT DATA',...inputSummary(calcBox),'','CALCULATED OUTPUT',...resultSummary(calcBox)];
    try{
      await copyText(lines.join('\n'));
      copy.dataset.state='copied';copy.textContent='COPIED';
      setTimeout(()=>{copy.dataset.state='';copy.textContent='COPY DATA'},1200);
    }catch{copy.textContent='COPY FAILED';setTimeout(()=>copy.textContent='COPY DATA',1400)}
  });
  actions.appendChild(copy);
  calcBox.appendChild(actions);

  calcBox.addEventListener('keydown',event=>{
    if(event.key!=='Enter'||event.altKey||event.ctrlKey||event.metaKey||event.shiftKey)return;
    const target=event.target;
    if(!(target instanceof HTMLInputElement||target instanceof HTMLSelectElement))return;
    const button=q('[data-calculate],.calc-btn',calcBox);
    if(button){event.preventDefault();button.click()}
  });
}

const categoryPrefix=title=>{
  const t=String(title||'').toLowerCase();
  if(/atmos|weather|performance/.test(t))return'PERF';
  if(/weight|balance|fuel/.test(t))return'WNB';
  if(/nav|route|enroute|flight planning/.test(t))return'NAV';
  if(/speed|distance|time|conversion/.test(t))return'CONV';
  if(/turn|maneuver|bank/.test(t))return'MAN';
  if(/engine|multi|aircraft/.test(t))return'ACFT';
  return'TOOL';
};

function enhanceToolCards(){
  qa('.category').forEach(category=>{
    const prefix=categoryPrefix(q('.category-head h2,.category h2',category)?.textContent);
    qa('.tool-card',category).forEach((card,index)=>{
      if(q('.pd-tool-code',card))return;
      const code=document.createElement('span');
      code.className='pd-tool-code';
      code.textContent=`${prefix}-${String(index+1).padStart(2,'0')}`;
      card.prepend(code);
    });
  });
}

function markReadouts(){
  qa('.result strong,output,[data-readout]').forEach(el=>el.classList.add('instrument-readout'));
}

function init(){
  document.documentElement.classList.add('pd-avionics-architecture');
  installOpsBar();
  enhanceCalculator();
  enhanceToolCards();
  markReadouts();

  /* Homepage modules can be inserted by deferred scripts. Keep enhancement bounded. */
  const observer=new MutationObserver(()=>{enhanceToolCards();markReadouts()});
  if(document.body)observer.observe(document.body,{childList:true,subtree:true});
  setTimeout(()=>observer.disconnect(),2500);
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
