#!/usr/bin/env python3
from pathlib import Path
import json, sys

def find_force_file(case: Path):
    candidates=list(case.glob('postProcessing/forceCoeffs/**/forceCoeffs.dat'))
    if not candidates:
        candidates=list(case.glob('postProcessing/forceCoeffs/**/coefficient.dat'))
    if not candidates: raise FileNotFoundError('No force coefficient file found')
    return sorted(candidates,key=lambda p:p.stat().st_mtime)[-1]

def parse(path: Path):
    rows=[]
    for line in path.read_text(errors='ignore').splitlines():
        s=line.strip()
        if not s or s.startswith('#'): continue
        parts=s.replace('(',' ').replace(')',' ').split()
        try: vals=[float(x) for x in parts]
        except: continue
        if len(vals)>=4: rows.append(vals)
    if not rows: raise ValueError('No numeric rows in force coefficient file')
    v=rows[-1]
    out={'time':v[0],'Cm':v[1],'Cd':v[2],'Cl':v[3]}
    if len(v)>4: out['Cl_front']=v[4]
    if len(v)>5: out['Cl_rear']=v[5]
    return out

def main():
    case=Path(sys.argv[1] if len(sys.argv)>1 else 'case')
    ff=find_force_file(case)
    result=parse(ff)
    result['source']='OpenFOAM simpleFoam'
    result['force_file']=str(ff)
    result['case']=json.loads((case/'pilotdesk-case.json').read_text())
    (case/'openfoam-result.json').write_text(json.dumps(result,indent=2))
    print(json.dumps(result,indent=2))
if __name__=='__main__': main()
