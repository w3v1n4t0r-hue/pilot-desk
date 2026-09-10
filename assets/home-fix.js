(()=>{
  function apply(){
    if(location.pathname!=='/'&&location.pathname!=='/index.html')return;
    const sections=[...document.querySelectorAll('.category')];
    const wb=sections.find(s=>s.querySelector('h2')?.textContent.trim()==='Weight & Balance');
    if(!wb)return;
    const grid=wb.querySelector('.grid');
    if(!grid||grid.querySelector('a[href="/calculators/weight-balance-builder/"]'))return;
    const a=document.createElement('a');
    a.className='tool-card';
    a.href='/calculators/weight-balance-builder/';
    a.innerHTML='<b>Weight & Balance Builder</b><p>Build a loading table and calculate total weight, moment and CG.</p>';
    grid.prepend(a);
    const count=wb.querySelector('.category-head span');
    if(count)count.textContent='5 tools';
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply,{once:true});else apply();
})();
