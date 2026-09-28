import assert from 'node:assert/strict';
import {RoomManager} from '../src/world/room-manager.js';import {Camera} from '../src/core/camera.js';import {GreyboxDriver} from './greybox-driver.js';import {input} from './greybox-navigation.js';
const make=()=>{const w=new RoomManager(new Camera(320,180));w.phase='playing';return w;};const step=(w,k=input(0,false,false),n=1)=>{for(let i=0;i<n;i++)w.update(1/60,k);};
let w=make();
for(const r of Object.values(w.rooms)){w.load(r.id,r.spawn);assert.ok(!w.map.grid.includes(2),r.id+' solid including dynamic lift');}
const bridge=w.rooms.bridge;for(let x=34;x<45;x++){assert.equal(bridge.rows[47][x],'^');assert.equal(bridge.rows[48][x],'#');}
for(const x of [316,340]){const h=make();h.load('bridge',{x,y:368});const hp=h.health.skulls;step(h,input(0,false,false),40);assert.ok(h.health.skulls<hp,'new spike region causes damage');}
// Every ordinary passage crosses only beyond the visible mouth, and arrives clear.
for(const r of Object.values(w.rooms))for(const e of r.exits.filter(e=>e.offscreen)){
 w=make();if(e.flag)w.flags.add(e.flag);w.flags.add('arenaComplete');w.load(r.id,r.entries[e.connection+':'+r.id]);w.arrival=0;
 for(let n=0;n<180&&!w.transition;n++){step(w,input(e.direction,false,false));if(w.transition)assert.ok(e.direction*(w.player.x-e.x)>=24,'whole sprite cleared mouth');}
 assert.ok(w.transition,r.id+' -> '+e.to);step(w,input(0,false,false),45);assert.equal(w.room.id,e.to);assert.ok(!w.map.overlapsSolid(w.player.left,w.player.top,w.player.w,w.player.h));
}
console.log('Every horizontal passage: offscreen threshold, both directions, clear arrivals.');
w=make();w.flags.add('cellWall');w.levelEvents.rebuild();step(w,input(-1,false,false),160);assert.equal(w.cellZone,'secret');assert.equal(w.room.id,'awakening');step(w,input(1,false,false),180);assert.equal(w.cellZone,'cell');assert.equal(w.room.id,'awakening');console.log('Cell secret: faded local transition out and back.');
w=make();w.load('crossroads',w.rooms.crossroads.spawn);const pile=w.levelEvents.targets.find(t=>t.id==='courtyardBones');for(let i=0;i<3;i++)pile.takeHit();assert.ok(!pile.dead);pile.takeHit();assert.ok(pile.dead);assert.equal(w.levelEvents.drops.get(pile.id).reduce((a,b)=>a+b.amount,0),12);
w=make();w.load('guardian',w.rooms.guardian.checkpoint);assert.ok(!w.state.bossStarted);step(w,input(1,false,false),100);assert.ok(w.state.bossStarted);for(const g of w.room.bossArena.gates)assert.ok(w.map.overlapsSolid(g.x,g.y-g.h,g.w,g.h));w.die();for(let i=0;i<180;i++)step(w);assert.ok(!w.state.bossStarted);assert.equal(w.room.id,'guardian');assert.ok(w.player.x<w.room.bossArena.trigger);
w.flags.add('bossKey');const d=w.room.finalDoor;w.load('guardian',{x:d.x-16,y:d.y});const before=w.map.grid.slice();let k=input(0,false,false);k.pressed.interact=true;step(w,k);assert.ok(w.flags.has('finalDoor'));for(let y=0;y<(d.y-d.h)/8;y++)assert.equal(w.map.grid[y*w.map.cols+d.x/8],before[y*w.map.cols+d.x/8]);console.log('Boss: waits for entry, narrow gates, death restores preboss checkpoint; final door retains upper masonry.');
w=make();w.load('balcony',{x:278,y:256});for(let i=0;i<90;i++)step(w);assert.ok(w.presentationScale<.82);const scale=w.presentationScale;step(w,input(1,false,false));assert.ok(Math.abs(w.presentationScale-scale)<.02);step(w,input(1,false,false),150);assert.ok(w.presentationScale>.97);console.log('Gate camera: gradual local zoom and restoration while moving.');
// Independently exercise each reverse route with normal controls and live enemies.
const order=['awakening','passage','crossroads','watch','bridge','ossuary','sentries','balcony','ascent','guardian'];
for(let i=1;i<order.length;i++){
 w=make();w.flags.add('arenaComplete');const r=w.rooms[order[i]],e=r.exits.find(e=>e.to===order[i-1]&&!e.flag),from=r.exits.find(e=>e.to===order[i+1]&&!e.flag);w.load(r.id,from?r.entries[from.connection+':'+r.id]:r.checkpoint);const b=new GreyboxDriver();
 for(let n=0;n<60*180&&w.room.id===r.id&&w.phase==='playing';n++)step(w,b.next(w,e));
 assert.equal(w.room.id,order[i-1],r.id+' reverse route at '+w.player.x+','+w.player.y);console.log('Backtracking',r.number,'->',i,'normal controls and live enemies');
}


