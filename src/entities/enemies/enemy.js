import { Zombie } from '../zombie.js';
import { DEMO, ENEMIES, ZOMBIE } from '../../../config/tuning.js';

// Reuse tested gravity, solid collision, health and knockback from the dummy.
export class Enemy extends Zombie {
  constructor(def) {
    super(def.x,def.y);
    this.type = def.type;
    this.cfg = ENEMIES[this.type];
    this.w = this.cfg.width; this.h = this.cfg.height;
    this.maxHealth = this.health = this.cfg.hp;
    this.home = def.x;
    this.state = 'idle'; this.timer = 0; this.stun = 0;
    this.hitbox = null;
  }
  takeHit(damage,vx,vy) {
    const hit = super.takeHit(damage,vx,vy);
    if (hit) {
      this.stun = DEMO.enemyStun;
      this.state = 'recovery'; this.timer = this.cfg.recovery;
      this.hitbox = null;
    }
    return hit;
  }
  canStep(map,dir,dt,speed) {
    const x = this.x + dir * (this.w/2 + speed*dt);
    return !map.overlapsSolid(x,this.top,1,this.h-1) &&
      map.overlapsSolid(x,this.y+1,1,1) && !map.overlapsHazard(x,this.top,1,this.h);
  }
  update(dt,map,player,emit = ()=>{}) {
    super.update(dt,map);
    this.hitbox = null;
    if (this.dead || !player) return;
    this.stun = Math.max(0,this.stun-dt);
    if (this.stun > 0) return;
    this.timer -= dt;
    const c = this.cfg, dx = player.x-this.x;
    const visible = Math.abs(dx)<c.detect && Math.abs(player.y-this.y)<DEMO.verticalDetect;
    if (this.state === 'idle') {
      if (visible) this.facing = Math.sign(dx)||this.facing;
      if (visible && this.type==='ranged' && Math.abs(dx)<c.retreat && this.canStep(map,-this.facing,dt,c.speed)) {
        this._moveAxis(map,'x',-this.facing*c.speed*dt);
        return;
      }
      if (visible && Math.abs(dx)<c.range) {
        this.state='windup'; this.timer=c.windup; this.vx=0;
      } else {
        if (!visible && Math.abs(this.x-this.home)>DEMO.patrolRadius) this.facing=Math.sign(this.home-this.x);
        const dir = this.facing;
        if (this.canStep(map,dir,dt,c.speed)) this._moveAxis(map,'x',dir*c.speed*dt);
        else if (!visible) this.facing *= -1;
      }
    } else if (this.state === 'windup' && this.timer<=0) {
      this.state='active'; this.timer=c.active;
      if (this.type === 'ranged') emit(this.x+this.facing*this.w,this.y-this.h/2,this.facing);
    } else if (this.state === 'active') {
      if (this.type === 'lunger' && this.canStep(map,this.facing,dt,c.chargeSpeed))
        this._moveAxis(map,'x',this.facing*c.chargeSpeed*dt);
      if (this.type !== 'ranged') this.hitbox={
        left: this.type==='lunger' ? this.left : this.facing>0 ? this.right : this.left-c.reach,
        top:this.top, w:this.type==='lunger'?this.w:c.reach, h:this.h, damage:c.damage,
      };
      if (this.timer<=0) { this.state='recovery'; this.timer=c.recovery; this.hitbox=null; }
    } else if (this.state === 'recovery' && this.timer<=0) this.state='idle';
  }
  draw(ctx) {
    if (this.finished) return;
    const x=Math.round(this.left),y=Math.round(this.top);
    ctx.save();
    ctx.globalAlpha=this.dead ? Math.max(0,this.deathTimer/ZOMBIE.deathFadeTime):1;
    ctx.fillStyle=this.flashTimer>0?'#ffffff':this.state==='windup'?'#edc46c':this.cfg.color;
    ctx.fillRect(x+2,y+5,this.w-4,this.h-8);
    ctx.fillRect(x+this.w/2-4,y,8,8);
    ctx.fillRect(x+1,y+this.h-5,4,5); ctx.fillRect(x+this.w-5,y+this.h-5,4,5);
    ctx.fillStyle='#211b29';
    ctx.fillRect(x+this.w/2+(this.facing>0?1:-3),y+2,2,2);
    if (this.type==='ranged') { ctx.fillStyle='#ac91cf';ctx.fillRect(x-3,y+6,2,this.h-6); }
    if (this.state==='windup') {
      ctx.fillStyle='#ffe0a0'; ctx.fillRect(x+this.w/2-1,y-10,2,5);ctx.fillRect(x+this.w/2-1,y-3,2,1);
    }
    if (this.hitbox) { ctx.fillStyle='#ed986999';const b=this.hitbox;ctx.fillRect(b.left,b.top,b.w,b.h); }
    if (this.state==='recovery') {ctx.fillStyle='#86b6c2';ctx.fillRect(x,y+this.h+2,this.w,1);}
    ctx.restore();
  }
}
