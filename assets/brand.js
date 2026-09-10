(()=>{
  const mark=`<svg viewBox="0 0 64 40" role="img" aria-label="PilotDesk airplane logo" xmlns="http://www.w3.org/2000/svg"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M32 5v9"/><path d="M32 14c-4.8 0-8 3.8-8 8.5S27.2 31 32 31s8-3.8 8-8.5S36.8 14 32 14Z"/><path d="M25 19 8 15l2 5 14 3"/><path d="m39 23 15-3 2-5-17 4"/><path d="M28 18.5h8"/><path d="M29 18.5v3.5m6-3.5V22"/><circle cx="18" cy="30" r="3.5"/><circle cx="46" cy="30" r="3.5"/><path d="M21.5 27 25 24m21.5 3L39 24"/></g></svg>`;
  function apply(){
    document.querySelectorAll('.brandmark').forEach(el=>{
      if(el.dataset.pdWireframe==='1')return;
      el.dataset.pdWireframe='1';
      el.innerHTML=mark;
      el.setAttribute('aria-label','PilotDesk');
      el.style.background='transparent';
      el.style.boxShadow='none';
      el.style.border='1px solid #34383f';
      el.style.color='#d9dde2';
      el.style.width='48px';
      el.style.height='38px';
      el.style.borderRadius='8px';
      el.style.padding='4px 5px';
    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply,{once:true});else apply();
})();
