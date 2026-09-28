import assert from 'node:assert/strict';
import {RoomManager} from '../src/world/room-manager.js';
import {Camera} from '../src/core/camera.js';
import {PlaythroughDriver} from './playthrough-driver.js';
for(const mode of ['critical','explorer']){
 const w=new RoomManager(new Camera(480,270)),bot=new PlaythroughDriver({mode});
 for(let n=0;n<60*1200&&w.phase!=='finished';n++){
  w.update(1/60,bot.next(w));assert.ok(Object.values(w.player.abilities).every(v=>!v));
 }
 assert.equal(w.phase,'finished',`${mode} parou em ${w.room.id}: ${w.player.x},${w.player.y}`);
 for(const flag of ['cemeteryKey','cemeteryDoor','mainGateLever'])assert.ok(w.flags.has(flag));
 if(mode==='critical')for(const r of Object.values(w.rooms).filter(r=>r.optional))assert.ok(!w.visited.has(r.id),r.id);
 else{assert.ok(bot.seenLocked.has('cemeteryDoor'));assert.ok(bot.seenLocked.has('mainGateLever'));assert.ok(w.flags.has('shortcutWest'));assert.ok(w.flags.has('shortcutGallery'));assert.ok(w.flags.has('secret'));assert.ok(w.flags.has('fountain'));}
 console.log(`PASSOU ${mode}: ${w.elapsed.toFixed(1)}s, ${w.visited.size} salas, ${w.deaths} mortes, ${w.collected.size} fragmentos`);
}
