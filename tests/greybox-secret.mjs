import {RoomManager}from'../src/world/room-manager.js';import{Camera}from'../src/core/camera.js';import{navigation,input}from'./greybox-navigation.js';import{GreyboxDriver}from'./greybox-driver.js';
const w=new RoomManager(new Camera(320,180));w.phase='playing';w.flags.add('liftLever');w.load('crossroads',w.rooms.crossroads.spawn);w.levelEvents.update(10);const b=new GreyboxDriver();let stage=0,jump=0;
for(let i=0;i<18000;i++){let k=input();k.held={};k.pressed={};
 if(stage===0){k=b.next(w,{x:460,y:168});if(w.player.onGround&&w.player.y===168&&Math.abs(w.player.x-460)<3){stage=1;b.air=null;}}
 else if(stage===1){if(w.energy.current<40){k.moveX=0;}else{k.moveX=-1;k.held.dash=true;if(w.player.x<=430){stage=2;jump=0;}}}
 else if(stage===2){jump++;k.moveX=-1;k.held.jump=jump<35;k.held.dash=true;k.pressed.jump=jump===1;k.pressed.attackLight=jump%16===2;k.pressed.attackM2=jump%16===8;if(w.flags.has('upperSecretWall')){stage=3;b.air=null;b.nav=navigation(w.map);}if(jump>90){stage=0;jump=0;}}
 else {b.frame++;k=b.navigate(w,w.room.cache,k);}
 w.update(1/60,k);if(w.flags.has('upperCache')){console.log('SECRET COLLECTED',w.elapsed,w.deaths);process.exit(0);}if(w.phase!=='playing')break;
}throw Error('secret route incomplete '+stage+' '+w.player.x+','+w.player.y);
