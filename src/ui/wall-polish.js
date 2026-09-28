export function drawWallFace(ctx,art,b,damaged=false){
 art.patch(ctx,'stone-b',b.x,b.y-48,8,48);
 // Small broken mortar cue; no contrasting pillar or bright outline.
 ctx.fillStyle=damaged?'#101819':'#1a2426';
 ctx.fillRect(b.x+3,b.y-30,1,damaged?13:5);
 ctx.fillRect(b.x+4,b.y-25,damaged?3:1,1);
}
// Read-only presentation of the existing permanent wall flags. No new collision.
export class WallPolish{
 constructor(){this.room=null;this.seen=new Map();this.time=new Map();this.chips=[];}
 update(dt,w){
  const change=this.room!==w.room.id||this.source!==w.levelEvents;this.source=w.levelEvents;if(change){this.room=w.room.id;this.seen.clear();this.time.clear();this.chips=[];}
  for(const b of (w.levelEvents?.targets??[])){if(b.kind==='pile')continue;const value=b.dead?'broken':w.levelEvents.damage.get(b.id)||0;
   if(!change&&this.seen.has(b.id)&&this.seen.get(b.id)!==value){this.time.set(b.id,value==='broken'?.36:.12);for(let i=0;i<10;i++)this.chips.push({x:b.x+4,y:b.y-8-i*3,ground:b.y,vx:(i%2?1:-1)*(10+i*3),vy:-22-i*2,life:.5+i*.02});}
   this.seen.set(b.id,value);
  }
  for(const[id,t]of this.time)this.time.set(id,Math.max(0,t-dt));
  for(const p of this.chips){p.life-=dt;p.vy+=180*dt;p.x+=p.vx*dt;p.y=Math.min(p.ground-1,p.y+p.vy*dt);}this.chips=this.chips.filter(p=>p.life>0);
 }
 draw(ctx,w,art){
  for(const b of (w.levelEvents?.targets??[])){if(b.kind==='pile')continue;const remaining=this.time.get(b.id)||0;
   const state=b.dead?(remaining>.22?'cracked':remaining>.1?'collapse':'broken'):(w.levelEvents.damage.get(b.id)?'cracked':'intact');
   // Only the lower 30 units are traversable visually. Upper masonry survives.
   let ceiling=b.top;const m=w.map,base=w.levelEvents.base;if(m&&base){let row=Math.floor(b.top/m.tileSize)-1;const col=Math.floor((b.x+4)/m.tileSize);while(row>=0&&base[row*m.cols+col]===0)row--;ceiling=(row+1)*m.tileSize;}const cap=Math.max(0,b.y-(b.dead?32:48)-ceiling);if(cap){art.patch(ctx,'stone-b',b.x,ceiling,8,cap,b.x%32,ceiling%32);}
   if(!b.dead||state==='cracked')drawWallFace(ctx,art,b,state==='cracked');
   else art.sprite(ctx,'wall-broken',b.x+4,b.y);
   if(b.dead&&state==='broken')art.sprite(ctx,'wall-rubble',b.x+4,b.y);
  }
  for(const p of this.chips){ctx.fillStyle=p.life>.25?'#7d877c':'#475651';ctx.fillRect(Math.round(p.x),Math.round(p.y),2,2);}
 }
}
