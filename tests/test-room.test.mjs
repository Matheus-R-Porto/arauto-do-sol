import assert from 'node:assert/strict';
import{testRooms}from'../src/world/rooms/test-room.js';import{RoomManager}from'../src/world/room-manager.js';import{Camera}from'../src/core/camera.js';import{input}from'./greybox-navigation.js';import{Zombie}from'../src/entities/zombie.js';
const w=new RoomManager(new Camera(320,180),testRooms);w.phase='playing';assert.equal(w.map.width,w.map.height);assert.equal(Object.keys(w.rooms).length,1);
for(const x of [144,368]){w.player.reset(x,432);w.player.onGround=true;for(let i=0;i<90;i++){const k=input();k.held.down=true;k.pressed.jump=i===0;w.update(1/60,k);}assert.equal(w.player.y,432,'solid platforms reject drop-through');}
w.player.reset(250,480);w.player.facing=1;const target=new Zombie(270,480);w.state.enemies=[target];const hp=target.health;const k=input();k.pressed.attackLight=true;w.update(1/60,k);assert.ok(target.health<hp,'real attack reaches target');
console.log('Test room: square, isolated, two solid platforms, drop-through blocked, real combat functional.');
