"""Export actual OpenFOAM U/p fields, never an analytic substitute.

Requires PyVista 0.46.3 in a separate Python environment; not a web dependency.
This adapter remains integration-unverified until a real case is available.
"""
import argparse
import datetime
import hashlib
import json
from pathlib import Path
import subprocess


def export(case, review_file, destination):
    import numpy as np
    import pyvista as pv

    manifest = json.loads((case / "pilotdesk-case.json").read_text())
    receipt = json.loads((case / "pilotdesk-run.json").read_text())
    review = json.loads(review_file.read_text())
    if receipt.get("status") != "solved-awaiting-review" or receipt.get("caseSha256") != manifest.get("caseSha256"):
        raise ValueError("A successful run receipt for this exact case is required")
    required = ("geometry", "meshQuality", "layerCoverage", "yPlus", "residuals", "forceStability", "meshIndependence", "domainIndependence")
    if review.get("caseSha256") != manifest["caseSha256"] or not all(review.get(key) is True for key in required):
        raise ValueError("The exact case needs an explicit aerodynamic review of every required check")
    if not isinstance(review.get("reviewedBy"), str) or not review["reviewedBy"].strip():
        raise ValueError("Identify the reviewer")
    if not isinstance(review.get("evidence"), str) or len(review["evidence"].strip()) < 30:
        raise ValueError("Record the evidence behind the review")
    if destination.exists():
        raise ValueError("Refusing to overwrite an existing export")
    geometry = case / "constant/triSurface/aircraft.stl"
    if hashlib.sha256(geometry.read_bytes()).hexdigest() != manifest["geometrySha256"]:
        raise ValueError("Geometry changed after case preparation")
    marker = case / "pilotdesk.foam"
    marker.touch(exist_ok=True)
    reader = pv.OpenFOAMReader(str(marker))
    reader.cell_to_point_creation = True
    if not reader.time_values or max(reader.time_values) <= 0:
        raise ValueError("No solved time is available; initial conditions must never be exported as CFD")
    reader.set_active_time_value(max(reader.time_values))
    blocks = reader.read()
    internal = blocks["internalMesh"].cell_data_to_point_data()
    boundaries = blocks["boundary"]
    surfaces = [boundaries[name] for name in boundaries.keys() if name.startswith("aircraft")]
    if not surfaces:
        raise ValueError("No aircraft boundary in solver output")
    surface = pv.MultiBlock(surfaces).combine().extract_surface().triangulate().cell_data_to_point_data()
    surface = surface.compute_normals(point_normals=True, cell_normals=False, split_vertices=False)
    triangles = surface.faces.reshape(-1, 4)[:, 1:].reshape(-1)
    if len(triangles) > 600000:
        raise ValueError("Surface exceeds viewer budget; prepare a reviewed visualization mesh, not an automatic pressure-blind decimation")
    bounds = manifest["meshAudit"]["bounds"]
    low, high = np.array(bounds["min"]), np.array(bounds["max"])
    span = max(high-low)
    seeds = pv.PolyData(np.array([[low[0] - span*.3, y, z]
                                 for y in np.linspace(low[1] - span*.15, high[1] + span*.15, 19)
                                 for z in np.linspace(low[2] - span*.15, high[2] + span*.15, 9)]))
    traces = internal.streamlines_from_source(seeds, vectors="U", integration_direction="forward", max_steps=500, initial_step_length=.05, max_length=span*4)
    lines, cursor, total = [], 0, 0
    while cursor < len(traces.lines):
        count = int(traces.lines[cursor])
        indices = traces.lines[cursor+1:cursor+1+count]
        cursor += count+1
        if count < 2:
            continue
        total += count
        if total > 100000:
            raise ValueError("Streamline export exceeds point budget; reduce seeds or integration steps")
        lines.append({"points": traces.points[indices].reshape(-1).tolist(), "speedMs": np.linalg.norm(traces["U"][indices], axis=1).tolist()})
    # simpleFoam p is kinematic pressure (m²/s²). Multiply by case density for Pa.
    data = {"schema": "pilotdesk.openfoam.v1", "units": "SI", "frame": "x-downstream,y-span,z-up",
            "provenance": {"solver": "simpleFoam", "version": "v2312", "reviewStatus": "reviewed",
                           "geometrySha256": manifest["geometrySha256"], "caseSha256": manifest["caseSha256"],
                           "solvedAt": receipt["solvedAt"], "reviewedAt": datetime.datetime.now(datetime.timezone.utc).isoformat(), "reviewedBy": review["reviewedBy"], "reviewEvidence": review["evidence"]},
            "conditions": manifest["conditions"],
            "surface": {"positions": surface.points[triangles].reshape(-1).tolist(), "normals": surface.point_data["Normals"][triangles].reshape(-1).tolist(),
                        "pressurePa": (surface.point_data["p"][triangles] * manifest["conditions"]["densityKgM3"]).tolist()},
            "streamlines": lines}
    serialized = json.dumps(data, separators=(",", ":"), allow_nan=False)
    if len(serialized.encode()) > 20*1024*1024:
        raise ValueError("Export exceeds 20 MB browser budget")
    # Validate against the same contract as the browser before writing an artifact.
    validator = Path(__file__).with_name("validate-export.mjs")
    subprocess.run(["node", str(validator)], input=serialized, text=True, check=True)
    with destination.open("x") as output:
        output.write(serialized)
    print("Exported reviewed solver fields:", destination)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("case", type=Path)
    parser.add_argument("review", type=Path)
    parser.add_argument("destination", type=Path)
    args = parser.parse_args()
    export(args.case.resolve(), args.review.resolve(), args.destination.resolve())
