(()=>{
  const applyBrand=()=>{
    const brand=document.querySelector('.brand');
    if(!brand)return;
    let mark=brand.querySelector('.brandmark');
    if(!mark){
      mark=document.createElement('span');
      mark.className='brandmark';
      brand.insertBefore(mark,brand.firstChild);
    }
    mark.dataset.pdWireframe='2';
    mark.innerHTML='<img src="/assets/icon.svg" alt="" width="42" height="42" aria-hidden="true">';
    mark.setAttribute('aria-label','PilotDesk');
    Object.assign(mark.style,{width:'42px',height:'42px',padding:'0',border:'0',borderRadius:'10px',overflow:'hidden',background:'transparent',boxShadow:'none',display:'grid',placeItems:'center',flex:'0 0 auto'});
    const img=mark.querySelector('img');
    if(img)Object.assign(img.style,{width:'100%',height:'100%',display:'block'});
    const name=brand.querySelector('b');
    if(name)Object.assign(name.style,{fontFamily:'Bahnschrift Condensed, Arial Narrow, Roboto Condensed, Segoe UI, sans-serif',fontStyle:'italic',fontWeight:'750',fontSize:'18px',letterSpacing:'.045em',lineHeight:'1.05'});
    const tag=brand.querySelector('small');
    if(tag)Object.assign(tag.style,{letterSpacing:'.20em',fontSize:'8.5px'});
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',applyBrand,{once:true});
  else applyBrand();
})();
