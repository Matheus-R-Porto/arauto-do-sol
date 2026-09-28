import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {WorldArt} from '../src/ui/world-art.js';
const read=p=>readFileSync(new URL('../'+p,import.meta.url)),json=p=>JSON.parse(read(p));
const before=json('docs/scenery/source-manifest.json'),after=json('assets/sprites/world/manifest.json');
const spec=json('tools/sprite_pipeline/scenery-build.json'),recipe=json('tools/sprite_pipeline/world-build.json');
const names=recipe.sets.filter(g=>spec.groups.includes(g.raw)).flatMap(g=>g.frames.map(f=>f.name));
let checks=0;const test=(name,fn)=>{fn();checks++;console.log('PASSOU',name);};
test('somente os 24 cenários previstos e quatro fundos foram substituídos',()=>{
 assert.equal(names.length,24);assert.deepEqual(Object.keys(after.assets),Object.keys(before.assets));
 assert.deepEqual(after.animations,before.animations);assert.deepEqual(after.rawHashes,before.rawHashes);
 for(const [name,a]of Object.entries(after.assets)){
  if(names.includes(name)){assert.ok(a.file.startsWith('scenery/'));assert.equal(a.worldScale,.25);assert.deepEqual(a.pivot.map(x=>x*.25),before.assets[name].pivot);}
  else if(!['medallion','health-skull','energy-frame','hud-fragment'].includes(name))assert.deepEqual(a,before.assets[name],name);
 }
 for(const b of Object.values(after.backgrounds)){assert.deepEqual(b.worldSize,[480,270]);assert.deepEqual(b.size,[960,540]);}
});
test('RAWs, personagens, gameplay, mapas e câmera congelados permanecem idênticos',()=>{
 for(const [path,hash]of Object.entries(json('docs/scenery/frozen.json')))assert.equal(createHash('sha256').update(read(path==='src/main.js'?'docs/display/main-before.js':path)).digest('hex'),hash,path);
});
test('presença espacial dos props e pivots mantidos; única exceção é apoio das raízes',()=>{
 for(const name of names){
  const a=after.assets[name],b=before.assets[name];
  assert.deepEqual(a.worldOffset,name==='dead-tree'?[0,2]:[0,0]);
  for(let i=0;i<4;i++)assert.ok(Math.abs(a.bounds[i]*a.worldScale-b.bounds[i])<=1.5,`${name} bound ${i}`);
 }
});
test('todas as instâncias preservam posição, camada, opacidade e relação com o tile',()=>{
 execFileSync(process.execPath,['tools/audit-scenery.mjs'],{cwd:new URL('../',import.meta.url)});
 const b=json('docs/scenery/positions-before.json'),a=json('docs/scenery/positions-after.json');
 assert.equal(a.length,17);
 for(let i=0;i<a.length;i++){
  assert.equal(a[i].id,b[i].id);assert.deepEqual(a[i].size,b[i].size);assert.equal(a[i].placements.length,b[i].placements.length);
  for(let j=0;j<a[i].placements.length;j++)for(const key of ['name','layer','x','y','flip','opacity','interactive','tileAtAnchor'])assert.deepEqual(a[i].placements[j][key],b[i].placements[j][key],`${a[i].id}/${j}/${key}`);
 }
});
test('tiles parciais e repetição desenham os mesmos retângulos de mundo',()=>{
 function calls(manifest,name,args){const result=[],a=Object.create(WorldArt.prototype);a.manifest=manifest;a.patch({drawImage:(...x)=>result.push(x.slice(5))},name,...args);return result;}
 for(const name of ['stone-a','stone-b','ledge','spikes'])for(const args of [[0,0,16,16,0,0],[123,87,16,5,16,0],[.5,1.5,79,33,31,7]])assert.deepEqual(calls(after,name,args),calls(before,name,args),name);
});
console.log(`${checks}/${checks} testes de cenário ok`);
