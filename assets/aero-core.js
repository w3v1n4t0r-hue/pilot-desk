/* NASA Glenn lift/drag and lifting-line equations. SI throughout. */
(function(root){
'use strict';
function calculate(p){
 for(const k of ['speed','density','area','span','efficiency','cl','cd0','chord','viscosity','temperature'])if(!Number.isFinite(p[k]))throw new Error('Enter a number in every field.');
 for(const k of ['speed','density','area','span','chord','viscosity','temperature'])if(p[k]<=0)throw new Error('Speed, density, geometry, viscosity and temperature must be above zero.');
 if(p.efficiency<=0||p.efficiency>1||p.cd0<0)throw new Error('Use efficiency above 0 and at most 1, and nonnegative zero-lift drag.');
 const q=.5*p.density*p.speed**2,ar=p.span**2/p.area,cdi=p.cl**2/(Math.PI*p.efficiency*ar),cd=p.cd0+cdi;
 const result={q,ar,cdi,cd,lift:q*p.area*p.cl,drag:q*p.area*cd,parasite:q*p.area*p.cd0,induced:q*p.area*cdi,re:p.density*p.speed*p.chord/p.viscosity,mach:p.speed/Math.sqrt(1.4*287.05*p.temperature)};
 result.ld=cd>0?p.cl/cd:null;
 if(Object.values(result).some(v=>v!==null&&!Number.isFinite(v)))throw new Error('Inputs exceed the supported numeric range.');
 return result;
}
root.PDAero={calculate};
})(typeof window==='undefined'?globalThis:window);
