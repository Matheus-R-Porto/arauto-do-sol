import { COMBAT, DEMO } from '../../config/tuning.js';
import { whiteSilhouette } from './animation-time.js';

// Presentation only: this observer never writes to the player, health or world.
export class PlayerAnimator {
 constructor(){this.state='idle';this.time=0;this.previous=null;this.hurt=0;this.attack=null;this.land=0;}
 update(dt,w){
  const p=w.player,prev=this.previous;
  const reset=!prev||prev.player!==p||prev.room!==w.room.id||(prev.phase==='dying'&&w.phase!=='dying');
  if(reset){this.state='idle';this.time=0;this.hurt=0;this.attack=null;this.land=0;}
  else{
   if(w.health.skulls<prev.hp)this.hurt=DEMO.hurtLock;
   else if(!w.transition&&w.hitstop<=0)this.hurt=Math.max(0,this.hurt-dt);
   for(const name of ['light','m2']){
    if(p.attacks[name].cooldownTimer>prev.cooldowns[name]+1e-6)this.attack=name;
   }
   if(this.attack&&p.attacks[this.attack].cooldownTimer<=0)this.attack=null;
  }
  if(!reset&&!w.transition&&w.hitstop<=0){this.land=Math.max(0,this.land-dt);if(p.onGround&&!prev.ground&&prev.vy>80)this.land=.12;}
  let next='idle',forcedTime=null;
  if(w.phase==='dying'||w.health.dead){next='death';forcedTime=Math.max(0,DEMO.deathDelay-w.phaseTimer);}
  else if(w.phase==='playing'){
   if(this.hurt>0)next='hurt';
   else if(this.attack){next=this.attack==='light'?'attack-light':'attack-m2';forcedTime=(this.attack==='light'?COMBAT.attackLight:COMBAT.attackM2).swingDuration-p.attacks[this.attack].cooldownTimer;}
   else if(!p.onGround){next=p.vy<0?'jump':'fall';if(Math.abs(p.vy)<35)forcedTime=.20;}
   else if(this.land>0){next='land';forcedTime=.12-this.land;}
   else if(Math.abs(p.vx)>4)next=p.running?'run':'walk';
  }
  if(next!==this.state){this.state=next;this.time=0;}
  else if(!w.transition&&w.hitstop<=0&&w.phase==='playing')this.time+=['walk','run'].includes(next)&&prev?(Number.isFinite(p.x-prev.x)?Math.abs(p.x-prev.x):Math.abs(p.vx)*dt)*(next==='walk'?.52/32:.36/48):dt;
  if(forcedTime!==null)this.time=Math.max(0,forcedTime);
  this.previous={x:p.x,ground:p.onGround,vy:p.vy,player:p,room:w.room.id,hp:w.health.skulls,phase:w.phase,cooldowns:{light:p.attacks.light.cooldownTimer,m2:p.attacks.m2.cooldownTimer}};
 }
 frame(animation){
  const total=animation.frames.reduce((sum,f)=>sum+f.duration,0);
  let time=animation.loop?this.time%total:Math.min(this.time,total-1e-8);
  for(const frame of animation.frames){if(time<frame.duration)return frame;time-=frame.duration;}
  return animation.frames.at(-1);
 }
}

export async function loadPlayerSprites(manifestPath='/assets/sprites/protagonist/manifest.json'){
 const url=new URL(manifestPath,location.href),response=await fetch(url);
 if(!response.ok)throw new Error(`Manifesto do protagonista: HTTP ${response.status}`);
 const manifest=await response.json();
 if(manifest.schemaVersion!==1||!manifest.animations?.idle)throw new Error('Manifesto de sprites inválido.');
 if(manifest.status!=='idle-pilot')for(const state of ['walk','run','jump','fall','attack-light','attack-m2','hurt','death'])if(!manifest.animations[state])throw new Error(`Animação ausente: ${state}`);
 if(!Array.isArray(manifest.canvas)||manifest.canvas.length!==2||manifest.canvas.some(n=>!Number.isInteger(n)||n<1||n>128))throw new Error('Canvas de sprite inválido.');
 if(!Array.isArray(manifest.pivot)||manifest.pivot.length!==2||manifest.pivot.some((n,i)=>!Number.isInteger(n)||n<0||n>=manifest.canvas[i]))throw new Error('Pivot de sprite inválido.');
 for(const animation of Object.values(manifest.animations)){
  if(!Array.isArray(animation.frames)||!animation.frames.length)throw new Error('Animação vazia.');
  await Promise.all(animation.frames.map(async frame=>{
   if(!Number.isFinite(frame.duration)||frame.duration<=0)throw new Error('Duração de frame inválida.');
   const asset=new URL(frame.file,url);
   if(asset.origin!==url.origin||!asset.pathname.startsWith('/assets/sprites/')||!asset.pathname.endsWith('.png'))throw new Error('Somente sprites finais são aceitos pelo jogo.');
   const image=new Image();image.src=asset.href;
   try{await image.decode();}catch{throw new Error(`Não foi possível carregar ${frame.file}`);}
   if(image.naturalWidth!==manifest.canvas[0]||image.naturalHeight!==manifest.canvas[1])throw new Error(`Dimensão inesperada: ${frame.file}`);
   frame.image=image;
   frame.flashImage=whiteSilhouette(image);
  }));
 }
 return manifest;
}

export class PlayerSpriteView {
 constructor(manifest){this.manifest=manifest;this.animator=new PlayerAnimator();}
 update(dt,w){this.animator.update(dt,w);}
 draw(ctx,w){
  const p=w.player,a=this.animator;
  if(a.state!=='hurt'&&w.phase!=='dying'&&w.health.invulnTimer>0&&Math.floor(w.health.invulnTimer*18)%2===0)return;
  const animation=this.manifest.animations[a.state]??this.manifest.animations.idle;
  const frame=a.frame(animation);
  ctx.save();ctx.imageSmoothingEnabled=false;
  ctx.translate(Math.round(p.x),Math.round(p.y));ctx.scale(p.facing,1);
  const pivot=frame.pivot??this.manifest.pivot;const scale=this.manifest.worldScale??1;ctx.scale(scale,scale);
  ctx.drawImage(a.state==='hurt'&&a.time<.05?frame.flashImage:frame.image,-pivot[0],-pivot[1]);ctx.restore();
  if(w.phase!=='dying'&&this.effects)this.effects(ctx,w,{state:a.state,index:animation.frames.indexOf(frame),pivot,scale});
  else if(w.phase!=='dying'){
   p._drawAttackFlash(ctx,p.attacks.light,COMBAT.attackLight.reach,'255,255,255');
   p._drawAttackFlash(ctx,p.attacks.m2,COMBAT.attackM2.reach,'255,170,60');
  }
 }
}
