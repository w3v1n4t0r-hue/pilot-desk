"""Optional off-browser CFD runner. Requires a separately installed upstream
https://github.com/inductiva/wind-tunnel package and configured Inductiva credentials.
This script submits cloud compute only with --submit. Outputs are unvalidated.
"""
import argparse
import json
from pathlib import Path


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--geometry', type=Path, required=True)
    parser.add_argument('--speed', type=float, required=True, help='m/s')
    parser.add_argument('--iterations', type=int, default=2000)
    parser.add_argument('--resolution', type=int, choices=range(1, 6), default=4)
    parser.add_argument('--submit', action='store_true', help='Submit paid Inductiva compute')
    args = parser.parse_args()
    if not args.geometry.is_file() or args.geometry.suffix.lower() != '.obj':
        parser.error('Supply an existing OBJ geometry in metres.')
    if not 0 < args.speed < 100 or args.iterations < 100:
        parser.error('Use a low-speed case above 0 and below 100 m/s and at least 100 iterations.')
    manifest = dict(geometry=str(args.geometry.resolve()), speed_ms=args.speed,
                    iterations=args.iterations, resolution=args.resolution,
                    validation='not validated', source='inductiva/wind-tunnel')
    print(json.dumps(manifest, indent=2))
    if not args.submit:
        print('Preparation only. Add --submit to request cloud compute.')
        return
    import windtunnel
    tunnel = windtunnel.WindTunnel(dimensions=(30, 20, 15))
    tunnel.set_object(object_path=str(args.geometry.resolve()), rotate_z_degrees=0,
                      normalize=False, center=True)
    task = tunnel.simulate(wind_speed_ms=args.speed,
                           num_iterations=args.iterations, resolution=args.resolution)
    task.wait()
    print(task.download_outputs())


if __name__ == '__main__':
    main()
