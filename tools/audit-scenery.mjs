import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {RoomManager} from '../src/world/room-manager.js';
import {Camera} from '../src/core/camera.js';
import {WorldArt} from '../src/ui/world-art.js';
const m=JSON.parse(readFileSync('assets/sprites/world/manifest.json','utf8'));
const w=new RoomManager(new Camera(384,216)),rows=[];
const ctx=new Proxy({globalAlpha:1},{get:(o,k)=>k in o?o[k]:()=>{},set:(o,k,v)=>(o[k]=v,true)});
const art=Object.create(WorldArt.prototype);Object.assign(art,{manifest:m,time:0,events:[]});
let layer,room,placements;
art.sprite=(ctx,name,x,y,flip=1,alpha=1)=>{
 const a=m.assets[name];if(!a)return;const s=a.worldScale??1,[l,t,r,b]=a.bounds;
 const [ox,oy]=a.worldOffset??[0,0];
 const bounds=[x+ox+(l-a.pivot[0])*s,y+oy+(t-a.pivot[1])*s,x+ox+(r-a.pivot[0])*s,y+oy+(b-a.pivot[1])*s];
 placements.push({name,layer,x,y,flip,opacity:ctx.globalAlpha*alpha,file:a.file,canvas:a.canvas,pivot:a.pivot,worldScale:s,bounds,visibleSize:[(r-l)*s,(b-t)*s],baseGap:y-bounds[3],tileAtAnchor:w.map.at(Math.floor(x/16),Math.floor(y/16)),interactive:layer==='objects',collision:'independent room/tile data; never derived from sprite'});
};
for(room of Object.values(w.rooms)){
 w.load(room.id,room.spawn??Object.values(room.entries)[0]);w.phase='playing';placements=[];
 for(layer of ['decor','objects'])art[layer](ctx,w,0);
 rows.push({id:room.id,name:room.name,landmark:room.landmark,theme:room.theme,size:[w.map.width,w.map.height],floor:(w.map.rows-2)*16,placements});
}
mkdirSync('docs/scenery',{recursive:true});writeFileSync(process.argv[2]??'docs/scenery/positions-after.json',JSON.stringify(rows,null,2));
console.log(rows.map(r=>`${r.id}: ${r.landmark} — ${r.placements.filter(p=>p.name==='dead-tree').map(p=>`tree (${p.x},${p.y}) base gap ${p.baseGap}, tile ${p.tileAtAnchor}`).join('; ')}`).join('\n'));
