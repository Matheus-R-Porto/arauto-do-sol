import {navigation,nearest,route,landing,input}from'./greybox-navigation.js';
import {PlaythroughDriver}from'./playthrough-driver.js';
export class GreyboxDriver{
 constructor(){this.frame=0;this.last='';this.cache=new Map();this.bossBot=new PlaythroughDriver({mode:'critical'});this.roomOrder=['awakening','passage','crossroads','watch','bridge','ossuary','sentries','balcony','ascent','guardian'];this.air=null;this.wait=0;}
 next(w,overrideGoal=null){
  this.frame++;const p=w.player,r=w.room,k=input();k.pressed={};k.held={};
  if(w.phase==='title'){k.pressed.interact=true;return k;}if(w.phase!=='playing'||w.transition)return k;
  if(this.last!==r.id){this.last=r.id;this.frame=0;this.air=null;this.nav=navigation(w.map);this.wait=0;}
  if(w.boss&&!w.boss.dead&&w.state.bossStarted){
   const offset=r.bossArena.left,player=Object.create(p),boss=Object.create(w.boss);Object.defineProperty(player,'x',{value:p.x-offset});Object.defineProperty(boss,'x',{value:w.boss.x-offset});Object.defineProperty(boss,'slamX',{value:w.boss.slamX-offset});
   const local=Object.create(w);Object.defineProperty(local,'player',{value:player});Object.defineProperty(local,'boss',{value:boss});Object.defineProperty(local,'map',{value:{width:r.bossArena.right-offset}});return this.bossBot.next(local);
  }
  let goal=overrideGoal??r.exits.find(e=>e.to===this.roomOrder[this.roomOrder.indexOf(r.id)+1]);
  if(r.id==='guardian'&&!overrideGoal)goal=!w.bossDefeated?{x:r.bossArena.trigger+24,y:r.boss.y}:!w.flags.has('bossKey')?r.bossKey:!w.flags.has('finalDoor')?{x:r.finalDoor.x-12,y:r.finalDoor.y}:r.end;
  if(w.arenaLocked&&!w.boss){const e=w.enemies.find(e=>!e.dead);goal=e?{x:e.x,y:e.y}:{x:240,y:224};}
  if(!goal)return k;
  // Defensive ordinary attacks; no changes to positions, health or energy.
  const enemy=w.enemies.filter(e=>!e.dead&&Math.abs(e.y-p.y)<24&&Math.abs(e.x-p.x)<85).sort((a,b)=>Math.abs(a.x-p.x)-Math.abs(b.x-p.x))[0];
  if(enemy&&!r.arena&&Math.abs(enemy.x-p.x)<enemy.w/2+30){k.pressed.attackLight=this.frame%12===0;k.pressed.attackM2=this.frame%12===6;}
  if(enemy&&p.onGround&&(r.arena||Math.abs(enemy.x-p.x)<40)&&w.energy.current>18){this.air=null;const dist=Math.abs(enemy.x-p.x),dir=Math.sign(enemy.x-p.x)||p.facing;
   k.moveX=dir;k.held.dash=false;
   if(dist<enemy.w/2+24){k.pressed.attackLight=this.frame%12===0;k.pressed.attackM2=this.frame%12===6;if(dist<enemy.w/2+14&&p.facing===dir)k.moveX=0;}
   if(enemy.type==='lunger'&&['windup','active'].includes(enemy.state)&&p.onGround){k.pressed.jump=true;k.held.jump=true;}
   if(!p.onGround)k.held.jump=true;
   if(w.energy.current<8)k.moveX=-dir;
   if(k.moveX&&!w.map.overlapsSolid(p.x+k.moveX*12,p.y+1,1,1)){k.moveX=0;if(dist>40)return this.navigate(w,goal,k);}
   return k;
  }
  return this.navigate(w,goal,k);
 }
 navigate(w,goal,k){const p=w.player,r=w.room; if(r.id==='ascent'&&goal.to==='balcony'&&p.y<100){k.moveX=p.x>124?-1:0;return k;} if(goal.offscreen&&Math.abs(p.y-goal.y)<2&&Math.abs(p.x-goal.x)<60){k.moveX=goal.direction;return k;}
  if(w.energy.current<12&&!this.air&&p.onGround){if(w.energy.current<60){this.rest=true;}}if(this.rest){const threatened=w.enemies.some(e=>!e.dead&&Math.abs(e.x-p.x)<210&&Math.abs(e.y-p.y)<40);if(w.energy.current>(threatened?24:75))this.rest=false;else {this.runup=null;k.pressed={};return k;}}
  if(r.finalDoor&&!w.flags.has('finalDoor')&&Math.abs(p.x-r.finalDoor.x)<25){k.pressed.interact=true;return k;}
  if(goal.axis==='y'&&!this.air&&Math.abs(p.y-goal.y)<48&&Math.abs(p.x-goal.x)<40){
   this.air=null;k.moveX=Math.abs(goal.x-p.x)>2?Math.sign(goal.x-p.x):0;
   if(goal.direction<0||w.map.overlapsSolid(p.x+k.moveX*8-5,p.y-22,10,22)){k.pressed.jump=p.onGround;k.held.jump=true;}
   return k;
  }
  if(this.air){const a=this.air;a.time++;k.moveX=a.turn&&a.time>=a.turn?-a.dir:a.dir;k.held.dash=true;k.held.jump=a.jump===true&&a.time<a.cut;k.held.down=a.jump==='drop';if((p.onGround&&landing(this.nav.nodes,p)===a.to&&a.time>3)||a.time>a.frames+45){this.air=null;}else return k;}
  if(!p.onGround){k.moveX=Math.sign(goal.x-p.x);return k;}
  const start=nearest(this.nav,p),end=nearest(this.nav,goal),path=route(this.nav,start,end);
  this.debug={start,end,path:path?.length,p:[p.x,p.y]};
  if(!path){k.moveX=Math.sign(goal.x-p.x);if(this.frame%35===0){k.pressed.jump=true;k.held.jump=true;}return k;}
  if(path.length===0){k.moveX=Math.abs(goal.x-p.x)>2?Math.sign(goal.x-p.x):goal.direction||0;k.held.dash=false;return k;}
  const edge=path[0],dir=Math.sign(edge.x-p.x);
  if(edge.velocity===158){
   if(!this.runup||this.runup.to!==edge.to){const startX=edge.x-edge.dir*22;if(Math.abs(p.x-startX)>3){k.moveX=Math.sign(startX-p.x);return k;}this.runup=edge;}
   if((edge.x-p.x)*edge.dir>2){k.moveX=edge.dir;k.held.dash=true;return k;}
  }
  if(edge.velocity===158&&Math.abs(p.vx)<150){this.runup=null;k.moveX=-edge.dir;return k;}
  if(edge.velocity!==158&&Math.abs(edge.x-p.x)>(['ascent','watch'].includes(r.id)?.4:4)){k.moveX=Math.sign(p.vx)===dir&&Math.abs(edge.x-p.x)<p.vx*p.vx/2800+.4?0:dir;k.held.dash=false;return k;}
  if(edge.velocity===0&&Math.abs(p.vx)>3){k.moveX=0;return k;} k.moveX=edge.dir;k.held.dash=true;k.pressed.jump=!!edge.jump;k.held.jump=edge.jump===true;k.held.down=edge.jump==='drop';this.air={...edge,time:0};this.runup=null;return k;
 }
}
