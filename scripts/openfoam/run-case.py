"""Run a prepared case in an already-configured OpenCFD v2312 environment.

No cloud resources, system installs, shell interpolation or browser submission.
"""
import argparse
import datetime
import hashlib
import json
import os
from pathlib import Path
import subprocess


def verify_case(case):
    manifest = json.loads((case / "pilotdesk-case.json").read_text())
    if manifest.get("schema") != "pilotdesk.case.v1" or manifest.get("version") != "v2312":
        raise ValueError("A prepared PilotDesk v2312 case is required")
    hashes = manifest["files"]
    if hashlib.sha256(json.dumps(hashes, separators=(",", ":")).encode()).hexdigest() != manifest["caseSha256"]:
        raise ValueError("Case manifest hash mismatch")
    for name, expected in hashes:
        target = (case / name).resolve()
        if not target.is_relative_to(case) or target.is_symlink():
            raise ValueError("Case inputs must remain inside the case directory")
        if hashlib.sha256(target.read_bytes()).hexdigest() != expected:
            raise ValueError(f"Case input changed: {name}. Prepare a new case for provenance.")
    return manifest


def run(case):
    manifest = verify_case(case)
    if os.environ.get("WM_PROJECT_VERSION", "").lstrip("v") != "2312":
        raise RuntimeError("Activate OpenCFD OpenFOAM v2312 first. This runner does not install a solver.")
    receipt = case / "pilotdesk-run.json"
    if receipt.exists():
        raise RuntimeError("Run already exists. Prepare a fresh directory rather than overwriting it.")
    state = {"status": "running", "caseSha256": manifest["caseSha256"], "startedAt": datetime.datetime.now(datetime.timezone.utc).isoformat()}
    receipt.write_text(json.dumps(state, indent=2))
    commands = [
        ["surfaceCheck", "-checkSelfIntersection", "constant/triSurface/aircraft.stl"],
        ["surfaceFeatureExtract"], ["blockMesh"], ["snappyHexMesh", "-overwrite"],
        ["checkMesh", "-allTopology", "-allGeometry"], ["potentialFoam", "-writePhi"], ["simpleFoam"],
    ]
    try:
        for command in commands:
            log = case / ("log." + command[0])
            print("Running", command[0], flush=True)
            with log.open("w") as stream:
                subprocess.run(command, cwd=case, stdout=stream, stderr=subprocess.STDOUT, check=True, timeout=21600)
            output = log.read_text(errors="replace")
            if command[0] == "surfaceCheck":
                if "Surface is closed" not in output or "Number of intersecting faces : 0" not in output:
                    raise RuntimeError("surfaceCheck did not explicitly confirm a closed, intersection-free surface. Review its log.")
            if command[0] == "checkMesh" and "Mesh OK." not in output:
                raise RuntimeError("Mesh quality check did not pass")
            if command[0] == "simpleFoam" and "solution converged" not in output.lower():
                raise RuntimeError("Solver did not meet configured residual convergence. Do not publish this field.")
        state.update(status="solved-awaiting-review", solvedAt=datetime.datetime.now(datetime.timezone.utc).isoformat())
    except Exception as error:
        state.update(status="failed", error=str(error))
        raise
    finally:
        receipt.write_text(json.dumps(state, indent=2))
    print("Solve finished. Force stability, mesh independence, y+ and surface review are still required.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("case", type=Path)
    run(parser.parse_args().case.resolve())
