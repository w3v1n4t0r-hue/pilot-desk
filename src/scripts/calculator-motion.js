import { animate, press, hover } from 'motion';
import { diagramModel, vector, shortestAngle, DIAGRAM_KEYS } from './calculator-motion-model.mjs';
import aircraftPlan from '../../assets/animation-objects/aircraft-plan.svg';
import aircraftProfile from '../../assets/animation-objects/aircraft-profile.svg';
import runway from '../../assets/animation-objects/runway.svg';
import compass from '../../assets/animation-objects/compass.svg';
import windVector from '../../assets/animation-objects/wind-vector.svg';
import seat from '../../assets/animation-objects/seat.svg';
import baggage from '../../assets/animation-objects/baggage.svg';
import obstacle from '../../assets/animation-objects/obstacle.svg';
import fuelSegments from '../../assets/animation-objects/fuel-segments.svg';

const icons={aircraftPlan,aircraftProfile,runway,compass,windVector,seat,baggage,obstacle,fuelSegments};
const ns='http://www.w3.org/2000/svg', reduced=matchMedia('(prefers-reduced-motion: reduce)');
const cleanup=[], active=new Set(), positions=new WeakMap();
const q=(selector,root=document)=>root.querySelector(selector);
const fmt=(v,d=1)=>Number.isFinite(v)?v.toLocaleString(undefined,{maximumFractionDigits:d}):'—';
const isReduced=()=>reduced.matches||document.documentElement.classList.contains('pd-reduced-motion');
const eligible=()=>!isReduced()&&!document.hidden&&!navigator.connection?.saveData;
const el=(tag,attrs={},parent)=>{const node=document.createElementNS(ns,tag);for(const [k,v]of Object.entries(attrs))node.setAttribute(k,v);parent?.append(node);return node};
function tracked(control){active.add(control);Promise.resolve(control.finished).then(()=>active.delete(control),()=>active.delete(control));return control}
function icon(name,parent,scale=1,part){
 const parsed=new DOMParser().parseFromString(icons[name],'image/svg+xml');
 const source=part?parsed.querySelector(`[data-part="${part}"]`):parsed.querySelector('[data-object]');
 const group=el('g',{},parent),scaled=el('g',{transform:`scale(${scale})`},group);
 const copy=source.cloneNode(true);copy.querySelectorAll('[id]').forEach(n=>n.removeAttribute('id'));copy.removeAttribute('id');scaled.append(document.importNode(copy,true));
 return group;
}
function animateTargets(targets,immediate=false){
 const tracks=targets.map(([node,end])=>{
  const previous=positions.get(node)||{};const start={};const target={...end};
  for(const key of Object.keys(target)){start[key]=previous[key]??target[key];if(key==='angle')target[key]=shortestAngle(start[key],target[key]);}
  return {node,start,target};
 });
 const paint=t=>tracks.forEach(({node,start,target})=>{
  const current=Object.fromEntries(Object.entries(target).map(([k,v])=>[k,start[k]+(v-start[k])*t]));positions.set(node,current);
  if('sx'in current)node.setAttribute('d',`M${current.sx} ${current.sy} L${current.ex} ${current.ey}`);
  else if('tx'in current||'angle'in current)node.setAttribute('transform',`translate(${current.tx||0} ${current.ty||0}) rotate(${current.angle||0}) scale(${current.scale??1})`);
  else for(const [k,v]of Object.entries(current))node.setAttribute(k,String(v));
 });
 if(immediate||!eligible()){paint(1);return null;}
 return tracked(animate(0,1,{duration:.3,ease:[.2,.8,.2,1],onUpdate:paint}));
}
function line(parent,dashed=false){return el('line',{class:dashed?'pd-diagram-line pd-diagram-dashed':'pd-diagram-line'},parent)}
function label(parent,x,y,text=''){const node=el('text',{x,y,class:'pd-diagram-label'},parent);node.textContent=text;return node}
function arrow(parent,dashed=false){return {line:line(parent,dashed),head:icon('windVector',parent,4,'wind-tip')};}
function arrowTarget(a,x1,y1,x2,y2){
 const angle=Math.atan2(x2-x1,-(y2-y1))*180/Math.PI;const visible=Math.hypot(x2-x1,y2-y1)>.01;
 a.head.style.display=visible?'':'none';a.line.style.display=visible?'':'none';
 return [[a.line,{x1,y1,x2,y2}],[a.head,{tx:x2-Math.sin(angle*Math.PI/180)*12,ty:y2+Math.cos(angle*Math.PI/180)*12,angle}]];
}
function readInputs(){const values={};for(const input of document.querySelectorAll('[data-calc-input]')){if(input.value.trim()===''&&input.hasAttribute('data-calc-optional'))continue;values[input.id]=input.value.trim()===''?NaN:Number(input.value);}return values;}
function mountDiagram(key){
 const panel=q('.pd-calc-output-panel');if(!panel)return;
 const figure=document.createElement('figure');figure.className='pd-calculator-diagram';figure.innerHTML='<div class="pd-diagram-heading"><b></b><button type="button" class="pd-diagram-replay" hidden>Replay</button></div><p class="pd-diagram-invalid" hidden>Enter valid values to show the diagram.</p><figcaption></figcaption>';
 const svg=el('svg',{viewBox:'0 0 480 260',role:'img','aria-label':'Calculation diagram'});figure.insertBefore(svg,q('figcaption',figure));panel.insertBefore(figure,panel.firstChild);
 q('b',figure).textContent='Diagram';
 const title=q('b',figure),caption=q('figcaption',figure),invalid=q('.pd-diagram-invalid',figure),button=q('button',figure);
 let nodes=null,kind=null,transition=null,replay=null,paused=false,lastModel=null,lastSignature='',domain='',disposed=false;
 function stopReplay(){replay?.stop();active.delete(replay);replay=null;paused=false;button.textContent='Replay';}
 function build(m){
  svg.replaceChildren();kind=m.kind;nodes={};domain='';
  if(kind==='journey'){
   nodes.lanes=m.lanes.map((_,i)=>{const y=m.lanes.length===1?132:62+i*72;const track=line(svg,true);track.setAttribute('x1','36');track.setAttribute('x2','438');track.setAttribute('y1',y);track.setAttribute('y2',y);return {path:line(svg),name:label(svg,36,y-19),answer:label(svg,36,y+23),y};});
   nodes.ticks=Array.from({length:5},()=>({mark:line(svg),text:label(svg,0,nodes.lanes[0].y+23)}));nodes.aircraft=icon('aircraftProfile',svg,3.2);nodes.scale=label(svg,300,254);
  }else if(kind==='airspeed'){
   nodes.cas=el('rect',{x:36,y:75,height:24,fill:'#77838d'},svg);nodes.tas=el('rect',{x:36,y:155,height:24,fill:'#d9dde0'},svg);
   nodes.casLabel=label(svg,36,62);nodes.tasLabel=label(svg,36,142);nodes.note=label(svg,36,223);nodes.scale=label(svg,300,254);
  }else if(kind==='crosswind'){
   nodes.compass=icon('compass',svg,30);nodes.runway=icon('runway',svg,15);nodes.wind=arrow(svg);nodes.gust=arrow(svg,true);nodes.head=arrow(svg,true);nodes.cross=arrow(svg,true);
   nodes.gustReadout=document.createElement('p');nodes.gustReadout.className='pd-diagram-gust';figure.insertBefore(nodes.gustReadout,q('figcaption',figure));
   nodes.warning=document.createElement('p');nodes.warning.className='pd-diagram-existing-warning';figure.insertBefore(nodes.warning,q('figcaption',figure));
   q('.pd-crosswind-display')?.classList.add('pd-diagram-replaced');
   nodes.gust.line.classList.add('pd-diagram-secondary');nodes.gust.head.classList.add('pd-diagram-secondary');nodes.note=label(svg,24,244);
   positions.set(nodes.compass,{tx:240,ty:124});nodes.compass.setAttribute('transform','translate(240 124)');
  }else if(kind==='triangle'){
   nodes.air=arrow(svg);nodes.wind=arrow(svg,true);nodes.ground=arrow(svg);nodes.ground.line.classList.add('pd-diagram-bright');nodes.aircraft=icon('aircraftPlan',svg,4);nodes.note=label(svg,24,244);
  }else if(kind==='profile'){
   nodes.axis=line(svg);nodes.axis.setAttribute('x1','42');nodes.axis.setAttribute('y1','216');nodes.axis.setAttribute('x2','440');nodes.axis.setAttribute('y2','216');
   nodes.vertical=line(svg,true);nodes.vertical.setAttribute('x1','42');nodes.vertical.setAttribute('y1','36');nodes.vertical.setAttribute('x2','42');nodes.vertical.setAttribute('y2','216');
   nodes.path=el('path',{class:'pd-diagram-line pd-diagram-bright',fill:'none',pathLength:1},svg);nodes.aircraft=icon('aircraftProfile',svg,4);nodes.obstacle=icon('obstacle',svg,1);nodes.height=label(svg,49,27);nodes.distance=label(svg,330,241);nodes.note=label(svg,60,241);
  }else if(kind==='turn'){
   nodes.circle=el('circle',{cx:240,cy:125,r:88,class:'pd-diagram-line pd-diagram-secondary',fill:'none'},svg);nodes.path=el('path',{class:'pd-diagram-line pd-diagram-bright',fill:'none',pathLength:1},svg);nodes.radius=line(svg,true);nodes.aircraft=icon('aircraftPlan',svg,4);nodes.note=label(svg,24,244);
  }else if(kind==='fuel'){
   nodes.fuel=icon('fuelSegments',svg,48);nodes.note=label(svg,30,207);nodes.fuel.setAttribute('transform','translate(240 118)');
   nodes.onboard=line(svg,true);
   nodes.trip=q('[data-part="fuel-trip"] polygon',nodes.fuel);nodes.reserve=q('[data-part="fuel-reserve"] polygon',nodes.fuel);nodes.remaining=q('[data-part="fuel-remaining"] polygon',nodes.fuel);
   // Replace design placeholder polygons with data-driven rectangles.
   for(const name of ['trip','reserve','remaining']){const old=nodes[name],rect=el('rect',{fill:old.getAttribute('fill'),y:-.62,height:1.24});old.replaceWith(rect);nodes[name]=rect;}
   nodes.legend=label(svg,30,233);
  }else if(kind==='heading'){
   nodes.compass=icon('compass',svg,30);nodes.compass.setAttribute('transform','translate(240 124)');nodes.first=arrow(svg,true);nodes.second=arrow(svg);nodes.note=label(svg,24,244);
  }else if(kind==='bank'){
   nodes.axis=line(svg);nodes.axis.setAttribute('x1','40');nodes.axis.setAttribute('y1','214');nodes.axis.setAttribute('x2','438');nodes.axis.setAttribute('y2','214');
   nodes.curve=el('path',{class:'pd-diagram-line',fill:'none',pathLength:1},svg);nodes.point=el('circle',{r:5,class:'pd-diagram-point'},svg);nodes.aircraft=el('g',{},svg);el('line',{x1:-40,y1:0,x2:40,y2:0,class:'pd-diagram-bright pd-diagram-line'},nodes.aircraft);el('line',{x1:0,y1:-15,x2:0,y2:0,class:'pd-diagram-line'},nodes.aircraft);el('ellipse',{rx:6,ry:8,class:'pd-diagram-point'},nodes.aircraft);nodes.note=label(svg,40,244);label(svg,40,27,'Load factor (G)');label(svg,390,244,'Bank');
   const pts=Array.from({length:81},(_,b)=>[40+b/80*390,214-(1/Math.cos(b*Math.PI/180)-1)/5*160]);nodes.curve.setAttribute('d',pts.map(([x,y],i)=>`${i?'L':'M'}${x} ${y}`).join(' '));
  }else if(kind==='altitude'){
   nodes.axis=line(svg);nodes.axis.setAttribute('x1','90');nodes.axis.setAttribute('y1','40');nodes.axis.setAttribute('x2','90');nodes.axis.setAttribute('y2','218');
   nodes.first=line(svg,true);nodes.second=line(svg);nodes.label1=label(svg,165,0);nodes.label2=label(svg,165,0);nodes.note=label(svg,24,244);
  }
 }
 function draw(m,immediate=false){
  const targets=[];button.hidden=!['profile','turn','journey'].includes(m.kind)||!(m.minutes>0||m.seconds>0);
  if(m.kind==='journey'){
   const maximum=Math.max(1,...m.lanes.map(l=>l.distance)),scale=390/maximum;
   const newDomain=String(maximum);immediate||=domain!==newDomain;domain=newDomain;
   m.path={start:[36,nodes.lanes[0].y],end:[36+m.lanes[0].distance*scale,nodes.lanes[0].y]};
   m.lanes.forEach((lane,i)=>{const n=nodes.lanes[i];n.name.textContent=lane.label+(i===0?` → ${fmt(lane.answer,2)} ${lane.unit}`:'');n.answer.toggleAttribute('hidden',i===0);n.answer.textContent=`${fmt(lane.answer,2)} ${lane.unit}`;targets.push([n.path,{x1:36,y1:n.y,x2:36+lane.distance*scale,y2:n.y}]);});
   nodes.ticks.forEach((tick,i)=>{const x=36+m.lanes[0].distance*scale*i/4,y=nodes.lanes[0].y;tick.mark.setAttribute('x1',x);tick.mark.setAttribute('x2',x);tick.mark.setAttribute('y1',y-3);tick.mark.setAttribute('y2',y+5);tick.text.setAttribute('x',x);tick.text.setAttribute('text-anchor',i===0?'start':i===4?'end':'middle');tick.text.textContent=fmt((m.minutes??m.seconds)*i/4,1);tick.mark.toggleAttribute('hidden',i>0&&m.lanes[0].distance===0);tick.text.toggleAttribute('hidden',i>0&&m.lanes[0].distance===0);});targets.push([nodes.aircraft,{tx:36,ty:nodes.lanes[0].y-7,angle:0}]);nodes.scale.textContent=`Full ruler: ${fmt(maximum,2)} NM`;
  }else if(m.kind==='airspeed'){
   const maximum=Math.max(50,Math.ceil(Math.max(m.cas,m.tas)/50)*50),scale=390/maximum;
   const newDomain=String(maximum);immediate||=domain!==newDomain;domain=newDomain;
   targets.push([nodes.cas,{width:m.cas*scale}],[nodes.tas,{width:m.tas*scale}]);
   nodes.casLabel.textContent=`CAS ${fmt(m.cas)} kt`;nodes.tasLabel.textContent=`Estimated TAS ${fmt(m.tas)} kt`;
   nodes.note.textContent=`${fmt(m.alt,0)} ft · difference ${fmt(m.tas-m.cas)} kt`;nodes.scale.textContent=`Full scale: ${fmt(maximum,0)} kt`;
  }else if(m.kind==='crosswind'){
   const scale=85/Math.max(40,m.speed,m.gust||0),u=vector(m.speed*scale,m.wind),h=vector(m.head*scale,m.runway);
   targets.push([nodes.runway,{tx:240,ty:124,angle:m.runway}],...arrowTarget(nodes.wind,240+u[0],124+u[1],240,124),...arrowTarget(nodes.head,240+h[0],124+h[1],240,124),...arrowTarget(nodes.cross,240+u[0],124+u[1],240+h[0],124+h[1]));
   if(Number.isFinite(m.gust)){const g=vector(m.gust*scale,m.wind);targets.push(...arrowTarget(nodes.gust,240+g[0],124+g[1],240,124));}else{nodes.gust.head.style.display='none';nodes.gust.line.style.display='none';}
   nodes.note.textContent=`Runway ${fmt(m.runway,0)}° · wind from ${fmt(m.wind,0)}°`;
   const legacy=q('.pd-crosswind-display');
   nodes.gustReadout.hidden=!Number.isFinite(m.gust);nodes.gustReadout.textContent=Number.isFinite(m.gust)?[legacy?.querySelector('[data-xwind-cross-gust]')?.textContent,legacy?.querySelector('[data-xwind-head-gust]')?.textContent].filter(Boolean).join(' · '):'';
   const warning=legacy?.querySelector('.pd-xwind-warning');nodes.warning.hidden=warning?.dataset.show!=='true';nodes.warning.textContent=warning?.textContent||'';
  }else if(m.kind==='triangle'){
   const pts=[[0,0],m.air,m.ground],xs=pts.map(p=>p[0]),ys=pts.map(p=>p[1]);const minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys),s=Math.min(350/Math.max(1,maxX-minX),170/Math.max(1,maxY-minY));
   const project=p=>[240+(p[0]-(minX+maxX)/2)*s,124+(p[1]-(minY+maxY)/2)*s];const a=project([0,0]),b=project(m.air),c=project(m.ground);
   targets.push(...arrowTarget(nodes.air,...a,...b),...arrowTarget(nodes.wind,...b,...c),...arrowTarget(nodes.ground,...a,...c),[nodes.aircraft,{tx:b[0],ty:b[1],angle:m.heading}]);
   nodes.note.textContent=`Heading ${fmt(m.heading)}° · groundspeed ${fmt(m.gs)} kt`;
  }else if(m.kind==='profile'){
   const xmax=Math.max(5,Math.ceil(m.distance/5)*5),ymax=Math.max(1000,Math.ceil(m.height/1000)*1000),endX=42+m.distance/xmax*390,highY=216-m.height/ymax*172;
   const start=[42,m.climb?216:highY],end=[endX,m.climb?highY:216];m.path={start,end};
   const newDomain=`${xmax}:${ymax}`;immediate||=domain!==newDomain;domain=newDomain;
   targets.push([nodes.path,{sx:start[0],sy:start[1],ex:end[0],ey:end[1]}]);targets.push([nodes.aircraft,{tx:start[0],ty:start[1]-7,angle:Math.atan2(end[1]-start[1],end[0]-start[0])*180/Math.PI}]);
   nodes.obstacle.style.display=Number.isFinite(m.obstacle)?'':'none';if(Number.isFinite(m.obstacle))targets.push([nodes.obstacle,{tx:endX,ty:216-m.obstacle/ymax*172*2.7/6,scale:m.obstacle/ymax*172/6}]);
   nodes.height.textContent=`${fmt(ymax,0)} ft`;nodes.distance.textContent=`${fmt(xmax,0)} NM`;nodes.note.textContent=`${fmt(m.angle,2)}°`;
  }else if(m.kind==='turn'){
   const unit=Math.max(1,Math.ceil(m.radius)),r=88*m.radius/unit,end=m.degrees*Math.PI/180,x=240+r*Math.sin(end),y=125-r*Math.cos(end);m.pixelRadius=r;nodes.circle.setAttribute('r',String(r));
   nodes.path.setAttribute('d',m.degrees<.001?`M240 ${125-r}`:m.degrees>=359.999?`M240 ${125-r} A${r} ${r} 0 1 1 240 ${125+r} A${r} ${r} 0 1 1 240 ${125-r}`:`M240 ${125-r} A${r} ${r} 0 ${m.degrees>180?1:0} 1 ${x} ${y}`);
   targets.push([nodes.aircraft,{tx:240,ty:125-r,angle:90}],[nodes.radius,{x1:240,y1:125,x2:240,y2:125-r}]);nodes.note.textContent=`Radius ${fmt(m.radius,2)} NM${m.rate?' · '+fmt(m.rate,2)+'°/sec':''}`;
  }else if(m.kind==='fuel'){
   const span=Math.max(m.total,m.trip+m.reserve,.001),length=7.7/ span;
   targets.push([nodes.trip,{x:-3.85,width:m.trip*length}],[nodes.reserve,{x:-3.85+m.trip*length,width:m.reserve*length}],[nodes.remaining,{x:-3.85+(m.trip+m.reserve)*length,width:Math.max(0,m.remaining)*length}]);
   const onboardX=240+(-3.85+m.total*length)*48;targets.push([nodes.onboard,{x1:onboardX,y1:70,x2:onboardX,y2:164}]);
   nodes.note.textContent=m.title==='Fuel volume'?`Entered ${fmt(m.total)} US gal`:`${fmt(m.total)} gal on board · dashed line`;nodes.legend.textContent=m.reserve||m.remaining?`Trip ${fmt(m.trip)} · reserve ${fmt(m.reserve)} · ${m.remaining<0?'shortfall '+fmt(-m.remaining):'remaining '+fmt(m.remaining)} gal`:`${fmt(m.total)} US gal`;nodes.note.classList.toggle('pd-diagram-alert',m.remaining<0);
  }else if(m.kind==='heading'){
   const a=vector(74,m.first),b=vector(88,m.second);targets.push(...arrowTarget(nodes.first,240,124,240+a[0],124+a[1]),...arrowTarget(nodes.second,240,124,240+b[0],124+b[1]));nodes.note.textContent=`${m.labels[0]} ${fmt(m.first)}° · ${m.labels[1]} ${fmt(m.second)}°`;
  }else if(m.kind==='bank'){
   targets.push([nodes.point,{cx:40+m.bank/80*390,cy:214-(m.factor-1)/5*160}],[nodes.aircraft,{tx:335,ty:83,angle:m.bank}]);nodes.note.textContent=`${fmt(m.bank)}° bank · ${fmt(m.factor,2)} G`;
  }else if(m.kind==='altitude'){
   const low=Math.min(0,m.first,m.second),high=Math.max(1000,m.first,m.second),s=170/Math.max(1,high-low),y1=214-(m.first-low)*s,y2=214-(m.second-low)*s;
   const newDomain=`${low}:${high}`;immediate||=domain!==newDomain;domain=newDomain;
   targets.push([nodes.first,{x1:76,y1,x2:144,y2:y1}],[nodes.second,{x1:76,y1:y2,x2:144,y2}]);
   // Put labels on separate rows when the markers overlap.
   nodes.label1.setAttribute('y',String(y1-8));nodes.label2.setAttribute('y',String(Math.abs(y2-y1)<30?y2+20:y2-8));nodes.label1.textContent=`${m.labels[0]} ${fmt(m.first,0)} ft`;nodes.label2.textContent=`${m.labels[1]} ${fmt(m.second,0)} ft`;nodes.note.textContent=`Scale ${fmt(low,0)} to ${fmt(high,0)} ft`;
  }
  transition?.stop();active.delete(transition);transition=animateTargets(targets,immediate);
 }
 function update(){
  if(disposed)return;const values=readInputs(),signature=JSON.stringify([values,...document.querySelectorAll('.result strong')].map(v=>v.textContent??v));if(signature===lastSignature)return;lastSignature=signature;
  const validOutput=q('#out0')?.textContent.trim();const m=validOutput&&validOutput!=='—'?diagramModel(key,values):null;
  stopReplay();transition?.stop();active.delete(transition);
  invalid.hidden=Boolean(m);svg.toggleAttribute('hidden',!m);caption.hidden=!m;button.hidden=!m;
  if(!m){if(nodes?.gustReadout)nodes.gustReadout.hidden=true;if(nodes?.warning)nodes.warning.hidden=true;lastModel=null;return;}
  const fresh=kind!==m.kind;if(fresh)build(m);title.textContent=m.title;caption.textContent=m.caption;svg.setAttribute('aria-label',`${m.title}. ${m.caption}`);draw(m,fresh);lastModel=m;
  if(fresh&&nodes.path&&eligible()){nodes.path.setAttribute('stroke-dasharray','1');tracked(animate(1,0,{duration:.55,ease:'easeOut',onUpdate:value=>nodes.path.setAttribute('stroke-dashoffset',String(value))}));}
 }
 button.addEventListener('click',()=>{
  if(!lastModel||!eligible())return;
  if(replay){if(paused){replay.play();paused=false;button.textContent='Pause replay';}else{replay.pause();paused=true;button.textContent='Resume replay';}return;}
  transition?.complete();const m=lastModel;button.textContent='Pause replay';caption.textContent=m.caption+` Replay: 5 seconds represents ${m.minutes?fmt(m.minutes)+(m.minutes===1?' minute':' minutes'):fmt(m.seconds,0)+' seconds'}.`;
  replay=tracked(animate(0,1,{duration:5,ease:'linear',onUpdate:t=>{
   if(m.kind==='profile'||m.kind==='journey'){const [a,b]=[m.path.start,m.path.end];const pose={tx:a[0]+(b[0]-a[0])*t,ty:a[1]+(b[1]-a[1])*t-7,angle:Math.atan2(b[1]-a[1],b[0]-a[0])*180/Math.PI};positions.set(nodes.aircraft,pose);nodes.aircraft.setAttribute('transform',`translate(${pose.tx} ${pose.ty}) rotate(${pose.angle})`);}
   else{const angle=m.degrees*t*Math.PI/180;const pose={tx:240+m.pixelRadius*Math.sin(angle),ty:125-m.pixelRadius*Math.cos(angle),angle:90+m.degrees*t};positions.set(nodes.aircraft,pose);nodes.aircraft.setAttribute('transform',`translate(${pose.tx} ${pose.ty}) rotate(${pose.angle})`);}
  },onComplete:()=>{active.delete(replay);replay=null;button.textContent='Replay';}}));
 });
 const observer=new MutationObserver(()=>requestAnimationFrame(update));observer.observe(q('.results'),{childList:true,subtree:true,characterData:true});
 const inputUpdate=()=>requestAnimationFrame(update);document.querySelectorAll('[data-calc-input]').forEach(i=>{i.addEventListener('input',inputUpdate);cleanup.push(()=>i.removeEventListener('input',inputUpdate));});
 const motionChange=()=>{if(isReduced()){stopReplay();transition?.complete();}button.disabled=isReduced();if(lastModel)draw(lastModel,true);};reduced.addEventListener('change',motionChange);document.addEventListener('pilotdesk:preferences-applied',motionChange);
 cleanup.push(()=>{disposed=true;observer.disconnect();stopReplay();transition?.complete();reduced.removeEventListener('change',motionChange);document.removeEventListener('pilotdesk:preferences-applied',motionChange);});
 update();motionChange();
}
function addCabinObjects(){
 const host=q('#wbCabinSlots');if(!host)return;
 const attach=()=>{for(const slot of host.children){if(slot.querySelector('.pd-cabin-object'))continue;const svg=el('svg',{viewBox:'-5 -5 10 10','aria-hidden':'true',class:'pd-cabin-object'});icon(/baggage/i.test(slot.textContent)?'baggage':'seat',svg);slot.prepend(svg);}};
 attach();const observer=new MutationObserver(attach);observer.observe(host,{childList:true});cleanup.push(()=>observer.disconnect());
 const respond=event=>{const slot=event.target.closest('#wbCabinSlots > *');if(!slot||!eligible())return;const flash=tracked(animate(slot,{outlineColor:['#f2f3f5','#56616e']},{duration:.45}));const svg=slot.querySelector('.pd-cabin-object');tracked(animate(svg,{opacity:[.45,1],scale:[.96,1]},{duration:.25,ease:'easeOut'}));};host.addEventListener('input',respond);cleanup.push(()=>host.removeEventListener('input',respond));
}
function init(){
 const calculator=location.pathname.startsWith('/calculators/')&&!location.pathname.includes('weight-balance-builder'),wb=location.pathname==='/weight-balance.html'||location.pathname.includes('weight-balance-builder');
 if(!calculator&&!wb)return;
 document.body.classList.add('pd-calculator-animated');
 if(calculator){const key=document.body.dataset.calc;if(DIAGRAM_KEYS.has(key)){q('.calculator-layout')?.classList.add('pd-has-calculator-diagram');mountDiagram(key);} }
 if(wb)addCabinObjects();
 cleanup.push(press('[data-calculate], .calc-actions button, .pd-diagram-replay, .wb-toolbar button',button=>{
  if(!eligible())return;tracked(animate(button,{scale:.985},{duration:.1}));return()=>{if(eligible())tracked(animate(button,{scale:1},{duration:.16}));else button.style.transform='none';};
 }));
 if(matchMedia('(hover:hover) and (pointer:fine)').matches)cleanup.push(hover('.pd-diagram-replay',button=>{if(eligible())tracked(animate(button,{opacity:.75},{duration:.15}));return()=>{if(eligible())tracked(animate(button,{opacity:1},{duration:.15}));};}));
}
const settle=()=>{if(isReduced()||document.hidden){active.forEach(a=>a.complete());active.clear();}};
reduced.addEventListener('change',settle);document.addEventListener('pilotdesk:preferences-applied',settle);document.addEventListener('visibilitychange',settle);
cleanup.push(()=>{reduced.removeEventListener('change',settle);document.removeEventListener('pilotdesk:preferences-applied',settle);document.removeEventListener('visibilitychange',settle);});
window.addEventListener('pagehide',()=>{cleanup.splice(0).forEach(fn=>fn());active.forEach(a=>a.stop());active.clear();},{once:true});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
