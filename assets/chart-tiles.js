(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.PilotDeskChartTiles=api})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
// Verified FAA cache limits, not the generic ArcGIS tileInfo LOD list.
const charts={sectional:{service:'VFR_Sectional',label:'VFR Sectional',minNativeZoom:8,maxNativeZoom:12},terminal:{service:'VFR_Terminal',label:'VFR TAC',minNativeZoom:10,maxNativeZoom:12},low:{service:'IFR_AreaLow',label:'IFR Low / Area',minNativeZoom:7,maxNativeZoom:12},high:{service:'IFR_High',label:'IFR High',minNativeZoom:5,maxNativeZoom:9}};
function options(chart,environment={}){
 // FAA tiles are 256 px. Use them at native size on ordinary and constrained
 // devices; request one higher-resolution level only on capable high-DPI screens.
 // The old 64 px grid multiplied tile requests sixteen-fold without adding
 // useful detail on standard-density displays.
 const connection=environment.connection||{};
 const memory=Number(environment.memory);
 const lowMemory=!Number.isFinite(memory)||memory<4;
 const slowNetwork=['slow-2g','2g','3g'].includes(String(connection.effectiveType||'').toLowerCase());
 const constrained=lowMemory||connection.saveData===true||slowNetwork;
 const offset=Number(environment.pixelRatio)>=1.5&&!constrained?1:0,density=2**offset;
 return{tileSize:256/density,zoomOffset:offset,minZoom:chart.minNativeZoom-offset,minNativeZoom:chart.minNativeZoom-offset,maxNativeZoom:chart.maxNativeZoom-offset,maxZoom:14,keepBuffer:1,updateWhenIdle:true,updateWhenZooming:false,updateInterval:200,detectRetina:false};
}
return{charts,options};
});
