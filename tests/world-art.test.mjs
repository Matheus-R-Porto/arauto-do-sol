import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {ActorAnimator,WorldArt} from '../src/ui/world-art.js';
import {RoomManager} from '../src/world/room-manager.js';
import {Camera} from '../src/core/camera.js';
import {PlaythroughDriver} from './playthrough-driver.js';
import {DemoView,WORLD_ZOOM} from '../src/ui/demo-view.js';
const root=new URL('../',import.meta.url),read=p=>readFileSync(new URL(p.replaceAll('\\','/'),root));
const manifest=JSON.parse(read('assets/sprites/world/manifest.json'));
let checks=0;const test=(name,f)=>{f();checks++;console.log('PASSOU',name);};
test('inventário completo e arquivos finais presentes',()=>{
 assert.equal(manifest.status,'animation-expansion-v2');assert.ok(Object.keys(manifest.assets).length>=72);assert.equal(Object.keys(manifest.backgrounds).length,4);
 const legacy=JSON.parse(read('tools/sprite_pipeline/world-build.json'));
 for(const group of legacy.sets)for(const frame of group.frames)assert.ok(manifest.assets[frame.name]);
 for(const a of [...Object.values(manifest.assets),...Object.values(manifest.backgrounds).flatMap(b=>b.panels)]){assert.ok(existsSync(new URL('assets/sprites/world/'+a.file,root)));assert.equal(createHash('sha256').update(read('assets/sprites/world/'+a.file)).digest('hex'),a.sha256);}
});
test('arte preservou todos os arquivos de regras, física, mapa e áudio',()=>{
 const baseline=JSON.parse(read('docs/art-world/gameplay-baseline.json'));
 for(const [path,sha]of Object.entries(baseline))assert.equal(createHash('sha256').update(read(path)).digest('hex'),sha,path);
});
test('cada estado de ataque e morte tem pose; sinais de ataque têm prioridade sobre flash',()=>{
 const a=new ActorAnimator(),e={x:100,state:'idle',flashTimer:0,dead:false},w={enemies:[e],phase:'playing'};
 for(const type of ['walker','lunger','ranged'])for(const state of ['idle','windup','active','recovery']){
  e.state=state;a.update(1/60,w);assert.ok(manifest.assets[type+'-'+a.pose(e)]);
 }
 w.enemies=[];w.boss=e;
 for(const attack of ['slash','charge','slam'])for(const state of ['windup','active','recovery']){
  e.attack=attack;e.state=state;e.flashTimer=.1;a.update(1/60,w);assert.ok(manifest.assets['boss-'+a.pose(e,true)]);
  if(state!=='recovery')assert.equal(a.pose(e,true),attack+'-'+state);
 }
 e.dead=true;a.update(1/60,w);assert.equal(a.pose(e,true),'death');
});
test('desenhar e animar a travessia inteira não altera o resultado do jogo',()=>{
 const ctx=new Proxy({createLinearGradient:()=>({addColorStop(){}})},{get:(o,k)=>k in o?o[k]:(()=>{}),set:(o,k,v)=>(o[k]=v,true)});
 globalThis.document={createElement:()=>({getContext:()=>ctx})};
 for(const a of [...Object.values(manifest.assets),...Object.values(manifest.backgrounds).flatMap(b=>b.panels)])a.image={};
 const art=new WorldArt(manifest),view=new DemoView(null,null,art),w=new RoomManager(new Camera(480/WORLD_ZOOM,270/WORLD_ZOOM)),control=new RoomManager(new Camera(480,270));
 const bot=new PlaythroughDriver({mode:'completionist',exerciseDeaths:true}),states=new Set(),snap=w=>JSON.stringify([w.room.id,w.phase,w.player.x,w.player.y,w.health.skulls,w.energy.current,w.deaths,w.boss?.health,[...w.flags],[...w.collected]]);
 for(let n=0;n<90000&&w.phase!=='finished';n++){
  const input=bot.next(w);w.update(1/60,input);control.update(1/60,input);view.update(1/60,w);
  for(const e of w.targets)states.add((e===w.boss?'boss':e.type)+'-'+art.animator.pose(e,e===w.boss));
  if(n%10===0)view.draw(ctx,w,n/60,{hitboxes:true,map:false});
  if(n%300===0)assert.equal(snap(w),snap(control));
 }
 assert.equal(w.phase,'finished');assert.equal(w.visited.size,17);assert.equal(w.collected.size,4);assert.equal(w.deaths,5);assert.equal(snap(w),snap(control));
 for(const state of ['boss-slash-windup','boss-slash-active','boss-charge-windup','boss-charge-active','boss-slam-windup','boss-slam-active','boss-death','walker-active','ranged-active','lunger-active'])assert.ok(states.has(state),state);
 console.log('Mundo renderizado: 17 salas, 4 fragmentos, 5 mortes, '+w.elapsed.toFixed(1)+'s; '+states.size+' estados observados');
});
console.log(checks+'/'+checks+' testes da arte do mundo ok');
