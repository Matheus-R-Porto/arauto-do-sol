import { TileMap } from './tilemap.js';
import { PLAYER, BOSS, ENEMIES } from '../../config/tuning.js';

export function validateRooms(rooms, start) {
  const ids = new Set();
  for (const r of rooms) {
    if (!r.id || !Array.isArray(r.rows) || !r.rows.length || !r.rows[0].length) throw new Error('Sala sem id ou grid vazio');
    if (ids.has(r.id)) throw new Error(`Sala duplicada: ${r.id}`);
    ids.add(r.id);
  }
  if (!ids.has(start)) throw new Error(`Início inexistente: ${start}`);
  for (const r of rooms) {
    const map = new TileMap(r);
    const safe = (p, label, w = PLAYER.width, h = PLAYER.height) => {
      if (!p || !Number.isFinite(p.x) || !Number.isFinite(p.y) ||
          map.overlapsSolid(p.x-w/2,p.y-h,w,h) || map.overlapsHazard(p.x-w/2,p.y-h,w,h))
        throw new Error(`${r.id}: ${label} inválido/dentro de parede`);
    };
    safe(r.spawn,'spawn');
    for (const [id,p] of Object.entries(r.entries)) safe(p,`entrada ${id}`);
    if (r.checkpoint) safe(r.checkpoint,'checkpoint');
    if (r.end) safe(r.end,'final');
    for(const kind of ['key','lever','well','secretStone'])if(r[kind])safe(r[kind],kind);
    for (const p of r.pickups) safe(p,`fragmento ${p.id}`);
    if (r.boss) safe(r.boss,'boss spawn',BOSS.width,BOSS.height);
    for (const e of r.enemies) {
      if (!ENEMIES[e.type]) throw new Error(`${r.id}: arquétipo desconhecido`);
      safe(e,'enemy spawn',ENEMIES[e.type].width,ENEMIES[e.type].height);
    }
    for (const e of r.exits) {
      const target = rooms.find(d => d.id === e.to);
      if (!target?.entries[e.entry]) throw new Error(`${r.id}: exit sem destino/entrada válida: ${e.to}`);
      safe(e,'exit');
      if(r.origin&&target.origin){
        const a=r.origin,b=target.origin,aw=r.rows[0].length,ah=r.rows.length,bw=target.rows[0].length,bh=target.rows.length;
        const arrival=target.entries[e.entry],t=r.tileSize;
        const aligned=e.side==='east'?a.x+aw===b.x&&a.y+e.y/t===b.y+arrival.y/t:
          e.side==='west'?b.x+bw===a.x&&a.y+e.y/t===b.y+arrival.y/t:
          e.side==='south'?a.y+ah===b.y&&a.x+e.x/t===b.x+arrival.x/t:
          e.side==='north'?b.y+bh===a.y&&a.x+e.x/t===b.x+arrival.x/t:false;
        if(!aligned)throw new Error(`${r.id} → ${target.id}: passagem não adjacente/alinhada`);
        if(!e.oneWay&&!target.exits.some(back=>back.to===r.id&&back.flag===e.flag))throw new Error(`${r.id}: retorno ausente`);
      }
    }
  }
  for(let i=0;i<rooms.length;i++)for(let j=i+1;j<rooms.length;j++){
    const a=rooms[i],b=rooms[j];if(!a.origin||!b.origin)continue;
    if(a.origin.x<b.origin.x+b.rows[0].length&&a.origin.x+a.rows[0].length>b.origin.x&&
       a.origin.y<b.origin.y+b.rows.length&&a.origin.y+a.rows.length>b.origin.y)
      throw new Error(`Salas sobrepostas: ${a.id}, ${b.id}`);
  }
  const seen = new Set(), queue = [start];
  while (queue.length) {
    const id = queue.pop();
    if (seen.has(id)) continue;
    seen.add(id);
    queue.push(...rooms.find(r=>r.id===id).exits.map(e=>e.to));
  }
  if (seen.size !== rooms.length) throw new Error('Grafo contém salas desconectadas');
  return true;
}
