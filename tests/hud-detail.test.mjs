import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {WorldArt} from '../src/ui/world-art.js';
const json=p=>JSON.parse(readFileSync(new URL('../'+p,import.meta.url)));
const before=json('docs/hud/before-manifest.json'),after=json('assets/sprites/world/manifest.json');
const names=['medallion','health-skull','energy-frame','hud-fragment'];
// Actor presentation is covered by animation and polish tests.
assert.deepEqual(after.backgrounds,before.backgrounds);
for(const [name,a] of Object.entries(after.assets)){
 if(!names.includes(name)&&!a.file.startsWith('level/')&&!a.file.startsWith('polish/')&&!a.file.startsWith('tiles/')&&!['stone-a','stone-b','ledge','spikes'].includes(name))assert.deepEqual(a,before.assets[name],name);
 else if(names.includes(name)) {assert.equal(a.worldScale,.25);assert.deepEqual(a.pivot.map(n=>n*.25),before.assets[name].pivot);assert.ok(a.colors<=16);}
}
function draw(m,ratio,width){const result=[],a=Object.create(WorldArt.prototype);a.manifest=m;const c={drawImage:(...x)=>result.push(['draw',...x.slice(5)]),fillRect:(...x)=>result.push(['fill',...x])};a.bar(c,33,19,width,ratio,'#80bac8');return result;}
for(const width of [106,284])for(const ratio of [0,.1,.5,1])assert.deepEqual(draw(after,ratio,width),draw(before,ratio,width));
console.log('HUD: somente quatro assets alterados; pivots, dimensões e preenchimento 0/10/50/100% preservados.');
