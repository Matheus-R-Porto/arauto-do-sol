import {drawWallLedges} from './wall-ledges.js';
import {drawMasonry} from './terrain-material.js';
import {WallPolish} from './wall-polish.js';
import { COMBAT, BOSS, DEMO, ZOMBIE, ENEMIES } from '../../config/tuning.js';
import { frameAt, duration, MarkerCursor, whiteSilhouette } from './animation-time.js';
import { playerAttackPlacement, drawPlayerAttackEffect } from './player-attack-effects.js';

const label=(c,s,x,y,color='#cfbd96',size=7)=>{c.font=`${size}px monospace`;c.textAlign='center';c.fillStyle=color;c.fillText(s,Math.round(x),Math.round(y));};
const clamp=n=>Math.max(0,Math.min(1,n));

// The observer owns its clocks; it never alters AI, hitboxes or combat timers.
export class ActorAnimator {
 constructor(){this.actors=new WeakMap();this.events=[];}
 update(dt,w){
  this.events=[];
  if(w.transition||w.hitstop>0||w.phase!=='playing')return;
  for(const e of [...w.enemies,...(w.boss?[w.boss]:[])]){
   const prev=this.actors.get(e),walking=!!prev&&Math.abs(e.x-prev.x)>.02;
   const boss=!!e.attack,hit=prev&&e.health<prev.hp;
   const hurt=hit?(boss?.15:.20):Math.max(0,(prev?.hurt||0)-dt);
   const state=e.dead?'death':e.state==='windup'||e.state==='active'?`${e.attack||''}${e.state}`:hurt>0||e.flashTimer>0?'hurt':e.state==='recovery'?'recovery':e.state==='intro'?'intro':walking?'walk':'idle';
   const changed=prev?.state!==state||prev?.attack!==e.attack||(e.timer??0)>(prev?.timer??Infinity)+1e-6||hit;
   let time=changed?0:prev.time+dt;
   let phaseDuration=null;
   if(['windup','active','recovery'].includes(e.state)&&state!=='hurt'&&!e.dead){
    const cfg=boss?BOSS[e.attack]:(e.cfg||ENEMIES[e.type||'walker']);
    phaseDuration=cfg[e.state]*(boss&&e.state==='recovery'?(changed?((e.timer??cfg.recovery)/cfg.recovery):prev.recoveryFactor):1);
    time=Math.max(0,phaseDuration-(e.timer??phaseDuration));
   }
   if(state==='intro'){phaseDuration=DEMO.bossIntro;time=Math.max(0,DEMO.bossIntro-e.timer);}
   if(state==='death'){phaseDuration=ZOMBIE.deathFadeTime;time=Math.max(0,ZOMBIE.deathFadeTime-e.deathTimer);}
   const phaseTime=boss&&prev?.phase===1&&e.phase===2?0:prev?.phaseTime===undefined?undefined:prev.phaseTime+dt;
   if(hit)this.events.push({name:'hit',entity:e});
   if(e.type==='ranged'&&e.state==='active'&&prev?.state!=='active')this.events.push({name:'fire',entity:e});
   this.actors.set(e,{distance:state==='walk'?(changed?0:(prev.distance||0)+Math.abs(e.x-prev.x)):0,x:e.x,state,time,hp:e.health,hurt,attack:e.attack,timer:e.timer,phase:e.phase,phaseTime,
    phaseDuration,recoveryFactor:e.state==='recovery'?(changed?(e.timer??1)/(boss?BOSS[e.attack].recovery:(e.cfg||ENEMIES[e.type||'walker']).recovery):prev.recoveryFactor):1,serial:(prev?.serial||0)+(changed?1:0)});
  }
 }
 sample(e,animations){
  const a=this.actors.get(e)||{state:'idle',time:0};
  let key=a.state.replace(/(slash|charge|slam)(windup|active)/,'$1-$2');
  if(e.attack&&key==='recovery')key=e.attack+'-recovery';
  const animation=animations[key]||animations.idle;
  if(!animation)return null;
  const time=key==='walk'?((a.distance||0)/(e.attack?48:e.type==='lunger'?32:24))*duration(animation):a.phaseDuration?Math.min(duration(animation),a.time/a.phaseDuration*duration(animation)):a.time;
  return frameAt(animation,time);
 }
 pose(e,boss=false){
  const a=this.actors.get(e)||{state:'idle',time:0};
  let pose=a.state;
  if(pose==='walk')pose=`walk-${Math.floor(a.time/.16)%2+1}`;
  if(boss){
   if(pose==='intro')pose='idle';
   pose=pose.replace(/(slash|charge|slam)(windup|active)/,'$1-$2');
  }
  return pose;
 }
}

export async function loadWorldArt(path='/assets/sprites/world/manifest.json'){
 const url=new URL(path,location.href),res=await fetch(url);
 if(!res.ok)throw new Error(`Arte do mundo: HTTP ${res.status}`);
 const m=await res.json();
 if(m.schemaVersion!==1||!m.assets||!m.backgrounds)throw new Error('Manifesto do mundo inválido');
 const entries=[...Object.values(m.assets),...Object.values(m.backgrounds).flatMap(b=>b.panels)];
 await Promise.all(entries.map(async a=>{
  const asset=new URL(a.file,url);
  if(asset.origin!==url.origin||!asset.pathname.startsWith('/assets/sprites/world/')||!asset.pathname.endsWith('.png'))throw new Error('Caminho de arte inválido');
  const im=new Image();im.src=asset.href;await im.decode();
  if(im.width!==a.canvas[0]||im.height!==a.canvas[1]||im.width>512||im.height>512)throw new Error(`Dimensão incorreta: ${a.file}`);
  a.image=im;
  if(a.file.startsWith('v2/')&&!a.file.startsWith('v2/vfx/'))a.flashImage=whiteSilhouette(im);
 }));
 return new WorldArt(m);
}

export class WorldArt {
 constructor(manifest){
  this.manifest=manifest;this.animator=new ActorAnimator();this.time=0;this.backgrounds={};this.events=[];this.previous=null;this.visualActors=new WeakMap();this.wallPolish=new WallPolish();
  for(const [name,b]of Object.entries(manifest.backgrounds)){
   const canvas=document.createElement('canvas');[canvas.width,canvas.height]=b.size;
   const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;
   for(const p of b.panels)ctx.drawImage(p.image,...p.source,p.x,p.y,p.source[2],p.source[3]);
   this.backgrounds[name]=canvas;
  }
 }
 update(dt,w){
  this.materialRoom=w.room.id;this.wallPolish.update(dt,w);
  this.animator.update(dt,w);
  if(w.transition||w.hitstop>0||w.phase!=='playing')return;
  this.time+=dt;this.events=this.events.filter(e=>(e.life-=dt)>0);
  const prev=this.previous;
  if(prev?.room!==w.room.id)this.events=[];
  const emit=(name,x,y,flip=1)=>{const a=this.manifest.animations?.vfx?.[name],total=a?duration(a):.25;this.events.push({room:w.room.id,x,y,life:total,total,name,flip});};
  if(prev?.room===w.room.id&&w.phase==='playing'){
   if(w.health?.skulls<prev.hp)emit('hit',w.player.x,w.player.y-12);
   if(w.player.onGround&&!prev.ground&&prev.vy>80)emit('dust',w.player.x,w.player.y);
   if(w.player.running&&Math.floor(this.time/.12)!==Math.floor((this.time-dt)/.12))emit('dust',w.player.x-w.player.facing*5,w.player.y,w.player.facing);
   for(const p of prev.projectiles||[])if(p.dead&&p.life>0)emit('projectile-impact',p.x,p.y);
  }
  for(const event of this.animator.events)if(event.name==='hit')emit('hit',event.entity.x,event.entity.y-event.entity.h/2);
  for(const e of [...w.enemies,...(w.boss?[w.boss]:[])]){
   const a=this.animator.actors.get(e);if(!a)continue;
   let visual=this.visualActors.get(e);if(!visual){visual={cursor:new MarkerCursor(),slam:false};this.visualActors.set(e,visual);}
   const slam=e.attack==='slam'&&!!e.hitbox;
   if(slam&&!visual.slam){emit('shockwave',e.x,e.floor);emit('dust',e.x-e.w/2,e.floor,-1);emit('dust',e.x+e.w/2,e.floor,1);}visual.slam=slam;
   if(!e.dead&&e.state==='active'&&(e.type==='lunger'||e.attack==='charge')&&Math.floor(this.time/.1)!==Math.floor((this.time-dt)/.1))emit('dust',e.x-e.facing*e.w/2,e.y,e.facing);
   const key=a.state.replace(/(slash|charge|slam)(windup|active)/,'$1-$2');
   const clip=this.manifest.animations?.[e.attack?'boss':e.type]?.[key];
   if(clip)for(const marker of visual.cursor.advance(clip,a.serial,a.time))if(marker.name==='fire'){
    emit('charge',e.x+e.facing*e.w,e.y-e.h/2,e.facing);this.events.at(-1).life=.06;
   }
  }
  this.previous={hp:w.health?.skulls,room:w.room.id,collected:w.collected.size,flags:w.flags.size,ground:w.player.onGround,vy:w.player.vy,projectiles:[...(w.projectiles||[])]};
 }
 fxName(name,time=this.time){const a=this.manifest.animations?.vfx?.[name];return a?frameAt(a,time).asset:name;}
 sprite(ctx,name,x,y,flip=1,alpha=1,flash=false){
  name=this.fxName(name);
  const a=this.manifest.assets[name];if(!a)return;
  const [ox,oy]=a.worldOffset??[0,0];
  ctx.save();ctx.globalAlpha*=clamp(alpha);ctx.translate(Math.round(x)+ox,Math.round(y)+oy);ctx.scale(flip*(a.worldScale??1),a.worldScale??1);ctx.drawImage(flash&&a.flashImage?a.flashImage:a.image,-a.pivot[0],-a.pivot[1]);ctx.restore();
 }
 patch(ctx,name,x,y,width,height,sx=0,sy=0){
  if(/^stone-[abc]$/.test(name)&&this.manifest.assets['stone-c']){drawMasonry(ctx,this.manifest.assets,this.materialRoom??'cemetery',x,y,width,height);return;}
  const a=this.manifest.assets[name];if(!a)return;
  const [l,t,r,b]=a.bounds,[sw,sh]=a.repeatSize??[(r-l)*(a.worldScale??1),(b-t)*(a.worldScale??1)],rx=(r-l)/sw,ry=(b-t)/sh;
  // Repeat native pixels, including partial edge tiles. Never stretch a sprite.
  for(let yy=0;yy<height;){const cy=(sy+yy)%sh,ch=Math.min(sh-cy,height-yy);
   for(let xx=0;xx<width;){const cx=(sx+xx)%sw,cw=Math.min(sw-cx,width-xx);ctx.drawImage(a.image,l+cx*rx,t+cy*ry,cw*rx,ch*ry,Math.round(x+xx),Math.round(y+yy),cw,ch);xx+=cw;}yy+=ch;}
 }
 bar(ctx,x,y,width,ratio,color){
  const a=this.manifest.assets['energy-frame'],[l,t,r,b]=a.bounds,s=a.worldScale??1,h=a.screenSize?.[1]??(b-t)*s,cap=9;
  ctx.fillStyle='#141b22';ctx.fillRect(x+cap,y+4,width-cap*2,4);
  ctx.drawImage(a.image,l,t,cap/s,b-t,x,y,cap,h);ctx.drawImage(a.image,r-cap/s,t,cap/s,b-t,x+width-cap,y,cap,h);
  for(let i=cap;i<width-cap;i++)ctx.drawImage(a.image,Math.floor((l+r)/2),t,1/s,b-t,x+i,y,1,h);
  ctx.fillStyle=color;ctx.fillRect(x+cap,y+5,Math.round((width-cap*2)*clamp(ratio)),2);
 }
 effect(ctx,name,b,flip=1,alpha=1,time=this.time){
  name=this.fxName(name,time);
  const a=this.manifest.assets[name];if(!a)return;const[l,t,r,bot]=a.bounds;
  ctx.save();ctx.globalAlpha*=clamp(alpha);ctx.beginPath();ctx.rect(b.left,b.top,b.w,b.h);ctx.clip();
  ctx.translate(Math.round(b.left+b.w/2),Math.round(b.top+b.h/2));ctx.scale(flip,1);
  ctx.drawImage(a.image,l,t,r-l,bot-t,-Math.round((r-l)/2),-Math.round((bot-t)/2),r-l,bot-t);ctx.restore();
 }
 background(ctx,w){
  this.materialRoom=w.room.id;
  const id=w.room.id,name=id==='guardian'||id==='beyond'?'arena':['ossuary','ascent','sentries'].includes(id)?'ossuary':w.room.theme==='crypt'?'crypt':'exterior';
  const [bw,bh]=this.manifest.backgrounds[name].worldSize??[480,270];
  ctx.fillStyle='#080d14';ctx.fillRect(0,0,480,270);ctx.drawImage(this.backgrounds[name],0,0,bw,bh);
  ctx.fillStyle=name==='exterior'?'#07100ed0':'#060d17bb';ctx.fillRect(0,0,480,270);
  // A separate middle-distance layer moves slower than collidable foreground.
  ctx.save();ctx.globalAlpha=.18;
  for(let i=-1;i<5;i++)this.sprite(ctx,name==='exterior'?'dead-tree':'window',i*175-Math.round(w.camera.ox*.17)%175,257-Math.round(w.camera.oy*.05));
  ctx.restore();
 }
 terrain(ctx,w){
  const m=w.map,c=w.camera,t=m.tileSize;
  // Small cell zones may frame beyond the technical map: opaque masonry, never void.
  if(w.room.id==='awakening'){if(c.ox<0)this.patch(ctx,'stone-b',c.ox,c.oy,-c.ox,c.h);if(c.ox+c.w>m.width)this.patch(ctx,'stone-b',m.width,c.oy,c.ox+c.w-m.width,c.h);}
  for(let r=Math.max(0,Math.floor(c.oy/t));r<Math.min(m.rows,Math.ceil((c.oy+c.h)/t));r++)for(let col=Math.max(0,Math.floor(c.ox/t));col<Math.min(m.cols,Math.ceil((c.ox+c.w)/t));col++){
   const type=m.at(col,r),x=col*t,y=r*t;if(!type)continue;
   if(type===1){ctx.fillStyle='#171d24';ctx.fillRect(x,y,t,t);this.patch(ctx,(Math.floor(y/16)+Math.floor(x/64))%3?'stone-b':'stone-a',x,y,t,t,x%32,y%32);if(m.at(col,r-1)!==1){ctx.fillStyle='#69766d';ctx.fillRect(x,y,t,1);}}
   else if(type===2){this.patch(ctx,'stone-b',x,y,t,5,x%32,y%32);ctx.fillStyle='#839180';ctx.fillRect(x,y,t,1);}
   else if(type===3)this.patch(ctx,'spikes',x,y,t,t,x%32,6);
  }
 }
 decor(ctx,w){
  if(w.room.number){
   ctx.save();ctx.globalAlpha=.48;
   drawWallLedges(ctx,w,this);

   for(let col=Math.max(4,4+Math.floor((w.camera.ox/8-4)/19)*19);col<Math.min(w.map.cols-4,(w.camera.ox+w.camera.w)/8);col+=19){for(let row=4;row<w.map.rows-2;row++)if(w.map.at(col,row)===1&&w.map.at(col,row-1)===0&&w.map.at(col,row-4)===0){const name=(w.room.theme==='open'||w.room.number===6)&&col%57===4?'dead-tree':col%3===0?'bones':col%2?'urns':'gravestones',a=this.manifest.assets[name],half=(a.bounds[2]-a.bounds[0])*(a.worldScale??1)/2,height=(a.bounds[3]-a.bounds[1])*(a.worldScale??1);
    const reserved=[...(w.room.breakables||[]),...w.room.exits,...[w.room.chest,w.room.checkpoint,w.room.lever,w.room.finalDoor].filter(Boolean)];let supported=!reserved.some(p=>Math.abs(p.x-col*8)<half+20&&Math.abs(p.y-row*8)<height+24);for(let x=col*8-half;x<col*8+half;x+=8)if(w.map.at(Math.floor(x/8),row)!==1)supported=false;
    for(let ry=Math.floor(row-height/8);ry<row;ry++)for(let cx=Math.floor(col-half/8);cx<=Math.ceil(col+half/8);cx++)if(w.map.at(cx,ry)!==0)supported=false;
    if(supported)this.sprite(ctx,name,col*8,row*8);break;}}
   ctx.restore();return;
  }
  const floor=(w.map.rows-2)*16,landmarks={statue:'statue',bones:'bones',bell:'bell',window:'window',tree:'dead-tree',roots:'dead-tree',urns:'urns',tomb:'mausoleum',fountain:'fountain',chain:'chain-gate',bridge:'gravestones'};
  ctx.save();ctx.globalAlpha=.63;
  for(let x=86;x<w.map.width-40;x+=151)this.sprite(ctx,x%3===0?'urns':'gravestones',x,floor);
  const name=landmarks[w.room.landmark];if(name)this.sprite(ctx,name,w.room.landmark==='statue'?350:Math.min(w.map.width*.55,440),floor);
  if(w.room.landmark==='roots')for(let x=720;x<w.map.width;x+=510)this.sprite(ctx,'dead-tree',x,floor);
  if(w.room.vista){const x=w.room.id==='crypt'?270:w.room.id==='refuge'?450:430,y=floor-85;
   const bossIdle=this.manifest.animations?.boss?.idle;
   this.sprite(ctx,'window',x,y);this.sprite(ctx,w.room.vista.kind==='guardian'?(bossIdle?frameAt(bossIdle,this.time).asset:'boss-idle'):w.room.vista.kind==='bones'?'bones':'shortcut-gate',x,y-2,1,.5);
   label(ctx,w.room.vista.label,x,y-111,'#8d9c9c');
  }
  ctx.restore();
 }
 objects(ctx,w,time){
  for(const e of w.room.exits){
   if(e.physical)continue;
   const locked=w.arenaLocked||!w.progression.isOpen(e);
   const asset=e.secret&&locked?'secret-stone':locked?(e.kind==='key'?'sun-door':e.kind==='lever'?'chain-gate':'shortcut-gate'):'arch';
   this.sprite(ctx,asset,e.x,e.y);
   const color=e.kind==='key'?'#e4bf6a':e.kind==='lever'?'#8dcbd3':e.kind==='shortcut'?'#c18b74':'#b0c6b7';
   if(e.portal){this.sprite(ctx,'ladder',e.x,e.y);label(ctx,e.side==='north'?'↑':e.oneWay?'↓!':'↓',e.x,e.y-55,color,11);}
   else if(!locked)label(ctx,e.direction>0?'›':'‹',e.x,e.y-49,color,11);
   if(locked&&!e.secret)label(ctx,e.kind==='key'?'SOL':e.kind==='lever'?'II':'×',e.x,e.y-19,color,8);
  }
  const bob=Math.round(Math.sin(time*3)*2);
  if(w.room.key&&!w.flags.has(w.room.key.id)){const {x,y}=w.room.key;this.sprite(ctx,'sun-key',x,y-8+bob);label(ctx,'CHAVE DO SOL',x,y-38,'#e8cd8a');}
  if(w.room.lever){const {x,y,id}=w.room.lever,open=w.flags.has(id);this.sprite(ctx,'lever',x,y,open?-1:1);label(ctx,open?'CORRENTE SOLTA':'CONTRAPESO',x,y-39,'#8ac9d4');}
  if(w.room.well){const {x,y,id}=w.room.well;this.sprite(ctx,'fountain',x,y,1,w.flags.has(id)?.55:1);label(ctx,'FONTE',x,y-47,'#b0d3cd');}
  if(w.room.checkpoint){const {x,y}=w.room.checkpoint;this.sprite(ctx,'shrine',x,y);this.sprite(ctx,'flame',x,y-23,1,w.checkpoint.room===w.room.id?.7+.2*Math.sin(time*4):.3);label(ctx,'REPOUSO',x,y-47,'#c1e3d5');}
  if(w.room.secretStone&&!w.flags.has(w.room.secretStone.id))this.sprite(ctx,'secret-stone',w.room.secretStone.x,w.room.secretStone.y);
  for(const item of w.room.pickups)if((!item.requires||w.flags.has(item.requires))&&!w.collected.has(item.id))this.sprite(ctx,'fragment',item.x,item.y-8+bob);
  if(w.room.end){this.sprite(ctx,'end-arch',w.room.end.x,w.room.end.y);label(ctx,'ADIANTE',w.room.end.x,w.room.end.y-66,'#e8d6a4');}
  this.contactEffects(ctx,w);
 }
 contactEffects(ctx,w){
  for(const e of this.events)if(e.room===w.room.id){
   if(['hit','charge','projectile-impact'].includes(e.name))this.effect(ctx,e.name,{left:e.x-20,top:e.y-20,w:40,h:40},e.flip,1,e.total-e.life);
   else this.sprite(ctx,this.fxName(e.name,e.total-e.life),e.x,e.y,e.flip,1);
  }
 }
 actor(ctx,e,boss=false){
  if(e.finished)return;
  const type=boss?'boss':e.type||'walker',pose=this.animator.pose(e,boss),name=`${type}-${pose}`;
  const animations=this.manifest.animations?.[type],frame=animations&&this.animator.sample(e,animations);
  const alpha=e.dead?clamp(e.deathTimer/.08):1;
  this.sprite(ctx,frame?.asset||(this.manifest.assets[name]?name:`${type}-idle`),e.x,e.y,e.facing,alpha,e.flashTimer>.1&&!e.dead);
  if(e.state==='windup'&&!e.dead){
   label(ctx,boss?({slash:'CORTE',charge:'INVESTIDA — PULE',slam:'QUEDA — AFASTE-SE'}[e.attack]||'!'):'!',e.x,e.y-e.h-10,'#ffdf98',boss?8:10);
  }
  if(boss&&!e.dead&&e.attack==='slam'&&['windup','active'].includes(e.state)){ctx.strokeStyle='#dfa35b';ctx.setLineDash([3,3]);ctx.beginPath();ctx.moveTo(e.slamX-60,e.floor-1);ctx.lineTo(e.slamX+60,e.floor-1);ctx.stroke();ctx.setLineDash([]);}
  const clock=this.animator.actors.get(e);
  if(e.hitbox&&e.attack!=='slam'&&e.attack!=='charge'&&type!=='lunger')this.effect(ctx,boss?'boss-slash':'slash-heavy',e.hitbox,e.facing,.9,clock?.time||0);
  if(type==='ranged'&&e.state==='windup'&&!e.dead)this.effect(ctx,'charge',{left:e.x+e.facing*8-10,top:e.y-e.h-8,w:20,h:20},e.facing,1,clock?.time||0);
  if(boss&&e.phase===2&&!e.dead){
   this.sprite(ctx,'flame',e.x,e.y-e.h+13,e.facing,.4);
   if(clock?.phaseTime<.85)this.effect(ctx,'phase-transition',{left:e.x-24,top:e.y-e.h-12,w:48,h:48},e.facing,1,clock.phaseTime);
  }
 }
 projectile(ctx,p){this.effect(ctx,'projectile',{left:p.x-5,top:p.y-4,w:10,h:8},Math.sign(p.vx)||1,1,DEMO.projectile.life-p.life);}
 playerEffects(ctx,w,pose){
  const p=w.player;
  const placement=playerAttackPlacement(p,pose);if(!placement)return;
  const heavy=placement.key==='m2',elapsed=DEMO.hitFlash-p.attacks[placement.key].flashTimer;
  const asset=this.manifest.assets[this.fxName(heavy?'slash-heavy':'slash-light',elapsed)];
  if(asset)drawPlayerAttackEffect(ctx,asset,placement,p._attackHitbox(heavy?COMBAT.attackM2.reach:COMBAT.attackLight.reach));
 }
 hud(ctx,w){
  ctx.fillStyle='#091016c9';ctx.fillRect(3,3,139,30);
  this.sprite(ctx,'medallion',18,31);
  for(let i=0;i<w.health.maxSkulls;i++)this.sprite(ctx,'health-skull',40+i*10,16,1,i<w.health?.skulls?1:.22);
  this.bar(ctx,33,19,106,w.energy.ratio,w.energy.mode==='combate'?'#dba052':'#80bac8');
  for(let i=0;i<w.health.fragments;i++)this.sprite(ctx,'hud-fragment',146+i*7,27);
  if(w.flags.has('cemeteryKey'))this.sprite(ctx,'sun-key',169,31,1,w.flags.has('cemeteryDoor')?.45:1);
 }
 bossHUD(ctx,w){
  const b=w.boss;label(ctx,'GUARDIÃO DO CEMITÉRIO',240,235,'#d4bd91',9);
  this.bar(ctx,98,238,284,b.health/b.maxHealth,b.phase===2?'#c47751':'#b3a07a');
 }
 title(ctx){this.sprite(ctx,'medallion',240,67);this.sprite(ctx,'gravestones',71,244,1,.5);this.sprite(ctx,'gravestones',409,244,-1,.5);}
}
