import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PixelDisplay,BASE_RESOLUTIONS,fitDisplay,installFullscreen} from '../src/ui/display.js';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8').replaceAll('\r\n','\n');
assert.match(read('src/ui/demo-view.js'),/WORLD_ZOOM = 1\.5/,'Approved camera zoom');
assert.match(read('src/main.js'),/display.present\(\);/,'Presentation buffer still used');
const fakeCanvas=()=>({width:0,height:0,style:{},ctx:{imageSmoothingEnabled:true,setTransform(...v){this.transform=v;},drawImage(...v){this.draw=v;}},getContext(){return this.ctx;}});
globalThis.document={createElement:fakeCanvas};
for(const base of BASE_RESOLUTIONS){
 const canvas=fakeCanvas(),d=new PixelDisplay(canvas,base);
 assert.deepEqual(d.resize(1920,1080),{width:1920,height:1080});
 assert.deepEqual([d.buffer.width,d.buffer.height],base);
 assert.equal(d.context.imageSmoothingEnabled,false);d.present();assert.equal(d.output.imageSmoothingEnabled,false);
 assert.deepEqual(d.output.draw.slice(1),[0,0,1920,1080]);
 // All bases map the same logical world point to the same Full HD output.
 assert.ok(Math.abs(100*d.context.transform[0]*1920/base[0]-400)<1e-9);
 for(const [w,h]of [[2560,1080],[1920,1200],[1280,720],[1536,864],[1366,768],[390,844],[320,180]]){const fit=fitDisplay(w,h,base);assert.ok(fit.width<=w&&fit.height<=h);assert.ok(Math.abs(fit.width*9-fit.height*16)<1e-8);assert.ok(Math.abs(fit.width-w)<1e-8||Math.abs(fit.height-h)<1e-8,'Must fill at least one viewport axis');}
 for(const ratio of [1,1.25,1.5,2]){
  const css=d.resize(1920/ratio,1080/ratio,ratio);
  assert.deepEqual([canvas.width,canvas.height],[1920,1080]);
  assert.equal(css.width,1920/ratio);assert.equal(css.height,1080/ratio);
  assert.equal(canvas.style.width,css.width+'px');
  d.present();assert.equal(d.output.imageSmoothingEnabled,false);
  assert.deepEqual(d.output.draw.slice(1),[0,0,1920,1080]);
 }
 d.resize(960,540);d.present();assert.equal(d.output.imageSmoothingEnabled,false);
}
console.log('Display: 3 bases → Full HD, nearest-neighbor, aspect ratio, resize, same framing and frozen world/HUD passed.');
const events=()=>({handlers:{},addEventListener(k,f){this.handlers[k]=f;}});
globalThis.window=events();Object.assign(document,events(),{fullscreenEnabled:true,fullscreenElement:null});
const button=events(),status={},stage={async requestFullscreen(){document.fullscreenElement=stage;document.handlers.fullscreenchange();}};
document.exitFullscreen=async()=>{document.fullscreenElement=null;document.handlers.fullscreenchange();};
let resized=0;installFullscreen(stage,button,()=>resized++,status);
await button.handlers.click();assert.equal(document.fullscreenElement,stage);assert.equal(resized,1);
await button.handlers.click();assert.equal(document.fullscreenElement,null);assert.equal(resized,2);
window.handlers.keydown({code:'KeyF',repeat:false,preventDefault(){}});await Promise.resolve();assert.equal(document.fullscreenElement,stage);
await document.exitFullscreen();stage.requestFullscreen=async()=>{throw new Error('denied');};await button.handlers.click();assert.match(status.textContent,/Não foi possível/);
const disabled=events();document.fullscreenEnabled=false;installFullscreen(stage,disabled,()=>{},status);assert.equal(disabled.disabled,true);
console.log('Fullscreen: button, F shortcut, entry/exit resize, denial and unsupported-browser fallback passed.');
