from pathlib import Path
import json
import numpy as np
import pyvista as pv

CASE = Path('cfd_case')
POST = Path('cfd_post')
POST.mkdir(exist_ok=True)
foam = CASE / 'foam.foam'
foam.touch()

summary = {
    'source': 'actual OpenFOAM solved field',
    'solver': 'simpleFoam',
    'condition': json.loads((CASE / 'pilotdesk_case.json').read_text()),
}

coeff_path = CASE / 'postProcessing' / 'forceCoeffs1' / '0' / 'forceCoeffs.dat'
if coeff_path.exists():
    data = np.loadtxt(coeff_path)
    row = data[-1] if data.ndim > 1 else data
    # OpenFOAM forceCoeffs file in the upstream case: time, Cm, Cd, Cl, Cl(f), Cl(r)
    summary['coefficients'] = {
        'iteration': float(row[0]),
        'Cm': float(row[1]),
        'Cd': float(row[2]),
        'Cl': float(row[3]),
        'Cl_front': float(row[4]) if len(row) > 4 else None,
        'Cl_rear': float(row[5]) if len(row) > 5 else None,
    }
else:
    summary['coefficients_error'] = 'forceCoeffs.dat not found'

try:
    reader = pv.OpenFOAMReader(str(foam))
    times = list(reader.time_values)
    summary['time_values'] = [float(x) for x in times]
    if times:
        reader.set_active_time_value(times[-1])
    full = reader.read()
    summary['top_level_blocks'] = list(full.keys())

    internal = full['internalMesh']
    summary['internal_cells'] = int(internal.n_cells)
    summary['internal_points'] = int(internal.n_points)
    summary['internal_arrays'] = list(internal.array_names)

    boundary = full['boundary']
    summary['boundary_blocks'] = list(boundary.keys())
    obj_key = next((k for k in boundary.keys() if 'object' in k.lower()), None)
    if obj_key:
        obj = boundary[obj_key]
        obj.save(POST / 'aircraft_pressure.vtp')
        summary['aircraft_boundary_key'] = obj_key
        summary['aircraft_arrays'] = list(obj.array_names)

    # Real streamlines integrated through OpenFOAM's solved U field.
    if 'U' in internal.array_names:
        source = pv.Plane(
            center=(-8.0, 0.0, 0.0),
            direction=(1.0, 0.0, 0.0),
            i_size=18.0,
            j_size=12.0,
            i_resolution=34,
            j_resolution=24,
        )
        stream = internal.streamlines_from_source(
            source,
            vectors='U',
            integration_direction='forward',
            integrator_type=45,
            initial_step_length=0.08,
            max_step_length=0.35,
            max_time=40.0,
            terminal_speed=0.05,
            compute_vorticity=True,
        )
        stream.save(POST / 'streamlines.vtp')
        summary['streamline_points'] = int(stream.n_points)
        summary['streamline_cells'] = int(stream.n_cells)
        summary['streamline_arrays'] = list(stream.array_names)
except Exception as exc:
    summary['field_postprocess_error'] = repr(exc)

(POST / 'result_summary.json').write_text(json.dumps(summary, indent=2))
print(json.dumps(summary, indent=2))
