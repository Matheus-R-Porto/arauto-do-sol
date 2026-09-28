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
import{cemetery as current}from'../src/world/rooms/cemetery.js';
for(const r of current)assert.ok(r.rows.every(row=>!row.includes('=')),r.id+' has only solid platforms');
const tower=current.find(r=>r.id==='watch');
for(const[x,y,len]of tower.platforms){assert.ok(tower.rows[y][x-1]==='#'||tower.rows[y][x+len]==='#'||tower.rows[y-1]?.[x+len]==='#'||tower.rows[y+1]?.[x-1]==='#','ledge attached '+[x,y,len]);assert.ok(tower.rows[y].includes('...'),'descent gap remains');}
// The forbidden side cannot unlock the inter-room shortcut using the real attack.
w=make();w.load('crossroads',{x:1418,y:360});for(let n=0;n<120;n++){const k=input(1,false,false);k.pressed={attackLight:n%20===0};step(w,k);}assert.ok(!w.flags.has('returnShortcut'));assert.equal(w.room.id,'crossroads');
console.log('Solid platforms, tower wall attachments, and forbidden-side melee verified.');

// The second inter-room wall uses the same seam and safe arrival rule.
w=make();w.load('bridge',{x:128,y:336});
for(let n=0;n<300&&w.room.id!=='watch';n++){const k=input(1,false,false);k.pressed={attackLight:n%20===0};step(w,k);}
assert.equal(w.room.id,'watch');assert.ok(w.flags.has('lowerShortcut'));step(w,input(0,false,false),90);assert.ok(w.player.onGround);
for(let n=0;n<180&&w.room.id!=='bridge';n++)step(w,input(-1,false,false));assert.equal(w.room.id,'bridge');step(w,input(0,false,false),90);assert.ok(w.player.onGround);
w.load('ossuary',w.rooms.ossuary.checkpoint);const rest=input(0,false,false);rest.pressed={interact:true};step(w,rest);assert.ok(w.flags.has('lowerShortcut'));w.respawn();assert.ok(w.flags.has('lowerShortcut'));
console.log('5 -> 4 -> 5: melee opening, safe arrivals, ordinary crossings, rest and respawn persistence.');
