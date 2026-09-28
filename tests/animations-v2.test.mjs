import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {ActorAnimator,WorldArt} from '../src/ui/world-art.js';
import {frameAt,duration,MarkerCursor} from '../src/ui/animation-time.js';
import {Enemy} from '../src/entities/enemies/enemy.js';
import {CemeteryGuardian} from '../src/entities/boss/guardian.js';
import {ENEMIES,BOSS} from '../config/tuning.js';
const m=JSON.parse(readFileSync(new URL('../assets/sprites/world/manifest.json',import.meta.url)));
const hero=JSON.parse(readFileSync(new URL('../assets/sprites/protagonist/manifest.json',import.meta.url)));
let checks=0;const test=(name,f)=>{f();checks++;console.log('PASSOU',name);};
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);
test('inventário por sequência, durações e loops solicitados',()=>{
 const expected={idle:4,walk:6,run:6,jump:2,fall:2,'attack-light':4,'attack-m2':4,hurt:2,death:4};
 for(const[k,n]of Object.entries(expected))assert.equal(hero.animations[k].frames.length,n,k);
 for(const type of ['walker','lunger','ranged']){
  for(const[k,n]of Object.entries({idle:2,walk:4,windup:3,active:type==='lunger'?3:2,recovery:2,hurt:2,death:4}))assert.equal(m.animations[type][k].frames.length,n,type+k);
  for(const phase of ['windup','active','recovery'])near(duration(m.animations[type][phase]),ENEMIES[type][phase]);
 }
 for(const[k,n]of Object.entries({idle:3,walk:4,intro:5,hurt:2,death:6,'slash-windup':4,'slash-active':2,'slash-recovery':3,'charge-windup':4,'charge-active':4,'charge-recovery':3,'slam-windup':4,'slam-active':3,'slam-recovery':4}))assert.equal(m.animations.boss[k].frames.length,n,k);
 for(const attack of ['slash','charge','slam'])for(const phase of ['windup','active','recovery'])near(duration(m.animations.boss[attack+'-'+phase]),BOSS[attack][phase]);
 for(const[k,n]of Object.entries({'phase-transition':5,'slash-light':3,'slash-heavy':4,hit:3,dust:4,shockwave:5,projectile:2,'projectile-impact':3,flame:4}))assert.equal(m.animations.vfx[k].frames.length,n,k);
});
test('frames progridem pelo timer real e recovery segura o último quadro',()=>{
 for(const type of ['walker','lunger','ranged']){
  const e=new Enemy({type,x:100,y:200}),a=new ActorAnimator(),w={enemies:[e],phase:'playing'};
  for(const phase of ['windup','active','recovery']){
   e.state=phase;e.timer=e.cfg[phase];a.update(1/60,w);
   assert.equal(a.sample(e,m.animations[type]),m.animations[type][phase].frames[0]);
   e.timer=.001;a.update(1/60,w);
   assert.equal(a.sample(e,m.animations[type]),m.animations[type][phase].frames.at(-1));
  }
 }
});
test('boss fase 2 preserva overlay durante movimento e adapta recovery sem alterar AI',()=>{
 const e=new CemeteryGuardian(200,300),a=new ActorAnimator(),w={enemies:[],boss:e,phase:'playing'};
 e.state='approach';e.phase=1;a.update(1/60,w);e.phase=2;e.x++;a.update(1/60,w);
 assert.equal(a.actors.get(e).phaseTime,0);assert.equal(a.actors.get(e).state,'walk');
 e.x++;a.update(.1,w);near(a.actors.get(e).phaseTime,.1);
 e.state='recovery';e.attack='slash';e.timer=BOSS.slash.recovery*.85;a.update(1/60,w);
 assert.equal(a.sample(e,m.animations.boss),m.animations.boss['slash-recovery'].frames[0]);
 e.timer=.001;a.update(1/60,w);assert.equal(a.sample(e,m.animations.boss),m.animations.boss['slash-recovery'].frames.at(-1));
});
test('morte não volta ao idle; hitstop congela relógio e flip não reinicia',()=>{
 const e=new Enemy({type:'walker',x:0,y:100}),a=new ActorAnimator(),w={enemies:[e],phase:'playing'};
 e.dead=true;e.deathTimer=.01;a.update(1/60,w);assert.equal(a.pose(e),'death');
 assert.equal(a.sample(e,m.animations.walker),m.animations.walker.death.frames.at(-1));
 const t=a.actors.get(e).time;e.facing=-1;w.hitstop=.03;a.update(.02,w);assert.equal(a.actors.get(e).time,t);
});
test('loop e hold não dependem da quantidade de draw calls',()=>{
 for(const actor of Object.values(m.animations))for(const a of Object.values(actor)){
  const end=frameAt(a,duration(a)+1e-9);assert.equal(end,a.loop?a.frames[0]:a.frames.at(-1));
  for(let n=0;n<144;n++)assert.equal(frameAt(a,.01),a.frames[0]);
 }
});
test('marcador de disparo ocorre uma vez, só após transição real da AI',()=>{
 const e=new Enemy({type:'ranged',x:100,y:200}),a=new ActorAnimator(),w={enemies:[e],phase:'playing'};
 const map={overlapsSolid:()=>false,overlapsHazard:()=>false,tileSize:16},p={x:260,y:200},cursor=new MarkerCursor();
 e.state='windup';e.timer=.001;let spawned=0;e.update(1/60,map,p,()=>spawned++);
 assert.equal(spawned,1);assert.equal(e.state,'active');a.update(1/60,w);
 const clip=m.animations.ranged.active,token=a.actors.get(e).serial;
 assert.equal(cursor.advance(clip,token,0).filter(x=>x.name==='fire').length,1);
 assert.equal(cursor.advance(clip,token,0).length,0);assert.equal(cursor.advance(clip,token,.1).length,0);
 assert.equal(cursor.advance(clip,token+1,0).length,1);
});
test('impacto de projétil só por colisão, não TTL nem troca de sala',()=>{
 const ctx=new Proxy({},{get:()=>()=>{}});globalThis.document={createElement:()=>({getContext:()=>ctx})};
 const art=new WorldArt({...m,backgrounds:{}}),w={enemies:[],phase:'playing',room:{id:'a'},collected:new Set(),flags:new Set(),player:{x:1,y:2,onGround:true,vy:0},projectiles:[]};
 const hit={x:3,y:4,life:1,dead:false};w.projectiles=[hit];art.update(.01,w);hit.dead=true;w.projectiles=[];art.update(.01,w);
 assert.equal(art.events.filter(x=>x.name==='projectile-impact').length,1);art.update(.01,w);assert.equal(art.events.filter(x=>x.name==='projectile-impact').length,1);
 const ttl={x:0,y:0,life:0,dead:true};art.previous.projectiles=[ttl];art.update(.01,w);assert.equal(art.events.length,1);
 w.room.id='b';art.update(.01,w);assert.equal(art.events.length,0);
});
console.log(checks+'/'+checks+' testes de animação v2 ok');
