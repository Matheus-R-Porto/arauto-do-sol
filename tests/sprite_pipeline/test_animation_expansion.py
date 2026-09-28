import json,hashlib,sys,unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/'tools/sprite_pipeline'))
from build_animations import build
from pipeline import profile_from_file,open_png,validate_final
class ExpansionTests(unittest.TestCase):
    def test_raw_sources_are_immutable(self):
        hashes=json.loads((ROOT/'docs/animations-v2/raw-sha256.json').read_text())
        for name,sha in hashes.items():
            self.assertEqual(hashlib.sha256((ROOT/'assets/raw/animations-v2'/name).read_bytes()).hexdigest(),sha,name)
    def test_expansion_rebuild_is_byte_identical(self):
        paths=list((ROOT/'assets/sprites').glob('*/v2/**/*.png'))
        before={p:p.read_bytes() for p in paths}
        build()
        for path,data in before.items():self.assertEqual(path.read_bytes(),data,str(path))
    def test_all_generated_frames_are_distinct_and_scale_is_shared_per_set(self):
        report=json.loads((ROOT/'docs/animations-v2/production-all.json').read_text())
        for name,group in report.items():
            frames=group['frames']
            self.assertEqual(len({f['scale'] for f in frames}),1,name)
            self.assertEqual(len({f['report']['output_sha256'] for f in frames}),len(frames),name)
            for f in frames:
                self.assertEqual(f['report']['downsample_method'],'lanczos')
                self.assertEqual(f['report']['post_scale_method'],'nearest')
    def test_player_master_palette_still_shared(self):
        profile=profile_from_file(ROOT/'tools/sprite_pipeline/profiles/protagonist.json')
        m=json.loads((ROOT/'assets/sprites/protagonist/manifest.json').read_text())
        for a in m['animations'].values():
            for f in a['frames']:
                image,_=open_png(ROOT/'assets/sprites/protagonist'/f['file'])
                self.assertLessEqual(validate_final(image,profile)['visible_colors'],16)
if __name__=='__main__':unittest.main()
