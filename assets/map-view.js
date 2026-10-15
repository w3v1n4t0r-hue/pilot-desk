(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else{root.PilotDeskMapView=api;api.init();}
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const KEY='pd-map-view-v1',CHARTS=['sectional','terminal','low','high'];
  function validate(value){
    if(!value||typeof value!=='object')return null;
    const {lon,lat,zoom,chart}=value;
    if(![lon,lat,zoom].every(Number.isFinite)||Math.abs(lon)>180||Math.abs(lat)>85||zoom<3||zoom>14)return null;
    if(chart!==undefined&&!CHARTS.includes(chart))return null;
    return {lon,lat,zoom,...(chart?{chart}:{})};
  }
  function parse(hash){
    const m=String(hash).match(/^#map=(-?\d+(?:\.\d+)?)\/(-?\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)(?:\/(sectional|terminal|low|high))?$/);
    return m?validate({lon:Number(m[1]),lat:Number(m[2]),zoom:Number(m[3]),chart:m[4]}):null;
  }
  function format(value){
    const view=validate(value);if(!view)return null;
    return '#map='+view.lon.toFixed(5)+'/'+view.lat.toFixed(5)+'/'+Number(view.zoom.toFixed(2))+(view.chart?'/'+view.chart:'');
  }
  function read(hash,storage){
    const linked=parse(hash);if(linked)return linked;
    try{return validate(JSON.parse(storage.getItem(KEY)||'null'))}catch{return null;}
  }
  function enabled(defaults,saved){
    return Object.fromEntries(Object.entries(defaults).map(([key,value])=>[key,typeof saved?.[key]==='boolean'?saved[key]:value]));
  }
  function opacity(value,fallback,min){
    return typeof value==='number'&&Number.isFinite(value)?Math.max(min,Math.min(1,value)):fallback;
  }
  function init(){
    if(typeof document!=='object')return;
    let started=false;
    function boot(){
      const RP=window.PilotDeskRoutePlanner,map=RP?.getMap(),bar=document.querySelector('.rp-map-toolbar');
      if(started||!map||!bar)return;started=true;
      let applying=false,timer=0;
      const current=()=>{const p=map.getCenter();return validate({lon:((p.lng+180)%360+360)%360-180,lat:p.lat,zoom:map.getZoom(),chart:RP.getChart()});};
      function persist(){
        if(applying)return;
        const view=current();if(!view)return;
        try{localStorage.setItem(KEY,JSON.stringify(view))}catch{}
        // Section anchors keep their meaning; map links own only their own fragment.
        if(!location.hash||parse(location.hash))try{history.replaceState(history.state,'',location.pathname+location.search+format(view))}catch{}
      }
      map.on('moveend',persist);
      document.addEventListener('pilotdesk:chart-changed',persist);
      window.addEventListener('hashchange',()=>{
        const view=parse(location.hash);if(!view)return;
        applying=true;
        try{if(view.chart)RP.setChart(view.chart);map.setView([view.lat,view.lon],view.zoom,{animate:false})}finally{applying=false;}
        document.dispatchEvent(new CustomEvent('pilotdesk:map-view-restored',{detail:view}));
        persist();
      });
    }
    document.addEventListener('pilotdesk:map-ready',boot,{once:true});
    document.readyState==='loading'?document.addEventListener('DOMContentLoaded',boot,{once:true}):boot();
  }
  return {validate,parse,format,read,enabled,opacity,init};
});
