import json, sys, unittest
from pathlib import Path
from PIL import Image
ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT/'tools/sprite_pipeline'))
from pipeline import profile_from_file, validate_final

class ResolutionTests(unittest.TestCase):
    def test_requested_dimensions_and_unchanged_world_scale(self):
        specs = {'player':(128,96,24,20,80), 'walker':(128,88,24,20,80),
                 'ranged':(128,88,32,20,80), 'lunger':(64,27,18,40,20),
                 'boss':(256,144,65,80,120)}
        for actor,(canvas,height,world_height,min_width,min_height) in specs.items():
            family = 'protagonist' if actor=='player' else 'world'
            base=ROOT/'assets/sprites'/family
            m=json.loads((base/'manifest.json').read_text(encoding='utf-8'))
            profile=profile_from_file(ROOT/'tools/sprite_pipeline/profiles'/('protagonist.json' if actor=='player' else actor+'-animation.json'))
            animations=m['animations'] if actor=='player' else m['animations'][actor]
            for name,animation in animations.items():
                for f in animation['frames']:
                    asset=m if actor=='player' else m['assets'][f['asset']]
                    im=Image.open(base/f['file']);info=validate_final(im,profile)
                    self.assertEqual(im.size,(canvas,canvas))
                    self.assertAlmostEqual(asset['worldScale']*height,world_height)
                    pivot=f['pivot'] if actor=='player' else asset['pivot']
                    self.assertTrue(all(0<=v<canvas for v in pivot))
                    l,t,r,b=info['visible_bbox']
                    if name=='idle':
                        self.assertGreaterEqual(r-l,min_width)
                        self.assertGreaterEqual(b-t,min_height)
                    if actor=='lunger':
                        self.assertLessEqual(r-l,64);self.assertLessEqual(b-t,48)

    def test_transparent_padding_preserves_raw_anchor(self):
        report=json.loads((ROOT/'docs/animations-v2/production-all.json').read_text(encoding='utf-8'))
        for name,group in report.items():
            if name.startswith('vfx/'): continue  # Unchanged effects can have faint extended halos.
            for f in group['frames']:
                r=f['report'];src=r['input_bbox'];anchor=r['source_anchor'];scale=r['common_scale']
                # Resampling may remove a faint edge pixel, but moving the canvas
                # must never shift the anatomical anchor in world space.
                for axis in (0,1):
                    expected=round((src[axis]-anchor[axis])*scale)
                    actual=r['visible_bbox'][axis]-r['pivot'][axis]
                    self.assertLessEqual(abs(expected-actual),2)

if __name__=='__main__': unittest.main()
