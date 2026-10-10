(()=>{'use strict';
const form=document.querySelector('#aero-form'),error=document.querySelector('#aero-error'),display=document.querySelector('.aero-display');
function update(){
 try{
 const p=Object.fromEntries([...form.querySelectorAll('input')].map(el=>[el.name,el.value.trim()===''?NaN:Number(el.value)]));
 const r=PDAero.calculate(p);error.textContent='';
 for(const [key,unit] of Object.entries({lift:'N',drag:'N',q:'Pa',ar:'',cdi:'',ld:'',re:'',mach:''}))document.querySelector(`[data-aero="${key}"]`).textContent=r[key]===null?'Undefined':`${r[key].toLocaleString('en-US',{maximumFractionDigits:['cdi','mach'].includes(key)?4:2})} ${unit}`;
 // Arrows share one scale, so their relative lengths represent force magnitude.
 const scale=130/Math.max(Math.abs(r.lift),r.drag,1);
 document.querySelector('#aero-lift').style.transform=`translate(400px,180px) scale(1,${r.lift*scale/100})`;
 document.querySelector('#aero-drag').style.transform=`translate(400px,180px) scale(${r.drag*scale/100},1)`;
 document.querySelector('#aero-envelope').textContent=r.mach>=.3?'Mach ≥ 0.3: compressibility may matter. Coefficients must match the flow conditions.':'Low-speed model. Coefficients must match shape, angle of attack and Reynolds number.';
 }catch(e){error.textContent=e.message;document.querySelectorAll('[data-aero]').forEach(el=>el.textContent='—');document.querySelector('#aero-lift').style.transform='scale(0)';document.querySelector('#aero-drag').style.transform='scale(0)';document.querySelector('#aero-envelope').textContent='Results unavailable until inputs are valid.';}
}
form.addEventListener('input',update);form.addEventListener('submit',e=>{e.preventDefault();update()});form.addEventListener('reset',()=>requestAnimationFrame(update));
document.querySelector('#aero-pause').addEventListener('click',e=>{const paused=display.classList.toggle('aero-paused');e.currentTarget.textContent=paused?'Play airflow':'Pause airflow';e.currentTarget.setAttribute('aria-pressed',String(paused))});update();
})();
