(()=>{
'use strict';
const qs=(s,r=document)=>r.querySelector(s),qsa=(s,r=document)=>[...r.querySelectorAll(s)];
if(!qs('#wbCabinSlots')||!qs('#wbRows'))return;
const norm=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const templates={
  four:{shape:'single',slots:[
    {key:'pilot',label:'Pilot',x:38,y:31,aliases:['pilot','left front','front left']},
    {key:'frontPassenger',label:'Front passenger',x:62,y:31,aliases:['front passenger','copilot','right front','front right']},
    {key:'rearLeft',label:'Rear left',x:38,y:51,aliases:['rear left','left rear']},
    {key:'rearRight',label:'Rear right',x:62,y:51,aliases:['rear right','right rear']},
    {key:'baggage',label:'Baggage',x:50,y:75,kind:'cargo',aliases:['baggage','baggage area','aft baggage']}
  ]},
  six:{shape:'single',slots:[
    {key:'pilot',label:'Pilot',x:38,y:27,aliases:['pilot','left front','front left']},
    {key:'copilot',label:'Copilot',x:62,y:27,aliases:['copilot','front passenger','right front','front right']},
    {key:'row2Left',label:'Row 2 left',x:38,y:44,aliases:['row 2 left','middle left']},
    {key:'row2Right',label:'Row 2 right',x:62,y:44,aliases:['row 2 right','middle right']},
    {key:'row3Left',label:'Row 3 left',x:38,y:61,aliases:['row 3 left','rear left','left rear']},
    {key:'row3Right',label:'Row 3 right',x:62,y:61,aliases:['row 3 right','rear right','right rear']},
    {key:'baggage',label:'Baggage',x:50,y:80,kind:'cargo',aliases:['baggage','baggage area','aft baggage']}
  ]},
  twin:{shape:'twin',slots:[
    {key:'pilot',label:'Pilot',x:38,y:31,aliases:['pilot','left front','front left']},
    {key:'copilot',label:'Copilot',x:62,y:31,aliases:['copilot','front passenger','right front','front right']},
    {key:'rearLeft',label:'Rear left',x:38,y:52,aliases:['rear left','left rear']},
    {key:'rearRight',label:'Rear right',x:62,y:52,aliases:['rear right','right rear']},
    {key:'noseBag',label:'Nose baggage',x:50,y:10,kind:'cargo',aliases:['nose baggage','forward baggage','front baggage']},
    {key:'aftBag',label:'Aft baggage',x:50,y:78,kind:'cargo',aliases:['aft baggage','baggage','rear baggage']}
  ]},
  utility:{shape:'utility',slots:[
    {key:'pilot',label:'Pilot',x:38,y:28,aliases:['pilot','left front','front left']},
    {key:'copilot',label:'Copilot',x:62,y:28,aliases:['copilot','front passenger','right front','front right']},
    {key:'cabin1',label:'Cabin station 1',x:50,y:47,kind:'cargo',aliases:['cabin station 1','cabin 1']},
    {key:'cabin2',label:'Cabin station 2',x:50,y:61,kind:'cargo',aliases:['cabin station 2','cabin 2']},
    {key:'cargo',label:'Cargo / baggage',x:50,y:78,kind:'cargo',aliases:['cargo','baggage','cargo baggage']}
  ]}
};
const silhouette={
single:`<svg viewBox="0 0 240 620" focusable="false"><path d="M120 16 C101 45 96 92 95 164 L22 251 L22 278 L94 253 L97 438 L61 516 L61 544 L106 520 L112 596 L128 596 L134 520 L179 544 L179 516 L143 438 L146 253 L218 278 L218 251 L145 164 C144 92 139 45 120 16Z"/><ellipse cx="120" cy="204" rx="30" ry="78"/><path d="M120 16V596"/></svg>`,
twin:`<svg viewBox="0 0 240 620" focusable="false"><path d="M120 16 C101 45 96 92 95 164 L22 251 L22 278 L94 253 L97 438 L61 516 L61 544 L106 520 L112 596 L128 596 L134 520 L179 544 L179 516 L143 438 L146 253 L218 278 L218 251 L145 164 C144 92 139 45 120 16Z"/><ellipse cx="58" cy="245" rx="18" ry="58"/><ellipse cx="182" cy="245" rx="18" ry="58"/><ellipse cx="120" cy="204" rx="30" ry="78"/><path d="M120 16V596"/></svg>`,
utility:`<svg viewBox="0 0 240 620" focusable="false"><path d="M120 18 C101 48 96 98 96 168 L24 250 L24 284 L92 258 L92 454 L54 520 L54 548 L106 522 L112 596 L128 596 L134 522 L186 548 L186 520 L148 454 L148 258 L216 284 L216 250 L144 168 C144 98 139 48 120 18Z"/><rect x="91" y="175" width="58" height="235" rx="24"/><path d="M120 18V596"/></svg>`
};
const layoutSel=qs('#wbCabinLayout'),mirror=qs('#wbMirrorLanding'),slotsHost=qs('#wbCabinSlots'),shapeHost=qs('#wbAircraftSilhouette'),status=qs('#wbCabinStatus');
const bewW=qs('#wbVisualBEWWeight'),bewA=qs('#wbVisualBEWArm');
let syncing=false;const splitArm={front:'',rear:''};
function rows(){return qsa('.wb-row',qs('#wbRows'))}
function rowInfo(el){return {el,name:qs('[data-k="name"]',el),dep:qs('[data-k="dep"]',el),ldg:qs('[data-k="ldg"]',el),arm:qs('[data-k="arm"]',el)}}
function allInfos(){return rows().map(rowInfo)}
function findRow(slot){const aliases=[slot.label,...slot.aliases].map(norm);return allInfos().find(r=>aliases.includes(norm(r.name?.value)))||null}
function findExact(name){const n=norm(name);return allInfos().find(r=>norm(r.name?.value)===n)||null}
function slotGroup(slot){
  if(['pilot','frontPassenger','copilot'].includes(slot.key))return 'front';
  if(['rearLeft','rearRight'].includes(slot.key))return 'rear';
  return '';
}
function groupRow(group){return group==='front'?findExact('Front seats'):group==='rear'?findExact('Rear seats'):null}
function groupArmValue(group){
  if(splitArm[group]!=='')return splitArm[group];
  const r=groupRow(group);return r?.arm?.value||'';
}
function prepareSplit(slot){
  const group=slotGroup(slot);if(!group||findRow(slot))return true;
  const r=groupRow(group);if(!r)return true;
  const hasWeight=String(r.dep?.value||'').trim()!==''||String(r.ldg?.value||'').trim()!=='';
  if(hasWeight){status.textContent=`${r.name.value} already contains a grouped weight. Open the Advanced station table to split or clear that grouped station before entering individual seat weights.`;qs('#wbAdvancedStations')?.setAttribute('open','');return false}
  splitArm[group]=r.arm?.value||splitArm[group]||'';
  r.el.querySelector('[data-remove]')?.click();
  return true;
}
function dispatch(el){el?.dispatchEvent(new Event('input',{bubbles:true}))}
function createRow(label){qs('#addStation')?.click();const el=rows().at(-1);if(!el)return null;const r=rowInfo(el);r.name.value=label;dispatch(r.name);return r}
function getOrCreate(slot){return findRow(slot)||createRow(slot.label)}
function setRow(slot,weight,arm){
  if(!prepareSplit(slot))return;
  const r=getOrCreate(slot);if(!r)return;
  syncing=true;
  if(weight!==''){r.dep.value=weight;if(mirror.checked)r.ldg.value=weight}
  if(arm!=='')r.arm.value=arm;
  dispatch(r.dep);if(mirror.checked)dispatch(r.ldg);dispatch(r.arm);
  syncing=false;
}
function setBEW(){
  let r=findExact('Basic Empty Weight')||createRow('Basic Empty Weight');if(!r)return;
  syncing=true;
  if(bewW.value!==''){r.dep.value=bewW.value;r.ldg.value=bewW.value}
  if(bewA.value!=='')r.arm.value=bewA.value;
  dispatch(r.dep);dispatch(r.ldg);dispatch(r.arm);syncing=false;
}
function slotCard(slot){
  const r=findRow(slot),dep=r?.dep?.value||'',arm=r?.arm?.value||groupArmValue(slotGroup(slot))||'',linked=r?`Linked to ${r.name.value}`:(slotGroup(slot)&&groupRow(slotGroup(slot))?'Uses grouped station arm when split':'Creates/links a station when edited');
  return `<label class="wb-seat-card" data-slot="${slot.key}" data-kind="${slot.kind||'seat'}" style="left:${slot.x}%;top:${slot.y}%"><strong>${slot.label}</strong><div class="wb-seat-inputs"><span><small>Weight lb</small><input data-visual-weight type="number" step="any" min="0" inputmode="decimal" value="${dep}" aria-label="${slot.label} weight in pounds"></span><span><small>Arm in</small><input data-visual-arm type="number" step="any" inputmode="decimal" value="${arm}" aria-label="${slot.label} arm in inches"></span></div><div class="wb-seat-linked">${linked}</div></label>`;
}
function refresh(){
  if(syncing)return;
  const key=layoutSel.value in templates?layoutSel.value:'four',t=templates[key];
  shapeHost.innerHTML=silhouette[t.shape]||silhouette.single;
  slotsHost.innerHTML=t.slots.map(slotCard).join('');
  const bew=findExact('Basic Empty Weight');
  if(document.activeElement!==bewW)bewW.value=bew?.dep?.value||'';
  if(document.activeElement!==bewA)bewA.value=bew?.arm?.value||'';
  status.textContent='Visual entries synchronize with the station table. Landing weights mirror departure while the mirror option is on; use the advanced table for any in-flight changes.';
}
function selectedSlot(key){return templates[layoutSel.value]?.slots.find(s=>s.key===key)}
slotsHost.addEventListener('input',e=>{
  const card=e.target.closest('[data-slot]');if(!card)return;
  const slot=selectedSlot(card.dataset.slot);if(!slot)return;
  const w=qs('[data-visual-weight]',card).value,a=qs('[data-visual-arm]',card).value;
  setRow(slot,w,a);status.textContent=`${slot.label} synchronized with the loading table.`;
});
bewW.addEventListener('input',setBEW);bewA.addEventListener('input',setBEW);
layoutSel.addEventListener('change',()=>{localStorage.setItem('pd-wb-cabin-layout',layoutSel.value);refresh()});
mirror.addEventListener('change',()=>localStorage.setItem('pd-wb-cabin-mirror',mirror.checked?'1':'0'));
qs('#wbCabinRefresh')?.addEventListener('click',refresh);
qs('#wbRows').addEventListener('input',()=>{if(!syncing)requestAnimationFrame(refresh)});
const savedLayout=localStorage.getItem('pd-wb-cabin-layout');if(savedLayout&&templates[savedLayout])layoutSel.value=savedLayout;
mirror.checked=localStorage.getItem('pd-wb-cabin-mirror')!=='0';
setTimeout(refresh,0);
})();