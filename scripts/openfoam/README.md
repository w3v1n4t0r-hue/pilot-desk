# PilotDesk OpenFOAM pipeline — integration pending

This replaces the decorative Flight Lab direction with user-supplied 3D geometry and a real solver-field contract. It is **not yet a validated CFD simulation**. No cloud job has been submitted and no production airflow dataset exists.

## What is working

- The optional 3D lab on Crosswind, Wind Triangle and Density Altitude loads the supplied trainer only after the visitor opens it. Calculator outputs and validation remain authoritative and independent.
- WebGL 2 renders actual triangles, supports orbit/top/side, keyboard rotation and zoom, and does not continuously animate the unsolved aircraft. Unsupported graphics do not break the calculator.
- Reviewed solver exports can supply their own solved boundary geometry, pressure and velocity streamlines. The CFD coordinate frame is transformed into the viewer frame consistently. No synthetic airflow fallback exists.
- Mesh inspection, input rejection, deterministic case preparation, SI units, right-handed transforms, field validation, browser imports, reduced motion and mobile layouts have automated coverage.

## Why not drop in the linked package unchanged?

Reference: https://github.com/inductiva/wind-tunnel at `58d72b19929306087240458a6f8b6a09a0290ac4`.

The package is a Python pre-processing / OpenFOAM / post-processing workflow using Inductiva cloud compute. It is not a browser solver. Its defaults place the object on a lower wall, normalize its dimensions and use frontal projected area. Its sample mesh keep-point is on the domain corner. Those defaults must not become a free-flight aircraft case unchanged.

Our independently authored case generator targets **OpenCFD OpenFOAM v2312**, uses a centred aircraft with farfield boundaries (no road/floor), requires explicit physical scale and axes, and puts the retained-fluid point inside the domain. We have not vendored upstream implementation code; no license was found in the inspected upstream tree. The architecture follows the same prepare → mesh → solve → review → export separation. Inductiva dispatch is deliberately not implemented until an account, budget and supported runtime are selected. The local runner never installs software or creates cloud resources.

## Supplied assets

The supplied v11 prototype contains a 28,736-triangle trainer and a 60,634-triangle jet. The latter corresponds by triangle count to `plane.stl`; the former to the zipped `3d-model.stl`. File hashes and mesh screens are preserved next to the imported display assets. Aircraft identity and physical dimensions are not manufacturer-verified.

The trainer display mesh has 1,014 boundary edges, 1,636 non-manifold edges, 3,452 winding conflicts, 170 degenerate faces and 231 duplicates under a relative 1e-7 welding screen. The original zipped STL also fails, with 1,087 boundary edges and 1,608 non-manifold edges. Slight differences reflect export coordinates and quantization. These are screening counts, not an exact repair specification. The jet is also open. Neither original file was modified.

The prototype's analytical flow, empirical stall/trim and generic performance formulas are **not** transplanted into the calculators or labelled OpenFOAM. The browser uses its real trainer geometry and the same underlying 3D interaction approach, without the multi-megabyte inline HTML, SDF, analytic tracers or unrelated simulation formulas.

## Local/self-hosted workflow

1. Repair a separate simulation surface. Review intersections, surface closure, outward winding, component unions, trailing edges and fixed-propeller simplification. Do not blindly fill holes or scale to a guessed Cessna span. Confirm source units and nose/up axes.
2. Install/activate OpenCFD v2312 in an approved Linux/WSL/container environment. This machine currently has neither WSL, Docker nor OpenFOAM configured. That system setup is not performed by these scripts.
3. Copy `settings.example.json` outside public assets. Fill in physical scale and axis mapping, select the case conditions and explicitly mark the geometry review. The frame is **X downstream (nose toward −X), Y span, Z up**. Positive AoA pitches the nose up; the sideslip setting rotates geometry around +Z. Angles are not calculator wind directions.
4. Prepare a new directory, preferably under the ignored/non-public `scripts/openfoam/runs/`:

   ```text
   node scripts/openfoam/prepare-case.mjs settings.json scripts/openfoam/runs/case-001
   python scripts/openfoam/run-case.py scripts/openfoam/runs/case-001
   ```

   Inspect dictionaries before running. Preparation refuses broken topology, unreviewed geometry, unknown scale, reflected coordinates and out-of-range conditions. Runs refuse an existing receipt or a mismatched runtime and stop on command, topology, mesh-quality or residual-convergence failure. A run may take hours and substantial memory; it is never launched by the browser.

5. Review mesh quality, boundary-layer coverage/y+, residual histories, force stability, mesh independence and domain independence. Record evidence in a copy of `review.example.json`, bound to the exact case hash. A successful process exit or a fixed iteration count is not validation.
6. In a separate Python environment with `pyvista==0.46.3`, export actual fields:

   ```text
   python scripts/openfoam/export-case.py scripts/openfoam/runs/case-001 review.json case-001.json
   ```

7. Open the lab and choose the exported JSON. This is a local browser file read, not a file upload or remote job submission. The viewer labels the declared solver, fixed conditions, dates, reviewer and hashes. JSON metadata is provenance supplied by the operator, not a digital signature or certification. Imports are bounded to 20 MB and checked before replacing the existing field.

## Physics and limits

The first solver target is steady, incompressible `simpleFoam` with k–omega SST. `p` is kinematic pressure; the exporter multiplies by case density to produce pressure relative to the zero-pressure outlet in Pa. Streamlines are integrated through exported U, not generated from a toy velocity model. Animated highlights use integrated travel time through a **fixed** field and are not transient CFD.

There is no propeller model, transition model, ground effect, aircraft-specific POH fit, moving control surfaces, compressible flow or verified post-stall model. Atmospheric conditions must be supplied as a self-consistent density/viscosity/speed case. The 100 m/s input ceiling is a guardrail, not a universal low-Mach guarantee. Numerical checks cannot establish aircraft aerodynamic fidelity.

RANS dictionary generation, solver execution and PyVista export remain **integration-unverified** until a real case is available. Unit tests use a tetrahedron and an explicitly synthetic field fixture under `qa/`; neither is public or an aviation result. Do not publish a solver dataset or mark this feature production-ready until the complete path is exercised.

## Future page coverage

Aerodynamics/performance pages can share reviewed case families. Wind/navigation pages need ground-referenced vectors kept distinct from relative airflow. Weight & Balance must use existing aircraft loading profiles, not generic prototype stations. Fuel, conversions and arithmetic should retain appropriate direct explanations rather than pretend to need CFD. Full sims can be added by family once the solver/data foundation is verified.

## References

- https://github.com/inductiva/wind-tunnel
- https://doc.openfoam.com/2306/tools/processing/solvers/rtm/incompressible/simpleFoam/
- https://doc.openfoam.com/2312/examples/verification-validation/turbulent/flat-plate-zpg/
- https://docs.pyvista.org/api/readers/_autosummary/pyvista.OpenFOAMReader.html
- https://docs.pyvista.org/api/core/_autosummary/pyvista.DataSetFilters.streamlines_from_source.html

## Verification

```text
node qa/openfoam-foundation.mjs
node qa/interaction-e2e.mjs
```

Solver sources, review records, run directories and Python dependencies belong under `scripts/` or outside this static repository. The Astro public-copy step excludes `scripts/` and `qa/`. Never place jobs, credentials or private solver files in an arbitrary new root folder: unexcluded folders are published by the static build.
