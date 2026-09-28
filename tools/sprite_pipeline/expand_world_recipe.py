"""One-time authored art inventory; idempotently replaces named recipe groups."""
from pathlib import Path
import json
p=Path(__file__).with_name('world-build.json')
r=json.loads(p.read_text())
sets=[
 ('landmarks','props',[('statue',64,116),('mausoleum',108,112),('window',62,108),('bones',105,58)]),
 ('relics','props',[('bell',60,100),('dead-tree',120,118),('urns',66,64),('gravestones',60,51)]),
 ('interactions','props',[('shrine',34,42),('fountain',36,42),('lever',28,24),('sun-key',10,22)]),
 ('secrets','props',[('fragment',9,10),('secret-stone',24,32),('end-arch',52,62),('ladder',14,38)]),
 ('hud','hud',[('medallion',28,28),('energy-frame',98,12),('health-skull',8,8),('hud-fragment',5,6)]),
 ('effects','effects',[('slash-light',30,24),('slash-heavy',42,30),('hit',16,16),('projectile',10,8)]),
 ('effects-extra','effects',[('shockwave',120,16),('dust',32,13),('flame',10,14),('projectile-2',10,8)]),
]
names={x[0] for x in sets}|{'walker','lunger','ranged','boss'}
r['sets']=[s for s in r['sets'] if s['raw'] not in names]
for raw,profile,items in sets:r['sets'].append(dict(raw=raw,profile=profile,grid=[2,2],components=raw in ['landmarks','relics','interactions','secrets'],frames=[dict(name=n,target=[w,h]) for n,w,h in items]))
for raw,height in [('walker',24),('lunger',18),('ranged',32),('boss',65)]:
 poses=['idle','walk-1','walk-2','hurt']+(['slash-windup','slash-active','charge-windup','charge-active','slam-windup','slam-active','recovery','death'] if raw=='boss' else ['windup','active','recovery','death'])
 r['sets'].append(dict(raw=raw,profile='boss' if raw=='boss' else 'enemy',grid=[4,3 if raw=='boss' else 2],components=True,body_height=height,feet=True,frames=[dict(name=f'{raw}-{pose}') for pose in poses]))
p.write_text(json.dumps(r,indent=2)+'\n',encoding='utf-8')
