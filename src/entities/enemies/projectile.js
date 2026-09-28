import { DEMO } from '../../../config/tuning.js';
export class Projectile {
  constructor(x,y,direction) {
    this.x=x;this.y=y;this.vx=direction*DEMO.projectile.speed;
    this.w=this.h=DEMO.projectile.size;this.life=DEMO.projectile.life;
    this.damage=DEMO.projectile.damage;this.dead=false;
  }
  get left(){return this.x-this.w/2;}
  get top(){return this.y-this.h/2;}
  update(dt,map) {
    this.x+=this.vx*dt;this.life-=dt;
    if(this.life<=0||map.overlapsSolid(this.left,this.top,this.w,this.h))this.dead=true;
  }
  draw(ctx) {
    ctx.fillStyle='#dca0d4';ctx.fillRect(Math.round(this.left)-2,Math.round(this.top)+1,this.w+4,this.h-2);
    ctx.fillStyle='#ffe2d4';ctx.fillRect(Math.round(this.left),Math.round(this.top),this.w,this.h);
  }
}
