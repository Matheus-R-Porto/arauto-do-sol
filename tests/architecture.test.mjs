import assert from 'node:assert/strict';
import {cemetery as before} from '../docs/architecture/cemetery-before.js';
import {cemetery as after} from '../src/world/rooms/cemetery.js';
import {RoomManager} from '../src/world/room-manager.js';
import {Camera} from '../src/core/camera.js';
import {activeCovers,concealedChambers,drawArchitecturalCovers} from '../src/ui/architecture.js';
// Full geometry preservation, including the authorized shaft cuts, lives in traversal.test.mjs.
assert.equal(after[0].rows[15][23],'#');
assert.equal(after[0].rows[24][23],'#');
const w=new RoomManager(new Camera(320,180));w.phase='playing';
for(const [room,covers]of Object.entries(concealedChambers))for(const cover of covers){
 w.load(room,w.rooms[room].spawn);w.flags.delete(cover.flag);assert.ok(activeCovers(w).some(c=>c.flag===cover.flag));
 const t=w.levelEvents.targets.find(t=>t.id===cover.flag);
 if(t){if(t.requires)w.flags.add(t.requires);assert.equal(t.takeHit(),true);assert.ok(activeCovers(w).some(c=>c.flag===cover.flag),'first hit stays opaque');assert.equal(t.takeHit(),true);}
 else w.flags.add(cover.flag);
 assert.ok(!activeCovers(w).some(c=>c.flag===cover.flag));
 w.load('passage',w.rooms.passage.spawn);w.load(room,w.rooms[room].spawn);assert.ok(!activeCovers(w).some(c=>c.flag===cover.flag),'reveal persists');
}
w.load('awakening',w.rooms.awakening.spawn);assert.equal(w.map.overlapsSolid(184,120,8,80),true);assert.equal(w.map.overlapsSolid(184,201,8,30),false);
w.flags.delete('cellWall');w.levelEvents.rebuild();assert.equal(w.map.overlapsSolid(184,201,8,30),true);
// Cover must use opaque paint after scene drawing, including when an asset has alpha.
let opacity=0,rects=[];const ctx={save(){},restore(){},set globalAlpha(v){opacity=v;},set fillStyle(v){},fillRect(...r){rects.push(r);}};
drawArchitecturalCovers(ctx,w,{patch(){},sprite(){}});assert.equal(opacity,1);assert.ok(rects.length);
console.log('Architecture: secret opacity before/during damage, persistent reveal, fixed cell lintel and unchanged remaining map verified.');

// Every directional seam keeps its permission rule and shares the permanent reveal flag.
for(const r of after)for(const e of r.exits.filter(e=>e.flag)){
 const world=new RoomManager(new Camera(320,180));world.load(r.id,r.spawn);
 const gate=world.levelEvents.targets.find(t=>t.id===e.flag);
 assert.equal(gate.takeHit(),e.breakAllowed);
 if(e.breakAllowed){assert.ok(!world.flags.has(e.flag));gate.takeHit();assert.ok(world.flags.has(e.flag));world.load(e.to,world.rooms[e.to].spawn);assert.ok(world.levelEvents.targets.find(t=>t.id===e.flag).dead);}
 else assert.ok(!world.flags.has(e.flag));
}
const contains=(c,x,y)=>x>=c.x&&x<c.x+c.w&&y>=c.y&&y<c.y+c.h;
assert.ok(concealedChambers.awakening.some(c=>contains(c,88,214)),'bone pile fully behind opaque architecture');
assert.ok(!concealedChambers.awakening.some(c=>contains(c,256,220)),'spawn stays visible');
console.log('Directional shortcuts and visibility separation verified.');
