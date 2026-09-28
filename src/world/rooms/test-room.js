// Isolated laboratory. Reuses the start ID only inside its own one-room world.
const size=32,grid=Array.from({length:size},(_,y)=>Array.from({length:size},(_,x)=>x===0||x===size-1||y===0||y>=30?'#':'.'));
for(const x of [4,18])for(let c=x;c<x+10;c++)grid[27][c]='#';
export const testRooms=[{id:'awakening',name:'Sala de testes',origin:{x:0,y:0},tileSize:16,rows:grid.map(r=>r.join('')),spawn:{x:250,y:480},entries:{},exits:[],enemies:[],pickups:[],breakables:[],theme:'test'}];
