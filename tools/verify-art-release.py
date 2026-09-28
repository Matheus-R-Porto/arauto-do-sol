"""Verify the contents of the ZIP, not merely its staging directory."""
from pathlib import Path
from zipfile import ZipFile
import json,hashlib
root=Path(__file__).resolve().parent.parent
package=root.parent/'Arauto-do-Sol-v0.6.0-Windows.zip'
prefix='Arauto do Sol - Demo v0.6.0/'
with ZipFile(package) as archive:
 files={n.replace('\\','/'):n for n in archive.namelist() if not n.endswith('/')}
 expected={prefix+'Jogar Arauto do Sol.exe',prefix+'LEIA-ME.txt',prefix+'index.html',prefix+'style.css'}
 for folder in ['src','config']:
  expected.update(prefix+p.relative_to(root).as_posix() for p in (root/folder).rglob('*') if p.is_file())
 assert prefix+'Jogar Arauto do Sol.exe' in files
 assert prefix+'LEIA-ME.txt' in files
 assert not any('/raw/' in n or '/work/' in n or '/pilot/' in n or '/tests/' in n for n in files)
 for name,entry in files.items():
  relative=name.removeprefix(prefix)
  if relative in ['Jogar Arauto do Sol.exe','LEIA-ME.txt']:continue
  assert archive.read(entry)==(root/relative).read_bytes(),relative
 for group in ['protagonist','world']:
  path=f'assets/sprites/{group}/manifest.json'
  m=json.loads(archive.read(files[prefix+path]))
  assets=([f for a in m['animations'].values() for f in a['frames']] if group=='protagonist' else list(m['assets'].values())+[a for b in m['backgrounds'].values() for a in b['panels']])
  for a in assets:assert prefix+f'assets/sprites/{group}/'+a['file'] in files
  expected.add(prefix+path)
  expected.update(prefix+f'assets/sprites/{group}/'+a['file'] for a in assets)
 assert set(files)==expected,(set(files)-expected,expected-set(files))
report={'zip':package.name,'bytes':package.stat().st_size,'sha256':hashlib.sha256(package.read_bytes()).hexdigest(),'files':len(files),'runtimeFiles':len(files)-2,'runtimePNGs':sum(n.endswith('.png') for n in files),'result':'All ZIP runtime bytes match the tested source; every manifest reference is present; no unreferenced PNGs.'}
(root/'docs/release-0.6.0-check.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print(json.dumps(report,indent=2))
