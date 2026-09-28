// Traced from Dungeon Scrawl crops 1–12. Coordinates use an 8-unit collision grid.
// The smaller collision grid does not rescale actors or the 16-unit artwork.
const T=8,pt=(x,y)=>({x:x*T,y:y*T});
const inside=(x,y,p)=>{let yes=false;for(let i=0,j=p.length-1;i<p.length;j=i++){const a=p[i],b=p[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])yes=!yes;}return yes;};
function make(id,number,name,w,h,contours,platforms=[],extra={}){
 const g=Array.from({length:h},(_,y)=>Array.from({length:w},(_,x)=>contours.some(p=>inside(x+.5,y+.5,p))?'.':'#'));
 for(const [x,y,len,type='=']of platforms)for(let i=x;i<x+len;i++)g[y][i]=type;
 return {id,number,name,tileSize:T,rows:g.map(r=>r.join('')),contours,platforms,entries:{},exits:[],enemies:[],pickups:[],breakables:[],spawn:pt(6,h-4),theme:'crypt',...extra};
}
const rect=(x,y,w,h)=>[[x,y],[x+w,y],[x+w,y+h],[x,y+h]];
const enemy=(type,x,y)=>({type,...pt(x,y)});
const wall=(id,x,y,h,extra={})=>({id,x:x*T,y:y*T,w:8,h:h*T,hits:2,...extra});
const pile=(id,x,y)=>({id,...pt(x,y),w:28,h:18,hits:4,kind:'pile',reward:12});
const rooms=[
 make('awakening',1,'Cela do despertar',44,32,[rect(3,3,20,26),rect(23,15,18,14)],[],{spawn:pt(32,29),landmark:'tomb',tutorial:'move',breakables:[wall('cellWall',23,29,8),pile('cellBones',11,29)]}),
 make('passage',2,'Galeria dos primeiros passos',100,34,[[[3,22],[5,22],[5,16],[9,16],[9,12],[20,12],[20,10],[32,10],[32,6],[51,6],[51,12],[66,12],[66,16],[80,16],[80,22],[97,22],[97,31],[78,31],[78,29],[71,29],[71,31],[63,31],[63,27],[54,27],[54,29],[45,29],[45,31],[3,31]]],[[22,25,11],[41,21,11]],{spawn:pt(6,31),tutorial:'jump',theme:'open'}),
 make('crossroads',3,'Pátio das sepulturas',184,52,[[[3,29],[3,20],[17,20],[17,22],[22,22],[22,24],[30,24],[30,21],[45,21],[45,6],[77,6],[77,8],[86,8],[86,12],[96,12],[96,14],[102,14],[102,18],[107,18],[107,11],[113,11],[113,9],[130,9],[130,7],[146,7],[146,12],[167,12],[167,16],[173,16],[173,20],[177,20],[177,29],[181,29],[181,45],[170,45],[170,46],[121,46],[121,37],[126,37],[126,35],[116,35],[116,37],[109,37],[109,41],[103,41],[103,43],[94,43],[94,45],[87,45],[87,41],[83,41],[83,39],[80,39],[80,37],[76,37],[76,35],[70,35],[70,42],[78,42],[78,44],[80,44],[80,49],[72,49],[72,47],[65,47],[65,45],[60,45],[60,41],[57,41],[57,39],[48,39],[48,42],[37,42],[37,44],[27,44],[27,45],[12,45],[12,44],[7,44],[7,43],[3,43]],rect(7,6,39,9)],[[132,34,12],[150,38,14,'#'],[166,42,8],[61,37,7],[45,27,9],[53,21,9]],{spawn:pt(6,43),theme:'open',enemies:[enemy('walker',22,45),enemy('lunger',52,39),enemy('walker',99,43),enemy('ranged',158,38)],breakables:[wall('upperSecretWall',45,15,9,{requires:'liftLever'})],cache:{id:'upperCache',...pt(17,15),amount:24},lift:{id:'liftLever',x:53*8,high:20*8,low:33*8,w:10*8},landmark:'statue'}),
 make('watch',4,'Poço dos contrapesos',68,96,[[[17,3],[28,3],[28,5],[36,5],[36,7],[44,7],[44,10],[50,10],[50,13],[63,13],[63,24],[37,24],[37,27],[42,27],[42,30],[46,30],[46,38],[49,38],[49,49],[51,49],[51,56],[59,56],[59,64],[48,64],[48,73],[51,73],[51,91],[44,91],[44,90],[33,90],[33,88],[23,88],[23,86],[9,86],[9,80],[14,80],[14,76],[20,76],[20,72],[16,72],[16,65],[19,65],[19,61],[23,61],[23,56],[26,56],[26,52],[29,52],[29,46],[32,46],[32,41],[35,41],[35,36],[29,36],[29,34],[23,34],[23,32],[17,32]]],[[18,8,10],[21,14,10],[24,20,10],[24,26,9,'#'],[29,32,9],[36,38,7],[38,44,9,'#'],[30,50,9],[38,56,9],[28,62,10,'#'],[24,68,11],[29,74,11],[30,80,12]],{spawn:pt(22,10),enemies:[enemy('walker',25,26),enemy('ranged',40,44),enemy('walker',32,62),enemy('lunger',37,90)],breakables:[wall('upperChamber',51,24,11),wall('leverChamber',51,64,8),pile('towerBones',59,24)],lever:{id:'liftLever',...pt(56,64)},landmark:'chain'}),
 make('bridge',5,'Travessia dos espinhos',180,90,[[[26,27],[30,27],[30,20],[34,20],[34,17],[46,17],[46,15],[60,15],[60,12],[173,12],[173,27],[176,27],[176,34],[169,34],[169,38],[172,38],[172,66],[164,66],[164,82],[144,82],[144,80],[135,80],[135,78],[128,78],[128,80],[109,80],[109,78],[28,78],[28,72],[32,72],[32,70],[21,70],[21,67],[17,67],[17,62],[13,62],[13,58],[10,58],[10,55],[7,55],[7,51],[4,51],[4,42],[8,42],[8,39],[18,39],[18,44],[24,44],[24,47],[31,47],[31,50],[37,50],[37,54],[42,54],[42,59],[37,59],[37,63],[42,63],[46,63],[46,61],[164,61],[164,60],[168,60],[168,49],[161,49],[161,48],[43,48],[43,50],[34,50],[34,46],[38,46],[38,37],[26,37]]],[[45,33,15,'#'],[68,30,16,'#'],[93,27,16,'#'],[118,32,16,'#'],[142,34,19,'#'],[34,72,9],[48,73,13],[71,70,13],[94,72,12],[117,75,12],[33,64,8],[24,58,8],[16,52,8],[7,46,9]],{spawn:pt(29,37),theme:'crypt',hazards:[[45,47,114],[32,77,77],[109,79,19]],enemies:[enemy('walker',56,33),enemy('walker',76,30),enemy('ranged',107,27),enemy('walker',125,32),enemy('ranged',159,34),enemy('walker',146,80)],chest:{id:'lowerChest',...pt(150,82),amount:40},landmark:'bridge'}),
 make('ossuary',6,'Repouso sob as raízes',136,38,[[[3,20],[6,20],[6,13],[18,13],[18,10],[32,10],[32,6],[44,6],[44,10],[89,10],[89,12],[101,12],[101,15],[110,15],[110,17],[126,17],[126,4],[133,4],[133,23],[128,23],[128,27],[121,27],[121,31],[112,31],[112,29],[105,29],[105,26],[97,26],[97,29],[93,29],[93,31],[76,31],[76,29],[38,29],[38,27],[28,27],[28,25],[7,25],[7,24],[3,24]]],[[39,23,11],[60,19,14,'#'],[84,23,13],[126,17,7],[126,11,7]],{spawn:pt(6,24),checkpoint:pt(15,25),enemies:[enemy('walker',34,27),enemy('ranged',65,19),enemy('lunger',81,31),enemy('walker',100,26),enemy('walker',117,31)],theme:'open',landmark:'roots'}),
 make('sentries',7,'Câmara das vigílias',62,32,[[[3,20],[7,20],[7,15],[13,15],[13,12],[23,12],[23,9],[37,9],[37,12],[47,12],[47,15],[56,15],[56,21],[59,21],[59,28],[3,28]]],[[16,22,10],[38,22,10]],{spawn:pt(54,28),arena:{id:'arenaComplete',left:9*8,right:53*8,waves:[[enemy('walker',18,28),enemy('lunger',42,28)],[enemy('walker',14,28),enemy('ranged',30,28),enemy('lunger',46,28)]]},landmark:'bell'}),
 make('balcony',8,'Portão do sol velado',100,40,[[[3,22],[20,22],[20,7],[43,7],[43,24],[79,24],[79,27],[84,27],[84,31],[89,31],[89,34],[97,34],[97,38],[80,38],[80,36],[64,36],[64,32],[20,32],[20,28],[3,28]]],[],{spawn:pt(94,38),sealedGate:pt(31,32),landmark:'window'}),
 make('ascent',9,'Galeria da última subida',144,72,[[[4,3],[23,3],[23,35],[31,35],[31,38],[41,38],[41,40],[70,40],[70,43],[103,43],[103,46],[124,46],[124,49],[135,49],[135,54],[140,54],[140,68],[125,68],[125,66],[116,66],[116,64],[108,64],[108,66],[101,66],[101,62],[94,62],[94,64],[85,64],[85,62],[68,62],[68,64],[59,64],[59,62],[45,62],[45,68],[38,68],[38,66],[25,66],[25,68],[20,68],[20,57],[23,57],[23,54],[20,54],[20,49],[17,49],[17,40],[4,40]]],[[5,9,18],[16,15,7],[5,21,7],[16,27,7],[5,33,7],[26,58,10,'#'],[24,62,7],[20,52,4],[18,46,5],[10,39,10]],{spawn:pt(137,68),enemies:[enemy('walker',120,66),enemy('ranged',89,64),enemy('lunger',55,62),enemy('walker',30,58)],landmark:'urns'}),
 make('guardian',10,'Limiar do Guardião',220,58,[[[3,43],[8,43],[8,41],[18,41],[18,38],[28,38],[28,36],[32,36],[32,32],[47,32],[47,28],[60,28],[60,21],[126,21],[126,8],[180,8],[180,35],[187,35],[187,33],[190,33],[190,30],[198,30],[198,11],[216,11],[216,49],[189,49],[189,50],[116,50],[116,51],[87,51],[87,53],[73,53],[73,55],[55,55],[55,56],[3,56]]],[[200,43,5],[208,38,5],[204,32,7]],{spawn:pt(110,50),checkpoint:pt(117,50),boss:pt(163,50),bossArena:{left:128*8,right:180*8,trigger:133*8},bossKey:{id:'bossKey',...pt(170,50)},finalDoor:{id:'finalDoor',...pt(186,50)},end:pt(213,38),landmark:'tomb',theme:'arena'}),
];
// The original cell wall stopped below its ceiling. Preserve the 32-unit doorway,
// but close the fixed lintel above it so the visible stone cannot be jumped through.
{const r=rooms[0],g=r.rows.map(s=>s.split(''));for(let y=15;y<25;y++)g[y][23]='#';r.rows=g.map(s=>s.join(''));}
const by=Object.fromEntries(rooms.map(r=>[r.id,r]));
// Horizontal thresholds lie within corridors. Vertical shafts have their own axis.
function connect(a,ax,ay,ad,b,bx,byy,bd,flag,breakSide){
 const A=by[a],B=by[b],id=[a,b,flag||'main'].join(':');
 for(const [r,x,y,d,to,tx,ty,td]of [[A,ax,ay,ad,B,bx,byy,bd],[B,bx,byy,bd,A,ax,ay,ad]]){
  const key=id+':'+r.id;r.entries[key]={...pt(x-d*3,y),facing:-d};
  r.exits.push({...pt(x,y),to:to.id,entry:id+':'+to.id,direction:d,side:d>0?'east':'west',physical:true,passageType:flag?'breakable':a==='awakening'?'door':r.id==='sentries'?'gate':'passage',connection:id,flag,kind:flag?'breakable':undefined,breakAllowed:breakSide===r.id});
 }
}
function vertical(a,ax,ay,ad,b,bx,byy,bd){
 const A=by[a],B=by[b],id=[a,b,'main'].join(':');
 for(const [r,x,y,d,to]of [[A,ax,ay,ad,B],[B,bx,byy,bd,A]]){
  const key=id+':'+r.id;
  // Arrivals from above land near the top; arrivals from below emerge on a lip.
  r.entries[key]=d<0?{...pt(x,y+3),facing:1}:{...pt(x-4,y-1),facing:1};
  r.exits.push({...pt(x,y),to:to.id,entry:id+':'+to.id,direction:d,axis:'y',side:d>0?'south':'north',physical:true,passageType:'vertical',connection:id,openingWidth:48});
  const g=r.rows.map(s=>s.split('')),left=x-3,right=x+3;
  // Only the existing floor/ceiling seam is cut; surrounding contours stay intact.
  const from=d<0?0:y-1,until=d<0?y:r.rows.length;
  for(let row=from;row<until;row++)for(let col=left;col<right;col++)g[row][col]='.';
  r.rows=g.map(s=>s.join(''));
 }
}
connect('awakening',39,29,1,'passage',5,31,-1);
connect('passage',95,31,1,'crossroads',5,43,-1);
vertical('crossroads',174,46,1,'watch',24,5,-1);
connect('watch',49,91,1,'bridge',28,37,-1);
connect('bridge',174,34,1,'ossuary',5,24,-1);
vertical('ossuary',129,6,-1,'sentries',33,29,1);
connect('sentries',5,28,-1,'balcony',94,38,1);
connect('balcony',5,28,-1,'ascent',138,68,1);
vertical('ascent',17,5,-1,'guardian',108,51,1);
connect('bridge',9,46,1,'watch',11,86,-1,'lowerShortcut','bridge');
connect('guardian',5,56,-1,'crossroads',179,45,1,'returnShortcut','guardian');
for(const r of rooms){
 if(r.hazards){const g=r.rows.map(s=>s.split(''));for(const[x,y,w]of r.hazards)for(let c=x;c<x+w;c++)g[y][c]='^';r.rows=g.map(s=>s.join(''));}
 r.mapPosition={x:[0,1,2,3,4,5,5,4,3,3][r.number-1],y:[0,0,0,1,1,1,0,0,-1,0][r.number-1]};
}
export const cemetery=rooms;
export const START_ROOM='awakening';

