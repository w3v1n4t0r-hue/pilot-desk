from pathlib import Path
import re
import shutil

import inductiva
import pyvista as pv
import windtunnel.windtunnel as wt_module
from windtunnel import pre_processing

CASE = Path('cfd_case')
if CASE.exists():
    shutil.rmtree(CASE)
CASE.mkdir(parents=True)

# Baseline PilotDesk aircraft case.
# Aircraft OBJ is already watertight, in metres, and physically rotated to +4 deg AoA.
mesh = pv.read('cfd/aircraft.obj')

# Larger all-air external-aerodynamics domain than the car-oriented upstream default.
walls = {
    'x_min': -10.0,
    'x_max': 24.0,
    'y_min': -12.0,
    'y_max': 12.0,
    'z_min': -8.0,
    'z_max': 8.0,
}

wind_speed = 90.0 * 0.514444  # m/s
rho = 1.225
nu = 1.4607e-5               # m^2/s at ~15 C sea-level reference
wing_area = 16.2              # m^2
mac = 1.47                    # m
cg_x = -2.25 + 0.28 * mac     # 28% MAC
iterations = 220
resolution = 3

# Render the exact Inductiva wind-tunnel OpenFOAM templates locally.
inductiva.TemplateManager.render_dir(
    wt_module.TEMPLATE_DIR,
    str(CASE),
    wind_speed=wind_speed,
    num_iterations=iterations,
    resolution=resolution,
    num_subdomains=1,
    area=wing_area,
    length=mac,
    **walls,
)

tri_dir = CASE / 'constant' / 'triSurface'
tri_dir.mkdir(parents=True, exist_ok=True)
pre_processing.save_mesh_obj(mesh, tri_dir / 'object.obj')

# OpenFOAM tutorials commonly carry U.orig and restore it before a run.
# The upstream scenario does not explicitly call restore0Dir, so make U concrete.
u_orig = CASE / '0' / 'U.orig'
u_file = CASE / '0' / 'U'
if not u_file.exists() and u_orig.exists():
    shutil.copy2(u_orig, u_file)

# Aircraft-specific fluid/force references.
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

# Keep point must be in a fluid cell, not on the block boundary/corner.
snappy = CASE / 'system' / 'snappyHexMeshDict'
stxt = snappy.read_text()
stxt = re.sub(r'locationInMesh\s+\([^\)]*\);', 'locationInMesh (-8 0 6);', stxt)
# Refine/add wall layers only around the aircraft, not the far lower tunnel wall.
stxt = stxt.replace('"(lowerWall|object).*"', '"object.*"')
stxt = stxt.replace('nSurfaceLayers 1;', 'nSurfaceLayers 2;')
snappy.write_text(stxt)

# Keep a machine-readable manifest with the exact solved condition.
(CASE / 'pilotdesk_case.json').write_text('''{
  "solver": "OpenFOAM 6 simpleFoam",
  "template_source": "inductiva/wind-tunnel",
  "tas_kt": 90.0,
  "freestream_m_s": %.6f,
  "aoa_deg": 4.0,
  "density_kg_m3": %.6f,
  "nu_m2_s": %.10g,
  "wing_area_m2": %.6f,
  "mean_aerodynamic_chord_m": %.6f,
  "cg_percent_mac": 28.0,
  "cg_x_m": %.6f,
  "iterations": %d,
  "snappy_resolution": %d
}\n''' % (wind_speed, rho, nu, wing_area, mac, cg_x, iterations, resolution))

print('Generated', CASE.resolve())
print((CASE / 'pilotdesk_case.json').read_text())
