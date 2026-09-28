import { CemeteryEvents } from './cemetery-events.js';
import { DEMO, ENERGY, COMBAT } from '../../config/tuning.js';
import { TileMap } from './tilemap.js';
import { cemetery, START_ROOM } from './rooms/cemetery.js';
import { validateRooms } from './validate.js';
import { Progression } from './progression.js';
import { Enemy } from '../entities/enemies/enemy.js';
import { Projectile } from '../entities/enemies/projectile.js';
import { CemeteryGuardian } from '../entities/boss/guardian.js';
import { Player } from '../entities/player.js';
import { Health } from '../systems/health.js';
import { Energy } from '../systems/energy.js';
import { aabbOverlap } from '../core/math.js';

export const overlap = (a,b) => aabbOverlap(a.left,a.top,a.w,a.h,b.left,b.top,b.w,b.h);
const near = (a,b,r) => Math.abs(a.x-b.x)<r && Math.abs(a.y-b.y)<r;

export class RoomManager {
  constructor(camera, rooms = cemetery) {
    validateRooms(rooms,START_ROOM);this.rooms=Object.fromEntries(rooms.map(r=>[r.id,r]));
    this.camera=camera;this.onEvent=()=>{};this.restart();
  }
  restart() {
    this.player=new Player(0,0);this.health=new Health();this.energy=new Energy();
    this.levelEvents=new CemeteryEvents(this);this.states=new Map();this.progression=new Progression();this.flags=this.progression.flags;
    this.collected=new Set();this.visited=new Set();
    this.tutorialDone=new Set();this.checkpoint={room:START_ROOM,...this.rooms[START_ROOM].spawn};
    this.elapsed=0;this.deaths=0;this.kills=0;this.bossDefeated=false;this.bossQuiet=0;
    this.phase='title';this.phaseTimer=0;this.transition=null;this.hitstop=0;this.hurtLock=0;
    this.notification='';this.noticeTimer=0;this.context='';this.arrival=0;
    this.load(START_ROOM,this.rooms[START_ROOM].spawn);
  }
  notify(text) {this.notification=text;this.noticeTimer=DEMO.notificationTime;}
  load(id,spawn) {
    this.room=this.rooms[id];this.map=new TileMap(this.room);
    if(!this.states.has(id))this.states.set(id,{
      enemies:this.room.enemies.map(e=>new Enemy(e)),
      boss:this.room.boss&&!this.bossDefeated?new CemeteryGuardian(this.room.boss.x,this.room.boss.y):null,
    });
    this.state=this.states.get(id);this.projectiles=[];this.visited.add(id);
    this.player.reset(spawn.x,spawn.y);this.player.facing=spawn.facing??(spawn.x>this.map.width/2?-1:1);
    this.safe={...spawn};this.arrival=DEMO.arrivalGrace;this.hurtLock=0;
    this.levelEvents.load();
    this.camera.snapTo(this.player,this.map);
    this.notify(this.room.name);
  }
  get enemies(){return this.state.enemies;}
  get boss(){return this.state.boss;}
  get arenaLocked(){return (!!this.boss&&!this.boss.dead&&(!this.room.bossArena||this.state.bossStarted))||['delay','wave','interval'].includes(this.levelEvents.arena?.phase);}
  get targets(){return this.boss?[...this.enemies,this.boss]:this.enemies;}
  get fade(){
    if(this.transition)return 1-Math.abs(this.transition.time/DEMO.fade-1);
    if(this.phase==='dying')return 1-this.phaseTimer/DEMO.deathDelay;
    if(this.phase==='ending')return 1-this.phaseTimer/DEMO.endFade;
    return 0;
  }
  travel(exit) {
    if(this.transition||this.phase!=='playing'||this.health.dead||this.arenaLocked||this.bossQuiet>0)return false;
    if(!exit||!this.room.exits.includes(exit))return false;
    let notice=null;
    if(!this.progression.isOpen(exit)){
      if(!this.progression.open(exit))return false;
      notice=exit.kind==='key'?'A porta do sol se abriu.':'Atalho destravado nos dois sentidos.';
      this.notify(notice);
      this.onEvent('checkpoint');
    }
    this.transition={time:0,exit,switched:false,notice};return true;
  }
  respawn() {
    this.states.clear();this.projectiles=[];
    this.health.restore();this.energy.refill();this.energy.timeSinceCombat=ENERGY.combatTimeout;
    this.energy.timeSinceAction=ENERGY.regenDelay;this.hitstop=0;this.bossQuiet=0;
    this.transition=null;this.phase='playing';
    this.load(this.checkpoint.room,this.checkpoint);
    this.health.invulnTimer=DEMO.arrivalGrace;
  }
  damage(amount,sourceX) {
    if(this.player.intangible||!this.health.damage(amount))return false;
    this.energy.markCombat();this.player.vx=(Math.sign(this.player.x-sourceX)||-this.player.facing)*DEMO.hurtVx;
    this.player.vy=DEMO.hurtVy;this.hurtLock=DEMO.hurtLock;
    this.player.wallJumpLockTimer=DEMO.hurtLock;
    this.onEvent('hurt');return true;
  }
  update(dt,input) {
    this.noticeTimer=Math.max(0,this.noticeTimer-dt);this.context='';
    if(this.phase==='title') {
      if(input.pressed.jump||input.pressed.interact||input.pressed.attackLight)this.phase='playing';
      return;
    }
    if(this.phase==='finished') {
      if(input.pressed.interact||input.pressed.jump){this.restart();this.phase='playing';}
      return;
    }
    if(this.phase==='dying'||this.phase==='ending') {
      this.phaseTimer-=dt;
      if(this.phaseTimer<=0){if(this.phase==='dying')this.respawn();else this.phase='finished';}
      return;
    }
    if(this.health.dead){this.die();return;}
    if(this.transition) {
      const t=this.transition;t.time+=dt;
      if(t.time>=DEMO.fade&&!t.switched){t.switched=true;const e=t.exit;this.load(e.to,this.rooms[e.to].entries[e.entry]);if(t.notice)this.notify(t.notice);}
      if(t.time>=DEMO.fade*2)this.transition=null;
      return;
    }
    this.elapsed+=dt;
    if(this.hitstop>0){this.hitstop-=dt;return;}
    this.health.update(dt);this.energy.update(dt);
    this.arrival=Math.max(0,this.arrival-dt);this.bossQuiet=Math.max(0,this.bossQuiet-dt);
    const p=this.player;
    this.levelEvents.update(dt);
    p.update(dt,input,this.map,this.energy);
    const before=this.targets.map(e=>({e,h:e.health,dead:e.dead}));
    p.updateAttack(dt,input,this.energy,[...this.targets.filter(e=>e!==this.boss||!this.room.bossArena||this.state.bossStarted),...this.levelEvents.targets]);
    for(const {e,h,dead} of before) {
      if(e.health<h){this.onEvent('hit');this.hitstop=DEMO.hitstop;}
      if(e.dead&&!dead){this.kills++;if(e===this.boss){
        this.bossDefeated=true;this.bossQuiet=DEMO.bossSilence;
        this.projectiles=[];this.energy.timeSinceCombat=ENERGY.combatTimeout;
        this.levelEvents.rebuild();this.hitstop=DEMO.bossHitstop;this.onEvent('victory');this.notify('O caminho se abriu.');
      }}
    }
    for(const e of this.enemies)e.update(dt,this.map,p,(x,y,d)=>this.projectiles.push(new Projectile(x,y,d)));
    if(this.boss&&(!this.room.bossArena||this.state.bossStarted))this.boss.update(dt,this.map,p);
    for(const e of this.targets)if(e.hitbox&&overlap(p,e.hitbox))this.damage(e.hitbox.damage,e.x);
    for(const b of this.projectiles) {
      b.update(dt,this.map);
      if(!b.dead&&overlap(p,b)){this.damage(b.damage,b.x);b.dead=true;}
    }
    this.projectiles=this.projectiles.filter(b=>!b.dead);
    if(this.map.overlapsHazard(p.left,p.top,p.w,p.h)&&!p.intangible) {
      if(this.damage(DEMO.damage,p.x-p.facing)){
        p.reset(this.safe.x,this.safe.y);this.camera.snapTo(p,this.map);
      }
    }
    // A safe floor is remembered only away from dangerous tile edges.
    if(p.onGround&&!this.map.overlapsHazard(p.left-DEMO.safeEdgePadding,p.top,p.w+DEMO.safeEdgePadding*2,p.h+DEMO.safeFloorProbe))this.safe={x:p.x,y:p.y};
    if(this.health.dead){this.die();return;}
    this.interactions(input);
    this.tutorial(input);
    this.camera.update(dt,p,this.map);
  }
  die() {
    this.deaths++;this.phase='dying';this.phaseTimer=DEMO.deathDelay;this.transition=null;
    this.onEvent('death');
  }
  interactions(input) {
    const p=this.player,r=this.room;
    this.levelEvents.interact(input);
    if(r.key&&!this.progression.has(r.key.id)&&near(p,r.key,DEMO.pickupRadius)){
      this.progression.set(r.key.id);this.notify('Chave do Cemitério · abre a porta do sol no Pátio');this.onEvent('checkpoint');
    }
    if(r.lever&&near(p,r.lever,DEMO.portalRadius)){
      this.context=this.progression.has(r.lever.id)?'Plataforma do Pátio baixada':'E / LB — acionar o contrapeso';
      if(input.pressed.interact&&!this.progression.has(r.lever.id)){
        this.progression.set(r.lever.id);this.notify('O contrapeso baixa a plataforma no Pátio.');this.onEvent('checkpoint');
      }
    }
    if(r.well&&near(p,r.well,DEMO.portalRadius)){
      this.context=this.progression.has(r.well.id)?'A fonte repousa.':'E / LB — beber da fonte';
      if(input.pressed.interact&&!this.progression.has(r.well.id)){
        this.progression.set(r.well.id);this.health.restore();this.energy.refill();
        this.notify('Água entre as cinzas · vida e energia restauradas');this.onEvent('checkpoint');
      }
    }
    if(r.checkpoint&&near(p,r.checkpoint,DEMO.checkpointRadius)){
      this.context='E / LB — repousar';
      if(this.checkpoint.room!==r.id||input.pressed.interact){
        this.checkpoint={room:r.id,...r.checkpoint};this.health.restore();this.energy.refill();
        this.energy.timeSinceCombat=ENERGY.combatTimeout;
        this.notify('Repouso ativado · vida e energia restauradas');this.onEvent('checkpoint');
      }
    }
    if(r.secretStone&&!this.flags.has(r.secretStone.id)&&near(p,r.secretStone,DEMO.portalRadius)){
      const s=r.secretStone;this.context='A pedra do altar está rachada.';
      const swing=p.attacks.light.flashTimer>0?COMBAT.attackLight:p.attacks.m2.flashTimer>0?COMBAT.attackM2:null;
      if(swing&&overlap(p._attackHitbox(swing.reach),{left:s.x-12,top:s.y-32,w:24,h:32})){
        this.progression.set(s.id);this.notify('O altar revela uma pequena urna.');this.onEvent('checkpoint');
      }
    }
    for(const item of r.pickups)if((!item.requires||this.flags.has(item.requires))&&!this.collected.has(item.id)&&near(p,item,DEMO.pickupRadius)){
      this.collected.add(item.id);this.health.addFragment();this.health.heal();
      this.notify('Fragmento de vida · 4 formam uma caveira · +1 vida');this.onEvent('checkpoint');
    }
    for(const note of r.notes??[])if(near(p,note,DEMO.portalRadius))this.context=note.text;
    for(const e of r.exits){
      if(e.physical){
        if(!this.progression.isOpen(e)||this.arenaLocked||this.arrival>0)continue;
        if(e.axis==='y'){
            const crossed=e.direction>0?p.y>=e.y:p.y<=e.y;
            const moving=e.direction>0?p.vy>0:p.vy<0;
            if(crossed&&moving&&Math.abs(p.y-e.y)<16&&Math.abs(p.x-e.x)<e.openingWidth/2-p.w/2)this.travel(e);
            continue;
          }
          const seam=e.flag?e.x+4:e.x; // Centre of the former 8-unit wall.
          const crossed=e.direction>0?p.x>=seam:p.x<=seam;
        if(crossed&&Math.abs(p.x-seam)<12&&(e.flag?(p.top>=e.y-32&&p.y<=e.y+1):Math.abs(p.y-e.y)<22)&&input.moveX===e.direction)this.travel(e);
        continue;
      }
      if(!near(p,e,DEMO.portalRadius))continue;
      const locked=!this.progression.isOpen(e);
      if(e.secret&&locked){
        this.context='Pedra rachada · golpeie a espada';
        const stone={left:e.x-this.map.tileSize/2,top:e.y-this.map.tileSize*2,w:this.map.tileSize,h:this.map.tileSize*2};
        const swing=p.attacks.light.flashTimer>0?COMBAT.attackLight:p.attacks.m2.flashTimer>0?COMBAT.attackM2:null;
        if(swing&&overlap(p._attackHitbox(swing.reach),stone)){this.flags.add(e.flag);this.notify('Uma passagem entre as pedras.');}
        continue;
      }
      if(locked){
        this.context=this.progression.hint(e);
        if(input.pressed.interact&&this.arrival<=0&&this.progression.canOpen(e))this.travel(e);
        continue;
      }
      if(this.arenaLocked){this.context='A saída está selada';continue;}
      if(e.portal){
        this.context=`E / LB — ${e.oneWay?'descer (sem volta por aqui)':e.side==='north'?'subir':e.side==='south'?'descer':this.rooms[e.to].name}`;
        if(input.pressed.interact&&this.arrival<=0)this.travel(e);
      }else if(this.arrival<=0&&input.moveX===e.direction)this.travel(e);
    }
    if(r.end&&this.bossDefeated&&near(p,r.end,DEMO.portalRadius)){
      this.phase='ending';this.phaseTimer=DEMO.endFade;
    }
  }
  tutorial(input){
    const kind=this.room.tutorial,p=this.player;
    const complete={move:input.moveX!==0,jump:p.vy<0,attack:input.pressed.attackLight||input.pressed.attackM2,
      run:p.running,drop:input.held.down&&input.pressed.jump,energy:this.energy.regenerating};
    if(kind&&complete[kind])this.tutorialDone.add(kind);
  }
}
