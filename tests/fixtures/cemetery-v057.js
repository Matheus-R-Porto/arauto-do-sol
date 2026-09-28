import { RENDER } from '../../../config/tuning.js';

// World origins and geometry are in tiles. All passages join adjacent rectangles.
const T = RENDER.tileSize;
const point = (x,y) => ({x:x*T,y:y*T});
function room(id,name,x,y,w=40,h=24,geometry=[],extra={}) {
  const grid=Array.from({length:h},(_,r)=>Array.from({length:w},(_,c)=>
    r===0||r>=h-2||c===0||c===w-1?'#':'.'));
  for(const [x,y,width,height=1,tile='#'] of geometry)
    for(let r=y;r<y+height;r++)for(let c=x;c<x+width;c++)grid[r][c]=tile;
  return {id,name,origin:{x,y},tileSize:T,rows:grid.map(r=>r.join('')),
    spawn:point(4,h-2),entries:{},exits:[],enemies:[],pickups:[],theme:'open',...extra};
}
const enemy=(type,x,y)=>({type,...point(x,y)});
const relic=(id,x,y)=>({id,...point(x,y)});
// Broad, overlapping landings: every required rise is 32 px (jump apex is 52 px).
const stairs=(bottom=22,top=4)=>{
  const steps=[];
  for(let y=bottom-2,i=0;y>=top;y-=2,i++)steps.push([6+(i%4<2?i%4:4-i%4)*5,y,10,1,'=']);
  return steps;
};
const rooms=[
  room('awakening','Câmara do despertar',-80,0,40,24,[[13,20,5,2],[25,19,5,1]],
    {theme:'crypt',tutorial:'move',landmark:'tomb',notes:[{...point(7,22),text:'A/D — mover · Espaço — pular'}]}),
  room('passage','Passagem das lápides',-40,0,40,24,[[13,20,5,2],[26,19,7,1,'=']],
    {tutorial:'jump',landmark:'tree',enemies:[enemy('walker',28,22)]}),
  room('crossroads','Pátio da estátua',0,0,30,24,[[15,20,7,1,'='],[19,18,7,1,'='],[23,16,6,1,'=']],
    {checkpoint:point(8,22),tutorial:'energy',landmark:'statue',pickups:[relic('ledge',26,16)],
      notes:[{...point(23,22),text:'O mesmo sol marca a fechadura e a cripta.'}]}),
  room('watch','Vigília da corrente',30,0,40,24,stairs(),
    {enemies:[enemy('walker',27,22)],tutorial:'attack',landmark:'chain'}),
  room('shaft','Poço dos sinos',30,-24,40,24,[[18,20,7,1,'='],[25,18,8,1,'=']],
    {theme:'crypt',tutorial:'drop',landmark:'bell'}),
  room('bridge','Ponte do contrapeso',70,-24,40,24,[[21,22,3,1,'^']],
    {landmark:'bridge',lever:{id:'mainGateLever',...point(16,22)},
      vista:{kind:'bones',label:'OSSUÁRIO · ABAIXO'},notes:[{...point(23,22),text:'A corrente azul desce até o portão da Vigília.'}]}),
  room('crypt','Cripta das raízes',0,24,70,24,stairs().concat([[37,20,8,1,'='],[43,18,8,1,'='],[51,16,8,1,'=']]),
    {theme:'crypt',landmark:'roots',key:{id:'cemeteryKey',...point(55,16)},
      enemies:[enemy('walker',27,22),enemy('lunger',45,22)],pickups:[relic('crypt',63,22)],
      vista:{kind:'return',label:'UM CORREDOR SOB AS RAÍZES'}}),
  room('chapel','Capela sem teto',-40,24,40,24,[[8,20,8,1,'='],[13,18,8,1,'='],[18,16,8,1,'=']],
    {optional:true,landmark:'window',enemies:[enemy('walker',18,22)],secretStone:{id:'secret',...point(22,16)},pickups:[{...relic('chapel',22,16),requires:'secret'}]}),
  room('ossuary','Grande ossuário',70,0,40,24,[[25,4,9,1,'='],[23,8,9,1,'='],[21,12,9,1,'='],[19,16,9,1,'=']],
    {checkpoint:point(14,22),landmark:'bones',enemies:[enemy('walker',27,22)]}),
  room('ascent','Escadaria das urnas',70,24,40,24,stairs(),
    {theme:'crypt',landmark:'urns',enemies:[enemy('walker',29,22)]}),
  room('sentries','Galeria das sentinelas',110,0,40,24,[[10,20,8,1,'='],[16,18,8,1,'=']],
    {landmark:'window',enemies:[enemy('ranged',20,22),enemy('walker',30,22)]}),
  room('balcony','Jardim das cinzas',110,24,40,24,stairs(),
    {landmark:'fountain',enemies:[enemy('lunger',27,22)],well:{id:'fountain',...point(28,22)},pickups:[relic('secret',33,22)]}),
  room('refuge','Repouso do guardião',150,0,40,24,[],
    {theme:'crypt',landmark:'tomb',checkpoint:point(28,22),vista:{kind:'guardian',label:'SEPULCRO · A LESTE'}}),
  room('antechamber','Escada do retorno',150,24,40,48,stairs(46,4),
    {theme:'crypt',optional:true,landmark:'chain'}),
  room('procession','Alameda sob as raízes',0,48,150,24,stairs(),
    {theme:'crypt',optional:true,landmark:'roots',notes:[{...point(9,22),text:'As raízes da Cripta. O Pátio está logo acima.'}]}),
  // Keep the existing boss arena and finish geometry/dimensions.
  room('guardian','Sepulcro do guardião',190,4,40,20,[],{theme:'arena',boss:point(27,18),landmark:'tomb'}),
  room('beyond','Além do sepulcro',230,3,48,21,[[24,17,5,2],[31,15,7,1,'='],[38,13,9,1,'=']],
    {end:point(43,13),theme:'open',landmark:'tree'}),
];
const byId=Object.fromEntries(rooms.map(r=>[r.id,r]));
function horizontal(a,b,gate={}) {
  const A=byId[a],B=byId[b],ay=A.rows.length-2,by=B.rows.length-2;
  const ax=A.rows[0].length-2,bx=2;
  A.entries[`from-${b}`]=point(ax-2,ay);B.entries[`from-${a}`]=point(bx+2,by);
  A.exits.push({...point(ax,ay),to:b,entry:`from-${a}`,side:'east',direction:1,...gate});
  B.exits.push({...point(bx,by),to:a,entry:`from-${b}`,side:'west',direction:-1,...gate,
    unlock:gate.kind==='shortcut'});
}
function vertical(above,below,ax,bx,{oneWay=false,...gate}={}) {
  const A=byId[above],B=byId[below],ay=A.rows.length-2;
  B.entries[`from-${above}`]=point(bx,4);
  A.exits.push({...point(ax,ay),to:below,entry:`from-${above}`,portal:true,side:'south',direction:0,oneWay,...gate});
  if(!oneWay){
    A.entries[`from-${below}`]=point(ax,ay);
    B.exits.push({...point(bx,4),to:above,entry:`from-${below}`,portal:true,side:'north',direction:0,...gate,
      unlock:gate.kind==='shortcut'});
  }
}
horizontal('awakening','passage');horizontal('passage','crossroads');
horizontal('crossroads','watch',{kind:'key',flag:'cemeteryDoor'});
vertical('crossroads','crypt',14,14);
horizontal('chapel','crypt');
vertical('shaft','watch',9,9);
horizontal('shaft','bridge');
horizontal('watch','ossuary',{kind:'lever',flag:'mainGateLever'});
vertical('bridge','ossuary',28,28,{oneWay:true,kind:'lever',flag:'mainGateLever'});
vertical('ossuary','ascent',9,9);
horizontal('crypt','ascent',{kind:'shortcut',flag:'shortcutWest'});
horizontal('ossuary','sentries',{kind:'shortcut',flag:'shortcutGallery'});horizontal('sentries','refuge');
vertical('sentries','balcony',9,9);
horizontal('ascent','balcony');
vertical('refuge','antechamber',9,9);
horizontal('procession','antechamber');
vertical('crypt','procession',9,9,{kind:'shortcut',flag:'shortcutDeep'});
horizontal('refuge','guardian');horizontal('guardian','beyond');
export const cemetery=rooms;
export const START_ROOM='awakening';
