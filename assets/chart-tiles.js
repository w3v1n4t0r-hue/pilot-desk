(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.PilotDeskChartTiles=api})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
// Verified FAA cache limits, not the generic ArcGIS tileInfo LOD list.
const charts={sectional:{service:'VFR_Sectional',label:'VFR Sectional',minNativeZoom:8,maxNativeZoom:12},terminal:{service:'VFR_Terminal',label:'VFR TAC',minNativeZoom:10,maxNativeZoom:12},low:{service:'IFR_AreaLow',label:'IFR Low / Area',minNativeZoom:7,maxNativeZoom:12},high:{service:'IFR_High',label:'IFR High',minNativeZoom:5,maxNativeZoom:9}};
function options(chart,environment={}){
 const {width=1024,height=640,memory,connection={}}=environment;
 // Four times the detail per screen area, capped at 120 visible tile slots.
 // Keep normal density on constrained devices, very large screens or data saver.
 const slots=(Math.ceil(width/128)+2)*(Math.ceil(height/128)+2);
 const density=!connection.saveData&&!/^(slow-2g|2g)$/.test(connection.effectiveType||'')&&!(memory>0&&memory<4)&&slots<=120?2:1;
 const offset=density===2?1:0;
 return{tileSize:256/density,zoomOffset:offset,minZoom:chart.minNativeZoom-offset,minNativeZoom:chart.minNativeZoom-offset,maxNativeZoom:chart.maxNativeZoom-offset,maxZoom:14,keepBuffer:1,updateWhenIdle:true,updateWhenZooming:false,updateInterval:200,detectRetina:false};
}
return{charts,options};
});
