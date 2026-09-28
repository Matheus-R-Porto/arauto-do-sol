import {Enemy} from '../entities/enemies/enemy.js';
import {Zombie} from '../entities/zombie.js';
export function installTestLab(w,art,debug,canvas){
 let type='dummy',target,state,stats={hits:0,last:0,total:0},effects=[];
 const resetTarget=()=>{
  target=new Enemy({type:type==='dummy'?'walker':type,x:272,y:480});
  if(type==='dummy'){target.maxHealth=target.health=100;target.update=function(dt,map){Zombie.prototype.update.call(this,dt,map);this.hitbox=null;this.state=this.hurtTimer>0?'recovery':'idle';};}
  const hit=target.takeHit.bind(target);target.takeHit=(...args)=>{const before=target.health,ok=hit(...args);if(ok){const amount=before-target.health;stats.hits++;stats.last=amount;stats.total+=amount;effects.push({x:target.x,y:target.top-5,text:String(amount),life:1});}return ok;};
  w.state.enemies=[target];w.projectiles=[];state=w.state;
 };
 const reset=()=>{w.restart();w.phase='playing';stats={hits:0,last:0,total:0};effects=[];resetTarget();};
 const panel=document.createElement('div');panel.id='lab-controls';
 panel.innerHTML='<label>Alvo <select aria-label="Alvo de teste"><option value="dummy">Boneco passivo · 100 HP</option><option value="walker">Walker</option><option value="ranged">Ranger</option><option value="lunger">Lunger</option></select></label> <button data-action="target">Repor alvo · F5</button> <button data-action="reset">Reiniciar sala · F4</button> <button data-action="heal">Restaurar vida/energia · F6</button> <button data-action="boxes">Hitboxes · F2</button> <output aria-live="off"></output>';
 document.getElementById('controls').prepend(panel);
 const focus=()=>canvas.focus();panel.querySelector('select').onchange=e=>{type=e.target.value;resetTarget();focus();};
 panel.querySelector('[data-action=target]').onclick=()=>{resetTarget();focus();};panel.querySelector('[data-action=reset]').onclick=()=>{reset();focus();};
 const heal=()=>{w.health.restore();w.energy.refill();};panel.querySelector('[data-action=heal]').onclick=()=>{heal();focus();};panel.querySelector('[data-action=boxes]').onclick=()=>{debug.hitboxes=!debug.hitboxes;focus();};
 window.addEventListener('keydown',e=>{if(['F4','F5','F6'].includes(e.code)){e.preventDefault();if(e.repeat)return;if(e.code==='F4')reset();if(e.code==='F5')resetTarget();if(e.code==='F6')heal();}});
 // Keep original actor sprites, effects, animation clocks and HUD. Only scenery is a placeholder.
 const labArt=Object.create(art);
 labArt.background=ctx=>{ctx.fillStyle='#161c25';ctx.fillRect(0,0,480,270);};labArt.decor=()=>{};labArt.objects=(ctx,world)=>labArt.contactEffects(ctx,world);
 labArt.terrain=(ctx,world)=>{const m=world.map,t=m.tileSize;ctx.strokeStyle='#27313e';ctx.lineWidth=.5;for(let y=0;y<m.height;y+=t){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(m.width,y);ctx.stroke();}for(let x=0;x<m.width;x+=t){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,m.height);ctx.stroke();}for(let r=0;r<m.rows;r++)for(let c=0;c<m.cols;c++)if(m.grid[r*m.cols+c]===1){ctx.fillStyle=r===27?'#657b91':'#354657';ctx.fillRect(c*t,r*t,t,t);ctx.strokeStyle='#8aa0b4';ctx.strokeRect(c*t+.5,r*t+.5,t-1,t-1);}for(const f of effects){ctx.fillStyle='#ffe39c';ctx.font='8px monospace';ctx.fillText(f.text,f.x,f.y);}};
 labArt.hud=(ctx,world)=>{art.hud(ctx,world);ctx.fillStyle='#0b101cdd';ctx.fillRect(5,225,310,24);ctx.fillStyle='#e2d5b7';ctx.textAlign='left';ctx.font='7px monospace';ctx.fillText(`Dano: ${stats.last} | Total: ${stats.total} | Acertos: ${stats.hits} | Alvo: ${target.health}/${target.maxHealth}`,10,235);ctx.fillText('Verde: corpo | Vermelho: alvo | Branco: golpe | Amarelo: ataque inimigo',10,244);};
 reset();debug.hitboxes=true;
 return {art:labArt,update(dt){if(w.state!==state)resetTarget();for(const f of effects){f.life-=dt;f.y-=12*dt;}effects=effects.filter(f=>f.life>0);panel.querySelector('output').textContent=` Dano ${stats.last} · total ${stats.total} · ${stats.hits} acertos`;}};
}
