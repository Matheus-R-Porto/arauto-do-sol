"""Rebuild all production sprites from immutable RAW and calibrated layouts."""
from copy import deepcopy
import json
from pathlib import Path
from PIL import Image, ImageDraw
from pipeline import profile_from_file, process, atomic_write, png_bytes
from split_strip import split

HERE=Path(__file__).resolve().parent
ROOT=HERE.parents[1]

def build():
    profile=profile_from_file(HERE/'profiles/protagonist.json')
    recipe=json.loads((HERE/'protagonist-build.json').read_text(encoding='utf-8'))
    manifest=dict(schemaVersion=1,status='art-iteration-1',canvas=profile['canvas'],pivot=profile['pivot'],worldScale=profile.get('world_scale',1),animations={})
    reports={}
    for item in recipe['sets']:
        name=item['name']; work=ROOT/'assets/work/protagonist'/name
        layout=work/'layout.json'; atomic_write(layout,json.dumps({**item,'alpha_threshold':profile['alpha_threshold']}).encode())
        anchors=split(ROOT/'assets/raw/protagonist'/f'{name}-strip.png',layout,work)
        config=deepcopy(profile)
        config['scale_reference']={'source_pixels':item['source_body_height'],'target_pixels':profile['scale_reference']['target_pixels']}
        config['_anchors_path']=str(work/'anchors.json')
        report,_=process(work,ROOT/'assets/sprites/protagonist'/name,config,{str(work/f):a for f,a in anchors.items()})
        reports[name]=report
    for name,anim in recipe['animations'].items():
        manifest['animations'][name]=dict(loop=anim['loop'],frames=[dict(file=f"{anim['set']}/{name}-{i}.png",duration=duration,pivot=next(r['pivot'] for r in reports[anim['set']]['frames'] if Path(r['output']).name==f'{name}-{i}.png')) for i,duration in enumerate(anim['durations'])])
    atomic_write(ROOT/'assets/sprites/protagonist/manifest.json',json.dumps(manifest,ensure_ascii=False,indent=2).encode())
    atomic_write(ROOT/'docs/art/production-report.json',json.dumps(reports,ensure_ascii=False,indent=2).encode())
    # Review sheets contain only already processed assets. Never loaded by gameplay.
    cw,ch=profile['canvas'];cols=max(len(a['frames']) for a in manifest['animations'].values())
    sheet=Image.new('RGBA',(cols*cw, len(manifest['animations'])*(ch+16)),(15,20,27,255));draw=ImageDraw.Draw(sheet)
    for row,(name,anim) in enumerate(manifest['animations'].items()):
        draw.text((2,row*(ch+16)),name,fill=(220,211,190,255))
        for col,frame in enumerate(anim['frames']):
            with Image.open(ROOT/'assets/sprites/protagonist'/frame['file']) as image: sheet.alpha_composite(image,(col*cw,row*(ch+16)+16))
    atomic_write(ROOT/'docs/art/contact-native.png',png_bytes(sheet))
    atomic_write(ROOT/'docs/art/contact-6x.png',png_bytes(sheet.resize((sheet.width*6,sheet.height*6),Image.Resampling.NEAREST)))
    print(f"{sum(len(a['frames']) for a in manifest['animations'].values())} frames; {len(manifest['animations'])} animações; pipeline validado.")
    if (HERE/'animation-build.json').exists():
        from build_animations import build as build_expansion
        build_expansion('player')

if __name__=='__main__':build()
