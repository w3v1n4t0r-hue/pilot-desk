from pathlib import Path
import json
import re
import shutil

from jinja2 import Environment, FileSystemLoader, StrictUndefined

CASE = Path('cfd_case')
TEMPLATES = Path('/tmp/inductiva-wind-tunnel/windtunnel/templates')
if CASE.exists():
    shutil.rmtree(CASE)
CASE.mkdir(parents=True)

# Baseline PilotDesk aircraft case. The OBJ is a closed coarse CFD proxy in
# metres and has already been rotated to +4 degrees AoA.
walls = {
    'x_min': -10.0,
    'x_max': 24.0,
    'y_min': -12.0,
    'y_max': 12.0,
    'z_min': -8.0,
    'z_max': 8.0,
}
wind_speed = 90.0 * 0.514444
rho = 1.225
nu = 1.4607e-5
wing_area = 16.2
mac = 1.47
cg_x = -2.25 + 0.28 * mac
iterations = 220
resolution = 3

context = dict(
    wind_speed=wind_speed,
    num_iterations=iterations,
    resolution=resolution,
    num_subdomains=1,
    area=wing_area,
    length=mac,
    **walls,
)

# Render the upstream inductiva/wind-tunnel templates without importing the
# Inductiva API client. Importing that client performs a backend version check,
# which is unnecessary when we run OpenFOAM directly on the Actions runner.
env = Environment(
    loader=FileSystemLoader(str(TEMPLATES)),
    undefined=StrictUndefined,
    keep_trailing_newline=True,
)
for src in TEMPLATES.rglob('*'):
    if not src.is_file():
        continue
    rel = src.relative_to(TEMPLATES)
    if src.name.endswith('.jinja'):
        dst_rel = Path(str(rel)[:-6])
        rendered = env.get_template(rel.as_posix()).render(**context)
        dst = CASE / dst_rel
        dst.parent.mkdir(parents=True, exist_ok=True)
        dst.write_text(rendered)
    else:
        dst = CASE / rel
        dst.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(src, dst)

tri_dir = CASE / 'constant' / 'triSurface'
tri_dir.mkdir(parents=True, exist_ok=True)
shutil.copy2('cfd/aircraft.obj', tri_dir / 'object.obj')

# The upstream template names the velocity field U.orig; materialize U so the
# standard OpenFOAM commands can start directly.
u_orig = CASE / '0' / 'U.orig'
u_file = CASE / '0' / 'U'
if not u_file.exists() and u_orig.exists():
    shutil.copy2(u_orig, u_file)

# Aircraft-specific fluid and force references.
transport = CASE / 'constant' / 'transportProperties'
txt = transport.read_text()
txt = re.sub(r'nu\s+\[0 2 -1 0 0 0 0\]\s+[^;]+;',
             f'nu              [0 2 -1 0 0 0 0] {nu:.10g};', txt)
transport.write_text(txt)

force = CASE / 'system' / 'forceCoeffs'
ftxt = force.read_text()
ftxt = re.sub(r'rhoInf\s+[^;]+;', f'rhoInf          {rho};', ftxt)
ftxt = re.sub(r'CofR\s+\([^\)]*\);[^\n]*', f'CofR            ({cg_x:.6f} 0 0);', ftxt)
ftxt = re.sub(r'lRef\s+[^;]+;', f'lRef            {mac};', ftxt)
ftxt = re.sub(r'Aref\s+[^;]+;', f'Aref            {wing_area};', ftxt)
force.write_text(ftxt)

# Keep point must be in fluid, never at a block corner. Also keep boundary
# layer cells on the aircraft only rather than the car-oriented ground wall.
snappy = CASE / 'system' / 'snappyHexMeshDict'
stxt = snappy.read_text()
stxt = re.sub(r'locationInMesh\s+\([^\)]*\);', 'locationInMesh (-8 0 6);', stxt)
stxt = stxt.replace('"(lowerWall|object).*"', '"object.*"')
stxt = stxt.replace('nSurfaceLayers 1;', 'nSurfaceLayers 2;')
snappy.write_text(stxt)

manifest = {
    'solver': 'OpenFOAM 6 simpleFoam',
    'template_source': 'inductiva/wind-tunnel',
    'tas_kt': 90.0,
    'freestream_m_s': wind_speed,
    'aoa_deg': 4.0,
    'density_kg_m3': rho,
    'nu_m2_s': nu,
    'wing_area_m2': wing_area,
    'mean_aerodynamic_chord_m': mac,
    'cg_percent_mac': 28.0,
    'cg_x_m': cg_x,
    'iterations': iterations,
    'snappy_resolution': resolution,
}
(CASE / 'pilotdesk_case.json').write_text(json.dumps(manifest, indent=2) + '\n')
print('Generated', CASE.resolve())
print(json.dumps(manifest, indent=2))
