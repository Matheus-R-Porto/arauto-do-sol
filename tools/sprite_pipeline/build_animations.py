"""Incremental animation export through the existing deterministic pipeline."""
from copy import deepcopy
import argparse,json
from pathlib import Path
from PIL import Image,ImageDraw
from pipeline import profile_from_file,process,atomic_write,png_bytes,open_png
from build_world import isolated_components,make_profile,write_json
HERE=Path(__file__).resolve().parent
ROOT=HERE.parents[1]
def build(actor=None):
    recipe=json.loads((HERE/'animation-build.json').read_text(encoding='utf-8'))
    world_recipe=json.loads((HERE/'world-build.json').read_text(encoding='utf-8'))
    manifests={}
    reports={}
    cache={}
    for item in recipe['sets']:
        who=item['actor']
        if actor and who!=actor:continue
        family='protagonist' if who=='player' else 'world'
        final=ROOT/'assets/sprites'/family
        if family not in manifests:manifests[family]=json.loads((final/'manifest.json').read_text(encoding='utf-8'))
        m=manifests[family]
        p=profile_from_file(HERE/'profiles/protagonist.json') if who=='player' else make_profile(world_recipe,'boss' if who=='boss' else 'effects' if who=='vfx' else 'enemy')
        if who in recipe.get('profiles',{}):p=profile_from_file(HERE/recipe['profiles'][who])
        im,rawhash=open_png(ROOT/'assets/raw/animations-v2'/item['raw'])
        cachekey=(item['raw'],item.get('sheet_count',item['count']),item['rows'])
        if cachekey not in cache:
            if 'grid' in item:
                cols,rows=item['grid'];parts=[]
                xe=item.get('x_edges',[round(i*im.width/cols) for i in range(cols+1)])
                ye=item.get('y_edges',[round(i*im.height/rows) for i in range(rows+1)])
                for i in range(cols*rows):
                    c=i%cols;r=i//cols;box=[xe[c],ye[r],xe[c+1],ye[r+1]]
                    crop=im.crop(box);bounds=crop.getchannel('A').point(lambda a:255 if a>=128 else 0).getbbox()
                    parts.append((crop,bounds,box))
                cache[cachekey]=parts
            else:cache[cachekey]=isolated_components(im,cachekey[1],item['rows'])
        components=cache[cachekey]
        if 'indices' in item:components=[components[i] for i in item['indices']]
        target=p['scale_reference']['target_pixels'] if who!='vfx' and p.get('scale_reference') else 1 if who=='vfx' else next(g['body_height'] for g in world_recipe['sets'] if g['raw']==who)
        scale=target/item['source_body_height']
        work=ROOT/'assets/work/animations-v2'/who/item['name']
        frames=[];records=[]
        for i,(crop,bounds,box) in enumerate(components):
            name=f"{item['name']}-{i}.png";source=work/name
            atomic_write(source,png_bytes(crop))
            bh=bounds[3]-bounds[1]
            feet=crop.getchannel('A').crop((0,max(bounds[1],bounds[3]-max(1,round(bh*.035))),crop.width,bounds[3])).getbbox()
            anchor=item.get('anchors',{}).get(str(i),[(feet[0]+feet[2])/2,bounds[3]])
            if item.get('anchor_mode')=='center':anchor=[(bounds[0]+bounds[2])/2,bounds[3]]
            if 'roots' in item:anchor=[item['roots'][i][0]-box[0],item['roots'][i][1]-box[1]]
            cfg=deepcopy(p);cfg['scale_reference']={'source_pixels':1/scale,'target_pixels':1}
            dest=final/'v2'/who/item['name']/name
            report,images=process(source,dest,cfg,{str(source.resolve()):anchor})
            info=report['frames'][0];file=str(dest.relative_to(final)).replace('\\','/')
            key=f"{who}-{item['name']}-{i}"
            frames.append(dict(file=file,duration=item['durations'][i],asset=key,pivot=info['pivot']))
            if family=='world':m['assets'][key]=dict(file=file,canvas=p['canvas'],pivot=info['pivot'],worldScale=p.get('world_scale',1),bounds=info['visible_bbox'],sha256=info['output_sha256'])
            records.append(dict(rawBox=box,sourceAnchor=anchor,scale=scale,report=info))
        animation=dict(loop=item['loop'],frames=frames,markers=item.get('markers',[]))
        write_json(dest.parent/'pipeline-report.json',dict(frames=[r['report'] for r in records]))
        if who=='player':
            m.update(canvas=p['canvas'],pivot=p['pivot'],worldScale=p.get('world_scale',1))
            m['animations'][item['name']]=animation
        else:m.setdefault('animations',{}).setdefault(who,{})[item['name']]=animation
        reports[who+'/'+item['name']]=dict(raw=item['raw'],sha256=rawhash,frames=records)
    for family,m in manifests.items():
        m['status']='animation-expansion-v2';write_json(ROOT/'assets/sprites'/family/'manifest.json',m)
    for who in ({i['actor'] for i in recipe['sets']} if not actor else [actor]):
        relevant=[i for i in recipe['sets'] if i['actor']==who]
        if not relevant:continue
        family='protagonist' if who=='player' else 'world';m=manifests.get(family)
        if not m:continue
        animations=m['animations'] if who=='player' else m['animations'][who]
        canvas=m['canvas'] if who=='player' else m['assets'][next(iter(animations.values()))['frames'][0]['asset']]['canvas']
        cw,ch=canvas;cols=max(len(a['frames']) for a in animations.values())
        sheet=Image.new('RGBA',(cols*cw,len(animations)*(ch+16)),(15,20,27,255));d=ImageDraw.Draw(sheet)
        for row,(name,a) in enumerate(animations.items()):
            d.text((2,row*(ch+16)),name,fill=(220,211,190,255))
            for col,f in enumerate(a['frames']):
                with Image.open(ROOT/'assets/sprites'/family/f['file']) as frame:sheet.alpha_composite(frame,(col*cw,row*(ch+16)+16))
        atomic_write(ROOT/'docs/animations-v2'/f'{who}-native.png',png_bytes(sheet))
        atomic_write(ROOT/'docs/animations-v2'/f'{who}-4x.png',png_bytes(sheet.resize((sheet.width*4,sheet.height*4),Image.Resampling.NEAREST)))
    write_json(ROOT/'docs/animations-v2'/f'production-{actor or "all"}.json',reports)
    print('Exported',list(reports))
if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--actor');build(parser.parse_args().actor)
