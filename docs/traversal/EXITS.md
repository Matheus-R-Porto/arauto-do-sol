# Auditoria das 22 saídas

| Origem | Destino | Direção | Tipo correto | Antes | Correção aplicada | Trigger atual | Spawn no destino |
|---|---|---|---|---|---|---|---|
| 1 — Cela do despertar | 2 | direita | porta real | porta lateral (direita) | Não; função preservada | (312, 232), eixo x | (64, 248) |
| 2 — Galeria dos primeiros passos | 1 | esquerda | porta real | porta lateral (esquerda) | Não; função preservada | (40, 248), eixo x | (288, 232) |
| 2 — Galeria dos primeiros passos | 3 | direita | passagem horizontal aberta | porta lateral (direita) | Sim: removida moldura de porta | (760, 248), eixo x | (64, 344) |
| 3 — Pátio das sepulturas | 2 | esquerda | passagem horizontal aberta | porta lateral (esquerda) | Sim: removida moldura de porta | (40, 344), eixo x | (736, 248) |
| 3 — Pátio das sepulturas | 4 | baixo | abertura vertical | porta lateral (direita) | Sim: abertura física, eixo Y, posição, spawn e visual | (1392, 368), eixo y | (192, 64) |
| 3 — Pátio das sepulturas | 10 | direita | parede quebrável / shortcut | parede quebrável | Não; função preservada | (1432, 360), eixo x | (64, 448) |
| 4 — Poço dos contrapesos | 3 | cima | abertura vertical | porta lateral (esquerda) | Sim: abertura física, eixo Y, posição, spawn e visual | (192, 40), eixo y | (1360, 360) |
| 4 — Poço dos contrapesos | 5 | direita | passagem horizontal aberta | porta lateral (direita) | Sim: removida moldura de porta | (392, 728), eixo x | (248, 296) |
| 4 — Poço dos contrapesos | 5 | esquerda | parede quebrável / shortcut | parede quebrável | Não; função preservada | (88, 688), eixo x | (48, 368) |
| 5 — Travessia dos espinhos | 4 | esquerda | passagem horizontal aberta | porta lateral (esquerda) | Sim: removida moldura de porta | (224, 296), eixo x | (368, 728) |
| 5 — Travessia dos espinhos | 6 | direita | passagem horizontal aberta | porta lateral (direita) | Sim: removida moldura de porta | (1392, 272), eixo x | (64, 192) |
| 5 — Travessia dos espinhos | 4 | direita | parede quebrável / shortcut | parede quebrável | Não; função preservada | (72, 368), eixo x | (112, 688) |
| 6 — Repouso sob as raízes | 5 | esquerda | passagem horizontal aberta | porta lateral (esquerda) | Sim: removida moldura de porta | (40, 192), eixo x | (1368, 272) |
| 6 — Repouso sob as raízes | 7 | cima | abertura vertical | porta lateral (direita) | Sim: abertura física, eixo Y, posição, spawn e visual | (1032, 48), eixo y | (232, 224) |
| 7 — Câmara das vigílias | 6 | baixo | abertura vertical + grade durante arena | porta lateral (direita) | Sim: abertura física, eixo Y, posição, spawn e visual | (264, 232), eixo y | (1032, 72) |
| 7 — Câmara das vigílias | 8 | esquerda | portão de arena | porta lateral (esquerda) | Classificação explícita; portão preservado | (40, 224), eixo x | (728, 304) |
| 8 — Portão do sol velado | 7 | direita | passagem horizontal aberta | porta lateral (direita) | Sim: removida moldura de porta | (752, 304), eixo x | (64, 224) |
| 8 — Portão do sol velado | 9 | esquerda | passagem horizontal aberta | porta lateral (esquerda) | Sim: removida moldura de porta | (40, 224), eixo x | (1080, 544) |
| 9 — Galeria da última subida | 8 | direita | passagem horizontal aberta | porta lateral (direita) | Sim: removida moldura de porta | (1104, 544), eixo x | (64, 224) |
| 9 — Galeria da última subida | 10 | cima | abertura vertical | porta lateral (direita) | Sim: abertura física, eixo Y, posição, spawn e visual | (136, 40), eixo y | (832, 400) |
| 10 — Limiar do Guardião | 9 | baixo | abertura vertical | porta lateral (esquerda) | Sim: abertura física, eixo Y, posição, spawn e visual | (864, 408), eixo y | (136, 64) |
| 10 — Limiar do Guardião | 3 | esquerda | parede quebrável / shortcut | parede quebrável | Não; função preservada | (40, 448), eixo x | (1408, 360) |

Estruturas internas também auditadas: porta da cela mantida; câmaras quebráveis das salas 1, 3 e 4 mantidas; portões da arena 7 mantidos (grade horizontal na abertura do chão); grande portão selado da sala 8 mantido; porta pós-chefe e exigência de chave mantidas. Esses objetos internos não acrescentam exits ao grafo.
