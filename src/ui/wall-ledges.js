export function drawWallLedges(ctx,w,art){
 if(!w.room.number)return;
 ctx.save();ctx.globalAlpha=1;
 for(const [x,y,len]of w.room.platforms){
  const px=x*8,py=y*8,width=len*8;
  if(px+width<w.camera.ox||px>w.camera.ox+w.camera.w||py>w.camera.oy+w.camera.h||py+16<w.camera.oy)continue;
  const left=w.room.rows[y][x-1]==='#',right=w.room.rows[y][x+len]==='#';if(!left&&!right&&w.room.id!=='watch')continue;
  // Short stepped corbels remain rooted in the same wall as the collision ledge.
  for(let tier=0;tier<3;tier++){
   const inset=(tier+1)*Math.max(4,Math.floor(width/5)),span=Math.max(8,width-inset);
   art.patch(ctx,'stone-b',left?px:px+width-span,py+5+tier*3,span,3);
  }
  ctx.fillStyle='#202c2c';
  const tip=left?px+width-9:px+5;ctx.fillRect(tip,py+5,3,2);ctx.fillRect(tip+(left?-5:5),py+8,2,2);
 }
 ctx.restore();
}
