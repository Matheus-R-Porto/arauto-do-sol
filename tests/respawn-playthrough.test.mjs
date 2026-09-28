import assert from 'node:assert/strict';
import {RoomManager} from '../src/world/room-manager.js';
import {Camera} from '../src/core/camera.js';
import {PlaythroughDriver} from './playthrough-driver.js';
const w=new RoomManager(new Camera(480,270)),bot=new PlaythroughDriver({exerciseDeaths:true});
let last='',bossEntries=0,sawRespawn=false,testedDeaths=0;
for(let n=0;n<60*1800;n++){
 w.update(1/60,bot.next(w));
 assert.ok(Object.values(w.player.abilities).every(v=>!v));
 if(w.room.id!==last){
  console.log(Math.round(w.elapsed),w.room.id,'vida',w.health.skulls,'mortes',w.deaths);last=w.room.id;
  if(w.room.id==='guardian'){bossEntries++;assert.equal(w.boss.health,w.boss.maxHealth);}
  if(w.deaths>testedDeaths&&['crossroads','ossuary'].includes(w.room.id)){testedDeaths=w.deaths;sawRespawn=true;assert.equal(w.health.skulls,w.health.maxSkulls);}
 }
 if(w.phase==='finished'){
  assert.ok(sawRespawn);assert.ok(bot.deathAtBoss);assert.ok(bossEntries>=2);assert.ok(w.bossDefeated);assert.equal(w.visited.size,17);
  for(const stage of ['key','door','lever','shortcut','boss'])assert.ok(bot.deathStages.has(stage),stage);
  console.log(`PASSOU playthrough com ações normais: ${w.elapsed.toFixed(1)}s, ${w.deaths} mortes, ${w.visited.size} salas, boss resetado e derrotado.`);process.exit(0);
 }
 if(w.deaths>8)throw new Error(`Mortes repetidas: ${w.room.id}`);
}
throw new Error(`Timeout: ${w.room.id} ${w.player.x},${w.player.y}`);
