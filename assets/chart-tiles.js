(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.PilotDeskChartTiles=api})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
// Verified FAA cache limits, not the generic ArcGIS tileInfo LOD list.
const charts={sectional:{service:'VFR_Sectional',label:'VFR Sectional',minNativeZoom:8,maxNativeZoom:12},terminal:{service:'VFR_Terminal',label:'VFR TAC',minNativeZoom:10,maxNativeZoom:12},low:{service:'IFR_AreaLow',label:'IFR Low / Area',minNativeZoom:7,maxNativeZoom:12},high:{service:'IFR_High',label:'IFR High',minNativeZoom:5,maxNativeZoom:9}};
function options(chart,environment={}){
 const ratio=Number(environment.pixelRatio)||1;
 // Supersample charts independently of viewport size. Source levels remain
 // bounded by the FAA cache; enlarging beyond them cannot create more detail.
 const offset=ratio>2?2:1,density=2**offset;
 return{tileSize:256/density,zoomOffset:offset,minZoom:chart.minNativeZoom-offset,minNativeZoom:chart.minNativeZoom-offset,maxNativeZoom:chart.maxNativeZoom-offset,maxZoom:14,keepBuffer:1,updateWhenIdle:true,updateWhenZooming:false,updateInterval:200,detectRetina:false};
}
return{charts,options};
});
