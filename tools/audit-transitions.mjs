import {writeFileSync} from 'node:fs';
import {cemetery} from '../src/world/rooms/cemetery.js';
import {cemetery as previous} from '../docs/traversal/cemetery-before.js';
const dir={east:'direita',west:'esquerda',north:'cima',south:'baixo'},types={door:'porta real',passage:'passagem horizontal aberta',vertical:'abertura vertical',gate:'portão de arena',breakable:'parede quebrável / shortcut'};
let out='# Auditoria das 22 saídas\n\n| Origem | Destino | Direção | Tipo correto | Antes | Correção aplicada | Trigger atual | Spawn no destino |\n|---|---|---|---|---|---|---|---|\n';
for(const r of cemetery)for(const e of r.exits){const to=cemetery.find(r=>r.id===e.to),old=previous.find(x=>x.id===r.id).exits.find(x=>x.connection===e.connection),spawn=to.entries[e.entry];
 const change=e.axis==='y'?'Sim: abertura física, eixo Y, posição, spawn e visual':e.passageType==='passage'?'Sim: removida moldura de porta':e.passageType==='gate'?'Classificação explícita; portão preservado':'Não; função preservada';
 out+=`| ${r.number} — ${r.name} | ${to.number} | ${dir[e.side]} | ${types[e.passageType]}${r.arena&&e.axis==='y'?' + grade durante arena':''} | ${old.flag?'parede quebrável':`porta lateral (${dir[old.side]})`} | ${change} | (${e.x}, ${e.y}), eixo ${e.axis||'x'} | (${spawn.x}, ${spawn.y}) |\n`;
}
out+='\nEstruturas internas também auditadas: porta da cela mantida; câmaras quebráveis das salas 1, 3 e 4 mantidas; portões da arena 7 mantidos (grade horizontal na abertura do chão); grande portão selado da sala 8 mantido; porta pós-chefe e exigência de chave mantidas. Esses objetos internos não acrescentam exits ao grafo.\n';
writeFileSync(new URL('../docs/traversal/EXITS.md',import.meta.url),out);
