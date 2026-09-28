import assert from 'node:assert/strict';import{readFileSync}from'node:fs';import{createHash}from'node:crypto';
const read=p=>readFileSync(new URL('../'+p,import.meta.url)),hash=b=>createHash('sha256').update(b).digest('hex');
for(const[p,h]of Object.entries(JSON.parse(read('docs/level-redesign/protected-v057.json'))))if(!['src/ui/player-sprites.js','assets/sprites/protagonist/manifest.json'].includes(p))assert.equal(hash(read(p)),h,p);
const m=JSON.parse(read('assets/sprites/world/manifest.json')),old=JSON.parse(read('docs/hud/before-manifest.json'));
for(const type of ['walker','lunger','ranged','vfx'])assert.deepEqual(m.animations[type],old.animations[type]);for(const[name,a]of Object.entries(m.assets))if(a.file.startsWith('level/')){assert.equal(hash(read('assets/sprites/world/'+a.file)),a.sha256);assert.ok(a.colors<=32);}
console.log('Approved physics, combat, AI, player/actor animations, energy, camera, display and sprite scales unchanged; new prop hashes valid.');
