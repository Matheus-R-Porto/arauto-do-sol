"""Split a small, explicitly measured generation strip without editing RAW pixels."""
import argparse
from pathlib import Path
import json
from pipeline import open_png, png_bytes, atomic_write, protected_output, PipelineError

def split(source, layout_path, target):
    source=Path(source).resolve(); layout_path=Path(layout_path).resolve(); target=Path(target).resolve()
    layout=json.loads(layout_path.read_text(encoding='utf-8'))
    image,_=open_png(source)
    if list(image.size)!=layout['source_size']: raise PipelineError('Dimensão do RAW difere do layout.')
    prepared=[]; anchors={}
    for frame in layout['frames']:
        name=frame['name']; box=frame['box']; destination=(target/name).resolve()
        if not destination.is_relative_to(target) or destination.suffix.lower()!='.png': raise PipelineError('Nome de frame inválido.')
        protected_output(destination,[source,layout_path])
        if len(box)!=4 or any(type(v)is not int for v in box) or not(0<=box[0]<box[2]<=image.width and 0<=box[1]<box[3]<=image.height): raise PipelineError('Recorte inválido.')
        if name in anchors: raise PipelineError('Nome de frame duplicado.')
        crop=image.crop(box)
        visible=crop.getchannel('A').point(lambda a:255 if a>=layout.get('alpha_threshold',128) else 0).getbbox()
        if not visible or visible[0]==0 or visible[1]==0 or visible[2]==crop.width or visible[3]==crop.height:
            raise PipelineError('Recorte vazio ou corta a silhueta: '+name)
        prepared.append((destination,png_bytes(crop)))
        anchors[name]=frame['anchor']
    anchor_path=target/'anchors.json'; protected_output(anchor_path,[source,layout_path])
    for destination,data in prepared: atomic_write(destination,data)
    atomic_write(anchor_path,json.dumps(anchors,indent=2).encode())
    return anchors

if __name__=='__main__':
    cli=argparse.ArgumentParser(description=__doc__)
    cli.add_argument('source');cli.add_argument('layout');cli.add_argument('output')
    args=cli.parse_args();split(args.source,args.layout,args.output)
