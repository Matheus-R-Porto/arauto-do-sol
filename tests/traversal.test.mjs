import assert from 'node:assert/strict';
import {cemetery as before} from '../docs/traversal/cemetery-before.js';
import {cemetery as after} from '../src/world/rooms/cemetery.js';
import {RoomManager} from '../src/world/room-manager.js';import {Camera} from '../src/core/camera.js';
import {GreyboxDriver} from './greybox-driver.js';import {navigation,input} from './greybox-navigation.js';
// Explicit authorized cells: platform tip and six vertical seams. No blanket map exemption.
const cuts={crossroads:[171,177,45,52],watch:[21,27,0,5],ossuary:[126,132,0,6],sentries:[30,36,28,32],ascent:[14,20,0,5],guardian:[105,111,50,58]};
for(let i=0;i<after.length;i++){
 const a=after[i],b=before[i],cut=cuts[a.id];
 for(let y=0;y<a.rows.length;y++)for(let x=0;x<a.rows[0].length;x++){
  const opened=(cut&&x>=cut[0]&&x<cut[1]&&y>=cut[2]&&y<cut[3])||(a.id==='watch'&&y===38&&x>=43&&x<45);
  if(a.id==='watch'&&[...a.platforms,...b.platforms].some(([px,py,len])=>py===y&&x>=px&&x<px+len))continue; // Exact ledge geometry is covered by wall-ledges.test.mjs.
  assert.equal(a.rows[y][x],opened?'.':b.rows[y][x],`${a.id} ${x},${y}`);
 }
 for(const key of Object.keys(b).filter(k=>!['rows','entries','exits','platforms'].includes(k)))assert.deepEqual(a[key],b[key],`${a.id}.${key}`);
 const platforms=structuredClone(b.platforms);if(a.id==='watch')platforms.find(p=>p[0]===36&&p[1]===38)[2]=7;if(a.id!=='watch')assert.deepEqual(a.platforms,platforms);
 assert.deepEqual(a.exits.map(e=>[e.to,e.connection,e.flag]),b.exits.map(e=>[e.to,e.connection,e.flag]));
}
for(const r of after)for(const e of r.exits.filter(e=>e.axis==='y')){
 const w=new RoomManager(new Camera(320,180));w.phase='playing';if(r.arena)w.flags.add(r.arena.id); // Return route is tested after the arena unlocks.
 const own=r.entries[e.connection+':'+r.id];w.load(r.id,own);w.arrival=0;
 // Use actual gravity/jump/movement to cross each direction, never write position after setup.
 const bot=new GreyboxDriver();bot.nav=navigation(w.map);let crossed=false;
 for(let n=0;n<600;n++){
  const k=bot.navigate(w,e,input());w.update(1/60,k);
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
import {Player} from '../src/entities/player.js';import {Energy} from '../src/systems/energy.js';import {TileMap} from '../src/world/tilemap.js';
function walkOff(room){const p=new Player(320,304),m=new TileMap(room),energy=new Energy();p.onGround=true;for(let n=0;n<90;n++)p.update(1/60,input(1,false,false),m,energy);return p;}
assert.equal(walkOff(before[3]).y,304,'original tip traps a player trying to walk off');assert.ok(walkOff(after[3]).y>320,'shortened tip allows ordinary descent, no drop command');
import {route,nearest} from './greybox-navigation.js';
const tower=new RoomManager(new Camera(320,180));tower.phase='playing';tower.load('watch',tower.rooms.watch.entries['crossroads:watch:main:watch']);
for(const id of ['upperChamber','leverChamber']){
 const target=tower.levelEvents.targets.find(b=>b.id===id),nav=navigation(tower.map);
 assert.ok(route(nav,nearest(nav,tower.room.spawn),nearest(nav,{x:target.x-16,y:target.y})),id+' approach reachable');
 target.takeHit();target.takeHit();const opened=navigation(tower.map),item=id==='upperChamber'?tower.room.breakables.find(b=>b.id==='towerBones'):tower.room.lever;
 assert.ok(route(opened,nearest(opened,{x:target.x-16,y:target.y}),nearest(opened,item)),id+' chamber reachable');
 assert.ok(route(opened,nearest(opened,item),nearest(opened,tower.room.exits.find(e=>e.to==='bridge'&&!e.flag))),id+' return to main route');
}
console.log('Room 4: reproduced original walk-off trap; normal descent and both chamber approaches/returns pass.');
