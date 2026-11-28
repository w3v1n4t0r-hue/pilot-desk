(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.PilotDeskChartTiles=api})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
// Verified FAA cache limits, not the generic ArcGIS tileInfo LOD list.
const charts={sectional:{service:'VFR_Sectional',label:'VFR Sectional',minNativeZoom:8,maxNativeZoom:12},terminal:{service:'VFR_Terminal',label:'VFR TAC',minNativeZoom:10,maxNativeZoom:12},low:{service:'IFR_AreaLow',label:'IFR Low / Area',minNativeZoom:7,maxNativeZoom:12},high:{service:'IFR_High',label:'IFR High',minNativeZoom:5,maxNativeZoom:9}};
function options(chart,environment={}){
 // A 128 px display grid requests one finer FAA level without changing the map scale.
 // Use it for sectionals even at standard DPI so live detail starts one zoom earlier.
 const connection=environment.connection||{};
 const memory=Number(environment.memory);
 const lowMemory=Number.isFinite(memory)&&memory<4;
 const slowNetwork=['slow-2g','2g','3g'].includes(String(connection.effectiveType||'').toLowerCase());
 const constrained=lowMemory||connection.saveData===true||slowNetwork;
 const wantsDetail=chart.service===charts.sectional.service||Number(environment.pixelRatio)>=1.5;
 const offset=wantsDetail&&!constrained?1:0,density=2**offset;
 return{tileSize:256/density,zoomOffset:offset,minZoom:chart.minNativeZoom-offset,minNativeZoom:chart.minNativeZoom-offset,maxNativeZoom:chart.maxNativeZoom-offset,maxZoom:14,keepBuffer:1,updateWhenIdle:true,updateWhenZooming:false,updateInterval:200,detectRetina:false};
}
return{charts,options};
});
