// Synthetic contract fixture for automated tests ONLY. Never deployed or offered as CFD.
export const fixture = () => ({
  schema:'pilotdesk.openfoam.v1',units:'SI',frame:'x-downstream,y-span,z-up',
  provenance:{solver:'simpleFoam',version:'v2312',reviewStatus:'reviewed',geometrySha256:'a'.repeat(64),caseSha256:'b'.repeat(64),solvedAt:'2026-09-16T00:00:00Z',reviewedAt:'2026-09-16T01:00:00Z',reviewedBy:'AUTOMATED TEST — NOT A SOLVER RUN'},
  conditions:{speedMs:50,densityKgM3:1.225,aoaDeg:0,sideslipDeg:0},
  surface:{positions:[-1,0,0,1,0,0,0,1,0],normals:[0,0,1,0,0,1,0,0,1],pressurePa:[-10,0,10]},
  streamlines:[{points:[-2,0,1,0,0,1,2,0,1],speedMs:[50,50,50]}]
});
