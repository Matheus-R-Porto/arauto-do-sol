import assert from 'node:assert/strict';
import {RoomManager} from '../src/world/room-manager.js';
import {Camera} from '../src/core/camera.js';
import {cemetery} from '../src/world/rooms/cemetery.js';
import {validateRooms} from '../src/world/validate.js';
const input=(interact=false)=>({held:{},pressed:{interact},released:{},moveX:0});
const make=()=>{const w=new RoomManager(new Camera(480,270));w.phase='playing';return w;};
const arrive=(w,id,p)=>{w.load(id,p??w.rooms[id].spawn);w.arrival=0;};
let checks=0;function test(name,fn){fn();checks++;console.log('PASSOU',name);}
function deadAndReturn(w){const flags=[...w.flags].sort(),items=[...w.collected];w.health.skulls=0;for(let i=0;i<60;i++)w.update(1/60,input());assert.equal(w.phase,'playing');assert.deepEqual([...w.flags].sort(),flags);assert.deepEqual([...w.collected],items);}
test('chave física, feedback, aquisição única e morte logo após coleta',()=>{
 const w=make();arrive(w,'crypt',w.rooms.crypt.key);w.interactions(input());assert.ok(w.flags.has('cemeteryKey'));assert.match(w.notification,/Chave/);assert.equal(w.collected.size,0);deadAndReturn(w);arrive(w,'crypt',w.rooms.crypt.key);w.interactions(input());assert.equal([...w.flags].filter(x=>x==='cemeteryKey').length,1);
});
test('porta exige chave e interação; aberta persiste após morte e dispensa chave',()=>{
 const w=make(),e=w.rooms.crossroads.exits.find(e=>e.kind==='key');arrive(w,'crossroads',e);w.interactions(input(true));assert.equal(w.transition,null);assert.match(w.context,/falta a chave/);assert.equal(w.travel(e),false);w.flags.add('cemeteryKey');w.interactions(input());assert.equal(w.transition,null);w.interactions(input(true));assert.ok(w.flags.has('cemeteryDoor'));deadAndReturn(w);w.flags.delete('cemeteryKey');arrive(w,'crossroads',e);assert.ok(w.travel(e));
});
test('alavanca exige proximidade e E; abre portão distante e queda; morte preserva',()=>{
 const w=make(),e=w.rooms.watch.exits.find(e=>e.kind==='lever');arrive(w,'watch',e);assert.equal(w.travel(e),false);arrive(w,'bridge');w.interactions(input(true));assert.ok(!w.flags.has('mainGateLever'));w.player.reset(w.room.lever.x,w.room.lever.y);w.interactions(input());assert.ok(!w.flags.has('mainGateLever'));w.interactions(input(true));assert.match(w.notification,/Vigília/);deadAndReturn(w);arrive(w,'watch',e);assert.ok(w.travel(e));
});
for(const [flag,near,far] of [['shortcutWest','crypt','ascent'],['shortcutGallery','ossuary','sentries'],['shortcutDeep','crypt','procession']])test(`${flag}: só abre pelo outro lado, funciona nos dois sentidos após morte`,()=>{
 const w=make(),a=w.rooms[near].exits.find(e=>e.flag===flag),b=w.rooms[far].exits.find(e=>e.flag===flag);arrive(w,near,a);assert.equal(w.travel(a),false);arrive(w,far,b);w.interactions(input(true));assert.ok(w.flags.has(flag));deadAndReturn(w);for(const [room,e]of [[near,a],[far,b]]){arrive(w,room,e);w.transition=null;assert.ok(w.travel(e));}
});
test('queda chega em plataforma segura; não há exit de subida pela queda',()=>{
 const w=make();w.flags.add('mainGateLever');arrive(w,'bridge');const e=w.room.exits.find(e=>e.oneWay);assert.ok(w.travel(e));for(let i=0;i<23;i++)w.update(1/60,input());assert.equal(w.room.id,'ossuary');assert.equal(w.player.x,28*16);assert.ok(!w.room.exits.some(e=>e.to==='bridge'));assert.ok(w.room.exits.some(e=>e.to==='watch'&&w.progression.isOpen(e)));
});
test('fonte opcional restaura uma vez; fragmentos/segredo não vazam após reinício',()=>{
 const w=make();arrive(w,'balcony',w.rooms.balcony.well);w.health.skulls=2;w.energy.current=10;w.interactions(input(true));assert.equal(w.health.skulls,5);assert.equal(w.energy.current,100);w.health.skulls=2;w.interactions(input(true));assert.equal(w.health.skulls,2);deadAndReturn(w);w.flags.add('secret');w.collected.add('chapel');w.restart();assert.equal(w.flags.size,0);assert.equal(w.collected.size,0);
});
test('segredo requer golpe e recompensa só pode ser coletada uma vez',()=>{
 const w=make(),s=w.rooms.chapel.secretStone;arrive(w,'chapel',s);w.interactions(input());assert.ok(!w.collected.has('chapel'));w.player.reset(s.x-16,s.y);w.player.facing=1;w.player.updateAttack(1/60,{...input(),pressed:{attackLight:true}},w.energy,[]);w.interactions(input());assert.ok(w.flags.has('secret'));w.player.reset(s.x,s.y);w.interactions(input());assert.ok(w.collected.has('chapel'));const count=w.health.fragments;w.interactions(input());assert.equal(w.health.fragments,count);deadAndReturn(w);
});
test('validação rejeita sobreposição, adjacência falsa e retorno inconsistente',()=>{
 for(const mutate of [r=>r[0].origin.x++,r=>r.find(r=>r.id==='chapel').origin={x:0,y:0},r=>r.find(r=>r.id==='passage').exits.shift()]){const rooms=structuredClone(cemetery);mutate(rooms);assert.throws(()=>validateRooms(rooms,'awakening'));}
});
test('entradas de múltiplos lados não colocam jogador em contato com inimigos',()=>{
 for(const r of cemetery)for(const p of Object.values(r.entries))for(const e of r.enemies)assert.ok(Math.abs(p.x-e.x)>80||Math.abs(p.y-e.y)>64,`${r.id}: chegada junto do inimigo`);
});
// Exhaustively enumerate reachable room + permanent-gate states. Acquiring the key
// and operating the lever are separate actions, so ignoring them is represented.
test('grafo com estados: sem softlocks em ordens distintas e sem opcionais obrigatórios',()=>{
 const flags=['cemeteryKey','cemeteryDoor','mainGateLever','shortcutWest','shortcutGallery','shortcutDeep'];
 const bit=id=>1<<flags.indexOf(id),byId=Object.fromEntries(cemetery.map(r=>[r.id,r]));
 function graph(optional=true){
  const nodes=new Map(),queue=[['awakening',0]],key=(r,m)=>`${r}:${m}`;nodes.set(key(...queue[0]),[]);
  for(let i=0;i<queue.length;i++){
   const [id,mask]=queue[i],r=byId[id],next=[];
   for(const obj of [r.key,r.lever])if(obj&&!(mask&bit(obj.id)))next.push([id,mask|bit(obj.id)]);
   for(const e of r.exits){if(!optional&&byId[e.to].optional)continue;let m=mask;
    if(e.flag&&!(m&bit(e.flag))){if(e.kind==='key'&&(m&bit('cemeteryKey'))||e.kind==='shortcut'&&e.unlock)m|=bit(e.flag);else continue;}
    next.push([e.to,m]);
   }
   const edge=nodes.get(key(id,mask));for(const state of next){const k=key(...state);edge.push(k);if(!nodes.has(k)){nodes.set(k,[]);queue.push(state);}}
  }
  return nodes;
 }
 const nodes=graph(),reverse=new Map([...nodes.keys()].map(k=>[k,[]]));for(const [from,to]of nodes)for(const t of to)reverse.get(t).push(from);
 const good=new Set([...nodes.keys()].filter(k=>k.startsWith('beyond:'))),todo=[...good];for(let i=0;i<todo.length;i++)for(const p of reverse.get(todo[i]))if(!good.has(p)){good.add(p);todo.push(p);}
 assert.equal(good.size,nodes.size,'há estado alcançável sem caminho para final');
 assert.equal(new Set([...nodes.keys()].map(k=>k.split(':')[0])).size,17);
 assert.ok([...graph(false).keys()].some(k=>k.startsWith('beyond:')));
 // These two shortcuts must actually reduce room transitions, rather than just
 // adding doors to routes that are longer than the original way back.
 function distance(from,to,opened){const seen=new Set([from]),queue=[[from,0]];
  for(let i=0;i<queue.length;i++){const [id,d]=queue[i];if(id===to)return d;
   for(const e of byId[id].exits)if((!e.flag||opened.has(e.flag))&&!seen.has(e.to)){seen.add(e.to);queue.push([e.to,d+1]);}}
  return Infinity;
 }
 const base=new Set(['cemeteryDoor','mainGateLever']);
 assert.equal(distance('ossuary','crypt',base),3);
 assert.equal(distance('ossuary','crypt',new Set([...base,'shortcutWest'])),2);
 assert.equal(distance('ossuary','sentries',base),3);
 assert.equal(distance('ossuary','sentries',new Set([...base,'shortcutGallery'])),1);
 console.log(`  ${nodes.size} estados de navegação revisados; final sem salas opcionais`);
});
console.log(`${checks}/${checks} verificações de exploração aprovadas`);
