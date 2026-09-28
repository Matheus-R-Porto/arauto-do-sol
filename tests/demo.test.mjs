import assert from 'node:assert/strict';
import {RoomManager} from '../src/world/room-manager.js';
import {Camera} from '../src/core/camera.js';
import {cemetery} from '../src/world/rooms/cemetery.js';
import {validateRooms} from '../src/world/validate.js';
import {Enemy} from '../src/entities/enemies/enemy.js';
import {Projectile} from '../src/entities/enemies/projectile.js';
import {CemeteryGuardian} from '../src/entities/boss/guardian.js';
import {Player} from '../src/entities/player.js';
import {TileMap} from '../src/world/tilemap.js';
import {DEMO,BOSS} from '../config/tuning.js';
const dt=1/60;
const input=()=>({held:{},pressed:{},released:{},moveX:0});
const make=()=>{const w=new RoomManager(new Camera(480,270));w.phase='playing';return w;};
const advance=(w,n,i=input())=>{for(let k=0;k<n;k++)w.update(dt,i);};
const checks=[];function test(name,fn){fn();checks.push(name);console.log('PASSOU ',name);}
const flat=new TileMap(cemetery.find(r=>r.id==='guardian'));
test('17 salas conectadas; todas as entradas, boss e checkpoints seguros',()=>{assert.equal(cemetery.length,17);assert.equal(validateRooms(cemetery,'awakening'),true);});
test('validador rejeita duplicatas, destino ausente, entrada em parede e linha irregular',()=>{
 for(const change of [r=>r.push(r[0]),r=>r[0].exits[0].to='missing',r=>r[0].spawn.x=0,r=>r[0].rows[0]+='#']){const r=structuredClone(cemetery);change(r);assert.throws(()=>validateRooms(r,'awakening'));}
});
test('habilidades futuras desligadas no início e no reinício',()=>{const w=make();assert.ok(Object.values(w.player.abilities).every(v=>!v));w.player.abilities.dash=true;w.restart();assert.ok(Object.values(w.player.abilities).every(v=>!v));});
test('transição mantém vida/energia, posiciona sem parede e não entra em loop',()=>{
 const w=make();w.health.skulls=3;w.energy.current=55;w.energy.timeSinceAction=0;const e=w.room.exits[0];assert.ok(w.travel(e));advance(w,23);assert.equal(w.room.id,'passage');assert.equal(w.health.skulls,3);assert.equal(w.energy.current,55);assert.ok(!w.map.overlapsSolid(w.player.left,w.player.top,w.player.w,w.player.h));advance(w,60);assert.equal(w.room.id,'passage');
});
test('checkpoint, morte, respawn e limpeza de estados transitórios',()=>{
 const w=make();w.load('crossroads',w.rooms.crossroads.checkpoint);advance(w,1);assert.equal(w.checkpoint.room,'crossroads');w.health.skulls=0;w.energy.current=0;advance(w,60);assert.equal(w.phase,'playing');assert.equal(w.room.id,'crossroads');assert.equal(w.health.skulls,5);assert.equal(w.energy.current,100);assert.equal(w.deaths,1);assert.equal(w.player.combo.step,0);
});
test('inimigo morto persiste ao revisitar; morte restaura os inimigos',()=>{
 const w=make();w.load('watch',w.rooms.watch.spawn);w.enemies[0].takeHit(99,0,0);w.load('passage',w.rooms.passage.spawn);w.load('watch',w.rooms.watch.spawn);assert.ok(w.enemies[0].dead);w.respawn();w.load('watch',w.rooms.watch.spawn);assert.ok(!w.enemies[0].dead);
});
test('walker: telegraph antes do dano, active e recovery finitos',()=>{
 const e=new Enemy({type:'walker',x:200,y:288}),p=new Player(224,288);const seen=new Set();for(let n=0;n<180;n++){e.update(dt,flat,p);seen.add(e.state);if(e.state==='windup')assert.equal(e.hitbox,null);}for(const s of ['windup','active','recovery'])assert.ok(seen.has(s));
});
test('lunger mantém direção anunciada mesmo que jogador cruze',()=>{
 const e=new Enemy({type:'lunger',x:200,y:288}),p=new Player(290,288);e.update(dt,flat,p);const dir=e.facing;p.x=100;for(let n=0;n<60;n++)e.update(dt,flat,p);assert.equal(e.facing,dir);
});
test('ranged dispara projétil depois do windup; expira e colide',()=>{
 const e=new Enemy({type:'ranged',x:200,y:288}),p=new Player(340,288);let bullets=[];for(let n=0;n<80;n++)e.update(dt,flat,p,(x,y,d)=>bullets.push(new Projectile(x,y,d)));assert.equal(bullets.length,1);const b=bullets[0];for(let n=0;n<500;n++)b.update(dt,flat);assert.ok(b.dead);
});
test('projétil causa dano uma vez e i-frames impedem stunlock',()=>{
 const w=make();w.projectiles=[new Projectile(w.player.x,w.player.y-10,1)];advance(w,1);assert.equal(w.health.skulls,4);assert.equal(w.projectiles.length,0);assert.equal(w.damage(1,w.player.x),false);
});
test('boss sela arena, passa por 3 ataques e segunda fase',()=>{
 const w=make();w.load('guardian',w.rooms.guardian.spawn);assert.ok(w.arenaLocked);assert.equal(w.travel(w.room.exits[1]),false);const b=w.boss,seen=new Set();for(let n=0;n<2500;n++){b.update(dt,w.map,w.player);if(b.state==='active')seen.add(b.attack);}assert.equal(seen.size,3);b.health=BOSS.hp*.4;b.update(dt,w.map,w.player);assert.equal(b.phase,2);
});
test('morte durante luta restaura boss inteiro e remove projéteis',()=>{
 const w=make();w.checkpoint={room:'refuge',...w.rooms.refuge.checkpoint};w.load('guardian',w.rooms.guardian.spawn);w.boss.health=1;w.health.skulls=0;advance(w,60);assert.equal(w.room.id,'refuge');w.load('guardian',w.rooms.guardian.spawn);assert.equal(w.boss.health,BOSS.hp);assert.equal(w.boss.state,'intro');assert.equal(w.projectiles.length,0);
});
test('vitória pelo combo abre saída, persiste e permite Fim da Demo',()=>{
 const w=make();w.load('guardian',w.rooms.guardian.spawn);const b=w.boss;b.state='recovery';b.timer=10;b.health=1;w.player.reset(b.left-10,b.y);w.player.facing=1;advance(w,1,{...input(),pressed:{attackLight:true}});assert.ok(w.bossDefeated);assert.ok(!w.arenaLocked);advance(w,160);const e=w.room.exits.find(e=>e.to==='beyond');assert.ok(w.travel(e));advance(w,23);w.player.reset(w.room.end.x,w.room.end.y);advance(w,90);assert.equal(w.phase,'finished');
});
test('atalho só abre pelo lado da escadaria; progresso persiste',()=>{
 const w=make();w.load('crypt',w.rooms.crypt.spawn);assert.equal(w.travel(w.room.exits.find(e=>e.flag==='shortcutWest')),false);w.load('ascent',w.rooms.ascent.spawn);assert.ok(w.travel(w.room.exits.find(e=>e.flag==='shortcutWest')));assert.ok(w.flags.has('shortcutWest'));advance(w,23);w.respawn();assert.ok(w.flags.has('shortcutWest'));
});
test('morte tem prioridade sobre transição e câmera permanece nos limites',()=>{
 const w=make();w.health.skulls=0;assert.equal(w.travel(w.room.exits[0]),false);advance(w,1);assert.equal(w.phase,'dying');for(const r of cemetery){w.load(r.id,r.spawn);for(const pos of [{x:-100,y:-100},{x:99999,y:99999}]){w.camera.snapTo({...w.player,...pos},w.map);assert.ok(w.camera.ox>=0&&w.camera.ox<=w.map.width-480);assert.ok(w.camera.oy>=0&&w.camera.oy<=w.map.height-270);}}
});
console.log(`${checks.length}/${checks.length} testes da demo ok`);

