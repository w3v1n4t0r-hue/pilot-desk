#!/usr/bin/env python3
"""Generate a complete OpenFOAM 6 aircraft external-aerodynamics case."""
from __future__ import annotations
from pathlib import Path
import argparse, json, math, struct, shutil

KT2MS = 0.5144444444444445
LB2N = 4.4482216152605

def sutherland_mu(temp_c: float) -> float:
    T = temp_c + 273.15
    T0 = 273.15
    mu0 = 1.716e-5
    S = 111.0
    return mu0 * (T/T0)**1.5 * (T0 + S)/(T + S)

def matmul(A, v):
    return tuple(sum(A[i][j]*v[j] for j in range(3)) for i in range(3))

def rotation_matrix(aoa_deg, beta_deg, roll_deg):
    a = math.radians(aoa_deg); b = math.radians(beta_deg); r = math.radians(roll_deg)
    ca,sa = math.cos(a),math.sin(a); cb,sb = math.cos(b),math.sin(b); cr,sr = math.cos(r),math.sin(r)
    Ry = ((ca,0,sa),(0,1,0),(-sa,0,ca))
    Rz = ((cb,-sb,0),(sb,cb,0),(0,0,1))
    Rx = ((1,0,0),(0,cr,-sr),(0,sr,cr))
    def mm(A,B):
        return tuple(tuple(sum(A[i][k]*B[k][j] for k in range(3)) for j in range(3)) for i in range(3))
    return mm(Rz, mm(Ry, Rx))

def rotate_binary_stl(src: Path, dst: Path, R):
    data = src.read_bytes()
    if len(data) < 84: raise ValueError("STL too small")
    n = struct.unpack_from("<I", data, 80)[0]
    if 84 + 50*n != len(data): raise ValueError("Expected packaged binary STL")
    out = bytearray(data[:84])
    for i in range(n):
        off = 84 + 50*i
        vals = struct.unpack_from("<12fH", data, off)
        normal = matmul(R, vals[0:3]); v1 = matmul(R, vals[3:6]); v2 = matmul(R, vals[6:9]); v3 = matmul(R, vals[9:12])
        out.extend(struct.pack("<12fH", *(normal+v1+v2+v3), vals[12]))
    dst.parent.mkdir(parents=True, exist_ok=True); dst.write_bytes(out)

def foam_header(cls, obj):
    return f"""/* PilotDesk direct OpenFOAM case */
FoamFile
{{
    version 2.0;
    format ascii;
    class {cls};
    object {obj};
}}
// ************************************************************************* //
"""

def write(path: Path, text: str):
    path.parent.mkdir(parents=True, exist_ok=True); path.write_text(text)

def make_case(cfg, root: Path, case: Path):
    if case.exists(): shutil.rmtree(case)
    (case/"0").mkdir(parents=True); (case/"constant"/"triSurface").mkdir(parents=True); (case/"system").mkdir(parents=True)
    V = cfg["tas_kt"] * KT2MS; rho = cfg["density_kg_m3"]
    mu = sutherland_mu(cfg["temperature_c"]); nu = mu/rho
    I = cfg["turbulence_intensity"]; Lt = cfg["turbulence_length_m"]
    k = 1.5*(V*I)**2; omega = math.sqrt(max(k,1e-12))/(0.09**0.25*max(Lt,1e-4))
    R = rotation_matrix(cfg["aoa_deg"],cfg["beta_deg"],cfg["roll_geometry_deg"])
    rotate_binary_stl(root/cfg["mesh"], case/"constant"/"triSurface"/"aircraft.stl", R)
    cbar=cfg["mean_aerodynamic_chord_m"]; cg_body_x=cfg["wing_mac_le_x_m"]+cfg["cg_percent_mac"]/100*cbar
    cg_global=matmul(R,(cg_body_x,0,0)); pitch_axis=matmul(R,(0,1,0))
    q=.5*rho*V*V; nload=1/max(math.cos(math.radians(cfg["bank_deg"])),1e-6)
    required_cl=cfg["weight_lb"]*LB2N*nload/(q*cfg["wing_area_m2"])
    presets={
      "preview":dict(cells=(40,28,20),surf=(2,3),near=2,wake=1,layers=2,maxcells=900000),
      "standard":dict(cells=(54,36,26),surf=(3,4),near=3,wake=2,layers=3,maxcells=2200000),
      "high":dict(cells=(72,48,34),surf=(4,5),near=4,wake=3,layers=5,maxcells=5000000)}
    P=presets.get(cfg.get("quality","preview"),presets["preview"])
    write(case/"0"/"U",foam_header("volVectorField","U")+f"""
dimensions [0 1 -1 0 0 0 0];
internalField uniform ({V:.9g} 0 0);
boundaryField
{{
 inlet {{ type fixedValue; value uniform ({V:.9g} 0 0); }}
 outlet {{ type zeroGradient; }}
 farfield {{ type slip; }}
 aircraft {{ type fixedValue; value uniform (0 0 0); }}
}}
""")
    write(case/"0"/"p",foam_header("volScalarField","p")+"""
dimensions [0 2 -2 0 0 0 0];
internalField uniform 0;
boundaryField
{
 inlet { type zeroGradient; }
 outlet { type fixedValue; value uniform 0; }
 farfield { type zeroGradient; }
 aircraft { type zeroGradient; }
}
""")
    write(case/"0"/"k",foam_header("volScalarField","k")+f"""
dimensions [0 2 -2 0 0 0 0];
internalField uniform {k:.9g};
boundaryField
{{
 inlet {{ type fixedValue; value uniform {k:.9g}; }}
 outlet {{ type zeroGradient; }}
 farfield {{ type zeroGradient; }}
 aircraft {{ type kqRWallFunction; value uniform {k:.9g}; }}
}}
""")
    write(case/"0"/"omega",foam_header("volScalarField","omega")+f"""
dimensions [0 0 -1 0 0 0 0];
internalField uniform {omega:.9g};
boundaryField
{{
 inlet {{ type fixedValue; value uniform {omega:.9g}; }}
 outlet {{ type zeroGradient; }}
 farfield {{ type zeroGradient; }}
 aircraft {{ type omegaWallFunction; value uniform {omega:.9g}; }}
}}
""")
    write(case/"0"/"nut",foam_header("volScalarField","nut")+"""
dimensions [0 2 -1 0 0 0 0];
internalField uniform 0;
boundaryField
{
 inlet { type calculated; value uniform 0; }
 outlet { type calculated; value uniform 0; }
 farfield { type calculated; value uniform 0; }
 aircraft { type nutkWallFunction; value uniform 0; }
}
""")
    write(case/"constant"/"transportProperties",foam_header("dictionary","transportProperties")+f"""
transportModel Newtonian;
nu [0 2 -1 0 0 0 0] {nu:.12g};
""")
    write(case/"constant"/"turbulenceProperties",foam_header("dictionary","turbulenceProperties")+"""
simulationType RAS;
RAS
{
 RASModel kOmegaSST;
 turbulence on;
 printCoeffs on;
}
""")
    nx,ny,nz=P["cells"]
    write(case/"system"/"blockMeshDict",foam_header("dictionary","blockMeshDict")+f"""
convertToMeters 1;
vertices
(
 (-18 -18 -12) (32 -18 -12) (32 18 -12) (-18 18 -12)
 (-18 -18 12)  (32 -18 12)  (32 18 12)  (-18 18 12)
);
blocks ( hex (0 1 2 3 4 5 6 7) ({nx} {ny} {nz}) simpleGrading (1 1 1) );
edges ();
boundary
(
 inlet {{ type patch; faces ((0 4 7 3)); }}
 outlet {{ type patch; faces ((1 2 6 5)); }}
 farfield {{ type patch; faces ((0 1 5 4)(3 7 6 2)(0 3 2 1)(4 5 6 7)); }}
);
mergePatchPairs ();
""")
    write(case/"system"/"surfaceFeaturesDict",foam_header("dictionary","surfaceFeaturesDict")+"""
surfaces ("aircraft.stl");
includedAngle 150;
subsetFeatures { nonManifoldEdges no; openEdges yes; }
""")
    smin,smax=P["surf"]
    write(case/"system"/"snappyHexMeshDict",foam_header("dictionary","snappyHexMeshDict")+f"""
castellatedMesh true;
snap true;
addLayers true;
geometry
{{
 aircraft {{ type triSurfaceMesh; file "aircraft.stl"; }}
 nearBody {{ type searchableBox; min (-7 -8 -4); max (8 8 4); }}
 wakeBox {{ type searchableBox; min (-2 -9 -5); max (26 9 5); }}
}}
castellatedMeshControls
{{
 maxLocalCells 900000; maxGlobalCells {P['maxcells']}; minRefinementCells 0; maxLoadUnbalance 0.10; nCellsBetweenLevels 3;
 features ({{ file "aircraft.eMesh"; level {smax}; }});
 refinementSurfaces {{ aircraft {{ level ({smin} {smax}); patchInfo {{ type wall; }} }} }}
 resolveFeatureAngle 30;
 refinementRegions
 {{
  nearBody {{ mode inside; levels ((1E15 {P['near']})); }}
  wakeBox {{ mode inside; levels ((1E15 {P['wake']})); }}
 }}
 locationInMesh (20 0 8);
 allowFreeStandingZoneFaces true;
}}
snapControls
{{ nSmoothPatch 3; tolerance 2.0; nSolveIter 40; nRelaxIter 5; nFeatureSnapIter 10; implicitFeatureSnap false; explicitFeatureSnap true; multiRegionFeatureSnap false; }}
addLayersControls
{{
 relativeSizes true;
 layers {{ aircraft {{ nSurfaceLayers {P['layers']}; }} }}
 expansionRatio 1.2; finalLayerThickness 0.35; minThickness 0.08; nGrow 0; featureAngle 60; slipFeatureAngle 30;
 nRelaxIter 5; nSmoothSurfaceNormals 3; nSmoothNormals 5; nSmoothThickness 10; maxFaceThicknessRatio 0.5; maxThicknessToMedialRatio 0.3;
 minMedianAxisAngle 90; nBufferCellsNoExtrude 0; nLayerIter 50;
}}
meshQualityControls
{{ maxNonOrtho 70; maxBoundarySkewness 20; maxInternalSkewness 4; maxConcave 80; minVol 1e-13; minTetQuality 1e-15; minArea -1; minTwist 0.02; minDeterminant 0.001; minFaceWeight 0.02; minVolRatio 0.01; minTriangleTwist -1; nSmoothScale 4; errorReduction 0.75; }}
mergeTolerance 1e-6;
""")
    write(case/"system"/"fvSchemes",foam_header("dictionary","fvSchemes")+"""
ddtSchemes { default steadyState; }
gradSchemes { default cellLimited Gauss linear 1; grad(U) cellLimited Gauss linear 1; }
divSchemes
{
 default none;
 div(phi,U) bounded Gauss linearUpwind grad(U);
 div(phi,k) bounded Gauss upwind;
 div(phi,omega) bounded Gauss upwind;
 div((nuEff*dev2(T(grad(U))))) Gauss linear;
}
laplacianSchemes { default Gauss linear limited 0.333; }
interpolationSchemes { default linear; }
snGradSchemes { default limited 0.333; }
wallDist { method meshWave; }
""")
    write(case/"system"/"fvSolution",foam_header("dictionary","fvSolution")+"""
solvers
{
 p { solver GAMG; tolerance 1e-7; relTol 0.05; smoother GaussSeidel; }
 "(U|k|omega)" { solver smoothSolver; smoother symGaussSeidel; tolerance 1e-7; relTol 0.05; }
}
SIMPLE
{
 nNonOrthogonalCorrectors 1;
 residualControl { p 1e-4; U 1e-5; k 1e-5; omega 1e-5; }
}
potentialFlow { nNonOrthogonalCorrectors 10; }
relaxationFactors { fields { p 0.3; } equations { U 0.7; k 0.7; omega 0.7; } }
""")
    write(case/"system"/"controlDict",foam_header("dictionary","controlDict")+f"""
application simpleFoam;
startFrom startTime; startTime 0; stopAt endTime; endTime {int(cfg['iterations'])}; deltaT 1;
writeControl timeStep; writeInterval {int(cfg['write_interval'])}; purgeWrite 2; writeFormat ascii; writePrecision 8; writeCompression off; timeFormat general; timePrecision 6; runTimeModifiable true;
functions
{{
 forceCoeffs
 {{
  type forceCoeffs; libs ("libforces.so"); writeControl timeStep; writeInterval 1; log yes; patches (aircraft);
  rho rhoInf; rhoInf {rho:.9g}; liftDir (0 0 1); dragDir (1 0 0);
  CofR ({cg_global[0]:.9g} {cg_global[1]:.9g} {cg_global[2]:.9g});
  pitchAxis ({pitch_axis[0]:.9g} {pitch_axis[1]:.9g} {pitch_axis[2]:.9g});
  magUInf {V:.9g}; lRef {cbar:.9g}; Aref {cfg['wing_area_m2']:.9g};
 }}
}}
""")
    allrun='''#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")"
surfaceFeatures > log.surfaceFeatures 2>&1
blockMesh > log.blockMesh 2>&1
snappyHexMesh -overwrite > log.snappyHexMesh 2>&1
checkMesh > log.checkMesh 2>&1
potentialFoam -writePhi > log.potentialFoam 2>&1
simpleFoam > log.simpleFoam 2>&1
postProcess -func wallShearStress -latestTime > log.wallShearStress 2>&1 || true
postProcess -func yPlus -latestTime > log.yPlus 2>&1 || true
foamToVTK -latestTime > log.foamToVTK 2>&1
echo "=== Solve complete ==="
'''
    write(case/"Allrun",allrun); (case/"Allrun").chmod(0o755)
    meta=dict(cfg); meta.update({"tas_ms":V,"dynamic_viscosity_pa_s":mu,"kinematic_viscosity_m2_s":nu,"reynolds_mac":rho*V*cbar/mu,"load_factor":nload,"required_cl_for_level_flight":required_cl,"cg_global_m":cg_global,"solver":"OpenFOAM 6 simpleFoam","turbulence_model":"kOmegaSST RANS"})
    write(case/"pilotdesk-case.json",json.dumps(meta,indent=2)); return meta

def main():
    ap=argparse.ArgumentParser(); ap.add_argument("--config",default="config.json"); ap.add_argument("--case",default="case"); ap.add_argument("--aoa",type=float); ap.add_argument("--quality",choices=["preview","standard","high"])
    args=ap.parse_args(); root=Path(__file__).resolve().parents[1]; cfg=json.loads((root/args.config).read_text())
    if args.aoa is not None: cfg["aoa_deg"]=args.aoa
    if args.quality is not None: cfg["quality"]=args.quality
    print(json.dumps(make_case(cfg,root,root/args.case),indent=2))
if __name__=="__main__": main()
