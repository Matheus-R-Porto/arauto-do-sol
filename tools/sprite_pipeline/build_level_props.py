"""Export only new level props through the established sprite pipeline (RAW immutable)."""
from pathlib import Path
from copy import deepcopy
import json,hashlib
from PIL import Image
from pipeline import process,profile_from_file,make_preview
ROOT=Path(__file__).resolve().parents[2];HERE=Path(__file__).resolve().parent
raw=ROOT/'assets/raw/level-redesign';work=ROOT/'assets/work/level-redesign';final=ROOT/'assets/sprites/world/level';work.mkdir(parents=True,exist_ok=True);final.mkdir(parents=True,exist_ok=True)
profile_path=HERE/'profiles/level-props.json'
base=profile_from_file(profile_path)
manifest_path=ROOT/'assets/sprites/world/manifest.json';manifest=json.loads(manifest_path.read_text(encoding='utf-8'))
recipe=[('sealed-gate','sealed-gate.png',None,[256,384],[128,376],.5,352,'height'),
 *[(f'bone-pile-{i}','bone-pile.png',[i*724,0,(i+1)*724,724],[160,128],[80,116],.25,128,'width')for i in range(3)],
 *[(name,'chest.png',[i*887,0,(i+1)*887,887],[160,160],[80,152],.25,128,'width')for i,name in enumerate(['chest-closed','chest-open'])],
 ('bone-currency','bone-pile.png',[75,315,200,480],[40,48],[20,44],.25,24,'width')]
frames=[];report=[]
for name,file,box,canvas,pivot,world_scale,target,axis in recipe:
 source=raw/file;before=hashlib.sha256(source.read_bytes()).hexdigest();im=Image.open(source).convert('RGBA');im=im.crop(box)if box else im
 bbox=im.getchannel('A').point(lambda a:255 if a>=128 else 0).getbbox();dimension=bbox[2]-bbox[0]if axis=='width'else bbox[3]-bbox[1]
 # Damage states share the intact source width to preserve the common scale.
 if name.startswith('bone-pile-'):dimension=606
 if name.startswith('chest-'):dimension=776
 path=work/(name+'.png');im.save(path)
 p=deepcopy(base);p['canvas']=canvas;p['pivot']=pivot;p['visible_size']=[canvas[0]-8,canvas[1]-8];p['scale_reference']={'source_pixels':dimension,'target_pixels':target}
 pp=HERE/'profiles/level'/f'{name}.json';pp.parent.mkdir(parents=True,exist_ok=True);spec={k:v for k,v in p.items() if not k.startswith('_')};spec['palette']='../../palettes/world-stone.json';pp.write_text(json.dumps(spec,indent=2),encoding='utf-8')
 out=final/(name+'.png');info,images=process(path,out,p);f=info['frames'][0]
 manifest['assets'][name]={'file':'level/'+name+'.png','canvas':canvas,'pivot':pivot,'bounds':list(f['visible_bbox']),'colors':f['visible_colors'],'sha256':f['output_sha256'],'worldScale':world_scale,'raw':'level-redesign/'+file,'rawBox':box,'profile':'profiles/level/'+name+'.json'}
 assert hashlib.sha256(source.read_bytes()).hexdigest()==before
 report.append({'asset':name,'rawHash':before,'profile':p,'output':f});frames.extend(images)
manifest_path.write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
(ROOT/'docs/level-redesign/art-build.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
make_preview(frames,1).save(ROOT/'docs/level-redesign/props-native.png')
print('Exported',len(recipe),'assets. RAW hashes preserved.')
