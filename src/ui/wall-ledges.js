export function drawWallLedges(ctx,w,art){
 if(!w.room.number)return;
 ctx.save();ctx.globalAlpha=1;
 for(const [x,y,len]of w.room.platforms){
  const px=x*8,py=y*8,width=len*8;
  if(px+width<w.camera.ox||px>w.camera.ox+w.camera.w||py>w.camera.oy+w.camera.h||py+16<w.camera.oy)continue;
  const left=w.room.rows[y][x-1]==='#',right=w.room.rows[y][x+len]==='#';if(!left&&!right&&w.room.id!=='watch')continue;
  // Surface wear stays inside the eight-unit collision slab.
  ctx.fillStyle='#202c2c';
  const tip=left?px+width-9:px+5;ctx.fillRect(tip,py+5,3,2);ctx.fillRect(tip+(left?-5:5),py+6,2,2);
 }
 ctx.restore();
}
