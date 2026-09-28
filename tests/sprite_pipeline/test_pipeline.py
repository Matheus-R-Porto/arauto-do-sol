"""Production constraints tested with synthetic fixtures, never with runtime art."""
from contextlib import redirect_stdout, redirect_stderr
from copy import deepcopy
from io import StringIO
import json
import os
from pathlib import Path
import sys
import tempfile
import unittest
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'tools' / 'sprite_pipeline'))
import pipeline as p


def profile(**changes):
    result = dict(schema_version=1, name='test-fixture', max_frame=[128,128],
                  canvas=[24,24], pivot=[12,22], visible_size=[20,20], margin=1,
                  source_kind='high_res', downsample_method='nearest', scale_reference=None,
                  source_pivot=None, pixel_scale=1, max_colors=16, palette=None,
                  require_fixed_palette=False, alpha_threshold=128, dither=False,
                  background=dict(mode='auto', color=None, tolerance=10))
    result.update(changes)
    return result


class PipelineTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        self.raw = self.root / 'raw'
        self.raw.mkdir()
        self.source = self.fixture('a.png')

    def tearDown(self):
        self.temp.cleanup()

    def fixture(self, name, box=(6,4,13,19), color=(197,173,120,255)):
        im = Image.new('RGBA', (32,32), (0,0,0,0))
        ImageDraw.Draw(im).rectangle(box, fill=color)
        path = self.raw/name
        path.parent.mkdir(parents=True, exist_ok=True)
        im.save(path)
        return path

    def frame(self, config=None, paths=None, anchors=None):
        return p.prepare_frames(paths or [self.source], config or profile(), anchors)

    def test_final_rgba_binary_margin_and_native_size(self):
        _,im,info=self.frame()[0]
        self.assertEqual(im.size, (24,24))
        self.assertEqual(info['alpha'], 'binary')
        self.assertTrue(info['transparent'])
        self.assertEqual(info['visible_bbox'], (8,6,16,22))
        self.assertEqual(info['pivot'], [12,22])

    def test_maximum_is_not_target(self):
        _,im,info=self.frame(profile(canvas=None,pivot=None))[0]
        self.assertEqual(im.size, (10,18))
        self.assertEqual(info['common_scale'], 1)

    def test_batch_common_scale_and_baseline(self):
        other=self.fixture('b.png', box=(6,8,15,19))
        rows=self.frame(profile(visible_size=[10,8]), [self.source,other])
        self.assertEqual([r[2]['common_scale'] for r in rows], [.5,.5])
        self.assertEqual([r[2]['visible_bbox'][3] for r in rows], [22,22])
        self.assertEqual([r[1].size for r in rows], [(24,24),(24,24)])

    def test_explicit_anchor_preserves_body_when_weapon_extends(self):
        other=self.fixture('b.png')
        im=Image.open(other).convert('RGBA')
        ImageDraw.Draw(im).rectangle((14,9,19,10), fill=(220,220,220,255)); im.save(other)
        rows=self.frame(profile(source_pivot=[10,20]), [self.source,other])
        self.assertEqual(rows[0][1].getpixel((8,6)), rows[1][1].getpixel((8,6)))
        self.assertEqual(rows[0][2]['visible_bbox'][0],rows[1][2]['visible_bbox'][0])

    def test_per_frame_source_anchors_correct_raw_translation(self):
        other=self.fixture('b.png',box=(8,7,15,22))
        anchors={str(self.source):[10,20],str(other):[12,23]}
        rows=self.frame(paths=[self.source,other],anchors=anchors)
        self.assertEqual(rows[0][1].tobytes(),rows[1][1].tobytes())

    def test_calibration_uses_same_scale_across_separate_calls(self):
        other=self.fixture('b.png',box=(6,8,15,19))
        config=profile(scale_reference=dict(source_pixels=32,target_pixels=16))
        self.assertEqual(self.frame(config)[0][2]['common_scale'],self.frame(config,[other])[0][2]['common_scale'])

    def test_alpha_always_preserved_before_threshold(self):
        im=Image.new('RGBA',(5,5),(255,255,255,255)); im.putpixel((0,0),(255,255,255,128))
        clean,info=p.remove_background(im,profile()['background'])
        self.assertEqual(clean.tobytes(),im.tobytes())
        self.assertEqual(info['action'],'preserved_alpha')

    def test_flood_fill_does_not_erase_enclosed_same_color(self):
        im=Image.new('RGBA',(9,9),'white'); draw=ImageDraw.Draw(im)
        draw.rectangle((2,2,6,6),outline='black',width=1)
        clean,info=p.remove_background(im,profile()['background'])
        self.assertEqual(clean.getpixel((0,0))[3],0)
        self.assertEqual(clean.getpixel((4,4)),(255,255,255,255))
        self.assertEqual(info['removed_pixels'],56)

    def test_ambiguous_background_fails(self):
        im=Image.new('RGBA',(2,2)); im.putdata([(255,0,0,255),(0,255,0,255),(0,0,255,255),(255,255,255,255)])
        with self.assertRaisesRegex(p.PipelineError,'ambíguo'): p.remove_background(im,profile()['background'])

    def test_alpha_threshold_and_hidden_rgb(self):
        im=Image.new('RGBA',(3,1)); im.putdata([(230,20,20,127),(220,220,220,128),(10,20,30,0)])
        result=p.quantize(im,profile())
        self.assertEqual(result.getpixel((0,0)),(0,0,0,0))
        self.assertEqual(result.getpixel((1,0))[3],255)
        self.assertEqual(result.getpixel((2,0)),(0,0,0,0))

    def test_shared_palette_membership(self):
        config=profile(_colors=[(0,0,0),(255,255,255)],require_fixed_palette=True)
        _,im,info=self.frame(config)[0]
        self.assertLessEqual(info['visible_colors'],2)
        self.assertLessEqual({p.rgb(c) for c in info['colors']},set(config['_colors']))

    def test_sixteen_is_not_a_global_limit(self):
        colors=[(v*8,v*8,v*8) for v in range(32)]
        im=Image.new('RGBA',(32,1)); im.putdata([(*c,255) for c in colors])
        result=p.quantize(im,profile(max_colors=32,_colors=colors))
        self.assertEqual(p.inspect_image(result)['visible_colors'],32)

    def test_profile_requires_master_palette(self):
        with self.assertRaisesRegex(p.PipelineError,'paleta mestre'): p.validate_profile(profile(require_fixed_palette=True))

    def test_profile_rejects_oversize_canvas(self):
        with self.assertRaises(p.PipelineError): p.validate_profile(profile(canvas=[129,40]))
        p.validate_profile(profile(max_frame=[256,256],canvas=[256,256]))

    def test_post_scale_nearest_blocks(self):
        base=self.frame()[0][1]
        enlarged=self.frame(profile(pixel_scale=2))[0][1]
        self.assertEqual(enlarged.tobytes(),base.resize((48,48),Image.Resampling.NEAREST).tobytes())

    def test_post_scale_must_respect_maximum(self):
        with self.assertRaisesRegex(p.PipelineError,'max_frame'): self.frame(profile(pixel_scale=6))

    def test_pixel_base_forces_nearest(self):
        config=profile(source_kind='pixel_art',downsample_method='lanczos',visible_size=[4,8])
        self.assertEqual(self.frame(config)[0][2]['downsample_method'],'nearest')

    def test_all_initial_filters_supported(self):
        for method in p.METHODS:
            self.assertEqual(self.frame(profile(downsample_method=method,visible_size=[4,8]))[0][2]['downsample_method'],method)

    def test_empty_image_fails(self):
        Image.new('RGBA',(4,4)).save(self.source)
        with self.assertRaisesRegex(p.PipelineError,'vazia'): self.frame()

    def test_invalid_batch_writes_nothing(self):
        Image.new('RGBA',(4,4)).save(self.raw/'empty.png')
        with self.assertRaises(p.PipelineError): p.process(self.raw,self.root/'final',profile())
        self.assertFalse((self.root/'final').exists())

    def test_raw_file_and_raw_directory_cannot_be_outputs(self):
        original=self.source.read_bytes()
        with self.assertRaises(p.PipelineError): p.process(self.source,self.source,profile())
        with self.assertRaises(p.PipelineError): p.process(self.raw,self.raw/'export',profile())
        self.assertEqual(original,self.source.read_bytes())

    def test_hardlink_to_raw_is_protected(self):
        linked=self.root/'linked.png'
        os.link(self.source,linked)
        with self.assertRaises(p.PipelineError): p.process(self.source,linked,profile())

    def test_repeated_export_is_byte_identical(self):
        output=self.root/'final.png'
        p.process(self.source,output,profile()); first=output.read_bytes()
        p.process(self.source,output,profile()); self.assertEqual(first,output.read_bytes())
        report=json.loads(output.with_suffix('.json').read_text())
        self.assertEqual(report['frames'][0]['input_sha256'],p.digest(self.source.read_bytes()))
        self.assertEqual(report['frames'][0]['output_sha256'],p.digest(first))

    def test_recursive_batch_preserves_structure(self):
        self.fixture('walk/b.png')
        report,_=p.process(self.raw,self.root/'final',profile())
        self.assertEqual(len(report['frames']),2)
        self.assertTrue((self.root/'final/walk/b.png').exists())

    def test_anchor_file_cannot_be_overwritten_by_report(self):
        anchor=self.root/'out.json'; anchor.write_text('{}')
        with self.assertRaises(p.PipelineError): p.process(self.source,self.root/'out.png',profile(_anchors_path=str(anchor)))
        self.assertEqual(anchor.read_text(),'{}')

    def test_palette_load_relative_to_profile(self):
        (self.root/'colors.json').write_text('["#000000", "#ffffff"]')
        path=self.root/'profile.json'; path.write_text(json.dumps(profile(palette='colors.json',require_fixed_palette=True)))
        self.assertEqual(p.profile_from_file(path)['_colors'],[(0,0,0),(255,255,255)])

    def test_preview_is_separate_has_four_backgrounds(self):
        im=self.frame()[0][1]
        preview=p.make_preview([im],1)
        self.assertEqual(preview.size,(24,96))
        self.assertEqual(len({preview.getpixel((0,y)) for y in (0,24,48,72)}),4)

    def test_cli_preview_cannot_overwrite_raw_or_final(self):
        config=self.root/'profile.json'; config.write_text(json.dumps(profile()))
        output=self.root/'out.png'
        for forbidden in (self.source,output,self.root/'out.json'):
            with redirect_stdout(StringIO()),redirect_stderr(StringIO()):
                code=p.main([str(self.source),str(output),'--profile',str(config),'--preview',str(forbidden)])
            self.assertEqual(code,2)
            self.assertFalse(output.exists())

    def test_cli_compare_exports_reports_and_native_previews(self):
        config=self.root/'profile.json'; config.write_text(json.dumps(profile()))
        output=self.root/'compare'
        with redirect_stdout(StringIO()),redirect_stderr(StringIO()):
            code=p.main([str(self.source),str(output),'--profile',str(config),'--compare','nearest','box','lanczos','--preview',str(self.root/'preview.png'),'--preview-scale','1'])
        self.assertEqual(code,0)
        for method in ('nearest','box','lanczos'):
            self.assertTrue((output/method/'a.png').exists())
            self.assertTrue((output/method/'a.json').exists())
            with Image.open(self.root/f'preview-{method}.png') as preview:
                self.assertEqual(preview.size,(24,96))


if __name__=='__main__': unittest.main()
