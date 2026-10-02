(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else{root.PilotDeskMapTools=api;api.init();}
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const rad=value=>value*Math.PI/180,deg=value=>value*180/Math.PI;
  function measure(a,b){
    if(![a?.lat,a?.lng,b?.lat,b?.lng].every(Number.isFinite)||Math.abs(a.lat)>90||Math.abs(b.lat)>90||Math.abs(a.lng)>180||Math.abs(b.lng)>180)throw new Error('Choose two valid chart coordinates.');
    const p1=rad(a.lat),p2=rad(b.lat),delta=rad(b.lng-a.lng);
    const h=Math.sin((p2-p1)/2)**2+Math.cos(p1)*Math.cos(p2)*Math.sin(delta/2)**2;
    const angle=2*Math.atan2(Math.sqrt(Math.min(1,Math.max(0,h))),Math.sqrt(Math.max(0,1-h)));
    const distance=3440.065*angle;
    const bearing=distance<1e-7||Math.abs(Math.PI-angle)<1e-7?null:(deg(Math.atan2(Math.sin(delta)*Math.cos(p2),Math.cos(p1)*Math.sin(p2)-Math.sin(p1)*Math.cos(p2)*Math.cos(delta)))+360)%360;
    const points=[];
    if(bearing!==null){
      const l1=rad(a.lng),l2=rad(b.lng);
      for(let i=0;i<=32;i++){
        const f=i/32,A=Math.sin((1-f)*angle)/Math.sin(angle),B=Math.sin(f*angle)/Math.sin(angle);
        const x=A*Math.cos(p1)*Math.cos(l1)+B*Math.cos(p2)*Math.cos(l2),y=A*Math.cos(p1)*Math.sin(l1)+B*Math.cos(p2)*Math.sin(l2),z=A*Math.sin(p1)+B*Math.sin(p2);
        let lon=deg(Math.atan2(y,x));
        const prior=i?points[i-1][1]:a.lng;
        while(lon-prior>180)lon-=360;while(lon-prior< -180)lon+=360;
        points.push([deg(Math.atan2(z,Math.hypot(x,y))),lon]);
      }
    }
    return{distance,bearing,points};
  }
  let started=false;
  function init(){
    if(typeof document!=='object')return;
    function boot(){
      const RP=window.PilotDeskRoutePlanner,map=RP?.getMap(),L=window.L;
      if(started||!map||!L)return;started=true;
      const toolbar=document.querySelector('.rp-map-toolbar'),container=document.getElementById('rpMap');
      const button=document.createElement('button');button.type='button';button.id='rpMeasure';button.className='utility-btn';button.textContent='Measure';button.setAttribute('aria-pressed','false');button.setAttribute('aria-controls','rpMeasurePanel');toolbar.insertBefore(button,document.getElementById('rpMapStatus'));
      const panel=document.createElement('section');panel.id='rpMeasurePanel';panel.className='rp-measure-panel';panel.hidden=true;panel.setAttribute('aria-label','Chart measurement');
      panel.innerHTML='<strong>Distance / bearing</strong><p id="rpMeasureResult" role="status">Click two points on the chart.</p><small>Great-circle distance and initial true bearing. Measuring does not change the flight plan.</small><div><button type="button" data-measure-reset>Start again</button><button type="button" data-measure-close>Done</button></div>';
      container.appendChild(panel);L.DomEvent.disableClickPropagation(panel);L.DomEvent.disableScrollPropagation(panel);
      const group=L.layerGroup().addTo(map);let active=false,points=[];
      const result=panel.querySelector('#rpMeasureResult');
      function reset(){points=[];group.clearLayers();result.textContent='Click two points on the chart.';}
      function toggle(on){if(on){const plot=document.getElementById('rpPlotMode');if(plot?.getAttribute('aria-pressed')==='true')plot.click();}active=on;panel.hidden=!on;button.setAttribute('aria-pressed',String(on));container.style.cursor=on||document.getElementById('rpPlotMode')?.getAttribute('aria-pressed')==='true'?'crosshair':'';if(on)reset();else{group.clearLayers();button.focus({preventScroll:true});}}
      button.addEventListener('click',()=>toggle(!active));panel.querySelector('[data-measure-reset]').addEventListener('click',reset);panel.querySelector('[data-measure-close]').addEventListener('click',()=>toggle(false));
      document.getElementById('rpPlotMode')?.addEventListener('click',()=>{if(active)toggle(false);});
      map.on('click',event=>{
        if(!active)return;if(points.length===2)reset();points.push({lat:event.latlng.lat,lng:((event.latlng.lng+180)%360+360)%360-180});
        L.circleMarker(points.at(-1),{pane:'pdRoutePane',radius:5,color:'#fff',weight:2,fillColor:'#08090b',fillOpacity:1,interactive:false}).addTo(group);
        if(points.length===1){result.textContent='First point set. Click the second point.';return;}
        const value=measure(points[0],points[1]);
        if(value.points.length)L.polyline(value.points,{pane:'pdRoutePane',color:'#f5f5f5',weight:2,dashArray:'6 5',interactive:false}).addTo(group);
        result.textContent=value.distance.toFixed(1)+' NM · '+(value.bearing===null?'Bearing undefined':String(Math.round(value.bearing)%360).padStart(3,'0')+'° true');
      });
      document.addEventListener('keydown',event=>{if(event.key==='Escape'&&active)toggle(false);});
    }
    document.addEventListener('pilotdesk:map-ready',boot,{once:true});
    document.readyState==='loading'?document.addEventListener('DOMContentLoaded',boot,{once:true}):boot();
  }
  return{measure,init};
});
