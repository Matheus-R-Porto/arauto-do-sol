import {RoomManager} from '../src/world/room-manager.js';
import {Camera} from '../src/core/camera.js';
import {PlaythroughDriver} from './playthrough-driver.js';
const w=new RoomManager(new Camera(480,270)),bot=new PlaythroughDriver();
let last='',pos=0,stuck=0;
for(let n=0;n<60*1500;n++){
 w.update(1/60,bot.next(w));
 if(w.room.id!==last){console.log(Math.round(w.elapsed),w.room.id,'hp',w.health.skulls,'deaths',w.deaths);last=w.room.id;}
 if(n%600===0){
  if(Math.abs(w.player.x-pos)<2)stuck++;else stuck=0;pos=w.player.x;
  if(stuck>2){console.log('STUCK',w.room.id,w.player.x,w.player.y,'platform',bot.platform,'energy',w.energy.current,'boss',w.boss?.state,w.boss?.health);process.exit(1);}
 }
 if(w.phase==='finished'){console.log('FINISHED',w.elapsed,'deaths',w.deaths,'visited',w.visited.size,'fragments',w.collected.size);process.exit(0);}
 if(w.deaths>8){console.log('TOO MANY DEATHS',w.room.id,w.boss?.health);process.exit(1);}
}
console.log('TIMEOUT',w.room.id,w.player.x,w.player.y,w.boss?.health);process.exit(1);
