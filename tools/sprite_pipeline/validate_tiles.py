"""Checks the authored variants, reproducibility, and all possible boundary pairs."""
import hashlib,json,sys
from pathlib import Path
from PIL import Image
sys.path.insert(0,str(Path(__file__).resolve().parent))
from build_tiles import build
ROOT=Path(__file__).resolve().parents[2];FINAL=ROOT/'assets/sprites/world'
m=json.loads((FINAL/'manifest.json').read_text())
paths=[FINAL/m['assets']['stone-'+k]['file'] for k in 'abc']
hashes=[hashlib.sha256(p.read_bytes()).hexdigest() for p in paths]
build()
assert hashes==[hashlib.sha256(p.read_bytes()).hexdigest() for p in paths]
assert len(set(hashes))==3
images=[Image.open(p).crop((192,112,320,240)) for p in paths]
for a in images:
 for b in images:
  for y in range(128):assert a.getpixel((0,y))==b.getpixel((127,y))
  for x in range(128):assert a.getpixel((x,0))==b.getpixel((x,127))
print('Tiles: reproducible PNG hashes and compatible borders in all nine combinations.')
