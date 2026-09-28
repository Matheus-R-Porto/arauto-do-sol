// A test driver, never imported by the shipped game's main.js.
// Reads state to choose normal input actions; never modifies the world/player.
export class PlaythroughDriver {
 constructor({exerciseDeaths=false,mode='completionist'}={}){
  this.exerciseDeaths=exerciseDeaths;this.deathBeforeBoss=false;this.deathAtBoss=false;
  this.deathStages=new Set();this.deathReason=null;
  this.mode=mode;this.seenLocked=new Set();
  const start=['awakening','passage','crossroads','crypt'];
  const middle=['crossroads','watch','shaft','bridge','ossuary'];
  const end=['refuge','guardian','beyond'];
  this.route=mode==='critical'?[...start,...middle,'ascent','balcony','sentries',...end]:
    mode==='explorer'?[...start,'chapel','crypt',...middle,'ascent','crypt','ascent','balcony','sentries','ossuary','watch','ossuary','sentries',...end]:
    [...start,'chapel','crypt',...middle,'ascent','crypt','ascent','balcony','sentries','ossuary','sentries','refuge','antechamber','procession','crypt','crossroads','crypt','procession','antechamber',...end];
  this.index=0;this.prev={};this.platform=0;this.lastRoom='';this.visits=[];this.frame=0;this.lastDeaths=0;
 }
 next(w){
  this.frame++;let held={};const p=w.player;
  if(w.phase==='dying'&&this.deathReason){this.deathStages.add(this.deathReason);this.deathReason=null;}
  if(w.phase==='dying'&&w.room.id==='sentries')this.deathBeforeBoss=true;
  if(w.phase==='dying'&&w.room.id==='guardian')this.deathAtBoss=true;
  if(w.phase==='title')held.interact=true;
  if(w.room.id!==this.lastRoom){
   this.lastRoom=w.room.id;this.platform=0;this.visits.push(w.room.id);
   if(w.deaths!==this.lastDeaths){this.lastDeaths=w.deaths;this.index=Math.max(0,this.route.lastIndexOf(w.room.id,this.index));}
   else if(w.room.id===this.route[this.index+1])this.index++;
   else if(this.route[this.index]!==w.room.id)this.index=Math.max(0,this.route.lastIndexOf(w.room.id,this.index));
  }
  let x=p.x,y=p.y;
  if(w.phase==='playing'&&!w.transition){
   const boss=w.boss;
   if(boss&&!boss.dead){
    const dx=boss.x-p.x,dir=Math.sign(dx)||1,dist=Math.abs(dx);
    if(boss.state==='intro'){x=150;}
    else if(boss.state==='windup'||boss.state==='active'){
     if(boss.attack==='slam'){
      x=boss.slamX+(p.x<boss.slamX?-100:100);
      if(x<35)x=boss.slamX+100;if(x>w.map.width-35)x=boss.slamX-100;
     }else if(boss.attack==='charge'){
      x=p.x;
      if(boss.state==='windup'&&boss.timer<.16&&dist<50){held.jump=true;this.crossDir=dir;}
      // Keep clear of the announced sweep until it approaches, then jump across it.
      if(boss.state==='active'){
       if(dist<95&&p.onGround){held.jump=true;this.crossDir=dir;}
       if(!p.onGround){held.jump=true;x=p.x+(this.crossDir||dir)*8;}
      }
     }else{
      x=boss.x-dir*120;held.dash=w.energy.current>10;
      if(boss.state==='windup'&&boss.timer<.17)held.jump=true;
     }
    }else{
     if(w.energy.current<15){x=boss.x-dir*115;}
     else{x=boss.x-dir*34;if(dist<49){x=p.x;held[dir>0?'right':'left']=true;if(this.frame%17===0)held.attackM2=true;}}
    }
   }else{
    const next=this.route[this.index+1];
    const e=w.room.exits.find(e=>e.to===next);
    if(w.room.end){x=w.room.end.x;y=w.room.end.y;}
    else if(e){x=e.x;y=e.y;}
    let goal=e;
    const collectible=this.mode!=='critical'?w.room.pickups.find(item=>!w.collected.has(item.id)):null;
    if(collectible)goal=collectible;
    if(w.room.key&&!w.flags.has(w.room.key.id)&&next!=='chapel')goal=w.room.key;
    if(w.room.lever&&!w.flags.has(w.room.lever.id))goal=w.room.lever;
    if(w.room.well&&!w.flags.has(w.room.well.id)&&this.mode!=='critical')goal=w.room.well;
    // Deliberately inspect both blocked doors before obtaining their requirements.
    const blocked=w.room.exits.find(exit=>['key','lever'].includes(exit.kind)&&!w.progression.isOpen(exit)&&!w.progression.canOpen(exit));
    if(this.mode!=='critical'&&blocked&&!this.seenLocked.has(blocked.flag))goal=blocked;
    if(goal){x=goal.x;y=goal.y;}
    if(goal&&Math.abs(p.x-goal.x)<14&&Math.abs(p.y-goal.y)<18){
      if(goal.requires&&!w.flags.has(goal.requires)){const face=Math.sign(goal.x-p.x)||1;held[face>0?'right':'left']=true;x=p.x+face*4;held.attackLight=this.frame%20===0;}
      else if(goal===blocked){this.seenLocked.add(blocked.flag);held.interact=true;}
      else if(goal===e&&e.secret&&!w.flags.has(e.flag)){const face=Math.sign(e.x-p.x)||e.direction;held[face>0?'right':'left']=true;x=p.x+face*4;held.attackLight=this.frame%20===0;}
      else if(goal===w.room.lever||goal===w.room.well||goal===e&&(e.portal||!w.progression.isOpen(e)))held.interact=this.frame%5===0;
    }
    this.atDoor=e&&goal===e&&Math.abs(p.x-e.x)<25;
    if(e&&goal===e&&!e.portal&&w.progression.isOpen(e)&&Math.abs(p.x-e.x)<22&&Math.abs(p.y-e.y)<18)x=e.x+e.direction*24;
    // Follow actual platform geometry; only the ending's solid step needs a waypoint.
    const rows=w.room.rows,platforms=[];
    for(let r=rows.length-3;r>0;r--){let start=-1;for(let c=0;c<=rows[r].length;c++){
      if(rows[r][c]==='='&&start<0)start=c;
      if(rows[r][c]!=='='&&start>=0){platforms.push({left:start*16,right:c*16,y:r*16});start=-1;}
    }}
    if(w.room.id==='beyond')platforms.push({left:24*16,right:29*16,y:17*16});
    if(p.onGround){
      this.waypoint=null;
      if(y<p.y-5){
        const steps=platforms.filter(t=>t.y<p.y-3&&t.y>=y&&p.y-t.y<=48)
          .sort((a,b)=>b.y-a.y||Math.abs((a.left+a.right)/2-x)-Math.abs((b.left+b.right)/2-x));
        if(steps[0]){const t=steps[0];this.waypoint={x:Math.max(t.left+16,Math.min(t.right-16,p.x+Math.sign(x-p.x)*32)),y:t.y};}
      }
    }
    if(this.waypoint){x=this.waypoint.x;y=this.waypoint.y;}
    const enemy=w.enemies.filter(e=>!e.dead&&Math.abs(e.y-p.y)<30&&Math.abs(e.x-p.x)<120).sort((a,b)=>Math.abs(a.x-p.x)-Math.abs(b.x-p.x))[0];
    if(enemy&&!(this.exerciseDeaths&&w.room.id==='crypt'&&!this.deathStages.has('key'))){
     const dir=Math.sign(enemy.x-p.x)||1,dist=Math.abs(enemy.x-p.x);
     x=enemy.x-dir*(enemy.w/2+13);y=p.y;
     if(dist<enemy.w/2+22){x=p.x;held[dir>0?'right':'left']=true;if(this.frame%17===0&&w.energy.current>10)held.attackM2=true;}
     if(w.energy.current<10)x=enemy.x-dir*100;
     if((enemy.state==='windup'||enemy.state==='active')&&enemy.type==='lunger'&&p.onGround)held.jump=true;
    }
   }
   const dir=Math.abs(x-p.x)>3?Math.sign(x-p.x):0;
   if(dir)held[dir>0?'right':'left']=true;
   if(!boss||boss.dead){
    held.dash=w.energy.current>20;
    const probe=p.x+(dir||1)*18;
    const obstacle=w.map.overlapsSolid(probe-2,p.top,4,p.h-1);
    const gap=w.map.overlapsHazard(p.x+(dir||1)*7-2,p.y,4,24);
    if(p.onGround&&((y<p.y-5&&Math.abs(x-p.x)<100)||(obstacle&&!this.atDoor)||gap))held.jump=true;
    if(p.onGround&&y>p.y+5&&Math.abs(x-p.x)<25){held.down=true;held.jump=true;}
   }
   if(!p.onGround&&this.prev.jump)held.jump=true;
  }
  const stage=this.exerciseDeaths&&(w.room.id==='crypt'&&w.flags.has('cemeteryKey')&&!this.deathStages.has('key')?'key':
    w.room.id==='watch'&&w.flags.has('cemeteryDoor')&&!this.deathStages.has('door')?'door':
    w.room.id==='ossuary'&&w.flags.has('mainGateLever')&&!this.deathStages.has('lever')?'lever':
    w.room.id==='sentries'&&!this.deathBeforeBoss?'shortcut':w.room.id==='guardian'&&!this.deathAtBoss?'boss':null);
  if(stage&&w.phase==='playing'){
   this.deathReason=stage;
   held={};const target=w.boss??w.enemies.find(e=>!e.dead);
   if(target&&Math.abs(target.x-p.x)>(target.type==='ranged'?110:23))held[target.x>p.x?'right':'left']=true;
   if(target&&target.y>p.y+5&&p.onGround){held.down=true;held.jump=this.frame%5===0;}
  }
  if(!stage&&!w.boss && w.energy.current<8)this.rest=true;
  if(this.rest){held={};if(w.energy.current>65)this.rest=false;}
  if(p.onGround && this.prev.jump)held.jump=false;
  const pressed={},released={};for(const a of ['left','right','jump','dash','attackLight','attackM2','interact','down']){pressed[a]=!!held[a]&&!this.prev[a];released[a]=!held[a]&&!!this.prev[a];}
  this.prev=held;
  return {held,pressed,released,moveX:(held.right?1:0)-(held.left?1:0)};
 }
}




