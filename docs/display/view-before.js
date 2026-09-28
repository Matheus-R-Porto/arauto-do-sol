import { RENDER, COMBAT } from '../../config/tuning.js';
import { drawHUD } from './hud.js';
import { drawLandmarks, drawMap } from './map-decor.js';
// Zoom only the world; HUD and menus retain their native screen coordinates.
export const WORLD_ZOOM = 1.5;
const text=(ctx,str,x,y,size=9,color='#d8ccb6',align='left')=>{ctx.font=`${size}px monospace`;ctx.fillStyle=color;ctx.textAlign=align;ctx.fillText(str,x,y);};
const tutorials={move:'A/D ou setas — mover',jump:'Espaço — pular · solte para um salto curto',attack:'M1 / J e M2 / U — espada · intercale até 5 golpes',run:'Shift + direção — correr · pule perto da borda',drop:'↓ + Espaço — descer plataforma · segure o pulo para subir',energy:'Uma barra para tudo · pare entre ações para recuperar'};
export class DemoView {
 constructor(background,playerView=null,art=null,zoom=WORLD_ZOOM){this.background=background;this.playerView=playerView;this.art=art;this.zoom=zoom;if(playerView&&art)playerView.effects=(ctx,w,pose)=>art.playerEffects(ctx,w,pose);}
 update(dt,w){this.playerView?.update(dt,w);this.art?.update(dt,w);}
 draw(ctx,w,time,debug,paused=false){
  const c=w.camera,p=w.player;ctx.imageSmoothingEnabled=false;
  if(this.art)this.art.background(ctx,w);else{this.background.draw(ctx,c,RENDER.width,RENDER.height,time);this.depth(ctx,w);}
  ctx.save();ctx.scale(this.zoom,this.zoom);ctx.translate(-c.ox,-c.oy);
  if(this.art){this.art.decor(ctx,w);this.art.terrain(ctx,w);this.art.objects(ctx,w,time);for(const e of w.enemies)this.art.actor(ctx,e);if(w.boss)this.art.actor(ctx,w.boss,true);for(const b of w.projectiles)this.art.projectile(ctx,b);}
  else{this.decor(ctx,w);w.map.draw(ctx,c,c.w,c.h);this.objects(ctx,w,time);for(const e of w.enemies)e.draw(ctx);if(w.boss)w.boss.draw(ctx);for(const b of w.projectiles)b.draw(ctx);}
  if(this.playerView)this.playerView.draw(ctx,w);
  else{p.draw(ctx,w.health.invulnTimer);if(!w.health.dead){ctx.fillStyle='#a9a59b';ctx.fillRect(Math.round(p.x+p.facing*7),Math.round(p.y-15),2,13);}}
  if(debug.hitboxes){const box=(b,color)=>{ctx.strokeStyle=color;ctx.strokeRect(b.left+.5,b.top+.5,b.w-1,b.h-1);};box(p,'#66ffb3');for(const e of w.targets){box(e,'#f58788');if(e.hitbox)box(e.hitbox,'#ffff66');}for(const b of w.projectiles)box(b,'#ff66ff');for(const [name,s] of Object.entries(p.attacks))if(s.flashTimer>0)box(p._attackHitbox(name==='light'?COMBAT.attackLight.reach:COMBAT.attackM2.reach),'#fff');}
  ctx.restore();ctx.fillStyle='#cbb89444';for(let i=0;i<22;i++){ctx.fillRect(Math.round((i*71+time*4)%480),Math.round((i*43+Math.sin(time+i)*5)%270),1,1);}
  if(this.art)this.art.hud(ctx,w);else drawHUD(ctx,w);text(ctx,w.room.name.toUpperCase(),470,14,8,'#bbae99','right');text(ctx,w.energy.mode==='combate'?'EM COMBATE':'EXPLORAÇÃO',8,41,7,w.energy.mode==='combate'?'#e5b173':'#8ca9b6');
  if(w.boss&&!w.boss.dead){if(this.art)this.art.bossHUD(ctx,w);else{text(ctx,'GUARDIÃO DO CEMITÉRIO',240,236,9,'#c9b594','center');ctx.fillStyle='#14141c';ctx.fillRect(98,242,284,6);ctx.fillStyle=w.boss.phase===2?'#c7876d':'#a39579';ctx.fillRect(100,244,280*w.boss.health/w.boss.maxHealth,2);}}
  const prompt=w.context||(!w.tutorialDone.has(w.room.tutorial)?tutorials[w.room.tutorial]:'');if(prompt&&w.phase==='playing')this.strip(ctx,prompt,259);
  if(w.noticeTimer>0&&w.phase==='playing')text(ctx,w.notification,240,57,8,'#d8bd8c','center');
  if(w.phase==='dying')text(ctx,'Os ossos encontram o caminho de volta.',240,125,9,'#f1d8b1','center');
  if(w.fade>0){ctx.fillStyle=`rgba(6,8,12,${Math.max(0,Math.min(1,w.fade))})`;ctx.fillRect(0,0,480,270);}
  if(w.phase==='title')this.title(ctx,false,w);if(w.phase==='finished')this.title(ctx,true,w);
  if(paused){ctx.fillStyle='#090c12d9';ctx.fillRect(0,0,480,270);text(ctx,'PAUSA',240,123,19,'#e6d1a4','center');text(ctx,'Esc — continuar',240,148,9,'#b0b4b9','center');}
  if(debug.map)drawMap(ctx,w);
 }
 strip(ctx,str,y){ctx.fillStyle='#0a0d14df';ctx.fillRect(0,y-12,480,23);text(ctx,str,240,y,8,'#d5cbb6','center');}
 title(ctx,finished,w){
  ctx.fillStyle='#080b12ce';ctx.fillRect(0,0,480,270);ctx.strokeStyle='#a98a5044';ctx.strokeRect(28.5,25.5,423,218);this.art?.title(ctx);
  text(ctx,'A R A U T O   D O   S O L',240,95,21,'#e8d5aa','center');ctx.fillStyle='#ad8b54';ctx.fillRect(210,110,60,1);
  text(ctx,finished?'FIM DA DEMO':'C E M I T É R I O',240,135,12,'#b9a88d','center');text(ctx,finished?'Esta travessia termina aqui.':'Sob a pedra, algo ainda desperta.',240,158,9,'#8896a4','center');
  if(finished)text(ctx,`${Math.floor(w.elapsed/60)} min · ${w.deaths} mortes · ${w.visited.size}/17 salas · ${w.collected.size}/4 fragmentos`,240,179,8,'#b1a68f','center');
  text(ctx,finished?'Espaço / E / A — reiniciar':'Espaço / E / A — despertar',240,210,10,'#eed6a2','center');text(ctx,'DEMO · CEMITÉRIO · v0.5.5',240,235,7,'#89928f','center');
 }
 depth(ctx,w){
  const c=w.camera,crypt=w.room.theme==='crypt';ctx.fillStyle=crypt?'#0b1522b9':'#0a1a2377';ctx.fillRect(0,0,480,270);
  for(let i=-1;i<9;i++){const x=Math.round(i*92-(c.ox*.18)%92),height=85+(i%3)*21;ctx.fillStyle='#18212c';ctx.fillRect(x,230-height,35,height);ctx.beginPath();ctx.arc(x+17,230-height,17,Math.PI,0);ctx.fill();ctx.fillStyle='#101821';ctx.fillRect(x+7,230-height,21,height);}
  const mist=ctx.createLinearGradient(0,150,0,270);mist.addColorStop(0,'#40525300');mist.addColorStop(1,'#40525355');ctx.fillStyle=mist;ctx.fillRect(0,140,480,130);
  if(crypt){ctx.fillStyle='#090f18';for(let x=0;x<480;x+=96){ctx.fillRect(x,0,9,270);ctx.fillRect(x-4,0,17,12);}}
 }
 decor(ctx,w){
  const floor=(w.map.rows-2)*16;
  for(let x=80;x<w.map.width-48;x+=117){const tall=(Math.floor(x/117)%3)*6+18;ctx.fillStyle='#2b3039';ctx.fillRect(x,floor-tall,12,tall);ctx.fillStyle='#3b3d43';ctx.fillRect(x-2,floor-tall,16,3);ctx.fillStyle='#161e29';ctx.fillRect(x+4,floor-tall+7,4,6);}
  drawLandmarks(ctx,w);
 }
 objects(ctx,w,time){
  for(const e of w.room.exits){const locked=w.arenaLocked||!w.progression.isOpen(e);
   if(e.secret&&locked){ctx.fillStyle='#343443';ctx.fillRect(e.x-12,e.y-42,24,42);ctx.strokeStyle='#aea28a';ctx.beginPath();ctx.moveTo(e.x+2,e.y-35);ctx.lineTo(e.x-3,e.y-23);ctx.lineTo(e.x+4,e.y-14);ctx.lineTo(e.x,e.y-4);ctx.stroke();continue;}
   const tone=e.kind==='key'?'#d0ac62':e.kind==='lever'?'#69afc0':e.kind==='shortcut'?'#b98169':'#8a9c93';
   ctx.fillStyle=tone;ctx.fillRect(e.x-12,e.y-39,3,39);ctx.fillRect(e.x+9,e.y-39,3,39);ctx.fillRect(e.x-12,e.y-42,24,4);
   if(e.portal){ctx.strokeStyle=tone;for(let k=0;k<4;k++){const y=e.y-6-k*7;ctx.strokeRect(e.x-7,y,14,3);}text(ctx,e.side==='north'?'↑':e.oneWay?'↓!':'↓',e.x,e.y-56,11,tone,'center');}
   if(locked){ctx.fillStyle='#514449';for(let x=e.x-7;x<e.x+10;x+=5)ctx.fillRect(x,e.y-36,2,36);}else{ctx.fillStyle='#82a69c22';ctx.fillRect(e.x-8,e.y-36,16,36);}
   if(locked&&e.kind==='key'){ctx.strokeStyle=tone;ctx.beginPath();ctx.arc(e.x,e.y-24,4,0,Math.PI*2);ctx.stroke();ctx.fillStyle=tone;ctx.fillRect(e.x-1,e.y-20,2,11);ctx.fillRect(e.x,e.y-12,5,2);}
   else if(locked){text(ctx,e.kind==='lever'?'II':'×',e.x,e.y-17,12,tone,'center');}
   else if(!e.portal)text(ctx,e.direction>0?'›':'‹',e.x,e.y-47,11,'#d5c191','center');
  }
  if(w.room.key&&!w.flags.has(w.room.key.id)){const {x,y}=w.room.key;ctx.strokeStyle='#f1cf76';ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y-19,4,0,Math.PI*2);ctx.stroke();ctx.fillStyle='#f1cf76';ctx.fillRect(x-1,y-15,2,12);ctx.fillRect(x,y-6,5,2);ctx.lineWidth=1;text(ctx,'CHAVE DO SOL',x,y-32,7,'#e8d399','center');}
  if(w.room.lever){const {x,y,id}=w.room.lever,open=w.flags.has(id);ctx.fillStyle='#5f777e';ctx.fillRect(x-8,y-8,16,8);ctx.strokeStyle='#76bfd0';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x,y-7);ctx.lineTo(x+(open?10:-10),y-29);ctx.stroke();ctx.lineWidth=1;ctx.fillStyle='#c4d5d3';ctx.fillRect(x+(open?7:-13),y-32,6,6);text(ctx,open?'CORRENTE SOLTA':'CONTRAPESO',x,y-42,7,'#83b8c6','center');}
  if(w.room.well){const {x,y,id}=w.room.well;ctx.fillStyle='#58646b';ctx.fillRect(x-18,y-12,36,12);ctx.fillRect(x-5,y-35,10,23);ctx.fillStyle=w.flags.has(id)?'#475964':'#87c0bd';ctx.fillRect(x-14,y-13,28,3);text(ctx,'FONTE',x,y-46,7,'#a5c8c4','center');}
  if(w.room.checkpoint){const {x,y}=w.room.checkpoint;ctx.fillStyle='#687d82';ctx.fillRect(x-9,y-9,18,9);ctx.fillRect(x-5,y-20,10,11);ctx.fillStyle=w.checkpoint.room===w.room.id?'#b8e2d6':'#bd9865';ctx.fillRect(x-2,y-29,4,8);ctx.strokeStyle='#8ec8c466';ctx.beginPath();ctx.arc(x,y-23,10+Math.sin(time*2),0,Math.PI*2);ctx.stroke();text(ctx,'REPOUSO',x,y-39,7,'#bdd0ca','center');}
  if(w.room.secretStone&&!w.flags.has(w.room.secretStone.id)){const {x,y}=w.room.secretStone;ctx.fillStyle='#55515b';ctx.fillRect(x-12,y-32,24,32);ctx.strokeStyle='#c0ad8e';ctx.beginPath();ctx.moveTo(x+4,y-29);ctx.lineTo(x-3,y-17);ctx.lineTo(x+3,y-9);ctx.lineTo(x,y-3);ctx.stroke();}
  for(const item of w.room.pickups)if((!item.requires||w.flags.has(item.requires))&&!w.collected.has(item.id)){const y=item.y-12+Math.round(Math.sin(time*3)*2);ctx.fillStyle='#efdba2';ctx.fillRect(item.x-3,y,6,7);ctx.fillStyle='#534842';ctx.fillRect(item.x-2,y+2,1,2);ctx.fillRect(item.x+1,y+2,1,2);}
  if(w.room.end){const {x,y}=w.room.end;ctx.fillStyle='#e6c18144';ctx.fillRect(x-12,y-55,24,55);text(ctx,'ADIANTE',x,y-62,8,'#e1cfa4','center');}
 }
}

