import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const BLUE = 0x8ed8f8;
const clamp = THREE.MathUtils.clamp;
const ease = value => 1 - (1 - clamp(value, 0, 1)) ** 3;

function texture(paint, size = 1024, aspect = 1) {
  const canvas = document.createElement('canvas');
  canvas.width = size; canvas.height = Math.round(size * aspect);
  paint(canvas.getContext('2d'), size);
  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  return map;
}
function mesh(geometry, material, parent, position = [0, 0, 0]) {
  const object = new THREE.Mesh(geometry, material);
  object.position.set(...position);
  parent.add(object);
  return object;
}
function metal(color = 0x555c62, roughness = .35) {
  return new THREE.MeshStandardMaterial({ color, metalness: .72, roughness });
}
function line(points, parent, color = 0x56646c, opacity = 1) {
  const geometry = new THREE.BufferGeometry().setFromPoints(points.map(p => new THREE.Vector3(...p)));
  const object = new THREE.Line(geometry, new THREE.LineBasicMaterial({ color, transparent: opacity < 1, opacity }));
  parent.add(object);
  return object;
}
function ring(radius, tube, parent, material, position = [0, 0, 0]) {
  return mesh(new THREE.TorusGeometry(radius, tube, 10, 96), material, parent, position);
}
function disc(radius, depth, parent, material, z = 0) {
  const object = mesh(new THREE.CylinderGeometry(radius, radius, depth, 96), material, parent, [0, 0, z]);
  object.rotation.x = Math.PI / 2;
  return object;
}
function world() {
  const scene = new THREE.Scene();
  const group = new THREE.Group();
  scene.add(group);
  scene.add(new THREE.HemisphereLight(0xc9d8e5, 0x141419, 2.1));
  const key = new THREE.DirectionalLight(0xffffff, 4.5);
  key.position.set(-3, 5, 5);
  const rim = new THREE.DirectionalLight(BLUE, 2.6);
  rim.position.set(4, 1, -2);
  const fill = new THREE.DirectionalLight(0xffffff, 1.5);
  fill.position.set(2, -3, 4);
  scene.add(key, rim, fill);
  return { scene, group };
}

function paperChart() {
  const { scene, group } = world();
  const hinges = [], pw = 2, ph = 16 / 9;
  const anchor = new THREE.Group(); anchor.position.set(-4, 8 / 3, 0); group.add(anchor);
  let loaded, failed;
  const assetsReady = new Promise((resolve, reject) => { loaded = resolve; failed = reject; });
  const map = new THREE.TextureLoader().load('/assets/hero-scenes/orlando-sectional.webp', loaded, undefined, failed);
  map.colorSpace = THREE.SRGBColorSpace; map.anisotropy = 4;
  const front = new THREE.MeshBasicMaterial({ map, toneMapped: false });
  const back = new THREE.MeshStandardMaterial({ color: 0xe6e1cf, roughness: .95 });
  let previousColumn = anchor;
  for (let col = 0; col < 4; col++) {
    const column = new THREE.Group(); column.position.x = col ? pw : 0; previousColumn.add(column); previousColumn = column;
    if (col) hinges.push({ group: column, axis: 'y', angle: (col % 2 ? -1 : 1) * Math.PI, delay: col * .05, duration: .6 });
    let previousRow = column;
    for (let row = 0; row < 3; row++) {
      const hinge = new THREE.Group(); hinge.position.y = row ? -ph : 0; previousRow.add(hinge); previousRow = hinge;
      if (row) hinges.push({ group: hinge, axis: 'x', angle: (row % 2 ? 1 : -1) * Math.PI, delay: .7 + row * .05, duration: .7 });
      const geometry = new THREE.BoxGeometry(pw, ph, .009), uv = geometry.attributes.uv;
      for (let v = 16; v < 20; v++) uv.setXY(v, (col + uv.getX(v)) / 4, 1 - (row + 1 - uv.getY(v)) / 3);
      mesh(geometry, [back, back, back, back, front, back], hinge, [pw / 2, -ph / 2, 0]);
    }
  }
  return { scene, assetsReady, camera: [0, 0, 8], cover: true, update(time, age) {
    for (const hinge of hinges) hinge.group.rotation[hinge.axis] = hinge.angle * (1 - ease((age - hinge.delay) / hinge.duration));
  } };
}

function flightComputer() {
  const {scene,group}=world();
  const body=new THREE.Group(),dial=new THREE.Group(),cursor=new THREE.Group(),slider=new THREE.Group();group.add(body,dial,cursor,slider);
  const aluminum=metal(0xcbd0d0,.56);
  function plate(w,h,r,depth,parent,z){const shape=new THREE.Shape();shape.moveTo(-w/2+r,-h/2);shape.lineTo(w/2-r,-h/2);shape.quadraticCurveTo(w/2,-h/2,w/2,-h/2+r);shape.lineTo(w/2,h/2-r);shape.quadraticCurveTo(w/2,h/2,w/2-r,h/2);shape.lineTo(-w/2+r,h/2);shape.quadraticCurveTo(-w/2,h/2,-w/2,h/2-r);shape.lineTo(-w/2,-h/2+r);shape.quadraticCurveTo(-w/2,-h/2,-w/2+r,-h/2);const geometry=new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:true,bevelSize:.015,bevelThickness:.009,bevelSegments:2,steps:1});return mesh(geometry,aluminum,parent,[0,0,z]);}
  // Reference silhouette: a narrow, ruled sliding body extends above and below the dial.
  plate(2.36,6.05,.12,.045,body,-.24);
  const instructions=texture((ctx,w)=>{
    const h=ctx.canvas.height;ctx.fillStyle='#e5e7e1';ctx.fillRect(0,0,w,h);
    ctx.fillStyle='#15191a';ctx.fillRect(75,30,w-150,175);ctx.fillStyle='#f0f1e9';ctx.font='bold 52px sans-serif';ctx.textAlign='center';ctx.fillText('PILOTDESK',w/2,110);ctx.font='26px monospace';ctx.fillText('FLIGHT COMPUTER',w/2,160);
    ctx.fillStyle='#242927';ctx.font='bold 23px sans-serif';ctx.fillText('OFF-COURSE CORRECTION',w/2,260);
    for(let i=0;i<5;i++){const y=310+i*115;ctx.font='17px monospace';ctx.fillText(['DISTANCE OFF / DISTANCE FLOWN','MILES TO GO / TOTAL CORRECTION','FLIGHT PLAN INFORMATION','SPEED / TIME / DISTANCE','FUEL / RATE / ENDURANCE'][i],w/2,y);ctx.strokeStyle='#777d77';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(150,y+30);ctx.lineTo(w-150,y+30);ctx.stroke();}
    for(const x of[45,w-45])for(let n=0;n<105;n++){const y=n*h/105;ctx.strokeStyle='#343b38';ctx.lineWidth=n%5?1:2;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+(x<w/2?1:-1)*(n%5?18:34),y);ctx.stroke();if(n%5===0){ctx.save();ctx.translate(x+(x<w/2?38:-38),y+4);ctx.fillStyle='#343b38';ctx.font='16px monospace';ctx.fillText(String(n),0,0);ctx.restore();}}
    ctx.strokeStyle='#69716b';ctx.lineWidth=1;const top=h*.73,left=120,right=w-120,step=(right-left)/18;
    for(let n=0;n<=18;n++){ctx.beginPath();ctx.moveTo(left+n*step,top);ctx.lineTo(left+n*step,h-50);ctx.stroke();}
    for(let n=0;n<=12;n++){const y=top+n*(h-top-50)/12;ctx.beginPath();ctx.moveTo(left,y);ctx.lineTo(right,y);ctx.stroke();}
    ctx.font='14px monospace';for(let r=0;r<12;r++)for(let c=0;c<18;c++)ctx.fillText(String((r+1)*(c+1)%97),left+(c+.5)*step,top+(r+.7)*(h-top-50)/12);
  },1024,2.56);
  mesh(new THREE.PlaneGeometry(2.31,6),new THREE.MeshBasicMaterial({map:instructions,toneMapped:false}),body,[0,0,-.184]);
  plate(2.12,5.7,.08,.035,slider,-.17);
  // The octagonal outer casting and four screws frame the circular slide rule.
  const frame=new THREE.Shape();[[-1.7,-1.05],[-1.05,-1.7],[1.05,-1.7],[1.7,-1.05],[1.7,1.05],[1.05,1.7],[-1.05,1.7],[-1.7,1.05]].forEach(([x,y],i)=>i?frame.lineTo(x,y):frame.moveTo(x,y));frame.closePath();
  mesh(new THREE.ExtrudeGeometry(frame,{depth:.06,bevelEnabled:true,bevelSize:.035,bevelThickness:.015,bevelSegments:3}),aluminum,body,[0,0,-.14]);
  for(const x of[-1.41,1.41])for(const y of[-.96,.96]){disc(.046,.025,body,metal(0x4a5254),-.045).position.set(x,y,-.045);line([[x-.024,y,-.028],[x+.024,y,-.028]],body,0x11181b);}
  const scale=(inner)=>texture((ctx,w)=>{
    const c=w/2;ctx.fillStyle='#e7e8e0';ctx.fillRect(0,0,w,w);ctx.translate(c,c);ctx.strokeStyle='#1c2523';ctx.fillStyle='#1c2523';ctx.textAlign='center';
    const rings=inner?[.98,.89,.77,.67]:[.985,.91,.83,.74];
    for(const radius of rings){ctx.lineWidth=1;ctx.beginPath();ctx.arc(0,0,c*radius,0,Math.PI*2);ctx.stroke();}
    for(let n=100;n<1000;n++){const major=n%50===0,medium=n%10===0,a=Math.log10(n/100)*Math.PI*2;ctx.save();ctx.rotate(a);ctx.lineWidth=major?6:medium?3:1.6;ctx.beginPath();ctx.moveTo(0,-c*.97);ctx.lineTo(0,-c*(major?.9:medium?.925:.95));ctx.stroke();if(major){ctx.font='bold 44px sans-serif';ctx.fillText(String(n/10),0,-c*.855);}ctx.restore();}
    for(let n=1;n<=60;n++){ctx.save();ctx.rotate(n/60*Math.PI*2);ctx.lineWidth=n%5?2:4;ctx.beginPath();ctx.moveTo(0,-c*.76);ctx.lineTo(0,-c*(n%5?.745:.71));ctx.stroke();if(n%5===0){ctx.font='32px monospace';ctx.fillText(String(n),0,-c*.66);}ctx.restore();}
    ctx.font='bold 48px sans-serif';ctx.fillText(inner?'FLIGHT COMPUTER':'CIRCULAR SLIDE RULE',0,-c*.53);
    if(inner){ctx.font='bold 26px sans-serif';ctx.fillText('ALTITUDE CORRECTION',-c*.28,-10);ctx.fillText('AIRSPEED CORRECTION',c*.28,-10);ctx.font='26px monospace';for(let i=0;i<5;i++){ctx.fillText(['PRESSURE ALTITUDE','TEMPERATURE °C','TRUE ALTITUDE','DENSITY ALTITUDE','CALIBRATED AIRSPEED'][i],0,38+i*33);}ctx.font='30px monospace';ctx.fillText('SET MPH (KT) / OUTER SCALE',0,c*.49);}
  },2048);
  mesh(new THREE.CircleGeometry(1.62,128),new THREE.MeshBasicMaterial({map:scale(false),toneMapped:false}),body,[0,0,-.055]);
  disc(1.31,.045,dial,aluminum);
  mesh(new THREE.CircleGeometry(1.31,128),new THREE.MeshBasicMaterial({map:scale(true),toneMapped:false}),dial,[0,0,.026]);
  ring(1.315,.012,dial,aluminum);
  const glass=new THREE.MeshPhysicalMaterial({color:0xf4f5ec,transparent:true,opacity:.025,roughness:.2,depthWrite:false});mesh(new THREE.CircleGeometry(1.27,96),glass,cursor);
  disc(.066,.085,cursor,metal(0x494e48),.04);
  const axle=disc(.032,1,body,metal(0x60696b),.3);
  return{scene,camera:[0,.1,11.3],update(time,age){const opening=ease(age/1.5);group.rotation.set(.08,-.22+Math.sin(time*.2)*.11,-.055);group.position.set(.55,0,0);dial.position.z=-.02+opening*.37;cursor.position.z=.025+opening*.7;axle.scale.y=.12+opening*.7;axle.position.z=opening*.35;slider.position.y=-(1-opening)*.35;slider.position.z=-.05-opening*.12;dial.rotation.z=(1-opening)*-Math.PI*2+time*.045;}};
}

// Soft density fields form overlapping cloud volumes without hard sphere seams.
function cloudTexture() {
  return texture((ctx,size)=>{
    const image=ctx.createImageData(size,size),lobes=[];
    for(let i=0;i<22;i++)lobes.push({x:Math.sin(i*2.4)*.56,y:Math.cos(i*1.7)*.22-.08,r:.16+(i%5)*.055});
    for(let y=0;y<size;y++)for(let x=0;x<size;x++){
      const u=x/size*2-1,v=y/size*2-1;let density=0,dx=0,dy=0;
      for(const l of lobes){const a=(u-l.x)/l.r,b=(v-l.y)/l.r,d=Math.exp(-(a*a+b*b)*4.1);density+=d;dx+=-a*d;dy+=-b*d;}
      const grain=(Math.sin(x*12.9898+y*78.233)*43758.5453)%1;
      const alpha=clamp((1-Math.exp(-density*1.3)-.035)*1.15,0,1);
      const light=clamp(.72+dx*.07+dy*.13-v*.16+grain*.012,.38,.97),o=(y*size+x)*4;
      image.data[o]=light*226;image.data[o+1]=light*235;image.data[o+2]=light*245;image.data[o+3]=alpha*255;
    }
    ctx.putImageData(image,0,0);
  },256);
}

function weatherWorld() {
  const {scene,group}=world();let compact=false;
  const groundY=-1.25;
  mesh(new THREE.CylinderGeometry(2.45,2.5,.1,96),metal(0x101c24,.8),group,[0,groundY,0]);
  for(const r of [.7,1.3,1.9,2.4]){const circle=ring(r,.007,group,new THREE.MeshBasicMaterial({color:0x395e6b}),[0,groundY+.06,0]);circle.rotation.x=Math.PI/2;}
  const echoes=texture((ctx,size)=>{
    ctx.translate(size/2,size/2);
    for(let i=0;i<26;i++){const a=i*2.4,x=size*.23+Math.sin(a)*size*.12,y=-size*.13+Math.cos(a)*size*.1,r=size*(.04+(i%4)*.015);const gradient=ctx.createRadialGradient(x,y,0,x,y,r);gradient.addColorStop(0,i%7===0?'#e3b85f':i%3===0?'#98c662':'#448863');gradient.addColorStop(.5,'#377b55b0');gradient.addColorStop(1,'#36774e00');ctx.fillStyle=gradient;ctx.fillRect(x-r,y-r,r*2,r*2);}
  },512);
  const echoPlane=mesh(new THREE.PlaneGeometry(4.8,4.8),new THREE.MeshBasicMaterial({map:echoes,transparent:true,depthWrite:false}),group,[0,groundY+.065,0]);echoPlane.rotation.x=-Math.PI/2;
  const tower=new THREE.Group();group.add(tower);tower.position.y=groundY+.05;
  const steel=metal(0x87959d,.55);
  for(const x of[-.31,.31])for(const z of[-.31,.31])mesh(new THREE.CylinderGeometry(.022,.035,1.3,8),steel,tower,[x,.65,z]);
  for(const y of[.15,.58,1.02])for(const z of[-.31,.31]){line([[-.31,y,z],[.31,y+.35,z]],tower,0x6e818b);line([[.31,y,z],[-.31,y+.35,z]],tower,0x6e818b);}
  mesh(new THREE.CylinderGeometry(.78,.65,.13,64),steel,tower,[0,1.4,0]);
  mesh(new THREE.CylinderGeometry(.10,.12,.28,16),steel,tower,[0,1.61,0]);
  const yaw=new THREE.Group();tower.add(yaw);yaw.position.y=2.1;
  const tilt=new THREE.Group();tilt.position.z=.24;yaw.add(tilt);
  // A rear fork carries the elevation bearings; the reflector clears the post.
  mesh(new THREE.CylinderGeometry(.11,.11,.08,24),steel,yaw,[0,-.34,0]);
  mesh(new THREE.BoxGeometry(1.36,.08,.12),steel,yaw,[0,-.34,-.14]);
  for(const side of[-1,1]){
    mesh(new THREE.BoxGeometry(.055,.36,.07),steel,yaw,[side*.66,-.17,-.14]);
    mesh(new THREE.BoxGeometry(.055,.06,.38),steel,yaw,[side*.66,0,.05]);
    const bearing=mesh(new THREE.CylinderGeometry(.07,.07,.10,24),steel,yaw,[side*.64,0,.24]);bearing.rotation.z=Math.PI/2;
  }
  const vertices=[],indices=[],segments=64,rings=16;
  for(let r=0;r<=rings;r++)for(let n=0;n<=segments;n++){const radius=r/rings*.59,a=n/segments*Math.PI*2;vertices.push(Math.cos(a)*radius,Math.sin(a)*radius,radius*radius/1.8);if(r<rings&&n<segments){const k=r*(segments+1)+n;indices.push(k,k+1,k+segments+1,k+1,k+segments+2,k+segments+1);}}
  const reflector=new THREE.BufferGeometry();reflector.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));reflector.setIndex(indices);reflector.computeVertexNormals();
  mesh(reflector,new THREE.MeshStandardMaterial({color:0xc2cbd0,metalness:.65,roughness:.4,side:THREE.DoubleSide}),tilt,[0,0,-.2]);
  ring(.59,.013,tilt,steel,[0,0,-.0066]);
  for(const a of[0,Math.PI*2/3,Math.PI*4/3])line([[Math.cos(a)*.57,Math.sin(a)*.57,-.02],[0,0,.25]],tilt,0x6f7f88);
  mesh(new THREE.CylinderGeometry(.035,.035,.15,12),steel,tilt,[0,0,.25]).rotation.x=Math.PI/2;
  // A fixed radome with a translucent front cutaway reveals the actual gimbal.
  const domeCenter=[0,1.95,0];
  mesh(new THREE.SphereGeometry(.79,48,32,2.8,Math.PI*2-1.4,0,Math.PI*.72),new THREE.MeshStandardMaterial({color:0xdde3e6,roughness:.75,metalness:.04,side:THREE.DoubleSide}),tower,domeCenter);
  mesh(new THREE.SphereGeometry(.795,32,24,0,Math.PI*2,0,Math.PI*.72),new THREE.MeshPhysicalMaterial({color:0xd4e3ec,roughness:.3,transparent:true,opacity:.12,depthWrite:false}),tower,domeCenter);
  const seams=mesh(new THREE.IcosahedronGeometry(.825,2),new THREE.MeshBasicMaterial({color:0x71828c,wireframe:true,transparent:true,opacity:.16}),tower,domeCenter);
  const scan=new THREE.Group();group.add(scan);
  const beam=mesh(new THREE.CircleGeometry(2.4,80,-Math.PI/2-THREE.MathUtils.degToRad(.475),THREE.MathUtils.degToRad(.95)),new THREE.MeshBasicMaterial({color:0x8ed8f8,transparent:true,opacity:.32,side:THREE.DoubleSide,depthWrite:false}),scan,[0,groundY+.08,0]);beam.rotation.x=-Math.PI/2;
  const clouds=new THREE.Group();group.add(clouds);const map=cloudTexture();
  for(let i=0;i<5;i++){const cloud=new THREE.Sprite(new THREE.SpriteMaterial({map,transparent:true,opacity:.9,depthWrite:false,color:i%3?0xc6d6e1:0x9caeba}));cloud.position.set(1.85+Math.sin(i*2.4)*.3,1.55+(i%3)*.12,-1.4+Math.cos(i*2.4)*.22);cloud.scale.set(1.12+(i%3)*.09,.74+(i%2)*.08,1);clouds.add(cloud);}
  return{scene,camera:[4,2.8,6.8],layout(aspect){compact=aspect<.8},update(time,age){
    const opening=ease(age/1.5),azimuth=time*Math.PI/3;
    group.scale.setScalar(.82+opening*.18);group.rotation.y=-.22;
    yaw.rotation.y=azimuth;scan.rotation.y=azimuth;
    // Elevation increases between full azimuth sweeps; the radome stays fixed.
    tilt.rotation.x=-THREE.MathUtils.degToRad(11.5+(Math.floor(time/6)%5)*1.5);
    clouds.position.x=(compact?-1.1:0)+(1-opening)*.25+Math.sin(time*.18)*.03;clouds.position.y=(compact?.9:0)+(1-opening)*.18;
    seams.material.opacity=.16;
  }};
}

function trainingWorld() {
  const { scene, group } = world();
  const book = new THREE.Group(); group.add(book); book.position.y = -.9;
  const pageTexture = texture((ctx, size) => {
    ctx.fillStyle = '#d1d4d3'; ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = '#39444b'; ctx.font = '44px sans-serif'; ctx.fillText('FLIGHT NOTES', 100, 130);
    ctx.font = '24px monospace'; ctx.fillText('UNDERSTAND THE WHY', 100, 190);
    ctx.strokeStyle = '#a0a8aa'; ctx.lineWidth = 2;
    for (let i = 0; i < 12; i++) { ctx.beginPath(); ctx.moveTo(100, 290 + i * 45); ctx.lineTo(900, 290 + i * 45); ctx.stroke(); }
    ctx.strokeStyle = '#536f7e'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(270, 750); ctx.lineTo(520, 370); ctx.lineTo(780, 750); ctx.closePath(); ctx.stroke();
    ctx.fillStyle = '#39444b'; ctx.font = '30px monospace'; ctx.fillText('WIND × sin(θ)', 310, 870);
  });
  const pageMat = new THREE.MeshStandardMaterial({ map: pageTexture, roughness: .95 });
  const leaves=[];
  const cover=new THREE.MeshStandardMaterial({color:0x242b31,roughness:.9});
  const edges=new THREE.MeshStandardMaterial({color:0xd4d0c4,roughness:1});
  const spine=mesh(new THREE.CylinderGeometry(.065,.065,2.12,20),cover,book,[0,-.015,0]);spine.rotation.x=Math.PI/2;
  for(const side of[-1,1]){
    const hinge=new THREE.Group();hinge.position.x=side*.045;book.add(hinge);leaves.push({hinge,side});
    mesh(new THREE.BoxGeometry(1.64,.055,2.12),cover,hinge,[side*.82,-.055,0]);
    mesh(new THREE.BoxGeometry(1.57,.065,2.04),edges,hinge,[side*.81,0,0]);
    const paper=mesh(new THREE.PlaneGeometry(1.55,2.02),pageMat,hinge,[side*.81,.034,0]);paper.rotation.x=-Math.PI/2;paper.rotation.z=Math.PI;
    for(let i=0;i<4;i++)line([[side*1.59,-.024+i*.012,-1],[side*1.59,-.024+i*.012,1]],hinge,0x96968c,.55);
  }
  const aircraft=new THREE.Group();aircraft.name='Cessna 172 SP';group.add(aircraft);
  let propeller=null;
  const assetsReady=new GLTFLoader().loadAsync('/assets/hero-scenes/cessna-172-sp.glb').then(({scene:model})=>{
    // The supplied FBX faces +Z; the hero camera expects the nose along -Z.
    model.rotation.y=Math.PI;aircraft.add(model);
    propeller=model.getObjectByName('Propeller_blades');
  });
  const route = [];
  for (let i = 0; i <= 100; i++) { const a = i / 100 * Math.PI * 2; route.push([Math.cos(a) * 2.15, -.42 + Math.sin(a) * .08, Math.sin(a) * 1.45]); }
  const path = line(route, group, BLUE, .5);
  const dot = mesh(new THREE.SphereGeometry(.045, 12, 8), new THREE.MeshBasicMaterial({ color: BLUE }), group);
  for (let i = 0; i < 3; i++) line([[-1.8 + i * 1.8, -.82, -.9], [-1.8 + i * 1.8, .8, -.9]], group, 0x48616e, .3);
  return { scene, assetsReady, model: 'cessna-172-sp', camera: [4.4, 3.3, -6.5], update(time, age) {
    const opening = ease(age / 1.5);
    const lift=ease((age-.55)/.95);
    for(const {hinge,side}of leaves){const unfold=ease((age-(side>0?.08:0))/1.08);hinge.rotation.z=side*((1-unfold)*Math.PI/2+unfold*.045);}
    aircraft.visible=age>.55;
    aircraft.position.y = -.18 + lift * .9 + Math.sin(time * .8) * .04;
    aircraft.scale.setScalar(lift);
    aircraft.rotation.set(.015, -.1 + Math.sin(time * .28) * .16, Math.sin(time * .65) * .16);
    if(propeller)propeller.rotation.z = time * 8;
    group.rotation.y = -.1 + Math.sin(time * .18) * .12;
    book.rotation.z = 0;
    const a = time * .55; dot.position.set(Math.cos(a) * 2.15, -.42 + Math.sin(a) * .08, Math.sin(a) * 1.45);
    path.geometry.setDrawRange(0, Math.max(2, Math.floor(opening * 101)));
  } };
}

export function initHeroScenes() {
  const root = document.querySelector('[data-hero-prototype]');
  if (!root || root.dataset.scenesInitialized) return;
  root.dataset.scenesInitialized = 'true';
  const slides = [...root.querySelectorAll('[data-slide]')];
  const hosts = slides.map(slide => slide.querySelector('[data-hero-scene]'));
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let renderer;
  try {
    const surface = document.createElement('canvas');
    const context = surface.getContext('webgl2', { alpha: true, antialias: true, powerPreference: 'low-power' });
    if (!context) { root.dataset.webgl = 'unavailable'; return; }
    renderer = new THREE.WebGLRenderer({ canvas: surface, context, alpha: true, antialias: true });
  } catch { root.dataset.webgl = 'unavailable'; return; }
  renderer.setClearColor(0x050506, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  const canvas = renderer.domElement;
  canvas.className = 'hp-webgl'; canvas.setAttribute('aria-hidden', 'true');
  const camera = new THREE.PerspectiveCamera(35, 1, .1, 50);
  const factories = { plan: paperChart, tools: flightComputer, weather: weatherWorld, learn: trainingWorld };
  const worlds = new Map();
  let active = null, host = null, previous = 0, time = 0, age = 0, running = false;
  const stats = root._heroSceneStats = { frames: 0, running: false };

  function getWorld(name) {
    if (worlds.has(name)) return worlds.get(name);
    const entry = factories[name]();
    entry.ready = false;
    worlds.set(name, entry);
    entry.update(0, 0);
    const preparationCamera = camera.clone();
    preparationCamera.position.set(...entry.camera);
    preparationCamera.lookAt(0, name === 'weather' ? .1 : 0, 0);
    // Compile off the transition path; the exact poster stays visible until ready.
    entry.prepared = Promise.resolve(entry.assetsReady).then(() => renderer.compileAsync(entry.scene, preparationCamera)).then(() => {
      if (!document.hidden && !root.classList.contains('is-suspended') && root.dataset.scenePaused !== 'true') {
        const target = new THREE.WebGLRenderTarget(16, 16);
        const previousTarget = renderer.getRenderTarget();
        renderer.setRenderTarget(target);
        renderer.render(entry.scene, preparationCamera);
        renderer.setRenderTarget(previousTarget);
        target.dispose();
      }
      entry.ready = true;
      if (host?.dataset.heroScene === name && !active) sync();
    }).catch(error => { entry.failed = true; console.error("Hero scene preparation:", name, error); });
    return entry;
  }

  function freeze(element) {
    let still=element.querySelector('.hp-frozen');
    if(!still){still=document.createElement('canvas');still.className='hp-frozen';still.setAttribute('aria-hidden','true');element.append(still);}
    still.width=canvas.width;still.height=canvas.height;
    still.getContext('2d').drawImage(canvas,0,0);
  }
  function resize() {
    if (!host) return;
    const { width, height } = host.getBoundingClientRect();
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, innerWidth < 650 ? 1.25 : 1.5));
    renderer.setSize(Math.max(width, 1), Math.max(height, 1), false);
    camera.aspect = width / Math.max(height, 1); camera.updateProjectionMatrix();
    if (active) {
      active.layout?.(camera.aspect);
      if (active.cover) {
const tan = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
camera.position.set(0, 0, Math.min((16 / 3) / (2 * tan), 8 / (2 * tan * camera.aspect)) * .98);
} else camera.position.set(...active.camera).multiplyScalar(Math.max(1, (host.dataset.heroScene === 'tools' ? .64 : host.dataset.heroScene === 'weather' ? 1.04 : .85) / camera.aspect));
      if (host.dataset.heroScene === 'tools' && camera.aspect < 1) { camera.position.x += .55; camera.lookAt(.55, .45, 0); }
      else camera.lookAt(0, host.dataset.heroScene === 'weather' ? .1 : 0, 0);
    }
  }
  function render(now) {
    if (!active) return;
    const dt = previous ? Math.min((now - previous) / 1000, .05) : 0;
    previous = now; time += dt; age += dt;
const slide = host?.closest('[data-slide]');
if (root.dataset.transitioning === 'true') { age = 0; time = 0; }
if (root.dataset.transitioning !== 'true' && slide?._heroOpening) age = Number(slide._heroOpening.currentTime || 0) / 1000;
else if (root.dataset.transitioning !== 'true' && slide?.classList.contains('is-settled')) age = Math.max(age, 1.5);
    active.update(time, age);
    renderer.render(active.scene, camera);
    stats.frames++;
    Object.assign(stats,{scene:host.dataset.heroScene,sceneTime:time,openingAge:age,model:active.model||null});
  }
  function sync() {
    const nextHost = hosts[Number(root.dataset.heroIndex || 0)];
    const next = nextHost?.dataset.heroScene;
    if (host !== nextHost) {
      if (host && active) { renderer.render(active.scene, camera); freeze(host); }
      host?.classList.remove('has-webgl');
      host = nextHost;
      active = null;
      age = 0; time = 0; previous = 0;
      canvas.remove();
      if (next) getWorld(next);
    }
    if (next && !active && worlds.get(next)?.ready) {
      active = worlds.get(next);
      host.querySelector('.hp-frozen')?.remove();host.append(canvas); resize();
      render(performance.now()); host.classList.add('has-webgl');
    }
    const shouldRun = !!active && (!reduced.matches || root.dataset.motionOverride === 'true') && root.dataset.scenePaused !== 'true' && root.dataset.transitioning !== 'true';
    if (shouldRun !== running) {
      running = shouldRun; stats.running = running; previous = 0;
      renderer.setAnimationLoop(running ? render : null);
    }
    if (!running && active) { if (reduced.matches && root.dataset.motionOverride !== 'true') age = 1.5;render(performance.now());
      if (root.dataset.transitioning === 'true') {const name=host.dataset.heroScene;root.querySelectorAll('[data-hero-clone] [data-hero-scene]').forEach(edge=>{if(edge.dataset.heroScene===name)freeze(edge)});}
    }
    root.dataset.webgl = 'ready';
  }
  new ResizeObserver(() => { resize(); if (!running && active) render(performance.now()); }).observe(root.querySelector('.hp-viewport'));
  root.addEventListener('hero:state', sync);
  root.addEventListener('hero:enter', () => { age = 0; });
  reduced.addEventListener('change', sync);
  canvas.addEventListener('webglcontextlost', event => {
    event.preventDefault(); renderer.setAnimationLoop(null); running = false;
    host?.classList.remove('has-webgl'); canvas.hidden = true; root.dataset.webgl = 'lost';
  });
  canvas.addEventListener('webglcontextrestored', () => { canvas.hidden = false; running = false; host?.classList.add('has-webgl'); sync(); });
  window.addEventListener('pagehide', () => { renderer.setAnimationLoop(null); running = false; });
  const names = ['tools', 'weather', 'learn'];
  const warmNext = () => {
    if (!names.length || document.hidden || root.classList.contains('is-suspended') || root.dataset.scenePaused === 'true') return;
    getWorld(names.shift()).prepared.finally(() => setTimeout(warmNext, 120));
  };
  setTimeout(warmNext, 1800);
  sync();
}
