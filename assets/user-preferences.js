(()=>{
'use strict';
const KEYS={compact:'pd-setting-compact',motion:'pd-setting-reduced-motion'};
const read=k=>{try{return localStorage.getItem(k)==='1'}catch{return false}};
function apply(){
 document.documentElement.classList.toggle('pd-compact-ui',read(KEYS.compact));
 document.documentElement.classList.toggle('pd-reduced-motion',read(KEYS.motion));
 document.dispatchEvent(new CustomEvent('pilotdesk:preferences-applied',{detail:{compact:read(KEYS.compact),reducedMotion:read(KEYS.motion)}}));
}
window.PilotDeskPreferences={
 keys:KEYS,
 get:()=>({compact:read(KEYS.compact),reducedMotion:read(KEYS.motion)}),
 set:(name,value)=>{const key=KEYS[name];if(!key)return;try{localStorage.setItem(key,value?'1':'0')}catch{}apply()}
};
apply();
})();