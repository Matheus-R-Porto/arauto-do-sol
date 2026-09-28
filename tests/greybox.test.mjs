import assert from 'node:assert/strict';
import {RoomManager}from'../src/world/room-manager.js';import{Camera}from'../src/core/camera.js';import{cemetery}from'../src/world/rooms/cemetery.js';import{validateRooms}from'../src/world/validate.js';import{navigation,route,nearest,input}from'./greybox-navigation.js';
const world=()=>{const w=new RoomManager(new Camera(320,180));w.phase='playing';return w;};
const step=(w,i=input(),n=1)=>{for(let j=0;j<n;j++)w.update(1/60,i);};
assert.equal(cemetery.length,10);validateRooms(cemetery,'awakening');assert.equal(cemetery[1].enemies.length,0);
let w=world();
const b=w.levelEvents.targets.find(b=>b.id==='cellBones');w.player.reset(b.x+24,b.y);w.player.facing=-1;
for(let hit=1;hit<=4;hit++){w.energy.refill();step(w,input(),30);const i=input();i.pressed.attackLight=true;step(w,i);assert.equal(w.flags.has(b.id),hit===4);}
assert.equal(w.health.fragments,0);assert.equal(w.levelEvents.drops.get('cellBones').length,4);
step(w,input(),180);assert.ok(w.levelEvents.bones>0);
w.load('watch',w.rooms.watch.spawn);let s=w.levelEvents.targets.find(b=>b.id==='lowerShortcut');assert.equal(s.takeHit(),false);assert.equal(w.flags.has('lowerShortcut'),false);
w.load('bridge',w.rooms.bridge.spawn);s=w.levelEvents.targets.find(b=>b.id==='lowerShortcut');s.takeHit();s.takeHit();assert.ok(w.flags.has('lowerShortcut'));
w.load('crossroads',w.rooms.crossroads.spawn);s=w.levelEvents.targets.find(b=>b.id==='returnShortcut');assert.equal(s.takeHit(),false);
w.load('guardian',w.rooms.guardian.spawn);s=w.levelEvents.targets.find(b=>b.id==='returnShortcut');s.takeHit();s.takeHit();assert.ok(w.flags.has('returnShortcut'));
w=world();w.load('crossroads',w.rooms.crossroads.spawn);let nav=navigation(w.map);assert.equal(route(nav,nearest(nav,w.room.spawn),nearest(nav,{x:460,y:168})),null,'high lift unreachable');
w.flags.add('liftLever');w.flags.add('upperSecretWall');w.levelEvents.liftY=w.room.lift.low;w.levelEvents.rebuild();nav=navigation(w.map);assert.ok(route(nav,nearest(nav,w.room.spawn),nearest(nav,w.room.cache)),'secret reachable after lever');
w.load('sentries',w.rooms.sentries.spawn);w.player.reset(240,224);w.levelEvents.update(.01);assert.equal(w.arenaLocked,true);w.levelEvents.update(1.1);assert.equal(w.enemies.length,2);
for(const e of w.enemies)e.takeHit(999,0,0);w.levelEvents.update(.01);w.levelEvents.update(1.3);assert.equal(w.enemies.length,3);for(const e of w.enemies)e.takeHit(999,0,0);w.levelEvents.update(.01);assert.ok(w.flags.has('arenaComplete'));assert.equal(w.arenaLocked,false);
w.flags.add('lowerChest');w.flags.add('lowerShortcut');w.flags.add('returnShortcut');w.flags.add('cellWall');w.bossDefeated=true;w.flags.add('bossKey');w.flags.add('finalDoor');const flags=[...w.flags];w.respawn();for(const f of flags)assert.ok(w.flags.has(f));w.load('sentries',w.rooms.sentries.spawn);w.player.reset(240,224);w.levelEvents.update(5);assert.equal(w.enemies.length,0);assert.equal(w.levelEvents.arena.phase,'complete');w.load('guardian',w.rooms.guardian.spawn);assert.equal(w.boss,null);
// Thresholds: proximity alone never changes rooms; crossing the seam does.
for(const r of cemetery)for(const e of r.exits.filter(e=>e.axis!=='y')){w=world();if(e.flag)w.flags.add(e.flag);w.load(r.id,{x:e.x-e.direction*8,y:e.y});w.arrival=0;w.interactions(input(e.direction));assert.equal(w.transition,null);w.player.x=e.x+(e.flag?4:0)+e.direction;w.interactions(input(e.direction));assert.ok(w.transition,`${r.id} -> ${e.to}`);step(w,input(),90);assert.equal(w.room.id,e.to);assert.equal(w.player.facing,-w.rooms[e.to].exits.find(x=>x.connection===e.connection).direction);assert.equal(w.map.overlapsSolid(w.player.left,w.player.top,w.player.w,w.player.h),false);}
console.log('Greybox: ten rooms, four-hit piles, physical doors, directional walls, lift gate, two waves and persistent run state passed.');

// Optional lower route: leave the chest safely, but do not reverse the tall drop.
w=world();w.load('bridge',w.rooms.bridge.chest);nav=navigation(w.map);
assert.ok(route(nav,nearest(nav,w.room.chest),nearest(nav,{x:62,y:368})), 'chest must have a return to the shortcut');
assert.equal(route(nav,nearest(nav,w.room.chest),nearest(nav,w.room.exits.find(e=>e.to==='ossuary'))),null,'drop is one-way');
let key=input();key.pressed.interact=true;w.interactions(key);assert.ok(w.flags.has('lowerChest'));assert.equal(w.levelEvents.drops.get('lowerChest').reduce((n,b)=>n+b.amount,0),40);
w.load('watch',w.rooms.watch.lever);w.interactions(key);assert.ok(w.flags.has('liftLever'));
w.load('crossroads',w.rooms.crossroads.spawn);w.levelEvents.update(10);assert.equal(w.levelEvents.liftY,w.room.lift.low);w.load('watch',w.rooms.watch.spawn);w.load('crossroads',w.rooms.crossroads.spawn);assert.equal(w.levelEvents.liftY,w.room.lift.low);
w.load('guardian',w.rooms.guardian.checkpoint);const bossX=w.boss.x;step(w,input(),120);assert.ok(!w.state.bossStarted);assert.equal(w.boss.x,bossX);assert.equal(w.health.skulls,5);
console.log('Optional chest return, one-way drop, lever interaction, lift persistence and safe boss checkpoint passed.');
