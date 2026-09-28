import { Zombie } from '../zombie.js';
import { BOSS, DEMO, ZOMBIE } from '../../../config/tuning.js';
import { clamp } from '../../core/math.js';

// No contact damage. Every damaging volume is announced and only active briefly.
export class CemeteryGuardian extends Zombie {
  constructor(x,y) {
    super(x,y);this.w=BOSS.width;this.h=BOSS.height;
    this.maxHealth=this.health=BOSS.hp;
    this.floor=y;this.state='intro';this.timer=DEMO.bossIntro;
    this.attack='slash';this.cycle=0;this.phase=1;this.hitbox=null;this.slamX=x;
  }
  takeHit(damage) {
    if(this.state==='intro')return false;
    // The guardian keeps its announced direction/attack; large mass resists knockback.
    return super.takeHit(damage,0,0);
  }
  update(dt,map,player) {
    this.hitbox=null;
    this.flashTimer=Math.max(0,this.flashTimer-dt);this.hurtTimer=Math.max(0,this.hurtTimer-dt);
    if(this.dead){this.deathTimer=Math.max(0,this.deathTimer-dt);return;}
    this.phase=this.health/this.maxHealth<=BOSS.phaseRatio?2:1;
    this.timer-=dt;
    const dx=player.x-this.x;
    if(this.state==='intro'&&this.timer<=0){this.state='approach';this.timer=BOSS.approachTime;}
    else if(this.state==='approach') {
      this.facing=Math.sign(dx)||this.facing;
      if(Math.abs(dx)>BOSS.range)this._moveAxis(map,'x',this.facing*BOSS.speed*dt);
      if(Math.abs(dx)<=BOSS.range||this.timer<=0){
        this.attack=['slash','charge','slam'][this.cycle++%3];
        this.state='windup';this.timer=BOSS[this.attack].windup;
        this.slamX=clamp(player.x,this.w,map.width-this.w);
        this.startX=this.x;
      }
    } else if(this.state==='windup'&&this.timer<=0){this.state='active';this.timer=BOSS[this.attack].active;}
    else if(this.state==='active') {
      const c=BOSS[this.attack];
      if(this.attack==='slash')this.hitbox={left:this.facing>0?this.right:this.left-BOSS.reach,top:this.floor-c.hitHeight,w:BOSS.reach,h:c.hitHeight,damage:c.damage};
      if(this.attack==='charge'){
        this._moveAxis(map,'x',this.facing*c.speed*dt);
        this.hitbox={left:this.left,top:this.floor-c.hitHeight,w:this.w,h:c.hitHeight,damage:c.damage};
      }
      if(this.attack==='slam'){
        const t=clamp(1-this.timer/c.active,0,1);
        this.x=this.startX+(this.slamX-this.startX)*t;
        this.y=this.floor-Math.sin(t*Math.PI)*c.height;
        if(this.timer<=dt){this.y=this.floor;this.x=this.slamX;
          this.hitbox={left:this.x-c.radius,top:this.floor-c.hitHeight,w:c.radius*2,h:c.hitHeight,damage:c.damage};}
      }
      if(this.timer<=0){this.state='recovery';this.timer=c.recovery*(this.phase===2?BOSS.phaseRecovery:1);this.y=this.floor;}
    } else if(this.state==='recovery'&&this.timer<=0){this.state='approach';this.timer=BOSS.approachTime;}
  }
  draw(ctx) {
    if(this.finished)return;
    const x=Math.round(this.x), y=Math.round(this.y);
    ctx.save();ctx.globalAlpha=this.dead?Math.max(0,this.deathTimer/ZOMBIE.deathFadeTime):1;
    ctx.fillStyle=this.flashTimer>0?'#fff0d1':this.state==='windup'?'#c4a66d':'#747477';
    ctx.fillRect(x-21,y-44,42,34);ctx.fillRect(x-12,y-65,24,22);
    ctx.fillRect(x-19,y-12,12,12);ctx.fillRect(x+7,y-12,12,12);
    ctx.fillStyle='#363340';ctx.fillRect(x-14,y-37,28,4);ctx.fillRect(x-12,y-28,24,4);
    ctx.fillStyle=this.phase===2?'#ed9b72':'#ffe0a0';
    ctx.fillRect(x-7,y-58,4,3);ctx.fillRect(x+3,y-58,4,3);
    ctx.fillStyle='#aaa08d';ctx.fillRect(x+this.facing*27-4,y-43,8,42);
    if(this.state==='windup') {
      ctx.fillStyle='#f5ca7d';ctx.font='8px monospace';ctx.textAlign='center';
      ctx.fillText({slash:'CORTE',charge:'INVESTIDA — PULE',slam:'QUEDA — AFASTE-SE'}[this.attack],x,y-75);
    }
    if((this.state==='windup'||this.state==='active')&&this.attack==='slam') {
      ctx.fillStyle='#e28f6599';ctx.fillRect(this.slamX-BOSS.slam.radius,this.floor-2,BOSS.slam.radius*2,2);
      ctx.fillRect(this.slamX-1,this.floor-9,2,9);
    }
    if(this.state==='active'&&this.attack==='charge'){
      ctx.fillStyle='#ebbd7288';ctx.fillRect(this.left,this.floor-BOSS.charge.hitHeight,this.w,BOSS.charge.hitHeight);
    }
    if(this.hitbox){const b=this.hitbox;ctx.fillStyle='#ffd599aa';ctx.fillRect(b.left,b.top,b.w,b.h);}
    if(this.state==='recovery'){ctx.fillStyle='#8ac3ca';ctx.fillRect(x-20,y+2,40,2);}
    ctx.restore();
  }
}
