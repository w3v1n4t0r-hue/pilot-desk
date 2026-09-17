// Real mesh rendering adapted from the user's v11 WebGL prototype.
// No analytic or fabricated CFD field is generated here.
const identity = () => new Float32Array([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
function perspective(aspect) {
  const f = 1 / Math.tan(Math.PI / 8), m = new Float32Array(16);
  m[0] = f / aspect; m[5] = f; m[10] = -1.002; m[11] = -1; m[14] = -.2002; return m;
}
function lookAt(eye) {
  const z = eye.map(v => v / Math.hypot(...eye)), l = Math.hypot(z[0], z[2]);
  const x = [z[2]/l, 0, -z[0]/l], y = [z[1]*x[2], z[2]*x[0]-z[0]*x[2], -z[1]*x[0]], m = identity();
  for (let i=0;i<3;i++) { m[i*4]=x[i]; m[i*4+1]=y[i]; m[i*4+2]=z[i]; }
  m[14] = -Math.hypot(...eye); return m;
}
export function createRenderer(canvas, onFailure) {
  const gl = canvas.getContext('webgl2', { antialias:true, alpha:false, powerPreference:'low-power' });
  if (!gl) throw Error('3D requires WebGL 2. Your calculator remains available above.');
  const events=new AbortController();
  const listen=(type,callback)=>canvas.addEventListener(type,callback,{signal:events.signal});
  const makeProgram = (vertex, fragment) => {
    const p = gl.createProgram();
    for (const [type, source] of [[gl.VERTEX_SHADER,vertex],[gl.FRAGMENT_SHADER,fragment]]) {
      const s = gl.createShader(type); gl.shaderSource(s,source); gl.compileShader(s);
      if (!gl.getShaderParameter(s,gl.COMPILE_STATUS)) throw Error('The 3D renderer could not start on this device.');
      gl.attachShader(p,s); gl.deleteShader(s);
    }
    gl.linkProgram(p); if (!gl.getProgramParameter(p,gl.LINK_STATUS)) throw Error('The 3D renderer could not start on this device.');
    return p;
  };
  const meshProgram = makeProgram(`#version 300 es
    in vec3 position; in vec3 normal; in float pressure; uniform mat4 projection,view;
    out vec3 n; out float scalar;
    void main(){ n=normal; scalar=pressure; gl_Position=projection*view*vec4(position,1.); }`, `#version 300 es
    precision highp float; in vec3 n; in float scalar; uniform float mapped,minimum,maximum; out vec4 color;
    void main(){vec3 N=normalize(n); if(!gl_FrontFacing)N=-N;
      float d=max(dot(N,normalize(vec3(-.5,.85,.28))),0.);
      float fill=max(dot(N,normalize(vec3(.65,.3,-.52))),0.);
      vec3 base=vec3(.61,.64,.66);
      float t=clamp((scalar-minimum)/max(.001,maximum-minimum),0.,1.);
      vec3 field=t<.5?mix(vec3(.13,.39,.76),vec3(.70,.83,.83),t*2.):mix(vec3(.70,.83,.83),vec3(.88,.39,.20),(t-.5)*2.);
      color=vec4(mix(base,field,mapped)*(.30+.55*d+.22*fill),1.); }`);
  const flowProgram = makeProgram(`#version 300 es
    in vec3 position; in float travel; uniform mat4 projection,view; out float t;
    void main(){t=travel;gl_Position=projection*view*vec4(position,1.);}`, `#version 300 es
    precision highp float; in float t; uniform float clock,moving; out vec4 color;
    void main(){float pulse=1.-smoothstep(.03,.20,abs(fract(t-clock)-.5));color=vec4(.49,.83,.90,.20+moving*pulse*.65);}`);
  const meshVao = gl.createVertexArray(), flowVao = gl.createVertexArray();
  const buffers=[]; let count=0,flowCount=0,pressureRange=[0,1],mapped=false,active=true,paused=true,frame=0,clock=0,last=0,lost=false;
  let yaw=.72,pitch=.31,distance=11;
  function attribute(program, name, data, size) {
    const b=gl.createBuffer();buffers.push(b);gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(data),gl.STATIC_DRAW);
    const loc=gl.getAttribLocation(program,name);gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,size,gl.FLOAT,false,0,0);
  }
  function setGeometry(positions,normals,pressure,lines=[],cfd=false) {
    if(lost)throw Error('The graphics connection was lost. Reload before importing a field.');
    const min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];
    positions.forEach((v,i)=>{min[i%3]=Math.min(min[i%3],v);max[i%3]=Math.max(max[i%3],v)});
    const center=max.map((v,i)=>(v+min[i])/2),scale=7.8/Math.max(...max.map((v,i)=>v-min[i]));
    if (!Number.isFinite(scale)) throw Error('The mesh has no visible extent.');
    buffers.splice(0).forEach(b=>gl.deleteBuffer(b));
    const transform = (values,isNormal=false) => {
      const out=[];
      for(let i=0;i<values.length;i+=3){const p=values.slice(i,i+3).map((v,j)=>isNormal?v:(v-center[j])*scale);out.push(...(cfd?[p[0],p[2],-p[1]]:p))}return out;
    };
    count=positions.length/3; gl.bindVertexArray(meshVao);
    attribute(meshProgram,'position',transform(positions),3);attribute(meshProgram,'normal',transform(normals,true),3);attribute(meshProgram,'pressure',pressure||new Float32Array(count),1);
    pressureRange=pressure?pressure.reduce((r,v)=>[Math.min(r[0],v),Math.max(r[1],v)],[Infinity,-Infinity]):[0,1];
    const flow=[],travel=[];
    for(const line of lines){const p=transform(line.points);let elapsed=0;
      for(let i=0;i<p.length-3;i+=3){const seconds=Math.hypot(...line.points.slice(i+3,i+6).map((v,j)=>v-line.points[i+j]))/Math.max(.01,(line.speedMs[i/3]+line.speedMs[i/3+1])/2);
        flow.push(...p.slice(i,i+6));travel.push(elapsed,elapsed+seconds);elapsed+=seconds;}}
    flowCount=flow.length/3;gl.bindVertexArray(flowVao);attribute(flowProgram,'position',flow,3);attribute(flowProgram,'travel',travel,1);gl.bindVertexArray(null);requestDraw();
    return pressureRange;
  }
  function draw(now=0) {
    frame=0;if(lost||!active)return;
    if(last&&!paused)clock+=Math.min(.05,(now-last)/1000);last=now;
    const rect=canvas.getBoundingClientRect(),ratio=Math.min(devicePixelRatio||1,2);
    const width=Math.max(1,Math.round(rect.width*ratio)),height=Math.max(1,Math.round(rect.height*ratio));
    if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height}
    gl.viewport(0,0,width,height);gl.clearColor(.025,.029,.033,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    const eye=[Math.cos(yaw)*Math.cos(pitch)*distance,Math.sin(pitch)*distance,Math.sin(yaw)*Math.cos(pitch)*distance],projection=perspective(width/height),view=lookAt(eye);
    const uniforms=p=>{gl.useProgram(p);gl.uniformMatrix4fv(gl.getUniformLocation(p,'projection'),false,projection);gl.uniformMatrix4fv(gl.getUniformLocation(p,'view'),false,view)};
    uniforms(meshProgram);gl.uniform1f(gl.getUniformLocation(meshProgram,'mapped'),mapped?1:0);gl.uniform1f(gl.getUniformLocation(meshProgram,'minimum'),pressureRange[0]);gl.uniform1f(gl.getUniformLocation(meshProgram,'maximum'),pressureRange[1]);
    gl.bindVertexArray(meshVao);gl.enable(gl.DEPTH_TEST);gl.disable(gl.BLEND);gl.drawArrays(gl.TRIANGLES,0,count);
    if(flowCount){uniforms(flowProgram);gl.uniform1f(gl.getUniformLocation(flowProgram,'clock'),clock);gl.uniform1f(gl.getUniformLocation(flowProgram,'moving'),paused?0:1);gl.bindVertexArray(flowVao);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.depthMask(false);gl.drawArrays(gl.LINES,0,flowCount);gl.depthMask(true)}
    gl.bindVertexArray(null);if(!paused&&flowCount)requestDraw();
  }
  function requestDraw(){if(!frame&&active&&!lost)frame=requestAnimationFrame(draw)}
  let drag=null;
  listen('pointerdown',e=>{drag=[e.clientX,e.clientY];canvas.setPointerCapture(e.pointerId)});
  listen('pointermove',e=>{if(!drag)return;yaw+=(e.clientX-drag[0])*.007;pitch=clamp(pitch+(e.clientY-drag[1])*.005,-1.45,1.45);drag=[e.clientX,e.clientY];requestDraw()});
  for(const event of ['pointerup','pointercancel','lostpointercapture'])listen(event,()=>{drag=null});
  listen('keydown',e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','-','Home'].includes(e.key))return;e.preventDefault();
    if(e.key==='ArrowLeft')yaw-=.15;if(e.key==='ArrowRight')yaw+=.15;if(e.key==='ArrowUp')pitch=clamp(pitch+.1,-1.45,1.45);if(e.key==='ArrowDown')pitch=clamp(pitch-.1,-1.45,1.45);
    if(e.key==='+')distance=clamp(distance-1,6,20);if(e.key==='-')distance=clamp(distance+1,6,20);if(e.key==='Home'){yaw=.72;pitch=.31;distance=11}requestDraw()});
  listen('webglcontextlost',e=>{e.preventDefault();lost=true;cancelAnimationFrame(frame);onFailure('The 3D graphics connection was lost. Reload this page to restore the viewer; calculator results are unchanged.');});
  const resize=new ResizeObserver(requestDraw);resize.observe(canvas);
  return {
    setGeometry,
    dispose(){active=false;events.abort();resize.disconnect();cancelAnimationFrame(frame);buffers.splice(0).forEach(b=>gl.deleteBuffer(b));gl.deleteVertexArray(meshVao);gl.deleteVertexArray(flowVao);gl.deleteProgram(meshProgram);gl.deleteProgram(flowProgram)},
    async loadModel(url){const response=await fetch(url);if(!response.ok)throw Error('The aircraft model could not be loaded. Try opening the viewer again.');const ab=await response.arrayBuffer();
      if(ab.byteLength<8||ab.byteLength>8e6||new TextDecoder().decode(new Uint8Array(ab,0,4))!=='PDM1')throw Error('Invalid aircraft model.');
      const n=new DataView(ab).getUint32(4,true);if(!n||n%3||ab.byteLength!==8+n*24)throw Error('Invalid aircraft model.');
      const p=new Float32Array(ab,8,n*3),normal=new Float32Array(ab,8+n*12,n*3);if(!p.every(Number.isFinite)||!normal.every(Number.isFinite))throw Error('Invalid aircraft coordinates.');
      setGeometry(p,normal);
    },
    setDataset(data){return setGeometry(data.surface.positions,data.surface.normals,data.surface.pressurePa,data.streamlines,true)},
    setPressure(value){mapped=value;requestDraw()},
    setPaused(value){paused=value;last=0;requestDraw()},
    setActive(value){active=value;last=0;if(!active){cancelAnimationFrame(frame);frame=0}else requestDraw()},
    setView(name){[yaw,pitch,distance]=name==='top'?[0,1.45,12]:name==='side'?[Math.PI/2,0,11]:[.72,.31,11];requestDraw()},
    zoom(delta){distance=clamp(distance+delta,6,20);requestDraw()}
  };
}
