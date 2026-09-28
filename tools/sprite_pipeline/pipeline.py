"""Deterministic PNG production pipeline. Runtime never imports this module."""
from __future__ import annotations
import argparse
from collections import deque
from copy import deepcopy
from hashlib import sha256
from io import BytesIO
import json
from math import isfinite
import os
from pathlib import Path
import sys
import tempfile
from PIL import Image, ImageDraw, __version__ as PILLOW_VERSION

VERSION = "1.1.1"
METHODS = {"nearest": Image.Resampling.NEAREST, "box": Image.Resampling.BOX,
           "bicubic": Image.Resampling.BICUBIC, "lanczos": Image.Resampling.LANCZOS}

class PipelineError(ValueError):
    pass

def digest(data):
    return sha256(data).hexdigest()

def read_json(path):
    return json.loads(Path(path).read_text(encoding="utf-8-sig"))

def rgb(color):
    if isinstance(color, str) and len(color) == 7 and color.startswith("#"):
        try:
            return tuple(int(color[i:i+2], 16) for i in (1, 3, 5))
        except ValueError:
            pass
    if isinstance(color, (list, tuple)) and len(color) == 3 and all(type(v) is int and 0 <= v <= 255 for v in color):
        return tuple(color)
    raise PipelineError(f"Cor inválida: {color!r}")

def pair(value, label, minimum=1):
    if not isinstance(value, (list, tuple)) or len(value) != 2 or any(type(v) is not int or v < minimum for v in value):
        raise PipelineError(f"{label} precisa de dois inteiros >= {minimum}.")
    return tuple(value)

def profile_from_file(path):
    path = Path(path).resolve()
    p = read_json(path)
    p["_profile_path"] = str(path)
    if p.get("palette"):
        palette_path = (path.parent / p["palette"]).resolve()
        p["_palette_path"] = str(palette_path)
        raw = read_json(palette_path)
        p["_colors"] = [rgb(c) for c in (raw["colors"] if isinstance(raw, dict) else raw)]
    validate_profile(p)
    return p

def validate_profile(p):
    if p.get("schema_version") != 1:
        raise PipelineError("schema_version do perfil deve ser 1.")
    maximum = pair(p.get("max_frame"), "max_frame")
    canvas = pair(p["canvas"], "canvas") if p.get("canvas") else None
    if canvas and any(a > b for a, b in zip(canvas, maximum)):
        raise PipelineError("Canvas excede max_frame.")
    pair(p["visible_size"], "visible_size")
    if p.get("source_kind") not in ("high_res", "pixel_art"):
        raise PipelineError("source_kind deve ser high_res ou pixel_art.")
    if p.get("downsample_method") not in METHODS:
        raise PipelineError("Método desconhecido: " + str(p.get("downsample_method")))
    if type(p.get("max_colors")) is not int or not 1 <= p["max_colors"] <= 256:
        raise PipelineError("max_colors deve estar entre 1 e 256 no perfil.")
    if type(p.get("alpha_threshold")) is not int or not 1 <= p["alpha_threshold"] <= 255:
        raise PipelineError("alpha_threshold deve estar entre 1 e 255.")
    if type(p.get("margin")) is not int or p["margin"] < 1:
        raise PipelineError("margin deve ser >=1 para preservar margem transparente.")
    if canvas and min(canvas) <= p["margin"] * 2:
        raise PipelineError("Canvas sem espaço para conteúdo e margem.")
    if type(p.get("pixel_scale")) is not int or p["pixel_scale"] < 1:
        raise PipelineError("pixel_scale deve ser inteiro positivo; escala posterior sempre nearest.")
    if type(p.get("dither")) is not bool:
        raise PipelineError("dither deve ser true ou false.")
    colors = p.get("_colors")
    if p.get("require_fixed_palette") and not colors:
        raise PipelineError("O perfil exige uma paleta mestre; defina palette após analisar a referência.")
    if colors and (len(colors) > p["max_colors"] or len(colors) != len(set(colors))):
        raise PipelineError("Paleta excede max_colors ou contém duplicatas.")
    if p.get("pivot"):
        pivot = pair(p["pivot"], "pivot", 0)
        if not canvas or any(a >= b for a, b in zip(pivot, canvas)):
            raise PipelineError("Pivot deve estar dentro de um canvas explícito.")
    if p.get("source_pivot"):
        pair(p["source_pivot"], "source_pivot", 0)
    ref = p.get("scale_reference")
    if ref and (set(ref) != {"source_pixels", "target_pixels"} or any(not isinstance(v, (int, float)) or not isfinite(v) or v <= 0 for v in ref.values())):
        raise PipelineError("scale_reference exige source_pixels e target_pixels positivos.")
    bg = p.get("background", {})
    if bg.get("mode") not in ("auto", "preserve", "remove") or type(bg.get("tolerance")) is not int or not 0 <= bg["tolerance"] <= 255:
        raise PipelineError("background inválido: mode auto/preserve/remove e tolerance 0..255.")
    if bg.get("color") is not None:
        rgb(bg["color"])
    return p

def inspect_image(image):
    rgba = image.convert("RGBA")
    pixels = rgba.get_flattened_data()
    alphas = sorted({px[3] for px in pixels})
    colors = sorted({px[:3] for px in pixels if px[3]})
    return {"size": list(image.size), "mode": image.mode, "visible_colors": len(colors),
            "colors": ["#%02x%02x%02x" % c for c in colors], "alpha": "binary" if set(alphas) <= {0, 255} else "partial",
            "transparent": 0 in alphas, "visible_bbox": rgba.getchannel("A").getbbox()}

def open_png(path):
    data = Path(path).read_bytes()
    try:
        with Image.open(BytesIO(data)) as image:
            if image.format != "PNG":
                raise PipelineError(f"A entrada não é PNG: {path}")
            image.load()
            return image.convert("RGBA"), digest(data)
    except (OSError, Image.DecompressionBombError) as error:
        raise PipelineError(f"PNG inválido: {path}: {error}") from error

def remove_background(image, settings):
    result = image.copy()
    if image.getchannel("A").getextrema()[0] < 255 or settings["mode"] == "preserve":
        return result, {"action": "preserved_alpha", "removed_pixels": 0}
    tolerance = settings["tolerance"]
    pixels = result.load()
    width, height = result.size
    corners = [pixels[0, 0][:3], pixels[width-1, 0][:3], pixels[0, height-1][:3], pixels[width-1, height-1][:3]]
    close = lambda a, b: max(abs(x-y) for x, y in zip(a, b)) <= tolerance
    if settings.get("color"):
        color = rgb(settings["color"])
    else:
        color = max(corners, key=lambda c: sum(close(c, other) for other in corners))
        if sum(close(color, other) for other in corners) < 3:
            raise PipelineError("Fundo ambíguo: use alpha verdadeiro ou informe background.color no perfil.")
    pending = deque()
    visited = bytearray(width*height)
    def offer(x, y):
        index = y*width+x
        if not visited[index] and close(pixels[x, y][:3], color):
            visited[index] = 1
            pending.append((x, y))
    for x in range(width):
        offer(x, 0); offer(x, height-1)
    for y in range(height):
        offer(0, y); offer(width-1, y)
    count = 0
    while pending:
        x, y = pending.popleft()
        pixels[x, y] = (0, 0, 0, 0)
        count += 1
        if x: offer(x-1, y)
        if x+1 < width: offer(x+1, y)
        if y: offer(x, y-1)
        if y+1 < height: offer(x, y+1)
    return result, {"action": "border_flood_fill", "color": list(color), "removed_pixels": count}

def quantize(image, profile):
    alpha = image.getchannel("A").point(lambda a: 255 if a >= profile["alpha_threshold"] else 0)
    opaque = [p[:3] for p, a in zip(image.get_flattened_data(), alpha.get_flattened_data()) if a]
    if not opaque:
        raise PipelineError("O processamento produziu um frame vazio; reveja escala/alpha no perfil.")
    colors = profile.get("_colors")
    # Pixel-art panels already in the master palette must remain byte-exact.
    # Pillow's RGB palette cache groups nearby colors and can otherwise remap
    # an exact palette color differently in independently processed panels.
    if profile['source_kind'] == 'pixel_art' and colors and set(opaque) <= set(colors):
        mapped = image.copy()
        mapped.putalpha(alpha)
        mapped.putdata([p if p[3] else (0, 0, 0, 0) for p in mapped.get_flattened_data()])
        return mapped
    if not colors:
        sample = Image.new("RGB", (len(opaque), 1)); sample.putdata(opaque)
        palette = sample.quantize(colors=profile["max_colors"], method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE)
        raw = palette.getpalette()
        colors = [tuple(raw[i*3:i*3+3]) for _, i in palette.getcolors()]
    palette = Image.new("P", (1, 1))
    expanded = colors + [colors[0]] * (256-len(colors))
    palette.putpalette([value for c in expanded for value in c])
    mapped = image.convert("RGB").quantize(palette=palette, dither=Image.Dither.FLOYDSTEINBERG if profile["dither"] else Image.Dither.NONE).convert("RGBA")
    mapped.putalpha(alpha)
    # Canonical hidden RGB eliminates stray color data and makes output stable.
    mapped.putdata([p if p[3] else (0, 0, 0, 0) for p in mapped.get_flattened_data()])
    return mapped

def validate_final(image, profile):
    info = inspect_image(image)
    if info["mode"] != "RGBA": raise PipelineError("O sprite final precisa ser RGBA.")
    if any(v > cap for v, cap in zip(image.size, profile["max_frame"])): raise PipelineError("Frame excede max_frame.")
    if not info["visible_bbox"]: raise PipelineError("Frame vazio.")
    if not info["transparent"] or info["alpha"] != "binary": raise PipelineError("Frame exige transparência e alpha binário.")
    if info["visible_colors"] > profile["max_colors"]: raise PipelineError("Frame excede a paleta do perfil.")
    if profile.get("_colors"):
        if not {rgb(c) for c in info["colors"]} <= set(profile["_colors"]): raise PipelineError("Cor fora da paleta mestre.")
    box = info["visible_bbox"]; margin = profile["margin"] * profile["pixel_scale"]
    if box[0] < margin or box[1] < margin or box[2] > image.width-margin or box[3] > image.height-margin:
        raise PipelineError("Conteúdo encosta na margem; aumente canvas ou ajuste escala/pivot no perfil.")
    return info

def prepare_frames(paths, profile, anchors=None):
    validate_profile(profile)
    anchors = anchors or {}
    sources = []
    for path in paths:
        image, raw_hash = open_png(path)
        clean, bg = remove_background(image, profile["background"])
        # Ignore alpha too faint to survive the final threshold when locating bounds.
        bounds = clean.getchannel("A").point(lambda a: a if a >= profile["alpha_threshold"] else 0).getbbox()
        if not bounds: raise PipelineError(f"Entrada vazia após remoção de fundo: {path}")
        anchor = anchors.get(str(path), profile.get("source_pivot")) or ((bounds[0]+bounds[2])/2, bounds[3])
        if len(anchor) != 2 or any(not isinstance(v, (int,float)) or not isfinite(v) for v in anchor):
            raise PipelineError(f"Anchor inválido: {path}")
        sources.append({"path": path, "raw_hash": raw_hash, "original_size": image.size,
                        "image": clean.crop(bounds), "bounds": bounds, "anchor": anchor, "background": bg})
    if not sources: raise PipelineError("Nenhum PNG encontrado.")
    reference = profile.get("scale_reference")
    if reference:
        scale = reference["target_pixels"] / reference["source_pixels"]
        if scale > 1: raise PipelineError("Escala inicial não amplia RAW; use pixel_scale depois da conversão.")
    else:
        scale = min(1.0, *(profile["visible_size"][axis]/max(s["image"].size[axis] for s in sources) for axis in (0,1)))
        available = profile.get("canvas") or profile["max_frame"]
        for axis in (0,1):
            low = min(s["bounds"][axis]-s["anchor"][axis] for s in sources)
            high = max(s["bounds"][axis+2]-s["anchor"][axis] for s in sources)
            scale = min(scale, (available[axis]-2*profile["margin"]-1)/max(1, high-low))
    method = "nearest" if profile["source_kind"] == "pixel_art" else profile["downsample_method"]
    prepared = []
    for source in sources:
        cropped = source["image"]
        size = tuple(max(1, int(v*scale+0.5)) for v in cropped.size)
        image = cropped.resize(size, METHODS[method])
        image = quantize(image, profile)
        offset = tuple(round((source["bounds"][axis]-source["anchor"][axis])*scale) for axis in (0,1))
        prepared.append((source, image, offset))
    margin = profile["margin"]
    if profile.get("canvas"):
        canvas = tuple(profile["canvas"])
        pivot = tuple(profile.get("pivot") or (canvas[0]//2, canvas[1]-margin))
    else:
        low = tuple(min(offset[a] for _, image, offset in prepared) for a in (0,1))
        high = tuple(max(offset[a]+image.size[a] for _, image, offset in prepared) for a in (0,1))
        canvas = tuple(high[a]-low[a]+2*margin for a in (0,1))
        pivot = tuple(margin-low[a] for a in (0,1))
    outputs = []
    for source, image, offset in prepared:
        if profile.get('fit_anchor'):
            # Move transparent padding only; the exported pivot keeps the same
            # anatomical anchor in world coordinates, without rescaling poses.
            pivot = tuple(max(margin-offset[a], min(profile['pivot'][a], canvas[a]-margin-image.size[a]-offset[a])) for a in (0,1))
        where = tuple(pivot[a]+offset[a] for a in (0,1))
        if min(where) < 0 or any(where[a]+image.size[a] > canvas[a] for a in (0,1)):
            raise PipelineError(f"Frame seria cortado: {source['path']}; ajuste canvas/pivot no perfil.")
        frame = Image.new("RGBA", canvas, (0,0,0,0)); frame.paste(image, where)
        factor = profile["pixel_scale"]
        if factor != 1: frame = frame.resize(tuple(v*factor for v in canvas), Image.Resampling.NEAREST)
        info = validate_final(frame, profile)
        info.update({"input": str(source["path"]), "input_sha256": source["raw_hash"], "input_size": source["original_size"],
                     "input_bbox": source["bounds"], "source_anchor": source["anchor"], "background": source["background"],
                     "common_scale": scale, "downsample_method": method, "post_scale_method": "nearest",
                     "pivot": [v*factor for v in pivot], "baseline": pivot[1]*factor})
        outputs.append((source["path"], frame, info))
    return outputs

def atomic_write(path, data):
    path = Path(path); path.parent.mkdir(parents=True, exist_ok=True)
    fd, temporary = tempfile.mkstemp(prefix=".sprite-", dir=path.parent)
    try:
        with os.fdopen(fd, "wb") as stream: stream.write(data)
        os.replace(temporary, path)
    finally:
        if os.path.exists(temporary): os.unlink(temporary)

def png_bytes(image):
    stream = BytesIO(); image.save(stream, format="PNG", optimize=False, compress_level=9)
    return stream.getvalue()

def protected_output(output, sources):
    output = Path(output).resolve()
    for source in sources:
        source = Path(source).resolve()
        if output == source or output.exists() and source.exists() and os.path.samefile(output, source):
            raise PipelineError(f"RAW/configuração imutável: saída coincide com fonte: {output}")

def process(input_path, output_path, profile, anchors=None):
    source = Path(input_path).resolve(); target = Path(output_path).resolve()
    if source.is_dir():
        if target == source or target.is_relative_to(source):
            raise PipelineError("Saída de batch não pode ficar dentro do diretório RAW.")
        paths = sorted(p for p in source.rglob('*') if p.is_file() and p.suffix.lower()=='.png')
        destinations = [target / p.relative_to(source) for p in paths]
    else:
        paths = [source]; destinations = [target]
        if target.suffix.lower() != '.png': raise PipelineError("Saída individual precisa terminar em .png.")
    protected = paths + [Path(profile[key]) for key in ('_profile_path','_palette_path','_anchors_path') if profile.get(key)]
    for destination in destinations: protected_output(destination, protected)
    report_path = target/'pipeline-report.json' if source.is_dir() else target.with_suffix('.json')
    protected_output(report_path, protected)
    results = prepare_frames(paths, profile, anchors)
    visible_profile = {k:v for k,v in profile.items() if not k.startswith('_')}
    profile_content = {**visible_profile, "palette_colors": profile.get('_colors')}
    report = {"tool_version": VERSION, "pillow_version": PILLOW_VERSION, "profile": visible_profile,
              "palette_colors": profile.get('_colors'),
              "profile_sha256": digest(json.dumps(profile_content, sort_keys=True).encode()), "frames": []}
    # All frames have already passed validation before writing any final PNG.
    for destination, (_, frame, info) in zip(destinations, results):
        data = png_bytes(frame); atomic_write(destination, data)
        info.update({"output": str(destination), "output_sha256": digest(data)})
        report["frames"].append(info)
    atomic_write(report_path, json.dumps(report, ensure_ascii=False, indent=2).encode())
    return report, [frame for _,frame,_ in results]

def make_preview(frames, scale=6):
    """Development contact sheet: checkerboard, light, dark and red backgrounds."""
    width = sum(f.width for f in frames); height=max(f.height for f in frames)
    preview = Image.new('RGBA',(width,height*4),(45,48,55,255)); draw=ImageDraw.Draw(preview)
    for y in range(0,height,4):
        for x in range(0,width,4):
            if (x//4+y//4)%2: draw.rectangle((x,y,x+3,y+3), fill=(66,70,77,255))
    for row,color in enumerate(((218,217,209,255),(15,20,27,255),(125,37,41,255)),start=1):
        draw.rectangle((0,height*row,width-1,height*(row+1)-1),fill=color)
    for row in range(4):
        x=0
        for frame in frames: preview.alpha_composite(frame,(x,row*height)); x+=frame.width
    return preview.resize((width*scale,height*4*scale),Image.Resampling.NEAREST)

def main(argv=None):
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('input',type=Path); parser.add_argument('output',type=Path,nargs='?')
    parser.add_argument('--profile',type=Path,default=Path(__file__).parent/'profiles/protagonist.json')
    parser.add_argument('--info',action='store_true')
    parser.add_argument('--downsample',choices=METHODS)
    parser.add_argument('--compare',nargs='+',choices=METHODS)
    parser.add_argument('--anchors',type=Path,help='JSON: nomes relativos ao input -> pivot original [x,y]')
    parser.add_argument('--preview',type=Path,help='Preview de desenvolvimento; nunca usar como sprite final')
    parser.add_argument('--preview-scale',type=int,default=6,help='1 para inspeção nativa; ampliação inteira nearest (padrão: 6)')
    args=parser.parse_args(argv)
    try:
        if args.info:
            image,_=open_png(args.input); print(json.dumps(inspect_image(image),ensure_ascii=False,indent=2)); return 0
        if args.output is None: raise PipelineError('Informe o arquivo/diretório de saída.')
        profile=profile_from_file(args.profile)
        anchors=None
        if args.anchors:
            profile['_anchors_path']=str(args.anchors.resolve())
            base=args.input if args.input.is_dir() else args.input.parent
            anchors={str((base/key).resolve()):value for key,value in read_json(args.anchors).items()}
        jobs=[]
        sources=list(args.input.rglob('*.png')) if args.input.is_dir() else [args.input]
        sources += [Path(profile[key]) for key in ('_profile_path','_palette_path','_anchors_path') if profile.get(key)]
        for method in args.compare or [args.downsample or profile['downsample_method']]:
            output=args.output/method if args.compare else args.output
            if args.compare and args.input.is_file(): output=output/args.input.name
            report_path=output/'pipeline-report.json' if args.input.is_dir() else output.with_suffix('.json')
            sources += [report_path]
            if args.input.is_dir():
                sources += [output/p.relative_to(args.input) for p in args.input.rglob('*') if p.is_file() and p.suffix.lower()=='.png']
            else: sources.append(output)
            preview=args.preview.with_name(args.preview.stem+'-'+method+'.png') if args.preview and args.compare else args.preview
            jobs.append((method,output,preview))
        for _,_,preview in jobs:
            if preview:
                if preview.suffix.lower()!='.png': raise PipelineError('Preview precisa terminar em .png.')
                if args.preview_scale < 1: raise PipelineError('preview-scale deve ser inteiro positivo.')
                if args.input.is_dir() and preview.resolve().is_relative_to(args.input.resolve()):
                    raise PipelineError('Preview não pode ficar dentro do diretório RAW.')
                protected_output(preview,sources)
        for method,output,preview in jobs:
            chosen=deepcopy(profile); chosen['downsample_method']=method
            report,frames=process(args.input,output,chosen,anchors)
            print(json.dumps(report,ensure_ascii=False,indent=2))
            if preview: atomic_write(preview,png_bytes(make_preview(frames,args.preview_scale)))
        return 0
    except (PipelineError,OSError,ValueError) as error:
        print('ERRO: '+str(error),file=sys.stderr); return 2

if __name__=='__main__':
    raise SystemExit(main())
