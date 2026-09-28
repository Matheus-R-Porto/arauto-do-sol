import{RoomManager}from'../src/world/room-manager.js';import{Camera}from'../src/core/camera.js';import{navigation,nearest,route}from'./greybox-navigation.js';
const w=new RoomManager(new Camera(320,180));w.load('crossroads',w.rooms.crossroads.spawn);let n=navigation(w.map);console.log('before lift',!!route(n,nearest(n,w.room.spawn),nearest(n,{x:460,y:168})));
w.flags.add('liftLever');w.flags.add('upperSecretWall');w.levelEvents.liftY=w.room.lift.low;w.levelEvents.rebuild();n=navigation(w.map);console.log('after lift',!!route(n,nearest(n,w.room.spawn),nearest(n,w.room.cache)));
