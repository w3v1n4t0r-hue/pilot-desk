import React,{useEffect,useMemo,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {Root,Animation,Waypoint} from '@bsmnt/scrollytelling';
function FieldNotes(){
 const host=useRef(null),controller=useRef(null),[reduced,setReduced]=useState(matchMedia('(prefers-reduced-motion: reduce)').matches);
 const model=useMemo(()=>({p:0}),[]),draw=useMemo(()=>()=>controller.current?.render(matchMedia('(prefers-reduced-motion: reduce)').matches?1:model.p),[model]);
 useEffect(()=>{const motion=matchMedia('(prefers-reduced-motion: reduce)');const onMotion=()=>setReduced(motion.matches);motion.addEventListener('change',onMotion);return()=>{motion.removeEventListener('change',onMotion);}},[]);
 useEffect(()=>{let cancelled=false;const observer=new IntersectionObserver(entries=>{if(!entries.some(e=>e.isIntersecting))return;observer.disconnect();import('./learn-scene.js').then(({createLearnScene})=>cancelled||!host.current?null:createLearnScene(host.current)).then(scene=>{if(!scene)return;if(cancelled){scene.dispose();return}controller.current=scene;scene.render(matchMedia('(prefers-reduced-motion: reduce)').matches?1:model.p)}).catch(()=>{host.current?.setAttribute('data-scene-unavailable','true')})},{rootMargin:'240px'});observer.observe(host.current);return()=>{cancelled=true;observer.disconnect();controller.current?.dispose();controller.current=null}},[]);
 useEffect(()=>{controller.current?.render(reduced?1:model.p)},[reduced]);
 const tween=useMemo(()=>({target:model,start:0,end:100,fromTo:[{p:0},{p:1,ease:'none',onUpdate:draw}]}),[model,draw]);
 return <Root trigger="#learn-scene-root" start="top 85%" end="bottom 15%" scrub={.35} disabled={reduced}><div ref={host} className="learn-canvas-host" style={{position:'absolute',inset:0}}/><Animation tween={tween}/><Waypoint at={35} label="read"/><Waypoint at={65} label="explain"/><Waypoint at={95} label="apply"/></Root>;
}
const root=document.getElementById('learn-scene-root');if(root)createRoot(root).render(<FieldNotes/>);
// Preserve native anchor navigation and explicitly focus the selected section.
document.querySelectorAll('[data-learn-hub] a[href^="#"]').forEach(a=>a.addEventListener('click',()=>{const target=document.getElementById(a.hash.slice(1));if(target){target.tabIndex=-1;target.focus({preventScroll:true})}}));
document.getElementById('pdTrainingSaveLocal')?.addEventListener('click',()=>{const feedback=document.getElementById('learn-goal-feedback');try{const selected=document.getElementById('pdTrainingGoalLocal').value;if(selected&&localStorage.getItem('pd-training-goal')===selected)feedback.textContent='Study goal saved on this device.';else if(!selected)feedback.textContent='Study goal cleared.';else feedback.textContent='Your browser could not save this goal. Check its storage settings.'}catch{feedback.textContent='Your browser could not save this goal. Check its storage settings.'}});

// Scrollcraft enhances only the two practice choices. The goal form stays static.
const hub=document.querySelector('[data-learn-hub]');
function mountLearnPolish(){if(!hub||hub.dataset.scrollcraftMounted)return;const motion=window.ScrollCraft.mount(hub);hub.dataset.scrollcraftMounted='true';window.addEventListener('pagehide',event=>{if(!event.persisted)motion.destroy()})}
if(window.ScrollCraft)mountLearnPolish();else document.querySelector('script[src*="learn-scrollcraft"]')?.addEventListener('load',mountLearnPolish,{once:true});
