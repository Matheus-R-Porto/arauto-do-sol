import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';import {createHash} from 'node:crypto';
import {masonryVariant,drawMasonry,masonryVariants} from '../src/ui/terrain-material.js';
const read=p=>readFileSync(new URL('../'+p,import.meta.url));const j=p=>JSON.parse(read(p));
for(const [file,hash] of Object.entries(j('docs/tiles/protected.json')))if(!['src/world/rooms/cemetery.js','src/world/room-manager.js','src/world/cemetery-events.js'].includes(file))assert.equal(createHash('sha256').update(read(file)).digest('hex'),hash,file);
const before=j('docs/tiles/manifest-before.json'),now=j('assets/sprites/world/manifest.json');
for(const [name,a]of Object.entries(before.assets))if(!['stone-a','stone-b','wall-intact','wall-cracked','wall-broken','wall-rubble'].includes(name))assert.deepEqual(now.assets[name],a,name);
for(const name of ['stone-a','stone-b'])for(const key of ['canvas','pivot','bounds','worldScale','repeatSize'])assert.deepEqual(now.assets[name][key],before.assets[name][key]);
assert.deepEqual(now.animations,before.animations);assert.deepEqual(now.backgrounds,before.backgrounds);
const chosen=[];for(let y=-4;y<20;y++)for(let x=-4;x<30;x++){const a=masonryVariant('awakening',x,y);assert.equal(a,masonryVariant('awakening',x,y));chosen.push(a);}
assert.equal(new Set(chosen).size,3);assert.notDeepEqual(chosen,chosen.map((_,i)=>masonryVariants[i%3]));
const assets=Object.fromEntries(masonryVariants.map(name=>[name,{bounds:[192,112,320,240],image:name}]));
const samples=(rects)=>{const out=new Map();for(const rect of rects)drawMasonry({drawImage:(name,sx,sy,sw,sh,x,y,w,h)=>{for(let yy=0;yy<h;yy++)for(let xx=0;xx<w;xx++)out.set(`${x+xx},${y+yy}`,[name,sx+xx*4,sy+yy*4]);}},assets,'awakening',...rect);return out;};
const whole=samples([[-8,-8,48,48]]),parts=[];for(let y=-8;y<40;y+=8)for(let x=-8;x<40;x+=8)parts.push([x,y,8,8]);const split=samples(parts);assert.equal(whole.size,split.size);for(const[k,v]of whole)assert.deepEqual(split.get(k),v);
console.log('Tiles: protected gameplay/actors, approved scales, deterministic distribution, and identical partial-tile sampling verified.');
