import {Enemy} from '../entities/enemies/enemy.js';
// Only map-specific events. Player, AI, combat and energy remain independent.
export class CemeteryEvents {
 constructor(world){this.w=world;this.damage=new Map();this.drops=new Map();this.bones=0;this.particles=[];this.liftPositions=new Map();}
 load(){
  const w=this.w,r=w.room;this.base=w.map.grid.slice();this.particles=[];
  this.arena={phase:w.flags.has(r.arena?.id)?'complete':'waiting',wave:0,timer:0};
  this.liftY=r.lift?(this.liftPositions.get(r.id)??r.lift.high):undefined;this.targets=[];
  for(const b of r.breakables??[])this.addTarget(b);
  for(const e of r.exits)if(e.physical&&e.flag)this.addTarget({id:e.flag,x:e.x,y:e.y,w:8,h:48,hits:2,sideAllowed:e.breakAllowed,door:true});
  this.rebuild();
 }
 addTarget(b){
  const w=this.w,self=this;
  this.targets.push({...b,left:b.kind==='pile'?b.x-b.w/2:b.x,top:b.y-b.h,
   get dead(){return w.flags.has(b.id);},
   takeHit(){
    if(this.dead||b.sideAllowed===false||(b.requires&&!w.flags.has(b.requires)))return false;
    const hits=(self.damage.get(b.id)||0)+1;self.damage.set(b.id,hits);self.burst(b.x,b.y-10);w.onEvent('hit');
    if(hits>=b.hits){w.flags.add(b.id);if(b.reward)self.drop(b.id,b.x,b.y-12,b.reward);w.notify(b.kind==='pile'?'Ossos desprendidos.':'Uma passagem entre as pedras.');self.rebuild();}
    return true;
   }});
 }
 burst(x,y){for(let i=0;i<8;i++)this.particles.push({x,y,vx:(i-3.5)*15,vy:-40-i%3*12,life:.65});}
 drop(id,x,y,amount){if(this.drops.has(id))return;this.drops.set(id,Array.from({length:4},(_,i)=>({room:this.w.room.id,x,y,vx:(i-1.5)*16,vy:-65-i*8,amount:amount/4,collected:false})));}
 rebuild(){
  const w=this.w,m=w.map;m.grid.set(this.base);
  const paint=(x,y,width,height,type)=>{for(let r=Math.floor(y/m.tileSize);r<Math.ceil((y+height)/m.tileSize);r++)for(let c=Math.floor(x/m.tileSize);c<Math.ceil((x+width)/m.tileSize);c++)if(c>=0&&r>=0&&c<m.cols&&r<m.rows)m.grid[r*m.cols+c]=type;};
  for(const b of this.targets){if(b.kind==='pile')continue;
   // Permanent masonry above the opening also keeps its collision.
   let row=Math.floor(b.top/m.tileSize)-1,col=Math.floor((b.x+4)/m.tileSize);
   while(row>=0&&this.base[row*m.cols+col]===0)row--;
   const ceiling=(row+1)*m.tileSize;
   paint(b.left,ceiling,b.w,Math.max(0,b.y-32-ceiling),1);
   if(!b.dead)paint(b.left,b.y-32,b.w,32,1);
  }
  if(w.room.lift)paint(w.room.lift.x,Math.round(this.liftY/8)*8,w.room.lift.w,8,1);
  if(this.arena.phase==='delay'||this.arena.phase==='wave'||this.arena.phase==='interval')for(const e of w.room.exits){if(e.axis==='y')paint(e.x-e.openingWidth/2,e.y-8,e.openingWidth,8,1);else paint(e.x-4,e.y-48,8,48,1);}
  if(w.room.bossArena&&w.boss&&!w.boss.dead&&w.state.bossStarted){const a=w.room.bossArena;for(const gate of a.gates??[{x:a.left-8,y:m.height,w:8,h:m.height},{x:a.right,y:m.height,w:8,h:m.height}])paint(gate.x,gate.y-gate.h,gate.w,gate.h,1);}
  if(w.room.finalDoor&&!w.flags.has('finalDoor')){const d=w.room.finalDoor;paint(d.x,d.y-(d.h??64),8,d.h??64,1);}
 }
 update(dt){
  const w=this.w,r=w.room,p=w.player;
  if(r.lift&&w.flags.has(r.lift.id)&&this.liftY<r.lift.low){const before=Math.round(this.liftY/8)*8;this.liftY=Math.min(r.lift.low,this.liftY+48*dt);this.liftPositions.set(r.id,this.liftY);const after=Math.round(this.liftY/8)*8;if(after!==before){if(p.onGround&&Math.abs(p.y-before)<1&&p.right>r.lift.x&&p.left<r.lift.x+r.lift.w)p.y+=after-before;this.rebuild();}}
  if(r.arena&&!w.flags.has(r.arena.id)){
   const a=this.arena;
   if(a.phase==='waiting'&&p.x>r.arena.left&&p.x<r.arena.right){a.phase='delay';a.timer=1;this.rebuild();w.onEvent('checkpoint');}
   if(a.phase==='delay'||a.phase==='interval'){a.timer-=dt;if(a.timer<=0){w.state.enemies=r.arena.waves[a.wave].map(e=>new Enemy(e));a.phase='wave';w.notify(`Vigília ${a.wave+1} de 2`);}}
   else if(a.phase==='wave'&&w.enemies.every(e=>e.dead)){a.wave++;if(a.wave===r.arena.waves.length){w.flags.add(r.arena.id);a.phase='complete';this.rebuild();w.notify('As grades se erguem.');w.onEvent('checkpoint');}else{a.phase='interval';a.timer=1.2;}}
  }
  if(r.bossArena&&w.boss&&!w.state.bossStarted&&p.x>r.bossArena.trigger&&p.x<r.bossArena.right){w.state.bossStarted=true;this.rebuild();w.onEvent('checkpoint');}
  for(const drops of this.drops.values())for(const b of drops)if(!b.collected&&b.room===r.id){b.vy+=350*dt;const ny=b.y+b.vy*dt;if(!w.map.overlapsSolid(b.x-2,ny-2,4,4)){b.y=ny;b.x+=b.vx*dt;}else{b.vx=0;b.vy=0;}if(Math.abs(p.x-b.x)<18&&Math.abs(p.y-12-b.y)<26){b.collected=true;this.bones+=b.amount;w.onEvent('checkpoint');}}
  for(const q of this.particles){q.life-=dt;q.vy+=170*dt;q.x+=q.vx*dt;q.y+=q.vy*dt;}this.particles=this.particles.filter(q=>q.life>0);
 }
 interact(input){
  const w=this.w,r=w.room,p=w.player,near=b=>Math.abs(p.x-b.x)<25&&Math.abs(p.y-b.y)<32;
  if(r.cache&&!w.flags.has(r.cache.id)&&near(r.cache)){w.flags.add(r.cache.id);this.drop(r.cache.id,r.cache.x,r.cache.y-10,r.cache.amount);}
  if(r.chest&&near(r.chest)){w.context=w.flags.has(r.chest.id)?'Baú vazio':'E — abrir o baú';if(input.pressed.interact&&!w.flags.has(r.chest.id)){w.flags.add(r.chest.id);this.drop(r.chest.id,r.chest.x,r.chest.y-12,r.chest.amount);w.notify('Reserva de ossos · 40 fragmentos');}}
  if(r.bossKey&&w.bossDefeated&&!w.flags.has('bossKey')&&near(r.bossKey)){w.flags.add('bossKey');w.notify('Chave do Guardião');w.onEvent('checkpoint');}
  if(r.finalDoor&&near(r.finalDoor)&&!w.flags.has('finalDoor')){w.context=w.flags.has('bossKey')?'E — abrir com a chave do Guardião':'O selo aguarda a chave do Guardião';if(w.flags.has('bossKey')&&input.pressed.interact){w.flags.add('finalDoor');this.rebuild();w.onEvent('checkpoint');}}
 }
}
