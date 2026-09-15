(()=>{
'use strict';
const form=document.querySelector('#pdMagicForm');
if(!form)return;
const button=form.querySelector('button[type="submit"]');
const COOLDOWN_MS=60_000;
let cooldownUntil=0;
let timer=null;

function resetButton(){
  if(!button)return;
  button.disabled=false;
  button.textContent='Email me a sign-in link';
}

function updateButton(){
  if(!button)return;
  const remaining=Math.max(0,Math.ceil((cooldownUntil-Date.now())/1000));
  if(!remaining){
    cooldownUntil=0;
    clearInterval(timer);
    timer=null;
    resetButton();
    return;
  }
  button.disabled=true;
  button.textContent=`Sign-in link sent · ${remaining}s`;
}

form.addEventListener('submit',event=>{
  if(Date.now()<cooldownUntil){
    event.preventDefault();
    event.stopImmediatePropagation();
    updateButton();
    return;
  }
  cooldownUntil=Date.now()+COOLDOWN_MS;
  updateButton();
  clearInterval(timer);
  timer=setInterval(updateButton,1000);
},true);
})();
