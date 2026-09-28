import assert from 'node:assert/strict';
import {cemetery as before} from '../docs/traversal/cemetery-before.js';
import {cemetery as after} from '../src/world/rooms/cemetery.js';
import {RoomManager} from '../src/world/room-manager.js';import {Camera} from '../src/core/camera.js';
import {GreyboxDriver} from './greybox-driver.js';import {navigation,input} from './greybox-navigation.js';
// Local geometry changes; the room order and connection graph remain fixed.
assert.deepEqual(after.map(r=>r.id),before.map(r=>r.id));
for(const r of after){const old=before.find(b=>b.id===r.id);assert.deepEqual(r.exits.map(e=>[e.to,e.connection,e.flag]),old.exits.map(e=>[e.to,e.connection,e.flag]));assert.equal(r.enemies.length,old.enemies.length);}
for(const r of after)for(const e of r.exits.filter(e=>e.axis==='y')){
 const w=new RoomManager(new Camera(320,180));w.phase='playing';if(r.arena)w.flags.add(r.arena.id); // Return route is tested after the arena unlocks.
 const own=r.entries[e.connection+':'+r.id];w.load(r.id,own);w.arrival=0;
 // Use actual gravity/jump/movement to cross each direction, never write position after setup.
 const bot=new GreyboxDriver();bot.nav=navigation(w.map);let crossed=false;
 for(let n=0;n<600;n++){
  const k=bot.next(w,e);w.update(1/60,k);
  if(w.transition){crossed=true;break;}
 }
 assert.ok(crossed,`${r.id} -> ${e.to} ordinary traversal`);
 for(let n=0;n<23;n++)w.update(1/60,input(0,false,false));
 assert.equal(w.room.id,e.to);
 assert.ok(!w.map.overlapsSolid(w.player.left,w.player.top,w.player.w,w.player.h));
 assert.ok(w.player.x>=w.camera.ox&&w.player.x<=w.camera.ox+w.camera.w);
 assert.ok(w.player.y>=w.camera.oy&&w.player.y<=w.camera.oy+w.camera.h);
 assert.ok(w.camera.ox>=0&&w.camera.oy>=0&&w.camera.ox+w.camera.w<=w.map.width&&w.camera.oy+w.camera.h<=w.map.height);
 console.log(`${r.number}->${w.room.number}: ${e.side}, clear collider, normal controls, framed arrival`);
}
console.log('Traversal: local geometry only, unchanged topology/encounters, all six vertical directions traversed.');
import {route,nearest} from './greybox-navigation.js';
const tower=new RoomManager(new Camera(320,180));tower.phase='playing';tower.load('watch',tower.rooms.watch.entries['crossroads:watch:main:watch']);
for(const id of ['upperChamber','leverChamber']){
 const target=tower.levelEvents.targets.find(b=>b.id===id),nav=navigation(tower.map);
 assert.ok(route(nav,nearest(nav,tower.room.spawn),nearest(nav,{x:target.x-16,y:target.y})),id+' approach reachable');
 target.takeHit();target.takeHit();const opened=navigation(tower.map),item=id==='upperChamber'?tower.room.breakables.find(b=>b.id==='towerBones'):tower.room.lever;
 assert.ok(route(opened,nearest(opened,{x:target.x-16,y:target.y}),nearest(opened,item)),id+' chamber reachable');
 assert.ok(route(opened,nearest(opened,item),nearest(opened,tower.room.exits.find(e=>e.to==='bridge'&&!e.flag))),id+' return to main route');
}
console.log('Room 4: both chamber approaches and return paths pass on the solid collision grid.');
