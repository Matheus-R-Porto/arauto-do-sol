from pathlib import Path
from copy import deepcopy
import json,hashlib
from PIL import Image
from pipeline import profile_from_file,process,make_preview
H=Path(__file__).resolve().parent;R=H.parents[1];work=R/'assets/work/polish';work.mkdir(parents=True,exist_ok=True);(H/'profiles/polish').mkdir(exist_ok=True)
m=json.loads((R/'assets/sprites/world/manifest.json').read_text(encoding='utf-8'));hero=json.loads((R/'assets/sprites/protagonist/manifest.json').read_text(encoding='utf-8'));report=[];previews=[]
for who,source in [('wall','wall.png'),('land','land.png')]:
 raw=R/'assets/raw/polish'/source;sha=hashlib.sha256(raw.read_bytes()).hexdigest();im=Image.open(raw).convert('RGBA');cols=3;frames=[]
 for i in range(3+(who=='wall')):
  name=('wall-'+['intact','cracked','broken','rubble'][i])if who=='wall' else 'land-'+str(i)
  j=min(i,2);box=[round(j*im.width/3),0,round((j+1)*im.width/3),im.height];crop=im.crop(box)
  if i==3:crop=crop.crop((0,600,crop.width,crop.height))
  p=deepcopy(profile_from_file(H/('profiles/level-props.json'if who=='wall'else'profiles/protagonist.json')))
  if who=='wall':p.update(canvas=[192,256],pivot=[96,248],visible_size=[184,248],scale_reference={'source_pixels':654,'target_pixels':192},background={'mode':'preserve','tolerance':18,'color':None})
  else:p.update(scale_reference={'source_pixels':714,'target_pixels':96},background={'mode':'preserve','tolerance':18,'color':None})
  src=work/(name+'.png');crop.save(src);bbox=crop.getchannel('A').point(lambda a:255 if a>=128 else 0).getbbox();anchor=[(bbox[0]+bbox[2])/2,bbox[3]]
  if who=='land':anchor=[(340 if i==0 else 345 if i==1 else 325),bbox[3]]
  family='world'if who=='wall'else'protagonist';dest=R/'assets/sprites'/family/'polish'/(name+'.png');dest.parent.mkdir(exist_ok=True)
  profile={k:v for k,v in p.items()if not k.startswith('_')};profile['palette']='../../palettes/'+('aged-stone.json'if who=='wall'else'protagonist.json');pp=H/'profiles/polish'/(name+'.json');pp.write_text(json.dumps(profile,indent=2),encoding='utf-8')
  p=profile_from_file(pp)
  info,ims=process(src,dest,p,{str(src.resolve()):anchor});f=info['frames'][0];previews+=ims
  if who=='wall':m['assets'][name]={'file':'polish/'+name+'.png','canvas':p['canvas'],'pivot':f['pivot'],'worldScale':.25,'bounds':f['visible_bbox'],'colors':f['visible_colors'],'sha256':f['output_sha256'],'profile':'profiles/polish/'+name+'.json'}
  else:frames.append({'file':'polish/'+name+'.png','duration':.04,'pivot':f['pivot']})
  report.append({'name':name,'raw':source,'rawSHA256':sha,'crop':box,'anchor':anchor,'result':f})
 if who=='land':hero['animations']['land']={'loop':False,'frames':frames}
 assert hashlib.sha256(raw.read_bytes()).hexdigest()==sha
before=json.loads((R/'docs/polish/world-before.json').read_text(encoding='utf-8'))
for attack in ['slash','charge','slam']:
 old=before['animations']['boss'][attack+'-recovery'];clip=m['animations']['boss'][attack+'-recovery'];clip['frames']=[dict(f,duration=f['duration']*.8) for f in old['frames']];clip['frames'].append(dict(m['animations']['boss']['idle']['frames'][0],duration=sum(f['duration'] for f in old['frames'])*.2))
(R/'assets/sprites/world/manifest.json').write_text(json.dumps(m,indent=2,ensure_ascii=False),encoding='utf-8');(R/'assets/sprites/protagonist/manifest.json').write_text(json.dumps(hero,indent=2,ensure_ascii=False),encoding='utf-8')
(R/'docs/polish/build.json').write_text(json.dumps(report,indent=2),encoding='utf-8');make_preview(previews,1).save(R/'docs/polish/native.png')

