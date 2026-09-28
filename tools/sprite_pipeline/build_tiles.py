"""Reproducible masonry export. RAWs are read-only; shared periodic borders precede quantization."""
from pathlib import Path
from copy import deepcopy
import json, hashlib
from PIL import Image, ImageDraw
from pipeline import profile_from_file, quantize, png_bytes, atomic_write
from build_world import export_frame, write_json, HERE, ROOT, RAW, WORK, FINAL

def build():
 path=HERE/'profiles/aged-masonry.json'; spec=json.loads(path.read_text()); cfg=spec['texture']; size=tuple(cfg['size']); band=cfg['edge_band']
 images={k:Image.open(RAW/f'tiles/{k}.png').convert('RGB').crop(box).resize(size,Image.Resampling.LANCZOS) for k,box in cfg['crops'].items()}
 common=images['a'].copy(); px=common.load(); w,h=size
 # Opposite boundary samples agree exactly, including corners.
 for y in range(h):
  avg=tuple((px[0,y][c]+px[w-1,y][c])//2 for c in range(3));px[0,y]=px[w-1,y]=avg
 for x in range(w):
  avg=tuple((px[x,0][c]+px[x,h-1][c])//2 for c in range(3));px[x,0]=px[x,h-1]=avg
 for im in images.values():
  p=im.load()
  for y in range(h):
   for x in range(w):
    d=min(x,y,w-1-x,h-1-y); weight=max(0,1-d/band)
    if weight:p[x,y]=tuple(round(p[x,y][c]*(1-weight)+px[x,y][c]*weight) for c in range(3))
 palpath=HERE/'palettes/aged-stone.json'
 if not palpath.exists():
  sample=Image.new('RGB',(w*3,h))
  for i,im in enumerate(images.values()):sample.paste(im,(i*w,0))
  q=sample.quantize(colors=spec['max_colors'],method=Image.Quantize.MEDIANCUT);pal=q.getpalette()
  write_json(palpath,{'name':'Alvenaria escura compartilhada','colors':[pal[i*3:i*3+3] for _,i in sorted(q.getcolors(),reverse=True)]})
 profile=profile_from_file(path);manifest=json.loads((FINAL/'manifest.json').read_text());preview=Image.new('RGB',(w*3,h+22),(10,15,20));draw=ImageDraw.Draw(preview)
 for i,(key,im) in enumerate(images.items()):
  base=quantize(im.convert('RGBA'),profile);source=WORK/f'tiles/{key}.png';atomic_write(source,png_bytes(base))
  p=deepcopy(profile);p['source_kind']='pixel_art'
  a=export_frame(source,FINAL/f'tiles/stone-{key}.png',p,[w/2,h],1)
  a.update(worldScale=.25,repeatSize=cfg['repeat_world'],profile='profiles/aged-masonry.json',worldOffset=[0,0],raw=f'tiles/{key}',rawBox=cfg['crops'][key])
  manifest['assets'][f'stone-{key}']=a;manifest['rawHashes'][f'tiles/{key}']=hashlib.sha256((RAW/f'tiles/{key}.png').read_bytes()).hexdigest()
  preview.paste(base,(i*w,22));draw.text((i*w+4,4),f'stone-{key}',fill='#bbbbaa')
 write_json(FINAL/'manifest.json',manifest);preview.save(ROOT/'docs/tiles/variants.png')
 print('3 variants exported; RAW preserved; shared palette and periodic boundaries.')
if __name__=='__main__':build()
