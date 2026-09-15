(()=>{
'use strict';

const COOLDOWN_MS=60_000;
const cooldowns=new Map();

function startCooldown(key,button,idleLabel,activeLabel){
  const now=Date.now();
  const until=cooldowns.get(key)||0;
  if(now<until)return false;
  cooldowns.set(key,now+COOLDOWN_MS);

  if(!button)return true;
  const original=button.textContent||idleLabel;
  button.disabled=true;

  const tick=()=>{
    const remaining=Math.max(0,Math.ceil(((cooldowns.get(key)||0)-Date.now())/1000));
    if(!remaining){
      button.disabled=false;
      button.textContent=original||idleLabel;
      return false;
    }
    button.textContent=`${activeLabel} · ${remaining}s`;
    return true;
  };

  tick();
  const timer=setInterval(()=>{if(!tick())clearInterval(timer)},1000);
  return true;
}

function guardForm(selector,key,idleLabel,activeLabel){
  const form=document.querySelector(selector);
  if(!form)return;
  const button=form.querySelector('button[type="submit"]');
  form.addEventListener('submit',event=>{
    if(!startCooldown(key,button,idleLabel,activeLabel)){
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  },true);
}

guardForm('#pdMagicForm','magic','Email me a sign-in link','Sign-in link requested');
guardForm('#pdCreateAccountForm','create','Create account','Confirmation requested');

const forgot=document.querySelector('#pdForgotPassword');
forgot?.addEventListener('click',event=>{
  if(!startCooldown('reset',forgot,'Forgot password?','Reset link requested')){
    event.preventDefault();
    event.stopImmediatePropagation();
  }
},true);
})();
