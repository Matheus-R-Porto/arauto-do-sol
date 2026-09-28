"""Read-only validation plus a deterministic rebuild of scenery ONLY."""
import hashlib
import json
from pathlib import Path
import sys
import unittest

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT/'tools/sprite_pipeline'))
from build_world import build_scenery, FINAL, HERE
from pipeline import profile_from_file, validate_final, quantize
from PIL import Image, ImageChops

class SceneryTests(unittest.TestCase):
    def test_pixel_art_keeps_exact_nearby_master_colors(self):
        profile=profile_from_file(HERE/'profiles/scenery-background.json')
        profile['source_kind']='pixel_art'
        colors=[tuple(c)+(255,) for c in profile['_colors']]
        source=Image.new('RGBA',(len(colors),1));source.putdata(colors)
        self.assertEqual(quantize(source,profile).tobytes(),source.tobytes())

    def test_profiles_alpha_palettes_and_panel_seams(self):
        manifest=json.loads((FINAL/'manifest.json').read_text(encoding='utf-8'))
        for asset in manifest['assets'].values():
            if not asset.get('profile'): continue
            with Image.open(FINAL/asset['file']) as im:
                validate_final(im,profile_from_file(HERE/asset['profile']))
                self.assertEqual(list(im.getbbox()),asset['bounds'])
        for name,bg in manifest['backgrounds'].items():
            restored=Image.new('RGBA',tuple(bg['size']))
            for panel in bg['panels']:
                with Image.open(FINAL/panel['file']) as im:
                    validate_final(im,profile_from_file(HERE/panel['profile']))
                    x,y,w,h=panel['source']
                    restored.paste(im.crop((x,y,x+w,y+h)),(panel['x'],panel['y']))
            with Image.open(ROOT/f'assets/work/world/scenery/{name}-base.png') as source:
                self.assertIsNone(ImageChops.difference(restored,source).convert('RGB').getbbox())

    def test_rebuild_is_identical_and_preserves_raw_and_characters(self):
        paths=list((ROOT/'assets/raw').rglob('*.png'))+list((ROOT/'assets/sprites').rglob('*.png'))+[FINAL/'manifest.json']
        before={p:hashlib.sha256(p.read_bytes()).hexdigest() for p in paths}
        build_scenery()
        for path,sha in before.items():
            self.assertEqual(hashlib.sha256(path.read_bytes()).hexdigest(),sha,str(path))

if __name__=='__main__': unittest.main()
