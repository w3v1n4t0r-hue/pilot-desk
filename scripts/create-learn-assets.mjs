import fs from 'node:fs/promises';
import * as THREE from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
// GLTFExporter uses FileReader for binary buffers in both browsers and Node.
globalThis.FileReader = class {
 readAsArrayBuffer(blob){blob.arrayBuffer().then(result=>{this.result=result;this.onloadend?.()})}
 readAsDataURL(blob){blob.arrayBuffer().then(result=>{this.result='data:'+blob.type+';base64,'+Buffer.from(result).toString('base64');this.onloadend?.()})}
};
const root='assets/learn-scenes';await fs.mkdir(root,{recursive:true});
const paper=new THREE.MeshStandardMaterial({color:0xdedcd2,roughness:.94});
const cover=new THREE.MeshStandardMaterial({color:0x23312c,roughness:.83});
const metal=new THREE.MeshStandardMaterial({color:0x929c96,metalness:.85,roughness:.23});
function box(name,w,h,d,material,parent,x=0,y=0,z=0){const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);mesh.name=name;mesh.position.set(x,y,z);parent.add(mesh);return mesh}
const book=new THREE.Group();book.name='FlightFieldNotebook';
box('BackCover',2.52,3.28,.075,cover,book,1.22,0,-.16);
box('PageBlock',2.34,3.08,.18,paper,book,1.22,0,-.035);
for(let n=0;n<12;n++)box('PaperEdge'+n,2.34,.009,.003,new THREE.MeshStandardMaterial({color:n%2?0xc8c9bf:0xf1eee3}),book,1.22,-1.54,-.12+n*.014);
box('RightPage',2.31,3.04,.008,paper,book,1.22,0,.062);
const hinge=new THREE.Group();hinge.name='FrontHinge';hinge.position.set(0,0,.09);book.add(hinge);
box('FrontCover',2.52,3.28,.07,cover,hinge,1.22,0,0);
box('CoverLabel',1.76,1.7,.012,new THREE.MeshStandardMaterial({color:0x26372f,roughness:.6}),hinge,1.22,.1,.043);
box('InsideCover',2.31,3.06,.008,paper,hinge,1.22,0,-.043);
for(const y of[-1.13,-.68,-.23,.23,.68,1.13]){const ring=new THREE.Mesh(new THREE.TorusGeometry(.12,.016,8,30),metal);ring.name='BindingRing';ring.rotation.y=Math.PI/2;ring.position.set(.02,y,0);book.add(ring)}
box('Spine',.09,3.2,.25,cover,book,.01,0,-.01);
const ribbon=new THREE.MeshStandardMaterial({color:0x8da390,roughness:.8});box('PageRibbon',.09,3.3,.006,ribbon,book,2.03,-.18,.07);
const exporter=new GLTFExporter();for(const [name,scene] of [['field-notebook',book]]){const out=await exporter.parseAsync(scene,{binary:true});await fs.writeFile(root+'/'+name+'.glb',Buffer.from(out));console.log(name,out.byteLength,'bytes')}
await fs.writeFile(root+'/README.md','# PilotDesk Learn assets\n\nOriginal procedural 3D assets authored for this preview: field-notebook.glb. Regenerate with node scripts/create-learn-assets.mjs. No third-party model, paid asset, or generated video is included. Canvas page textures are authored in src/scripts/learn-scene.js.\n');
