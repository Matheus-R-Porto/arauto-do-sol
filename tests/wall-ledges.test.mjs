import assert from 'node:assert/strict';import{RoomManager}from'../src/world/room-manager.js';import{Camera}from'../src/core/camera.js';import{input,navigation}from'./greybox-navigation.js';import{GreyboxDriver}from'./greybox-driver.js';
const step=(w,k,n=1)=>{for(let i=0;i<n;i++)w.update(1/60,k);};const make=()=>{const w=new RoomManager(new Camera(320,180));w.phase='playing';return w;};
let w=make();step(w,input(-1,false,false),80);assert.equal(w.room.id,'awakening');assert.ok(!w.flags.has('cellWall'));assert.ok(w.player.x>=197);
for(let n=0;n<150&&w.player.x>170;n++){const k=input(-1,false,false);k.pressed={attackLight:n%20===0};step(w,k);}assert.ok(w.flags.has('cellWall'));assert.equal(w.room.id,'awakening');assert.ok(w.player.x<184);console.log('Cell: intact barrier, real melee destruction, physical local crossing.');
w=make();w.load('guardian',{x:72,y:448});step(w,input(-1,false,false),60);assert.equal(w.room.id,'guardian');assert.ok(!w.flags.has('returnShortcut'));assert.ok(w.player.x>=53);
for(let n=0;n<300&&w.room.id!=='crossroads';n++){const k=input(-1,false,false);k.pressed={attackLight:n%20===0};step(w,k);}assert.equal(w.room.id,'crossroads');assert.ok(w.flags.has('returnShortcut'));
step(w,input(0,false,false),90);assert.equal(w.room.id,'crossroads');assert.equal(w.player.y,360,'arrival cannot fall into adjacent vertical shaft');assert.ok(w.player.onGround);
for(let n=0;n<180&&w.room.id!=='guardian';n++)step(w,input(1,false,false));assert.equal(w.room.id,'guardian');assert.ok(w.levelEvents.targets.find(b=>b.id==='returnShortcut').dead);console.log('10 -> 3 -> 10: real melee, aligned crossing, safe arrival and bidirectional transition.');
w.respawn();assert.ok(w.flags.has('returnShortcut'));w.load('crossroads',{x:1424,y:360});assert.ok(w.levelEvents.targets.find(b=>b.id==='returnShortcut').dead);console.log('Shortcut remains open after room reload and respawn.');
// Full tower ascent with normal inputs; setup starts at its existing lower entrance.
w=make();w.load('watch',w.rooms.watch.entries['watch:bridge:main:watch']);const bot=new GreyboxDriver();bot.last='watch';bot.nav=navigation(w.map);let jumps=0;
for(let n=0;n<6000&&w.room.id==='watch';n++){
 bot.frame++;const goal=w.room.exits.find(e=>e.to==='crossroads'),k=input();k.held={};k.pressed={};const action=bot.navigate(w,goal,k);if(action.pressed.jump)jumps++;
 if(w.enemies.some(e=>!e.dead&&Math.abs(e.x-w.player.x)<65&&Math.abs(e.y-w.player.y)<32)){action.pressed.attackLight=n%20===0;action.pressed.attackM2=n%20===10;}step(w,action);
 
 if(w.phase!=='playing')throw Error('tower ascent died at '+w.player.x+','+w.player.y);
}
assert.equal(w.room.id,'crossroads');assert.ok(jumps>=10);assert.ok(Object.values(w.player.abilities).every(v=>!v));console.log('Room 4: bottom -> all climbing stages -> room 3, normal jumps:',jumps);
import{cemetery as previous}from'../docs/wall-ledges/cemetery-before.js';import{cemetery as current}from'../src/world/rooms/cemetery.js';
const inside=(x,y,p)=>{let yes=false;for(let i=0,j=p.length-1;i<p.length;j=i++){const a=p[i],b=p[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])yes=!yes;}return yes;};
for(let i=0;i<current.length;i++){
 const a=current[i],b=previous[i];
 for(const key of Object.keys(b).filter(k=>!['rows','platforms','entries'].includes(k)))assert.deepEqual(a[key],b[key]);
 if(a.id!=='watch'){assert.deepEqual(a.rows,b.rows);assert.deepEqual(a.platforms,b.platforms);continue;}
 assert.deepEqual(a.platforms.map(p=>p[1]),b.platforms.map(p=>p[1]),'same 13 greybox elevations');
 for(let y=0;y<a.rows.length;y++)for(let x=0;x<a.rows[0].length;x++){
  const inLedge=[...a.platforms,...b.platforms].some(([px,py,len])=>py===y&&x>=px&&x<px+len);
  const spec=a.platforms.find(([px,py,len])=>py===y&&x>=px&&x<px+len);
  assert.equal(a.rows[y][x],inLedge?(spec?spec[3]||'=':a.contours.some(p=>inside(x+.5,y+.5,p))?'.':'#'):b.rows[y][x]);
 }
 for(const[x,y,len]of a.platforms){assert.ok(a.rows[y][x-1]==='#'||a.rows[y][x+len]==='#'||a.rows[y-1][x+len]==='#','ledge attached to a real wall');assert.ok(a.rows[y].includes('...'),'descent gap remains');}
}
// The forbidden side cannot unlock the inter-room shortcut using the real attack.
w=make();w.load('crossroads',{x:1418,y:360});for(let n=0;n<120;n++){const k=input(1,false,false);k.pressed={attackLight:n%20===0};step(w,k);}assert.ok(!w.flags.has('returnShortcut'));assert.equal(w.room.id,'crossroads');
console.log('Local map edit budget, unchanged elevations/topology, wall attachment, and forbidden-side melee verified.');

// The second inter-room wall uses the same seam and safe arrival rule.
w=make();w.load('bridge',{x:64,y:368});
for(let n=0;n<300&&w.room.id!=='watch';n++){const k=input(1,false,false);k.pressed={attackLight:n%20===0};step(w,k);}
assert.equal(w.room.id,'watch');assert.ok(w.flags.has('lowerShortcut'));step(w,input(0,false,false),90);assert.ok(w.player.onGround);
for(let n=0;n<180&&w.room.id!=='bridge';n++)step(w,input(-1,false,false));assert.equal(w.room.id,'bridge');step(w,input(0,false,false),90);assert.ok(w.player.onGround);
w.load('ossuary',w.rooms.ossuary.checkpoint);const rest=input(0,false,false);rest.pressed={interact:true};step(w,rest);assert.ok(w.flags.has('lowerShortcut'));w.respawn();assert.ok(w.flags.has('lowerShortcut'));
console.log('5 -> 4 -> 5: melee opening, safe arrivals, ordinary crossings, rest and respawn persistence.');
