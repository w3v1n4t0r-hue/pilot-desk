import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
const clamp=THREE.MathUtils.clamp;
const studyTopics=[
 {title:'Weather',lines:['WEATHER'],subtitle:'THE BIG PICTURE',subjects:['METAR & TAF','Fronts & stability','Clouds & visibility']},
 {title:'Medical factors',lines:['MEDICAL','FACTORS'],subtitle:'THE PILOT’S CONDITION',subjects:['Fitness for flight','Fatigue & hypoxia','Medication & impairment']},
 {title:'Aerodynamics',lines:['AERODYNAMICS'],subtitle:'HOW THE AIRCRAFT FLIES',subjects:['Lift, drag & angle of attack','Stability & control','Stalls & energy']},
 {title:'Navigation',lines:['NAVIGATION'],subtitle:'THE ROUTE AHEAD',subjects:['Charts & airspace','Pilotage & navigation','Planning & alternates']}
];
function pageTexture(topic){
 const cover=topic==='cover',canvas=document.createElement('canvas');canvas.width=1536;canvas.height=2048;const c=canvas.getContext('2d');c.scale(2,2);
 c.fillStyle=cover?'#283b31':'#e6e3d7';c.fillRect(0,0,768,1024);
 for(let i=0;i<6500;i++){const x=(i*127.17)%768,y=(i*73.37)%1024;c.fillStyle=i%2?'rgba(0,0,0,.018)':'rgba(255,255,255,.025)';c.fillRect(x,y,1+(i%3),1)}
 c.fillStyle=cover?'#e0e5d6':'#263e32';c.font='500 23px monospace';c.fillText('PILOTDESK  /  LEARN',70,110);
 c.strokeStyle=cover?'#8a9e89':'#acb5a6';c.lineWidth=2;c.beginPath();c.moveTo(70,150);c.lineTo(698,150);c.stroke();
 const lines=cover?['FLIGHT','FIELD','NOTES']:topic.lines;let fontSize=cover?78:80;
 for(const line of lines){c.font='600 '+fontSize+'px sans-serif';while(c.measureText(line).width>628){fontSize-=2;c.font='600 '+fontSize+'px sans-serif'}}
 lines.forEach((line,i)=>c.fillText(line,70,275+i*90));
 c.font='500 24px monospace';c.fillText(cover?'FLIGHT KNOWLEDGE':topic.subtitle,70,535);
 c.font='30px sans-serif';const subjects=cover?['Weather. Medical factors.','Aerodynamics. Navigation.']:topic.subjects;
 subjects.forEach((line,i)=>{c.fillText(line,70,625+i*72);c.strokeStyle=cover?'#839682':'#b9c1b4';c.lineWidth=1;c.beginPath();c.moveTo(70,648+i*72);c.lineTo(698,648+i*72);c.stroke()});
 c.font='22px monospace';c.fillText('PILOT KNOWLEDGE / STUDY NOTES',70,950);
 const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;return texture;
}
export async function createLearnScene(host){
 const renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});renderer.setPixelRatio(Math.min(Math.max(devicePixelRatio,1.5),2));renderer.setClearColor(0,0);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.85;
 renderer.domElement.setAttribute('aria-hidden','true');host.append(renderer.domElement);host.dataset.textureSize='1536x2048';host.dataset.renderScale=String(renderer.getPixelRatio());
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(34,1,.1,50);camera.position.set(0,.3,9.4);camera.lookAt(0,0,0);
 const pmrem=new THREE.PMREMGenerator(renderer),room=new RoomEnvironment(),env=pmrem.fromScene(room,.04);scene.environment=env.texture;scene.environmentIntensity=.45;room.dispose();pmrem.dispose();
 scene.add(new THREE.HemisphereLight(0xffffff,0x1d2926,1.3));const light=new THREE.DirectionalLight(0xfff4df,2);light.position.set(-3,5,7);scene.add(light);
 const loader=new GLTFLoader();let assets;
 try{assets=await loader.loadAsync('/assets/learn-scenes/field-notebook.glb')}catch(error){renderer.dispose();env.dispose();renderer.domElement.remove();throw error}
 const book=assets.scene;scene.add(book);
 const textures=new Set();const anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
 function apply(name,texture,object=book){textures.add(texture);texture.anisotropy=anisotropy;const surface=object.getObjectByName(name);if(!surface)return;const old=surface.material;const material=new THREE.MeshStandardMaterial({map:texture,roughness:.88,metalness:0});surface.material=material;old.dispose();return material}
 apply('CoverLabel',pageTexture('cover'));
 const topicTextures=studyTopics.map(topic=>{const texture=pageTexture(topic);texture.anisotropy=anisotropy;textures.add(texture);return texture});
 const leftPage=apply('InsideCover',topicTextures[0]),rightPage=apply('RightPage',topicTextures[1]);let spreadIndex=0;
 function currentSpread(){leftPage.map=topicTextures[spreadIndex];rightPage.map=topicTextures[(spreadIndex+1)%studyTopics.length];host.dataset.leftTopic=studyTopics[spreadIndex].title;host.dataset.rightTopic=studyTopics[(spreadIndex+1)%studyTopics.length].title}
 currentSpread();
 const hinge=book.getObjectByName('FrontHinge');let progress=0,disposed=false;
 // Independent paper surfaces bend around the binding during each page turn.
 const sheetGeometry=new THREE.PlaneGeometry(2.31,3.04,32,12);sheetGeometry.translate(1.155,0,0);
 const baseVertices=sheetGeometry.attributes.position.array.slice();
 const backGeometry=sheetGeometry.clone();const backUV=backGeometry.attributes.uv;for(let i=0;i<backUV.count;i++)backUV.setX(i,1-backUV.getX(i));
 const sheet=new THREE.Group();sheet.position.set(.065,0,.075);book.add(sheet);
 const sheetFront=new THREE.MeshStandardMaterial({map:topicTextures[1],roughness:.92,side:THREE.FrontSide}),sheetBack=new THREE.MeshStandardMaterial({map:topicTextures[2],roughness:.92,side:THREE.BackSide});
 sheet.add(new THREE.Mesh(sheetGeometry,sheetFront));sheet.add(new THREE.Mesh(backGeometry,sheetBack));
 sheet.visible=false;
 let idleOpen=0,turn=0,turns=0,frame=0,timer=0,onScreen=false,contextLost=false,animating=false,motion=null,waiting=0,deadline=0;
 function bendPage(t){
 // Land just above the inside cover, in its actual 169.2-degree plane.
 // A 180-degree landing cuts through that raised surface and flashes its text.
 const landing=-Math.PI*.94;
 sheet.position.set(THREE.MathUtils.lerp(.065,.065*Math.cos(landing)-.053*Math.sin(landing),t),0,THREE.MathUtils.lerp(.075,.09-.065*Math.sin(landing)-.053*Math.cos(landing),t));
 const positions=sheetGeometry.attributes.position;for(let i=0;i<positions.count;i++){const x=baseVertices[i*3],y=baseVertices[i*3+1],u=x/2.31;
 const angle=-Math.PI*.94*t+Math.sin(Math.PI*u)*Math.sin(Math.PI*t)*.38;
 positions.setXYZ(i,x*Math.cos(angle),y+Math.sin(Math.PI*t)*Math.sin(Math.PI*u)*.055,-x*Math.sin(angle)+Math.sin(Math.PI*t)*u*.06)}positions.needsUpdate=true;sheetGeometry.computeVertexNormals();backGeometry.attributes.position.array.set(positions.array);backGeometry.attributes.position.needsUpdate=true;backGeometry.computeVertexNormals()}
 function stopMotion(){if(timer)waiting=Math.max(0,deadline-performance.now());clearTimeout(timer);timer=0;if(motion&&animating)motion.elapsed+=performance.now()-motion.started;cancelAnimationFrame(frame);frame=0;animating=false;}
 function available(){return !disposed&&onScreen&&!document.hidden&&!contextLost}
 function scheduleMotion(){if(!available()||frame||timer||animating)return;
 const resume=()=>{timer=0;waiting=0;if(!available())return;
 if(!motion){const opening=idleOpen<1;motion={opening,startingOpen:idleOpen,duration:opening?1500:2100,elapsed:0,started:0};if(!opening){sheetFront.map=topicTextures[(spreadIndex+1)%studyTopics.length];sheetBack.map=topicTextures[(spreadIndex+2)%studyTopics.length];rightPage.map=topicTextures[(spreadIndex+3)%studyTopics.length]}}
 motion.started=performance.now();animating=true;
 const step=now=>{if(!available()){stopMotion();return}const t=Math.min(1,(motion.elapsed+now-motion.started)/motion.duration),e=t*t*(3-2*t);
 if(motion.opening)idleOpen=motion.startingOpen+(1-motion.startingOpen)*e;else{turn=e;sheet.visible=true;bendPage(e)}render();
 if(t<1)frame=requestAnimationFrame(step);else{const opening=motion.opening;frame=0;animating=false;motion=null;if(!opening){sheet.visible=false;turn=0;turns++;spreadIndex=(spreadIndex+2)%studyTopics.length;currentSpread();host.dataset.pageTurns=String(turns)}render();scheduleMotion()}};
 frame=requestAnimationFrame(step)};
 if(motion){resume();return}const delay=waiting||(idleOpen<1?900:4200);deadline=performance.now()+delay;timer=setTimeout(resume,delay)}
 const stage=host.closest('.learn-stage');let renderedWidth=0,renderedHeight=0;
 function render(p=progress){if(disposed||contextLost)return;progress=clamp(p,0,1);const width=host.clientWidth,height=host.clientHeight,compact=width<390;
 if(width!==renderedWidth||height!==renderedHeight){renderedWidth=width;renderedHeight=height;renderer.setSize(Math.max(1,width),Math.max(1,height),false);camera.aspect=width/Math.max(1,height);camera.position.z=Math.max(7.8,9.5/Math.max(camera.aspect,.4));camera.updateProjectionMatrix()}
 const opening=Math.max(idleOpen,THREE.MathUtils.smoothstep(progress,0,.42)),spread=THREE.MathUtils.smoothstep(progress,.38,.95);
 hinge.rotation.y=-opening*Math.PI*.94;
 book.rotation.set(-.23-opening*.13,-.27+opening*.38,-.11+opening*.04);book.position.set(-1.05+opening*1.08,-.05-spread*.28,0);book.scale.setScalar(compact?.9:1);
 renderer.render(scene,camera);host.dataset.progress=progress.toFixed(3);stage?.classList.add('has-scene');host.dataset.pageTurn=turn.toFixed(3);scheduleMotion();
 }
 const observer=new ResizeObserver(()=>render());observer.observe(host);
 const visibility=new IntersectionObserver(entries=>{onScreen=entries.some(e=>e.isIntersecting);if(onScreen)scheduleMotion();else{stopMotion();render()}},{threshold:.08});visibility.observe(host);
 const onVisibility=()=>{if(document.hidden)stopMotion();else{render();scheduleMotion()}};document.addEventListener('visibilitychange',onVisibility);
 const lost=event=>{event.preventDefault();contextLost=true;stopMotion();stage?.classList.remove('has-scene')},restored=()=>{contextLost=false;render()};renderer.domElement.addEventListener('webglcontextlost',lost);renderer.domElement.addEventListener('webglcontextrestored',restored);
 render();return{render,dispose(){disposed=true;stopMotion();visibility.disconnect();document.removeEventListener('visibilitychange',onVisibility);observer.disconnect();renderer.domElement.removeEventListener('webglcontextlost',lost);renderer.domElement.removeEventListener('webglcontextrestored',restored);scene.traverse(o=>{o.geometry?.dispose();if(o.material){for(const m of Array.isArray(o.material)?o.material:[o.material])m.dispose()}});textures.forEach(t=>t.dispose());env.dispose();renderer.dispose();renderer.domElement.remove();stage?.classList.remove('has-scene')}};
}
