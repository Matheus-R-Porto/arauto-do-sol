export const masonryVariants=['stone-a','stone-b','stone-c'];
export function masonryVariant(room,x,y){
 let h=1977;for(const c of room)h=Math.imul(h^c.charCodeAt(0),16777619);
 h^=Math.imul(x,374761393)^Math.imul(y,668265263);h=Math.imul(h^(h>>>13),1274126177);h^=h>>>16;
 return masonryVariants[(h>>>0)%masonryVariants.length];
}
export function drawMasonry(ctx,assets,room,x,y,width,height){
 const size=32;
 for(let yy=y;yy<y+height;){const row=Math.floor(yy/size),dy=yy-row*size,ch=Math.min(size-dy,y+height-yy);
  for(let xx=x;xx<x+width;){const col=Math.floor(xx/size),dx=xx-col*size,cw=Math.min(size-dx,x+width-xx),a=assets[masonryVariant(room,col,row)], [l,t,r,b]=a.bounds;
   ctx.drawImage(a.image,l+dx*(r-l)/size,t+dy*(b-t)/size,cw*(r-l)/size,ch*(b-t)/size,xx,yy,cw,ch);xx+=cw;
  }yy+=ch;
 }
}
