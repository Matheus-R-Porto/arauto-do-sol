// Presentation helpers. Never advance gameplay or emit damage.
export const duration = animation => animation.frames.reduce((n,f)=>n+f.duration,0);
export function frameAt(animation,elapsed){
 const total=duration(animation);
 let t=animation.loop?Math.max(0,elapsed)%total:Math.min(Math.max(0,elapsed),total-1e-9);
 for(const f of animation.frames){if(t<f.duration)return f;t-=f.duration;}
 return animation.frames.at(-1);
}
export function crossedMarkers(animation,previous,elapsed){
 return (animation.markers||[]).filter(m=>m.time>previous&&m.time<=elapsed);
}
export class MarkerCursor {
 constructor(){this.token=null;this.time=-1;}
 advance(animation,token,time){
  if(token!==this.token){this.token=token;this.time=-1;}
  const markers=crossedMarkers(animation,this.time,time);this.time=time;return markers;
 }
}
export function whiteSilhouette(image){
 const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;
 const ctx=canvas.getContext('2d');ctx.drawImage(image,0,0);ctx.globalCompositeOperation='source-in';
 ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);return canvas;
}
