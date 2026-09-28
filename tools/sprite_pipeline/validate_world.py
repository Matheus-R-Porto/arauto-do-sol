from pathlib import Path
import json,hashlib
from PIL import Image,ImageChops
from build_world import ROOT,FINAL,WORK,HERE,make_profile
from pipeline import validate_final,profile_from_file
recipe=json.loads((HERE/'world-build.json').read_text());m=json.loads((FINAL/'manifest.json').read_text())
assert m['status']=='animation-expansion-v2'
profiles={k:make_profile(recipe,k) for k in recipe['profiles']}
names={f['name']:g['profile'] for g in recipe['sets'] for f in g['frames']}
assert set(names)<=set(m['assets'])
for actor,animations in m['animations'].items():
 for animation in animations.values():
  for frame in animation['frames']:names[frame['asset']]='effects' if actor=='vfx' else actor+'-animation'
for actor in ['boss','walker','ranged','lunger']:profiles[actor+'-animation']=profile_from_file(HERE/f'profiles/{actor}-animation.json')
for name,a in m['assets'].items():
 if a['file'].startswith(('level/','polish/','tiles/')):names[name]='level'
assert set(names)==set(m['assets'])
for name,a in m['assets'].items():
 im=Image.open(FINAL/a['file']);validate_final(im,profile_from_file(HERE/a['profile']) if a.get('profile') else profiles[names[name]])
 assert list(im.getbbox())==a['bounds']
 assert hashlib.sha256((FINAL/a['file']).read_bytes()).hexdigest()==a['sha256']
for name,b in m['backgrounds'].items():
 restored=Image.new('RGBA',tuple(b['size']))
 for a in b['panels']:
  im=Image.open(FINAL/a['file']);validate_final(im,profile_from_file(HERE/a['profile']) if a.get('profile') else profiles['background'])
  x,y,w,h=a['source'];restored.paste(im.crop((x,y,x+w,y+h)),(a['x'],a['y']))
 expected=Image.open((WORK/'scenery' if b.get('worldSize') else WORK)/(name+'-base.png'))
 assert not ImageChops.difference(restored,expected).convert('RGB').getbbox(),name
for name,sha in m['rawHashes'].items():assert hashlib.sha256((ROOT/'assets/raw/world'/f'{name}.png').read_bytes()).hexdigest()==sha
print(f"OK: {len(m['assets'])} sprites, 48 painéis sem emendas, paletas/alpha/margens/hashes válidos; RAW preservados.")
