import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PlayerAnimator} from '../src/ui/player-sprites.js';
import {RoomManager} from '../src/world/room-manager.js';
import {Camera} from '../src/core/camera.js';
import {GreyboxDriver as PlaythroughDriver} from './greybox-driver.js';
import {COMBAT,DEMO} from '../config/tuning.js';
const manifest=JSON.parse(readFileSync(new URL('../assets/sprites/protagonist/manifest.json',import.meta.url),'utf8'));
let count=0;const test=(name,f)=>{f();count++;console.log('PASSOU',name);};
const fixture=()=>({player:{onGround:true,vx:0,vy:0,running:false,attacks:{light:{cooldownTimer:0},m2:{cooldownTimer:0}}},room:{id:'fixture'},health:{skulls:5,dead:false},phase:'playing',phaseTimer:0,transition:null,hitstop:0});
test('arte cobre todos os estados implementados e cada golpe dura o cooldown real',()=>{
 assert.deepEqual(Object.keys(manifest.animations),['idle','walk','run','jump','fall','attack-light','attack-m2','hurt','death','land']);
 for(const [name,seconds] of [['attack-light',COMBAT.attackLight.swingDuration],['attack-m2',COMBAT.attackM2.swingDuration],['hurt',DEMO.hurtLock],['death',DEMO.deathDelay]])assert.ok(Math.abs(manifest.animations[name].frames.reduce((a,f)=>a+f.duration,0)-seconds)<1e-8);
});
test('prioridade morte > hurt > ataque > ar > locomoção',()=>{
 const w=fixture(),a=new PlayerAnimator();a.update(1/60,w);assert.equal(a.state,'idle');
 w.player.vx=92;a.update(1/60,w);assert.equal(a.state,'walk');
 w.player.running=true;a.update(1/60,w);assert.equal(a.state,'run');
 w.player.onGround=false;w.player.vy=-10;a.update(1/60,w);assert.equal(a.state,'jump');
 w.player.vy=10;a.update(1/60,w);assert.equal(a.state,'fall');
 w.player.attacks.light.cooldownTimer=.25;a.update(1/60,w);assert.equal(a.state,'attack-light');assert.equal(a.time,0);
 w.health.skulls--;a.update(1/60,w);assert.equal(a.state,'hurt');
 w.phase='dying';w.phaseTimer=.85;w.health.dead=true;a.update(1/60,w);assert.equal(a.state,'death');assert.equal(a.time,0);
});
test('alternância M1/M2 reinicia visual no contato sem inserir startup',()=>{
 const w=fixture(),a=new PlayerAnimator();a.update(1/60,w);
 w.player.attacks.light.cooldownTimer=.25;a.update(1/60,w);assert.equal(a.state,'attack-light');
 w.player.attacks.light.cooldownTimer=.23;w.player.attacks.m2.cooldownTimer=.25;a.update(1/60,w);assert.equal(a.state,'attack-m2');assert.equal(a.frame(manifest.animations[a.state]),manifest.animations[a.state].frames[0]);
 w.player.attacks.m2.cooldownTimer=.1;a.update(1/60,w);assert.equal(a.time,.15);
 w.player.attacks.m2.cooldownTimer=0;a.update(1/60,w);assert.equal(a.state,'idle');
});
test('invulnerabilidade de chegada não inventa reação de dano',()=>{
 const w=fixture(),a=new PlayerAnimator();w.health.invulnTimer=.45;a.update(1/60,w);a.update(1/60,w);assert.equal(a.state,'idle');
});
test('respawn e troca de sala não carregam animações antigas',()=>{
 const w=fixture(),a=new PlayerAnimator();a.update(1/60,w);w.health.skulls--;a.update(1/60,w);assert.equal(a.state,'hurt');
 w.room.id='next';a.update(1/60,w);assert.equal(a.state,'idle');
 w.phase='dying';w.phaseTimer=.3;a.update(1/60,w);assert.equal(a.state,'death');
 w.phase='playing';a.update(1/60,w);assert.equal(a.state,'idle');
});
test('consultar frame em 30/60/144 FPS não avança tempo e respeita não-loop',()=>{
 const a=new PlayerAnimator(),animation=manifest.animations.idle;a.time=.67;const frame=a.frame(animation);
 for(let i=0;i<144;i++)assert.equal(a.frame(animation),frame);assert.equal(a.time,.67);
 a.time=5;assert.equal(a.frame(manifest.animations.death),manifest.animations.death.frames.at(-1));
});
test('pausa de transição e hitstop congelam locomoção',()=>{
 const w=fixture(),a=new PlayerAnimator();a.update(1/60,w);a.update(1/60,w);const before=a.time;
 w.hitstop=.03;a.update(1/60,w);assert.equal(a.time,before);w.hitstop=0;w.transition={};a.update(1/60,w);assert.equal(a.time,before);
});
test('observador aceita mundo congelado sem escrever gameplay',()=>{
 const w=fixture();const freeze=o=>{Object.freeze(o);for(const v of Object.values(o))if(v&&typeof v==='object'&&!Object.isFrozen(v))freeze(v);};freeze(w);
 const a=new PlayerAnimator();a.update(1/60,w);a.update(1/60,w);assert.equal(w.player.vx,0);
});
test('percurso com observador tem o mesmo resultado de gameplay, incluindo respawn no novo mapa',()=>{
 const w=new RoomManager(new Camera(480,270)),control=new RoomManager(new Camera(480,270)),a=new PlayerAnimator();
 const bot=new PlaythroughDriver({mode:'completionist',exerciseDeaths:true}),seen=new Set();
 const snapshot=x=>({room:x.room.id,phase:x.phase,x:x.player.x,y:x.player.y,vx:x.player.vx,vy:x.player.vy,hp:x.health.skulls,energy:x.energy.current,deaths:x.deaths,boss:x.boss?.health,flags:[...x.flags],collected:[...x.collected]});
 for(let n=0;n<60*1500&&w.phase!=='finished';n++){
  const input=bot.next(w);w.update(1/60,input);control.update(1/60,input);a.update(1/60,w);seen.add(a.state);
  if(n%300===0)assert.deepEqual(snapshot(w),snapshot(control));
 }
 assert.equal(w.phase,'finished');
 // The corrected route can be completed without dying. Exercise respawn explicitly
 // in both control worlds instead of requiring an incidental traversal failure.
 if(!w.deaths){for(const world of [w,control]){world.phase='playing';world.health.skulls=0;}for(let n=0;n<90;n++){const k={moveX:0,held:{},pressed:{},released:{}};w.update(1/60,k);control.update(1/60,k);a.update(1/60,w);seen.add(a.state);}}
 assert.ok(w.deaths>=1);assert.deepEqual(snapshot(w),snapshot(control));
 for(const name of ['run','jump','fall','attack-light','attack-m2','hurt','death'])assert.ok(seen.has(name),`Estado não exercitado: ${name}`);
 console.log('Arte no percurso:',[...seen].join(', '), '|',w.elapsed.toFixed(1),'s simulados');
});
console.log(`${count}/${count} testes de apresentação ok`);
