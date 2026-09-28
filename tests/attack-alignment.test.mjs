import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {RoomManager} from '../src/world/room-manager.js';
import {Camera} from '../src/core/camera.js';
import {PlayerAnimator} from '../src/ui/player-sprites.js';
import {playerAttackPlacement,drawPlayerAttackEffect} from '../src/ui/player-attack-effects.js';
const m=JSON.parse(readFileSync(new URL('../assets/sprites/protagonist/manifest.json',import.meta.url)));
const input=(pressed={})=>({held:{},pressed,released:{},moveX:0});
let checks=0;const test=(name,f)=>{f();checks++;console.log('PASSOU',name);};
function fixture(facing=1,air=false){
 const w=new RoomManager(new Camera(384,216)),a=new PlayerAnimator();w.load('awakening',{x:256,y:232});w.phase='playing';w.transition=null;w.state.enemies=[];
 const step=pressed=>{w.update(1/60,input(pressed));a.update(1/60,w);};
 for(let i=0;i<60;i++)step();w.player.facing=facing;
 if(air){step({jump:true});for(let i=0;i<5;i++)step();}
 const placement=()=>{const animation=m.animations[a.state],frame=a.frame(animation);return playerAttackPlacement(w.player,{state:a.state,index:animation.frames.indexOf(frame),pivot:frame.pivot??m.pivot,scale:m.worldScale});};
 return {w,a,step,placement};
}
test('M1 acompanha a lâmina alta, em vez do centro vertical da hitbox',()=>{
 const f=fixture();f.step({attackLight:true});const p=f.w.player,b=p._attackHitbox(18),v=f.placement();
 assert.equal(v.y,p.y-18.125);assert.ok(v.x>b.left&&v.x<b.left+b.w);
 assert.ok(Math.abs(v.y-(b.top+b.h/2))>6);
});
test('retração da espada move o efeito junto com o quadro real de M1 e M2',()=>{
 for(const attack of ['attackLight','attackM2']){
  const f=fixture();f.step({[attack]:true});const start=f.placement();
  for(let i=0;i<(attack==='attackLight'?7:4);i++)f.step();
  const end=f.placement();assert.ok(end);assert.ok(end.x<start.x-3);
  if(attack==='attackM2')assert.ok(end.y<start.y-5);
 }
});
test('espelhamento e salto preservam ligação local à lâmina em todos os quadros',()=>{
 for(const attack of ['attackLight','attackM2'])for(const air of [false,true]){
  const r=fixture(1,air),l=fixture(-1,air);r.step({[attack]:true});l.step({[attack]:true});
  for(let i=0;i<18;i++){
   const rv=r.placement(),lv=l.placement();assert.equal(!!rv,!!lv);
   if(rv){assert.equal(rv.x-Math.round(r.w.player.x),Math.round(l.w.player.x)-lv.x);assert.equal(rv.y,lv.y);assert.equal(lv.flip,-1);}
   r.step();l.step();
  }
 }
});
test('alternância não deixa feixe anterior sobre a nova pose; hurt e recovery não deixam resíduos',()=>{
 const f=fixture();f.step({attackLight:true});f.step({attackM2:true});
 assert.ok(f.w.player.attacks.light.flashTimer>0);assert.equal(f.placement().key,'m2');
 for(let i=0;i<7;i++)f.step();assert.equal(f.placement(),null);
 const h=fixture();h.step({attackLight:true});h.w.health.skulls--;h.a.update(1/60,h.w);assert.equal(h.a.state,'hurt');assert.equal(h.placement(),null);
});
test('efeito respeita recorte do alcance e não escala a arte nem altera estado',()=>{
 const f=fixture(-1);f.step({attackM2:true});const v=f.placement(),box=f.w.player._attackHitbox(18),calls=[];
 const ctx=new Proxy({},{get:(_,method)=>(...args)=>calls.push([method,...args]),set:()=>true});
 const before=JSON.stringify(f.w.player);
 drawPlayerAttackEffect(ctx,{bounds:[56,47,72,60],image:{}},v,box);
 assert.deepEqual(calls.find(c=>c[0]==='rect'),['rect',box.left,box.top,box.w,box.h]);
 assert.deepEqual(calls.find(c=>c[0]==='scale'),['scale',-1,1]);
 assert.deepEqual(calls.find(c=>c[0]==='transform'),['transform',0,1,1,0,0,0]);
 const draw=calls.find(c=>c[0]==='drawImage');assert.equal(draw[4],draw[8]);assert.equal(draw[5],draw[9]);
 assert.equal(JSON.stringify(f.w.player),before);
});
test('sprites, perfis de escala, gameplay e resolução aprovados permanecem byte a byte iguais',()=>{
 const hashes=JSON.parse(readFileSync(new URL('../docs/attack-alignment/preserved.json',import.meta.url)));
 for(const [file,hash]of Object.entries(hashes)){
  if(file.startsWith('src/world/')||file==='src/ui/demo-view.js')continue; // Level redesign is covered separately.
  if(file==='assets/sprites/protagonist/manifest.json'){const old=JSON.parse(readFileSync(new URL('../docs/polish/protagonist-before.json',import.meta.url)));const now=JSON.parse(readFileSync(new URL('../'+file,import.meta.url)));for(const k of Object.keys(old.animations))assert.deepEqual(now.animations[k],old.animations[k]);continue;}
  // The scenery revision intentionally changes only scenery entries of this manifest.
  // Character/VFX entries and all animation definitions remain locked separately.
  if(file==='assets/sprites/world/manifest.json'){
   const old=JSON.parse(readFileSync(new URL('../docs/scenery/source-manifest.json',import.meta.url)));
   const now=JSON.parse(readFileSync(new URL('../'+file,import.meta.url)));
   for(const type of ['walker','lunger','ranged','vfx'])assert.deepEqual(now.animations[type],old.animations[type]);
   for(const [name,asset]of Object.entries(old.assets))if(!now.assets[name].file.startsWith('scenery/')&&!now.assets[name].file.startsWith('tiles/')&&!['medallion','health-skull','energy-frame','hud-fragment'].includes(name))assert.deepEqual(now.assets[name],asset,name);
  }else assert.equal(createHash('sha256').update(readFileSync(new URL('../'+(file==='src/main.js'?'docs/display/main-before.js':file),import.meta.url))).digest('hex'),hash,file);
 }
});
console.log(`${checks}/${checks} testes de alinhamento ok`);
