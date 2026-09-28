"""Data-driven world art export; every runtime PNG passes pipeline.process."""
from copy import deepcopy
from collections import deque
from pathlib import Path
import argparse,json
from PIL import Image,ImageOps,ImageDraw
from pipeline import profile_from_file,process,quantize,png_bytes,atomic_write,open_png,digest

HERE=Path(__file__).resolve().parent
ROOT=HERE.parents[1]
RAW=ROOT/'assets/raw/world';WORK=ROOT/'assets/work/world';FINAL=ROOT/'assets/sprites/world'

def write_json(path,value):atomic_write(path,json.dumps(value,ensure_ascii=False,indent=2).encode())

def isolated_components(image,count,rows):
    # Generated sheets do not always respect equal cells. Isolate connected alpha
    # islands instead of cutting a sword or importing its neighbour into a frame.
    image=image.convert('RGBA');w,h=image.size
    data=bytearray(image.getchannel('A').point(lambda a:255 if a>=128 else 0).tobytes());parts=[]
    for index in range(w*h):
        if not data[index]:continue
        data[index]=0;queue=deque([index]);points=[];l=w;t=h;r=b=0
        while queue:
            k=queue.popleft();y,x=divmod(k,w);points.append(k);l=min(l,x);r=max(r,x);t=min(t,y);b=max(b,y)
            for xx,yy in ((x-1,y),(x+1,y),(x,y-1),(x,y+1)):
                if 0<=xx<w and 0<=yy<h and data[yy*w+xx]:data[yy*w+xx]=0;queue.append(yy*w+xx)
        if len(points)>400:parts.append((len(points),[l,t,r+1,b+1],points))
    parts=sorted(parts,reverse=True)[:count]
    if len(parts)!=count:raise ValueError('Missing disconnected sprite component')
    parts.sort(key=lambda p:(min(rows-1,int((p[1][1]+p[1][3])*.5/(h/rows))),p[1][0]))
    out=[]
    for _,bounds,points in parts:
        l,t,r,b=bounds;box=[max(0,l-2),max(0,t-2),min(w,r+2),min(h,b+2)]
        crop=image.crop(box);alpha=Image.new('L',crop.size);pixels=alpha.load()
        for k in points:y,x=divmod(k,w);pixels[x-box[0],y-box[1]]=255
        crop.putalpha(alpha);out.append((crop,crop.getbbox(),box))
    return out

def create_background_palette(recipe):
    # Fixed palette derived once from the four authored backgrounds, never per panel.
    path=HERE/'palettes/world-background.json'
    if path.exists():return
    sample=Image.new('RGB',(256,len(recipe['backgrounds'])*144))
    for i,name in enumerate(recipe['backgrounds']):
        im,_=open_png(RAW/f'{name}.png')
        sample.paste(ImageOps.fit(im.convert('RGB'),(256,144),method=Image.Resampling.LANCZOS),(0,i*144))
    reduced=sample.quantize(colors=64,method=Image.Quantize.MEDIANCUT)
    pal=reduced.getpalette();colors=[pal[index*3:index*3+3] for _,index in sorted(reduced.getcolors(),reverse=True)]
    write_json(path,{'name':'Cemitério — fundo compartilhado','colors':colors})

def make_profile(recipe,name):
    spec=recipe['profiles'][name]
    profile=dict(schema_version=1,name='world-'+name,max_frame=[128,128],canvas=spec['canvas'],pivot=spec['pivot'],
        visible_size=[126,126],margin=1,source_kind='high_res',downsample_method='lanczos',scale_reference=None,
        source_pivot=None,pixel_scale=1,max_colors=spec['max_colors'],palette=str(HERE/spec['palette']),
        require_fixed_palette=True,alpha_threshold=128,dither=False,background=dict(mode='auto',color=None,tolerance=18))
    path=WORK/f'profile-{name}.json';write_json(path,profile)
    return profile_from_file(path)

def export_frame(source,destination,profile,anchor,scale):
    p=deepcopy(profile);p['scale_reference']={'source_pixels':1/scale,'target_pixels':1}
    report,frames=process(source,destination,p,{str(source.resolve()):anchor})
    info=report['frames'][0]
    return dict(file=str(destination.relative_to(FINAL)).replace('\\','/'),canvas=list(frames[0].size),pivot=info['pivot'],bounds=list(info['visible_bbox']),colors=info['visible_colors'],sha256=info['output_sha256'])

def build(partial=False):
    recipe=json.loads((HERE/'world-build.json').read_text(encoding='utf-8'))
    create_background_palette(recipe)
    manifest=dict(schemaVersion=1,status='pilot' if partial else 'complete',assets={},backgrounds={},rawHashes={})
    for name in recipe['backgrounds']:
        image,raw_hash=open_png(RAW/f'{name}.png');manifest['rawHashes'][name]=raw_hash
        profile=make_profile(recipe,'background')
        base=ImageOps.fit(image,tuple(recipe['background_size']),method=Image.Resampling.LANCZOS)
        base=quantize(base,profile);atomic_write(WORK/f'{name}-base.png',png_bytes(base))
        cols,rows=recipe['background_panels'];pw=base.width//cols;ph=base.height//rows
        panels=[]
        for y in range(rows):
            for x in range(cols):
                source=WORK/f'{name}-{x}-{y}.png';atomic_write(source,png_bytes(base.crop((x*pw,y*ph,(x+1)*pw,(y+1)*ph))))
                config=deepcopy(profile);config['source_kind']='pixel_art';config['background']['mode']='preserve'
                asset=export_frame(source,FINAL/'backgrounds'/f'{name}-{x}-{y}.png',config,[pw/2,ph],1)
                asset.update(x=x*pw,y=y*ph,source=[1,1,pw,ph]);panels.append(asset)
        manifest['backgrounds'][name]=dict(size=list(base.size),panels=panels)
    for group in recipe['sets']:
        path=RAW/(group['raw']+'.png')
        if not path.exists():
            if partial:continue
            raise FileNotFoundError(path)
        image,raw_hash=open_png(path);manifest['rawHashes'][group['raw']]=raw_hash
        profile=make_profile(recipe,group['profile']);cols,rows=group['grid']
        crops=[]
        components=isolated_components(image,len(group['frames']),rows) if group.get('components') else None
        for i,frame in enumerate(group['frames']):
            col=i%cols;row=i//cols
            box=frame.get('box',[round(col*image.width/cols),round(row*image.height/rows),round((col+1)*image.width/cols),round((row+1)*image.height/rows)])
            crop=image.crop(box);bounds=crop.getchannel('A').point(lambda a:255 if a>=128 else 0).getbbox()
            if components:crop,bounds,box=components[i]
            if not bounds:raise ValueError('Empty cell: '+frame['name'])
            crops.append((frame,crop,bounds,box))
        group_scale=None
        if 'body_height' in group:
            raw_height=group.get('source_body_height') or (crops[group.get('calibration_frame',0)][2][3]-crops[group.get('calibration_frame',0)][2][1])
            group_scale=group['body_height']/raw_height
        for frame,crop,bounds,box in crops:
            source=WORK/(frame['name']+'.png');atomic_write(source,png_bytes(crop))
            bw,bh=bounds[2]-bounds[0],bounds[3]-bounds[1]
            scale=group_scale or min(frame['target'][0]/bw,frame['target'][1]/bh,1)
            # Feet anchoring is measured before resampling. Wide weapons do not center the torso.
            feet=crop.getchannel('A').crop((0,max(bounds[1],bounds[3]-max(1,round(bh*.035))),crop.width,bounds[3])).point(lambda a:255 if a>=128 else 0).getbbox()
            anchor=frame.get('anchor') or ([(feet[0]+feet[2])/2,bounds[3]] if group.get('feet',False) and not frame['name'].endswith('-death') else [(bounds[0]+bounds[2])/2,bounds[3]])
            config=deepcopy(profile)
            if frame.get('texture'):
                # Texture patches are uniform crops, not stretched character anatomy.
                crop=ImageOps.fit(crop.crop(bounds),tuple(frame['target']),method=Image.Resampling.LANCZOS)
                atomic_write(source,png_bytes(crop));anchor=[crop.width/2,crop.height];scale=1
                config['background']['mode']='preserve'
            asset=export_frame(source,FINAL/'frames'/(frame['name']+'.png'),config,anchor,scale)
            asset.update(raw=group['raw'],rawBox=box,scale=scale,sourceAnchor=anchor)
            manifest['assets'][frame['name']]=asset
    write_json(FINAL/'manifest.json',manifest)
    write_json(ROOT/'docs/art-world/production.json',manifest)
    # Native-size proof sheet; only final PNGs, never used by gameplay.
    names=list(manifest['assets']);cols=6;rows=(len(names)+cols-1)//cols
    if rows:
        sheet=Image.new('RGBA',(cols*144,rows*148),(13,20,27,255));draw=ImageDraw.Draw(sheet)
        for i,name in enumerate(names):
            asset=manifest['assets'][name];x=(i%cols)*144;y=(i//cols)*148
            draw.text((x+3,y+3),name,fill=(219,211,186,255))
            with Image.open(FINAL/asset['file']) as im:sheet.alpha_composite(im,(x+8,y+18))
        atomic_write(ROOT/'docs/art-world/contact.png',png_bytes(sheet))
    print(f"World art: {len(manifest['backgrounds'])} backgrounds, {len(manifest['assets'])} frames; {manifest['status']}")
    return manifest

def build_scenery(group=None):
    """Incremental scenery revision through the same crop/export/process path.

    The frozen manifest supplies world scale and anchors, never new collision data.
    Characters, animations, effects and legacy files are deliberately not rebuilt.
    """
    recipe=json.loads((HERE/'world-build.json').read_text(encoding='utf-8'))
    spec=json.loads((HERE/'scenery-build.json').read_text(encoding='utf-8'))
    baseline=json.loads((HERE/spec['baseline']).read_text(encoding='utf-8'))
    manifest=json.loads((FINAL/'manifest.json').read_text(encoding='utf-8'))
    report={}
    for family in recipe['sets']:
        if family['raw'] not in spec['groups'] or group and family['raw']!=group:continue
        raw=RAW/(family['raw']+'.png');image,raw_hash=open_png(raw)
        if raw_hash!=baseline['rawHashes'][family['raw']]:raise ValueError('RAW changed: '+str(raw))
        profile=profile_from_file(HERE/spec['profiles'][family['profile']]);factor=profile['density']
        cols,rows=family['grid']
        components=isolated_components(image,len(family['frames']),rows) if family.get('components') else None
        for i,frame in enumerate(family['frames']):
            name=frame['name'];old=baseline['assets'][name]
            crop=components[i][0] if components else image.crop(old['rawBox'])
            config=deepcopy(profile);anchor=old['sourceAnchor'];scale=old['scale']*factor
            if frame.get('texture'):
                bounds=crop.getchannel('A').point(lambda a:255 if a>=profile['alpha_threshold'] else 0).getbbox()
                crop=ImageOps.fit(crop.crop(bounds),tuple(v*factor for v in frame['target']),method=Image.Resampling.LANCZOS)
                anchor=[crop.width/2,crop.height];scale=1;config['background']['mode']='preserve'
            source=WORK/'scenery'/(name+'.png');atomic_write(source,png_bytes(crop))
            a=export_frame(source,FINAL/'scenery'/family['raw']/(name+'.png'),config,anchor,scale)
            a.update(raw=family['raw'],rawBox=old['rawBox'],scale=scale,sourceAnchor=anchor,
                     worldScale=1/factor,profile=spec['profiles'][family['profile']],
                     worldOffset=spec['offsets'].get(name,[0,0]))
            if family['profile']=='terrain':a['repeatSize']=[old['bounds'][2]-old['bounds'][0],old['bounds'][3]-old['bounds'][1]]
            manifest['assets'][name]=a;report[name]={'before':old,'after':a,'raw_sha256':raw_hash}
    if group is None or group=='backgrounds':
        profile=profile_from_file(HERE/spec['profiles']['background']);factor=profile['density']
        for name in spec['backgrounds']:
            raw,raw_hash=open_png(RAW/(name+'.png'))
            if raw_hash!=baseline['rawHashes'][name]:raise ValueError('RAW changed: '+name)
            base=ImageOps.fit(raw,tuple(v*factor for v in recipe['background_size']),method=Image.Resampling.LANCZOS)
            base=quantize(base,profile);atomic_write(WORK/'scenery'/(name+'-base.png'),png_bytes(base))
            cols,rows=recipe['background_panels'];pw=base.width//cols;ph=base.height//rows;panels=[]
            for y in range(rows):
                for x in range(cols):
                    source=WORK/'scenery'/f'{name}-{x}-{y}.png';atomic_write(source,png_bytes(base.crop((x*pw,y*ph,(x+1)*pw,(y+1)*ph))))
                    config=deepcopy(profile);config['source_kind']='pixel_art';config['background']['mode']='preserve'
                    a=export_frame(source,FINAL/'scenery/backgrounds'/f'{name}-{x}-{y}.png',config,[pw/2,ph],1)
                    a.update(x=x*pw,y=y*ph,source=[factor,factor,pw,ph],profile=spec['profiles']['background']);panels.append(a)
            b=dict(size=list(base.size),worldSize=recipe['background_size'],panels=panels)
            manifest['backgrounds'][name]=b;report['background/'+name]={'before':baseline['backgrounds'][name],'after':b,'raw_sha256':raw_hash}
    manifest['sceneryRevision']=1;write_json(FINAL/'manifest.json',manifest)
    dest=ROOT/'docs/scenery/production.json'
    prior=json.loads(dest.read_text(encoding='utf-8')) if dest.exists() else {}
    prior.update(report);write_json(dest,prior)
    print('Scenery:',', '.join(report))
    return manifest

def build_hud():
    baseline=json.loads((ROOT/'docs/scenery/source-manifest.json').read_text(encoding='utf-8'))
    manifest=json.loads((FINAL/'manifest.json').read_text(encoding='utf-8'))
    profile=profile_from_file(HERE/'profiles/hud-detail.json')
    image,sha=open_png(RAW/'hud.png')
    if sha!=baseline['rawHashes']['hud']:raise ValueError('HUD RAW changed')
    report={}
    for name in ['medallion','health-skull','energy-frame','hud-fragment']:
        old=baseline['assets'][name];source=WORK/'hud-detail'/(name+'.png')
        atomic_write(source,png_bytes(image.crop(old['rawBox'])))
        a=export_frame(source,FINAL/'hud-detail'/(name+'.png'),profile,old['sourceAnchor'],old['scale']*profile['density'])
        a.update(raw='hud',rawBox=old['rawBox'],sourceAnchor=old['sourceAnchor'],scale=old['scale']*profile['density'],worldScale=1/profile['density'],profile='profiles/hud-detail.json',screenSize=[old['bounds'][2]-old['bounds'][0],old['bounds'][3]-old['bounds'][1]])
        manifest['assets'][name]=a;report[name]={'before':old,'after':a,'raw_sha256':sha}
    write_json(FINAL/'manifest.json',manifest);write_json(ROOT/'docs/hud/production.json',report)
    print('HUD: medallion, health-skull, energy-frame, hud-fragment')

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--partial',action='store_true');parser.add_argument('--scenery',action='store_true');parser.add_argument('--hud',action='store_true');parser.add_argument('--group');args=parser.parse_args()
    if args.hud:build_hud()
    elif args.scenery:build_scenery(args.group)
    else:build(args.partial)
