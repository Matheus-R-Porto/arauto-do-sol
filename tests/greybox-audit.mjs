import {RoomManager} from '../src/world/room-manager.js';import {Camera}from'../src/core/camera.js';import{navigation,route,nearest}from'./greybox-navigation.js';import{writeFileSync}from'node:fs';
const w=new RoomManager(new Camera(320,180)),report=[];
for(const r of Object.values(w.rooms)){
 for(const b of r.breakables)w.flags.add(b.id);for(const e of r.exits)if(e.flag)w.flags.add(e.flag);w.flags.add('finalDoor');w.flags.add('liftLever');
 w.load(r.id,r.spawn);if(r.lift){w.levelEvents.liftY=r.lift.low;w.levelEvents.rebuild();}
 const nav=navigation(w.map),results=[];
 for(const a of r.exits)for(const b of r.exits)if(a!==b){const path=route(nav,nearest(nav,a),nearest(nav,b));results.push({from:a.to+' '+a.x,to:b.to+' '+b.x,reachable:!!path});}
 report.push({id:r.id,nodes:nav.nodes.length,results});console.log(r.id,JSON.stringify(results));
}
writeFileSync('docs/level-redesign/navigation.json',JSON.stringify(report,null,2));
