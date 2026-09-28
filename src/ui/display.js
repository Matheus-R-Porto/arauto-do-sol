// Raster resolution is independent of world units, camera zoom and HUD layout.
export const BASE_RESOLUTIONS = [[480,270],[640,360],[960,540]];
export const DEFAULT_BASE = [960,540];
export function fitDisplay(width,height,base=DEFAULT_BASE){
 const available=Math.min(Math.max(1,width)/base[0],Math.max(1,height)/base[1]);
 // Fit CSS pixels continuously; Windows scaling need not yield an integer ratio.
 return {width:base[0]*available,height:base[1]*available};
}
export class PixelDisplay {
 constructor(canvas,base=DEFAULT_BASE,logical=[480,270]){
  if(!BASE_RESOLUTIONS.some(([w,h])=>w===base[0]&&h===base[1]))throw new Error('Resolução interna inválida');
  this.canvas=canvas;this.base=[...base];this.buffer=document.createElement('canvas');
  [this.buffer.width,this.buffer.height]=base;
  this.context=this.buffer.getContext('2d',{alpha:false});
  this.context.setTransform(base[0]/logical[0],0,0,base[1]/logical[1],0,0);
  this.context.imageSmoothingEnabled=false;
  this.output=canvas.getContext('2d',{alpha:false});this.output.imageSmoothingEnabled=false;
 }
 resize(width,height,pixelRatio=1){
  const size=fitDisplay(width,height,this.base);
  const density=Number.isFinite(pixelRatio)&&pixelRatio>0?pixelRatio:1;
  const pixels={width:Math.max(1,Math.round(size.width*density)),height:Math.max(1,Math.round(size.height*density))};
  if(this.canvas.width!==pixels.width||this.canvas.height!==pixels.height){
   this.canvas.width=pixels.width;this.canvas.height=pixels.height;
   this.output.imageSmoothingEnabled=false;
  }
  this.canvas.style.width=size.width+'px';this.canvas.style.height=size.height+'px';return size;
 }
 present(){this.output.imageSmoothingEnabled=false;this.output.drawImage(this.buffer,0,0,this.canvas.width,this.canvas.height);}
}
export function installFullscreen(stage,button,onResize,status){
 const available=!!stage.requestFullscreen&&document.fullscreenEnabled!==false;
 button.disabled=!available;
 if(!available)status.textContent='Tela cheia indisponível neste navegador.';
 async function toggle(){
  if(!available)return;
  try{if(document.fullscreenElement)await document.exitFullscreen();else await stage.requestFullscreen();}
  catch{status.textContent='Não foi possível abrir a tela cheia. Tente pelo botão ou use F11.';}
 }
 button.addEventListener('mousedown',e=>e.stopPropagation());
 button.addEventListener('keydown',e=>{if(e.code==='Space'||e.code==='Enter')e.stopPropagation();});
 button.addEventListener('click',toggle);
 window.addEventListener('keydown',e=>{if(e.code==='KeyF'&&!e.repeat&&!e.ctrlKey&&!e.altKey&&!e.metaKey){e.preventDefault();void toggle();}});
 document.addEventListener('fullscreenchange',()=>{button.textContent=document.fullscreenElement?'Sair da tela cheia':'Tela cheia · F';status.textContent='';onResize();});
 return toggle;
}
