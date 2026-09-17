import assert from 'node:assert/strict';
import fs from 'node:fs';
import { auditMesh, readMesh } from '../scripts/openfoam/mesh-audit.mjs';
import { prepareCase } from '../scripts/openfoam/prepare-case.mjs';
import { validateDataset } from '../assets/flight-lab-data.mjs';
import { fixture } from './flight-lab-fixture.mjs';

const tetra=[0,0,0,0,1,0,1,0,0, 0,0,0,1,0,0,0,0,1, 0,0,0,0,0,1,0,1,0, 1,0,0,0,1,0,0,0,1];
const report=auditMesh(tetra);assert.equal(report.passesTopologyScreen,true);assert.equal(report.connectedShells,1);assert(Math.abs(report.signedVolume-1/6)<1e-10);
assert.equal(auditMesh(tetra.slice(9)).boundaryEdges,3);assert.equal(auditMesh([...tetra,...tetra.slice(0,9)]).duplicateFaces,1);
assert.throws(()=>auditMesh([NaN,0,0,0,0,0,0,0,0]));assert.throws(()=>readMesh(Buffer.alloc(10)));
const bytes=Buffer.alloc(84+4*50);bytes.writeUInt32LE(4,80);tetra.forEach((v,i)=>bytes.writeFloatLE(v,84+Math.floor(i/9)*50+12+i%9*4));
assert.deepEqual(readMesh(bytes),tetra);
const settings={metersPerUnit:2,downstreamSpanUpAxes:[1,2,3],geometryReviewed:true,speedMs:50,densityKgM3:1.225,kinematicViscosityM2s:.0000146,aoaDeg:0,sideslipDeg:0,iterations:1000,surfaceRefinement:4};
const prepared=prepareCase(settings,bytes);assert.deepEqual(prepared.manifest.meshAudit.bounds.extent,[2,2,2]);
assert.match(prepared.files['0/p'],/dimensions \[0 2 -2/);assert.match(prepared.files['system/controlDict'],/rhoInf 1.225/);
assert(!prepared.files['system/blockMeshDict'].includes('lowerWall'));assert(prepared.files['system/blockMeshDict'].includes('farfield'));
assert.equal(prepared.manifest.caseSha256,prepareCase(settings,bytes).manifest.caseSha256);
assert.notEqual(prepared.manifest.caseSha256,prepareCase({...settings,speedMs:55},bytes).manifest.caseSha256);
for(const patch of [{metersPerUnit:null},{downstreamSpanUpAxes:[1,1,3]},{downstreamSpanUpAxes:[-1,2,3]},{geometryReviewed:false},{speedMs:101},{surfaceRefinement:4.5}])assert.throws(()=>prepareCase({...settings,...patch},bytes));
const trainer=fs.readFileSync(new URL('../assets/flight-lab/trainer.pdm',import.meta.url));assert.equal(auditMesh(readMesh(trainer)).passesTopologyScreen,false);assert.throws(()=>prepareCase(settings,trainer),/CFD surface rejected/);
validateDataset(fixture());
for(const change of [d=>d.units='imperial',d=>d.provenance.reviewStatus='pending',d=>d.provenance.geometrySha256='bad',d=>d.conditions.speedMs=NaN,d=>d.surface.pressurePa.pop(),d=>d.surface.positions.fill(0),d=>d.surface.normals.fill(0),d=>d.streamlines[0].speedMs=[50]]){const data=fixture();change(data);assert.throws(()=>validateDataset(data))}
console.log('OpenFOAM foundation: topology, units, handedness, deterministic cases, rejection gates and field contract passed. No CFD solve is implied by these tests.');
