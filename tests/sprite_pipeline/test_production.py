import json
import hashlib
from pathlib import Path
import sys
import unittest
from PIL import Image
ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/'tools/sprite_pipeline'))
import pipeline as p

class ProductionTests(unittest.TestCase):
    def test_raw_hashes_match_original_generation(self):
        recorded=json.loads((ROOT/'docs/art/raw-sha256.json').read_text())
        for name,expected in recorded.items():
            self.assertEqual(hashlib.sha256((ROOT/'assets/raw/protagonist'/name).read_bytes()).hexdigest(),expected,name)

    def test_rebuild_same_raw_and_profile_is_byte_identical(self):
        from build_protagonist import build
        paths=list((ROOT/'assets/sprites/protagonist').rglob('*.png'))
        before={path:path.read_bytes() for path in paths}
        build()
        for path,data in before.items():self.assertEqual(path.read_bytes(),data,path.name)

    def test_every_runtime_frame_has_shared_palette_canvas_pivot_and_report(self):
        profile=p.profile_from_file(ROOT/'tools/sprite_pipeline/profiles/protagonist.json')
        base=ROOT/'assets/sprites/protagonist'
        manifest=json.loads((base/'manifest.json').read_text())
        self.assertEqual(sum(len(a['frames']) for a in manifest['animations'].values()),34)
        self.assertEqual(manifest['pivot'],profile['pivot'])
        self.assertEqual(manifest['worldScale'],0.25)
        for animation in manifest['animations'].values():
            for frame in animation['frames']:
                path=base/frame['file'];image,hash=p.open_png(path)
                info=p.validate_final(image,profile)
                self.assertEqual(image.size,(128,128))
                self.assertLessEqual(info['visible_colors'],16)
                report=json.loads((path.parent/'pipeline-report.json').read_text())
                row=next(row for row in report['frames'] if Path(row['output']).name==path.name)
                self.assertEqual(row['pivot'],frame['pivot']);self.assertEqual(row['output_sha256'],hash)
                self.assertEqual(row['downsample_method'],'lanczos')
                self.assertEqual(row['post_scale_method'],'nearest')

    def test_animation_frames_are_not_duplicate_placeholders(self):
        base=ROOT/'assets/sprites/protagonist'
        manifest=json.loads((base/'manifest.json').read_text())
        for name,animation in manifest['animations'].items():
            self.assertGreater(len({p.open_png(base/f['file'])[1] for f in animation['frames']}),1,name)

    def test_raw_layouts_do_not_clip_visible_pixels_and_preserve_scale(self):
        recipe=json.loads((ROOT/'tools/sprite_pipeline/protagonist-build.json').read_text())
        for item in recipe['sets']:
            image,_=p.open_png(ROOT/'assets/raw/protagonist'/f"{item['name']}-strip.png")
            self.assertEqual(list(image.size),item['source_size'])
            for frame in item['frames']:
                crop=image.crop(frame['box']);bbox=crop.getchannel('A').point(lambda a:255 if a>=128 else 0).getbbox()
                self.assertGreater(bbox[0],0);self.assertGreater(bbox[1],0)
                self.assertLess(bbox[2],crop.width);self.assertLess(bbox[3],crop.height)
            report=json.loads((ROOT/'assets/sprites/protagonist'/item['name']/'pipeline-report.json').read_text())
            self.assertEqual(len({f['common_scale'] for f in report['frames']}),1)
            self.assertAlmostEqual(report['frames'][0]['common_scale'],96/item['source_body_height'])

if __name__=='__main__':unittest.main()
