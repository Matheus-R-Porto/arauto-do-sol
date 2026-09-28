export function drawCemetery(ctx,w,art=null,debug=false){
 const r=w.room,ev=w.levelEvents;if(!r.number)return;
 const prop=(name,x,y)=>{if(!art?.manifest.assets[name])return false;art.sprite(ctx,name,x,y);return true;};
 // Side-view door jamb: the threshold is exactly the vertical seam at exit.x.
 for(const e of r.exits){if(!e.physical)continue;if(debug&&e.offscreen){ctx.strokeStyle='#f8de74';ctx.strokeRect(e.x+e.direction*e.visualMargin-.5,e.y-32,1,32);}
   if(e.passageType==='vertical'){if(r.arena&&w.arenaLocked){ctx.fillStyle='#847351';ctx.fillRect(e.x-e.openingWidth/2,e.y-8,e.openingWidth,3);for(let x=e.x-e.openingWidth/2;x<e.x+e.openingWidth/2;x+=8)ctx.fillRect(x,e.y-8,2,8);}if(debug){ctx.strokeStyle='#68ffae';ctx.strokeRect(e.x-e.openingWidth/2,e.y-1,e.openingWidth,2);}continue;}
   if(e.passageType==='passage'){if(debug){ctx.strokeStyle='#68ffae';ctx.strokeRect(e.x-1,e.y-22,2,22);}continue;}
   if(e.flag&&art?.wallPolish){if(debug){ctx.strokeStyle=w.flags.has(e.flag)?'#68ffae':'#ff9f68';ctx.strokeRect(e.x+3.5,e.y-32,1,32);}continue;}const locked=w.arenaLocked||!w.progression.isOpen(e);
  if(art){ctx.save();ctx.globalAlpha=.45;art.patch(ctx,'stone-b',e.x-16,e.y-68,32,68,e.x%32,0);ctx.restore();}
  ctx.fillStyle='#1a2028';ctx.fillRect(e.x-7,e.y-55,14,55);ctx.fillStyle='#918772';ctx.fillRect(e.x-8,e.y-55,16,6);ctx.fillRect(e.x-6,e.y-49,3,49);
  if(art){art.patch(ctx,'stone-a',e.x-8,e.y-55,16,6);art.patch(ctx,'stone-b',e.x-6,e.y-49,3,49);}
  ctx.fillStyle=locked?'#706452':'#111820';ctx.fillRect(e.x-2,e.y-49,7,49);if(locked){ctx.fillStyle='#b49d72';for(let y=e.y-44;y<e.y;y+=9)ctx.fillRect(e.x-3,y,9,2);}
  if(locked&&e.kind==='breakable'&&e.breakAllowed){ctx.strokeStyle='#161d24';ctx.beginPath();ctx.moveTo(e.x+3,e.y-46);ctx.lineTo(e.x-1,e.y-26);ctx.lineTo(e.x+4,e.y-7);ctx.stroke();}
  if(debug){ctx.strokeStyle='#68ffae';ctx.strokeRect(e.x-.5,e.y-22,1,22);}
 }
 for(const b of ev.targets){if(b.kind!=='pile'&&art?.wallPolish)continue;if(b.dead||b.door)continue;const hits=ev.damage.get(b.id)||0;
  if(b.kind==='pile'){if(!prop('bone-pile-'+Math.min(2,hits),b.x,b.y)){ctx.fillStyle=['#aea087','#80745f','#655f53'][Math.min(hits,2)];ctx.fillRect(b.left,b.top+hits*3,b.w,b.h-hits*3);}}
  else{if(!prop('cracked-wall',b.x+4,b.y)){ctx.fillStyle='#655f53';ctx.fillRect(b.left,b.top,b.w,b.h);if(art)art.patch(ctx,'stone-b',b.left,b.top,b.w,b.h);}ctx.strokeStyle='#171c24';ctx.beginPath();ctx.moveTo(b.x+5,b.top+2);ctx.lineTo(b.x+2,b.top+b.h*.5);ctx.lineTo(b.x+7,b.y-4);ctx.stroke();}
  if(debug){ctx.strokeStyle='#fcb45c';ctx.strokeRect(b.left,b.top,b.w,b.h);}
 }
 art?.wallPolish?.draw(ctx,w,art);
 if(r.lift){const l=r.lift,y=Math.round(ev.liftY/8)*8;ctx.strokeStyle='#776f5c';for(const x of[l.x+4,l.x+l.w-4]){ctx.beginPath();ctx.moveTo(x,48);ctx.lineTo(x,y);ctx.stroke();}ctx.fillStyle='#a69573';ctx.fillRect(l.x,y,l.w,4);}
 if(r.chest){if(!prop(w.flags.has(r.chest.id)?'chest-open':'chest-closed',r.chest.x,r.chest.y)){ctx.fillStyle='#ac8b51';ctx.fillRect(r.chest.x-12,r.chest.y-17,24,w.flags.has(r.chest.id)?9:17);}}
 if(r.sealedGate){const{x,y}=r.sealedGate;if(!prop('sealed-gate',x,y)){ctx.fillStyle='#111720';ctx.fillRect(x-52,y-150,104,150);ctx.strokeStyle='#ab9873';ctx.lineWidth=3;ctx.strokeRect(x-54,y-152,108,152);ctx.beginPath();ctx.moveTo(x-50,y-140);ctx.lineTo(x+50,y-12);ctx.moveTo(x+50,y-140);ctx.lineTo(x-50,y-12);ctx.stroke();ctx.strokeStyle='#86b9ca';ctx.beginPath();ctx.arc(x,y-75,20,0,Math.PI*2);ctx.stroke();ctx.lineWidth=1;}}
 if(r.finalDoor){const d=r.finalDoor,closed=!w.flags.has('finalDoor');ctx.save();ctx.beginPath();ctx.rect(d.x-8,d.y-(d.h??64)-6,32,(d.h??64)+6);ctx.clip();
  ctx.fillStyle='#545e59';ctx.fillRect(d.x-5,d.y-68,3,68);if(art)art.patch(ctx,'stone-b',d.x-5,d.y-64,3,64);ctx.fillStyle='#a59575';ctx.fillRect(d.x-5,d.y-68,18,5);if(art)art.patch(ctx,'stone-b',d.x-5,d.y-68,18,5);
  if(closed){ctx.fillStyle='#343336';ctx.fillRect(d.x,d.y-64,8,64);ctx.fillStyle='#c5a15d';for(let y=d.y-59;y<d.y;y+=12)ctx.fillRect(d.x,y,8,2);ctx.fillRect(d.x+2,d.y-33,4,6);}
 ctx.restore();}

 if(r.bossKey&&w.bossDefeated&&!w.flags.has('bossKey'))prop('sun-key',r.bossKey.x,r.bossKey.y-10);
 for(const drops of ev.drops.values())for(const b of drops)if(b.room===r.id&&!b.collected){if(!prop('bone-currency',b.x,b.y)){ctx.fillStyle='#d4c6a5';ctx.fillRect(Math.round(b.x)-2,Math.round(b.y)-2,4,3);}}
 for(const b of ev.particles){ctx.fillStyle='#a6987e';ctx.fillRect(Math.round(b.x),Math.round(b.y),2,2);}
 if(r.bossArena&&w.arenaLocked){for(const g of r.bossArena.gates??[]){ctx.fillStyle='#847351';for(let x=g.x;x<g.x+g.w;x+=4)ctx.fillRect(x,g.y-g.h,2,g.h);}}
 if(debug){ctx.font='7px monospace';ctx.textAlign='left';ctx.fillStyle='#e7ce95';for(const e of r.exits)ctx.fillText(e.to,e.x-25,e.y-60);}
}
export function drawCemeteryMap(ctx,w){
 ctx.fillStyle='#080f18f5';ctx.fillRect(0,0,480,270);ctx.fillStyle='#dccca5';ctx.font='10px monospace';ctx.textAlign='left';ctx.fillText('CEMITÉRIO · F3 FECHA',12,20);
 const center=r=>({x:38+r.mapPosition.x*78,y:122+r.mapPosition.y*75});
 for(const r of Object.values(w.rooms))for(const e of r.exits){const a=center(r),b=center(w.rooms[e.to]);ctx.strokeStyle=w.progression.isOpen(e)?'#73958c':'#805d4b';ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();}
 for(const r of Object.values(w.rooms)){const p=center(r);ctx.fillStyle=r===w.room?'#9e8252':w.visited.has(r.id)?'#38505a':'#182631';ctx.fillRect(p.x-15,p.y-11,30,22);ctx.fillStyle='#ede0c3';ctx.textAlign='center';ctx.fillText(r.number,p.x,p.y+4);}
}
