import {drawWallFace} from './wall-polish.js';
// Opaque foreground covers follow the existing permanent gate flags.
// Fixed chamber coordinates preserve geography and camera framing.
export const concealedChambers = {
 awakening: [{flag:'cellWall',x:0,y:0,w:192,h:256}],
 crossroads: [{flag:'upperSecretWall',x:56,y:48,w:304,h:72}],
 watch: [{flag:'upperChamber',x:416,y:104,w:88,h:88},{flag:'leverChamber',x:416,y:448,w:56,h:64}],

};
export function activeCovers(w){return (concealedChambers[w.room.id]||[]).filter(c=>!w.flags.has(c.flag));}
function masonry(ctx,art,x,y,width,height){
 ctx.fillStyle='#171e23';ctx.fillRect(x,y,width,height);
 art?.patch(ctx,'stone-b',x,y,width,height,((x%32)+32)%32,((y%32)+32)%32);
}
export function drawInteriorArchitecture(ctx,w,art){
 const interiors={awakening:[{x:24,y:24,w:160,h:208}],crossroads:concealedChambers.crossroads,watch:concealedChambers.watch};
 for(const c of interiors[w.room.id]||[]){ctx.save();masonry(ctx,art,c.x,c.y,c.w,c.h);ctx.fillStyle='#080e16bc';ctx.fillRect(c.x,c.y,c.w,c.h);ctx.restore();}
 if(w.room.id!=='awakening')return;
 // Rear masonry and engaged ribs sit behind actors, inside the existing cell.
 ctx.save();masonry(ctx,art,192,120,136,112);
 ctx.fillStyle='#080e16bc';ctx.fillRect(192,120,136,112);
 for(const x of [198,270,319]){masonry(ctx,art,x,124,5,108);ctx.fillStyle='#131b24aa';ctx.fillRect(x,124,5,108);}
 ctx.strokeStyle='#303d3e';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(197,147);ctx.quadraticCurveTo(252,115,321,147);ctx.stroke();
 ctx.fillStyle='#69746a';ctx.fillRect(192,120,136,2);ctx.restore();
}
export function drawArchitecturalCovers(ctx,w,art){
 ctx.save();ctx.globalAlpha=1;
 for(const c of activeCovers(w)){
  const x=Math.max(c.x,Math.floor(w.camera.ox)),y=Math.max(c.y,Math.floor(w.camera.oy));
  const right=Math.min(c.x+c.w,Math.ceil(w.camera.ox+w.camera.w)),bottom=Math.min(c.y+c.h,Math.ceil(w.camera.oy+w.camera.h));
  if(right>x&&bottom>y)masonry(ctx,art,x,y,right-x,bottom-y);
 }
 // Keep subtle damage readable at the secret seam, above the opaque facade.
 if(w.room.id==='awakening'&&!w.flags.has('cellWall')){
  const b=w.levelEvents.targets.find(t=>t.id==='cellWall');
  if(b&&art)drawWallFace(ctx,art,b,!!w.levelEvents.damage.get(b.id));
 }
 ctx.restore();
}
