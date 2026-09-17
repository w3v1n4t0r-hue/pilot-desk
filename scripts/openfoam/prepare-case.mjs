import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { auditMesh, readMesh, sha256 } from './mesh-audit.mjs';

const header = (object, type='dictionary') => `FoamFile { version 2.0; format ascii; class ${type}; object ${object}; }\n`;
export function prepareCase(settings, bytes) {
  const number=(key,min,max)=>{if(typeof settings[key]!=='number'||!Number.isFinite(settings[key])||settings[key]<min||settings[key]>max)throw Error(`Set ${key} explicitly within ${min}–${max}.`);return settings[key]};
  const scale=number('metersPerUnit',1e-6,100),speed=number('speedMs',1,100),rho=number('densityKgM3',.2,2),nu=number('kinematicViscosityM2s',1e-6,1e-3);
  const aoa=number('aoaDeg',-10,20)*Math.PI/180,beta=number('sideslipDeg',-15,15)*Math.PI/180;
  const iterations=number('iterations',100,10000),level=number('surfaceRefinement',3,6);
  if(!Number.isInteger(iterations)||!Number.isInteger(level))throw Error('Iterations and refinement must be integers.');
  const axes=settings.downstreamSpanUpAxes;
  if(!Array.isArray(axes)||axes.length!==3||!axes.every(v=>[-3,-2,-1,1,2,3].includes(v))||new Set(axes.map(Math.abs)).size!==3)throw Error('Specify downstreamSpanUpAxes as a signed axis permutation, for example [1,2,3].');
  const positions=readMesh(bytes),audit=auditMesh(positions);
  if(!audit.passesTopologyScreen||audit.signedVolume<=0)throw Error(`CFD surface rejected: ${audit.boundaryEdges} open edges, ${audit.nonManifoldEdges} non-manifold edges, ${audit.inconsistentEdges} winding conflicts, ${audit.degenerateFaces} degenerate faces, ${audit.duplicateFaces} duplicates; signed volume ${audit.signedVolume}. Repair and review the surface first.`);
  if(settings.geometryReviewed!==true)throw Error('Geometry scale, orientation, intersections and aircraft suitability must be reviewed before preparing a case.');
  // The signed permutation must preserve handedness; reflections reverse winding.
  const matrix=axes.map(a=>[1,2,3].map(v=>Math.abs(a)===v?Math.sign(a):0));
  const [a,b,c]=matrix,det=a[0]*(b[1]*c[2]-b[2]*c[1])-a[1]*(b[0]*c[2]-b[2]*c[0])+a[2]*(b[0]*c[1]-b[1]*c[0]);
  if(det!==1)throw Error('The axis mapping must preserve right-handed orientation.');
  const center=audit.bounds.min.map((v,i)=>(v+audit.bounds.max[i])/2),rotated=[];
  for(let i=0;i<positions.length;i+=3){const p=axes.map(axis=>(positions[i+Math.abs(axis)-1]-center[Math.abs(axis)-1])*scale*Math.sign(axis));
    // Nose points toward -X. Positive AoA rotates the nose toward +Z.
    const x=p[0]*Math.cos(aoa)+p[2]*Math.sin(aoa),z=-p[0]*Math.sin(aoa)+p[2]*Math.cos(aoa);
    rotated.push(x*Math.cos(beta)-p[1]*Math.sin(beta),x*Math.sin(beta)+p[1]*Math.cos(beta),z);
  }
  const physical=auditMesh(rotated),span=Math.max(...physical.bounds.extent);
  if(span<.5||span>50)throw Error('Verify aircraft units: largest dimension must be 0.5–50 metres for this case generator.');
  const xmin=-5*span,xmax=10*span,side=5*span,vec=v=>`(${v.join(' ')})`;
  const vertices=[[xmin,-side,-side],[xmax,-side,-side],[xmax,side,-side],[xmin,side,-side],[xmin,-side,side],[xmax,-side,side],[xmax,side,side],[xmin,side,side]];
  const files={};const dict=(name,body)=>{files[`system/${name}`]=header(name)+body};
  dict('blockMeshDict',`convertToMeters 1;\nvertices (${vertices.map(vec).join('\n')});\nblocks (hex (0 1 2 3 4 5 6 7) (60 40 40) simpleGrading (1 1 1));\nedges ();\nboundary (inlet { type patch; faces ((0 4 7 3)); } outlet { type patch; faces ((1 2 6 5)); } farfield { type patch; faces ((0 1 5 4) (3 7 6 2) (0 3 2 1) (4 5 6 7)); });\nmergePatchPairs ();`);
  dict('surfaceFeatureExtractDict','aircraft.stl { extractionMethod extractFromSurface; extractFromSurfaceCoeffs { includedAngle 150; } writeObj no; }');
  dict('snappyHexMeshDict',`castellatedMesh true; snap true; addLayers true;
geometry { aircraft.stl { type triSurfaceMesh; name aircraft; } }
castellatedMeshControls {
 maxLocalCells 3000000; maxGlobalCells 3000000; minRefinementCells 10; maxLoadUnbalance 0.10; nCellsBetweenLevels 3;
 features ({ file "aircraft.eMesh"; level ${level+1}; });
 refinementSurfaces { aircraft { level (${level} ${level+1}); patchInfo { type wall; } } }
 resolveFeatureAngle 30; refinementRegions {};
 locationInMesh (${xmin+span*.137} ${-side+span*.173} ${-side+span*.191}); allowFreeStandingZoneFaces true;
}
snapControls { nSmoothPatch 3; tolerance 2; nSolveIter 30; nRelaxIter 5; nFeatureSnapIter 10; implicitFeatureSnap false; explicitFeatureSnap true; multiRegionFeatureSnap false; }
addLayersControls {
 relativeSizes true; layers { "aircraft.*" { nSurfaceLayers 5; } }
 expansionRatio 1.2; finalLayerThickness .3; minThickness .1; nGrow 0; featureAngle 60;
 nRelaxIter 5; nSmoothSurfaceNormals 1; nSmoothNormals 3; nSmoothThickness 10; maxFaceThicknessRatio .5;
 maxThicknessToMedialRatio .3; minMedialAxisAngle 90; nBufferCellsNoExtrude 0; nLayerIter 50;
}
meshQualityControls {
 #includeEtc "caseDicts/mesh/generation/meshQualityDict"
}
writeFlags (scalarLevels layerSets layerFields); mergeTolerance 1e-6;`);
  dict('fvSchemes',`ddtSchemes { default steadyState; }
gradSchemes { default Gauss linear; grad(U) cellLimited Gauss linear 1; }
divSchemes { default none; div(phi,U) bounded Gauss linearUpwind grad(U); div(phi,k) bounded Gauss upwind; div(phi,omega) bounded Gauss upwind; div((nuEff*dev2(T(grad(U))))) Gauss linear; }
laplacianSchemes { default Gauss linear corrected; } interpolationSchemes { default linear; } snGradSchemes { default corrected; } wallDist { method meshWave; }`);
  dict('fvSolution',`solvers { p { solver GAMG; smoother GaussSeidel; tolerance 1e-7; relTol .01; } Phi { solver GAMG; smoother GaussSeidel; tolerance 1e-7; relTol .01; } "(U|k|omega)" { solver smoothSolver; smoother symGaussSeidel; tolerance 1e-8; relTol .1; } }
SIMPLE { nNonOrthogonalCorrectors 1; residualControl { p 1e-5; U 1e-6; "(k|omega)" 1e-6; } }
potentialFlow { nNonOrthogonalCorrectors 10; }
relaxationFactors { fields { p .3; } equations { U .7; k .7; omega .7; } }`);
  dict('controlDict',`application simpleFoam; startFrom startTime; startTime 0; stopAt endTime; endTime ${iterations}; deltaT 1;
writeControl timeStep; writeInterval 100; purgeWrite 0; writeFormat ascii; writePrecision 10; writeCompression off; timeFormat general; timePrecision 8; runTimeModifiable false;
functions {
 forces { type forces; libs (forces); patches ("aircraft.*"); rho rhoInf; rhoInf ${rho}; CofR (0 0 0); writeControl timeStep; writeInterval 1; }
 yPlus { type yPlus; libs (fieldFunctionObjects); writeControl writeTime; }
}`);
  files['constant/transportProperties']=header('transportProperties')+`transportModel Newtonian; nu [0 2 -1 0 0 0 0] ${nu};`;
  files['constant/turbulenceProperties']=header('turbulenceProperties')+'simulationType RAS; RAS { RASModel kOmegaSST; turbulence on; printCoeffs on; }';
  // Explicit 1% inlet intensity and 0.07 * characteristic length. Review for each scenario.
  const k=1.5*(speed*.01)**2,omega=Math.sqrt(k)/(.09**.25*.07*span);
  const field=(name,type,dimensions,value,inlet,outlet,wall,farfield='zeroGradient')=>{files[`0/${name}`]=header(name,type)+`dimensions [${dimensions}]; internalField uniform ${value}; boundaryField { inlet { type ${inlet}; value uniform ${value}; } outlet { type ${outlet}; ${outlet==='inletOutlet'?`inletValue uniform ${value};`:''} value uniform ${value}; } farfield { type ${farfield}; } "aircraft.*" { type ${wall}; value uniform ${name==='U'?'(0 0 0)':value}; } }`};
  field('U','volVectorField','0 1 -1 0 0 0 0',`(${speed} 0 0)`,'fixedValue','inletOutlet','noSlip','slip');
  field('p','volScalarField','0 2 -2 0 0 0 0','0','zeroGradient','fixedValue','zeroGradient');
  field('k','volScalarField','0 2 -2 0 0 0 0',k,'fixedValue','inletOutlet','kqRWallFunction');
  field('omega','volScalarField','0 0 -1 0 0 0 0',omega,'fixedValue','inletOutlet','omegaWallFunction');
  field('nut','volScalarField','0 2 -1 0 0 0 0','0','calculated','calculated','nutkWallFunction');
  const stl=Buffer.alloc(84+rotated.length/9*50);stl.write('PilotDesk reviewed surface in metres');stl.writeUInt32LE(rotated.length/9,80);
  for(let i=0;i<rotated.length;i+=9){const a=rotated.slice(i,i+3),b=rotated.slice(i+3,i+6).map((v,j)=>v-a[j]),c=rotated.slice(i+6,i+9).map((v,j)=>v-a[j]);const n=[b[1]*c[2]-b[2]*c[1],b[2]*c[0]-b[0]*c[2],b[0]*c[1]-b[1]*c[0]],length=Math.hypot(...n);
    [...n.map(v=>v/length),...rotated.slice(i,i+9)].forEach((v,j)=>stl.writeFloatLE(v,84+i/9*50+j*4));}
  files['constant/triSurface/aircraft.stl']=stl;
  const hashes=Object.keys(files).sort().map(name=>[name,sha256(files[name])]);
  const manifest={schema:'pilotdesk.case.v1',solver:'simpleFoam',version:'v2312',status:'prepared-not-run',geometrySha256:sha256(stl),caseSha256:sha256(JSON.stringify(hashes)),files:hashes,
    sourceSha256:sha256(bytes),conditions:{speedMs:speed,densityKgM3:rho,aoaDeg:settings.aoaDeg,sideslipDeg:settings.sideslipDeg},settings,meshAudit:physical,
    limitations:['Unvalidated case generator until a real OpenFOAM run passes.','Steady incompressible RANS; no propeller, transition, ground effect or time-resolved stall.','Review domain size, mesh independence, layer coverage, y+, force stability and residuals before exporting.']};
  return {files,manifest};
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  const [configFile,destination]=process.argv.slice(2);if(!configFile||!destination)throw Error('Usage: node prepare-case.mjs settings.json new-case-directory');
  const settings=JSON.parse(fs.readFileSync(configFile,'utf8')),bytes=fs.readFileSync(path.resolve(path.dirname(configFile),settings.sourceMesh));
  const {files,manifest}=prepareCase(settings,bytes);
  if(fs.existsSync(destination))throw Error('Choose a new case directory; existing runs are never overwritten.');
  for(const [name,content]of Object.entries(files)){const target=path.join(destination,name);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,content)}
  fs.writeFileSync(path.join(destination,'pilotdesk-case.json'),JSON.stringify(manifest,null,2)+'\n');console.log('Case prepared, not run. Review the dictionaries before starting OpenFOAM v2312.');
}
