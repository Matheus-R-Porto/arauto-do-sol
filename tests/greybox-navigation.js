import {Player} from '../src/entities/player.js';
import {Energy} from '../src/systems/energy.js';
export const input=(dir=0,jump=false,run=true)=>({moveX:dir,held:{jump,dash:run},pressed:{jump},released:{}});
export function surfaces(map){
 const out=[],t=map.tileSize;
 for(let row=1;row<map.rows;row++){let start=null;for(let col=0;col<=map.cols;col++){
  const x=col*t,y=row*t,ok=[1,2].includes(map.at(col,row))&&!map.overlapsSolid(x,y-22,t,22)&&!map.overlapsHazard(x,y-22,t,24);
  if(ok&&start===null)start=x;
  if(!ok&&start!==null){if(x-start>=12){const s={left:start+5,right:x-5,y};for(const e of map.corridors??[])if(Math.abs(e.y-y)<8){if(e.direction<0)s.left=Math.max(s.left,e.x+6);else s.right=Math.min(s.right,e.x-6);}if(s.right>s.left)out.push(s);}start=null;}
 }}return out;
}
export function landing(nodes,p){return nodes.findIndex(s=>Math.abs(s.y-p.y)<1&&p.x>=s.left-1&&p.x<=s.right+1);}
export function navigation(map){
 const nodes=surfaces(map),edges=nodes.map(()=>[]);
 for(let i=0;i<nodes.length;i++){
  const a=nodes[i],samples=new Set([a.left+1,a.right-1,(a.left+a.right)/2]);for(let x=a.left+8;x<a.right;x+=24)samples.add(x);
  for(const velocity of [0,158])for(const x of samples)for(const dir of [-1,0,1])for(const jump of [true,false])for(const cut of [15,60])for(const turn of (jump===true&&dir!==0?[0,12,20]:[0])){
   if(!jump&&cut===15)continue;
   if(velocity&& (x-dir*22<a.left||x-dir*22>a.right))continue;
   const p=new Player(x,a.y),energy=new Energy();p.onGround=true;p.vx=dir*velocity;
   for(let frame=0;frame<150;frame++){
    const k=input(turn&&frame>=turn?-dir:dir,jump&&frame<cut);k.pressed.jump=!!jump&&frame===0;k.held.down=jump==='drop';k.held.jump=jump===true&&frame<cut;p.update(1/60,k,map,energy);
    if(map.overlapsHazard(p.left,p.top,p.w,p.h))break;
    if(frame>1&&p.onGround){const j=landing(nodes,p);if(j>=0&&j!==i){const score=Math.min(p.x-nodes[j].left,nodes[j].right-p.x)+(velocity?0:2)+(turn?0:2),edge={to:j,x,dir,jump,cut,turn,velocity,frames:frame+1,land:p.x,score},old=edges[i].findIndex(e=>e.to===j);if(old<0)edges[i].push(edge);else if(score>edges[i][old].score)edges[i][old]=edge;break;}if(jump&&frame>cut+30)break;}
   }
  }
 }
 return {nodes,edges};
}
export function route(nav,start,target){const queue=[start],prev=new Map([[start,null]]);while(queue.length){const i=queue.shift();if(i===target){const path=[];for(let j=i;prev.get(j);j=prev.get(j).from)path.unshift(prev.get(j));return path;}for(const e of nav.edges[i])if(!prev.has(e.to)){prev.set(e.to,{...e,from:i});queue.push(e.to);}}return null;}
export function nearest(nav,p){let best=-1,score=Infinity;nav.nodes.forEach((s,i)=>{const d=Math.abs(s.y-p.y)+Math.max(0,s.left-p.x,p.x-s.right);if(d<score){score=d;best=i;}});return best;}
