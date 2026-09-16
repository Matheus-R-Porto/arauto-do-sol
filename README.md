# Arauto do Sol — protótipo

Metroidvania 2D em HTML5 + JavaScript puro (Canvas 2D, sem engine, sem build step).
Nome provisório. O GDD conceitual está em `docs/GDD.md`.

Esta primeira fatia implementa **movimento e a barra de energia única** — a base
que define o *game feel* antes de qualquer conteúdo.

## Rodando

```bash
npm run dev
```

Abre em http://localhost:5173. Não há dependências para instalar: o `serve.js`
é um servidor estático de ~60 linhas usando só o Node. Ele existe porque
módulos ES não carregam abrindo o `index.html` direto pelo `file://`.

```bash
npm test
```

Roda os testes de física em Node (sem navegador): altura de pulo, pouso,
travessia de vãos, wall jump, custos e regeneração de energia.

## Controles

| Ação | Teclado | Gamepad |
|---|---|---|
| Mover | `A`/`D` ou setas | analógico / d-pad |
| Pular | `Espaço` ou `K` | A |
| Dash | `Shift` (tocar) | B / RB |
| Correr | `Shift` (segurar) | B / RB |
| Descer plataforma | `↓` + `Espaço` | ↓ + A |
| Double jump (2º pulo no ar) | `Espaço` de novo, no ar | A de novo, no ar |

Teclas de debug: `F1` painel · `F2` hitbox · `R` reset · `C` levar dano ·
`M` liga/desliga som · `1`–`5` ligam/desligam habilidades.

## Estrutura

```
config/tuning.js          TODOS os números do jogo (é aqui que se faz playtest)
src/
  main.js                 bootstrap: canvas, loop, debug
  core/
    loop.js               game loop de passo fixo (1/60)
    input.js              input por AÇÃO (teclado + gamepad)
    camera.js             follow com look-ahead e clamp na sala
    math.js               clamp, lerp, approach, damp
  world/
    tilemap.js            grid de colisão + render de tiles
    background.js         céu com parallax (estrelas + Lua de Fogo)
    rooms/sala-de-teste.js
  entities/player.js      física, máquina de estados, colisão
  systems/
    energy.js             barra única, modos combate/exploração
    health.js             caveiras e fragmentos
  ui/hud.js               caveiras + barra de energia
  audio/heartbeat.js      batimento cardíaco diegético (WebAudio)
tests/fisica.test.mjs
```

### Regra do projeto

**Nenhum número mágico fora de `config/tuning.js`.** Se você quer que o pulo
seja mais alto, o dash mais longo ou a corrida mais cara, o valor está lá — e
só lá. Isso é o que torna o playtest barato.

O pulo é definido por **altura + tempo até o ápice**, não por gravidade crua:
é muito mais intuitivo dizer "quero pular 3 tiles em 0.36s" do que chutar
px/s². A gravidade é derivada disso em `player.js`.

## O que já está implementado

- Movimento de plataforma com aceleração, *coyote time* (0.10s) e *jump buffer* (0.12s)
- Pulo de altura variável (soltar o botão corta o pulo)
- Momentum preservado no ar — pulo correndo alcança mais que pulo parado
- Dash (com cooldown, dash aéreo, e intangibilidade como upgrade separado)
- Correr segurando o mesmo botão do dash, como no GDD
- Wall slide + wall jump (o wall jump devolve o dash aéreo). Empuxo horizontal
  calibrado pra dar pra **escalar uma parede única**, sem precisar de uma parede
  oposta — segure o pulo pra ganhar altura e aperte de volta em direção à parede
  para regarrá-la mais alto (ver nota de tuning abaixo)
- Plataformas de uma via, com descida por `↓ + Espaço`
- Colisão por tilemap com encaixe exato na face do tile
- Barra de energia única com modos combate (custo cheio) e exploração (metade)
- Vida em caveiras + fragmentos
- Tile de perigo (`^`) na sala de teste: não bloqueia, machuca ao encostar —
  atravessa ileso apenas durante um dash com a habilidade `dashIntangible` ligada
- Double jump provisório: apertar pulo 2x no ar (o double jump *de verdade* do
  GDD é outra mecânica — o torso se ejeta das pernas; isso aqui é só o padrão
  clássico de plataforma para validar movimento aéreo antes de desenhar aquilo)
- Batimento cardíaco que acelera com a vida baixa e silencia fora de combate
- Gating de habilidades (`player.abilities`) — a espinha do metroidvania

## Decisões que precisam de playtest

1. **Pular consome energia.** Está implementado como o GDD descreve (4 de custo),
   mas é o item mais arriscado do design: ficar sem poder pular por falta de
   barra costuma irritar em plataformer. O custo é baixo e a regeneração é
   rápida, então na prática quase nunca bloqueia — mas vale sentir. Para testar
   sem isso, zere `ENERGY.costs.jump` em `config/tuning.js`.
2. **Velocidade de corrida vs. tamanho dos vãos.** Hoje um vão de 5 tiles exige
   corrida ou dash, e um de 2 tiles se passa andando. Esse é o vocabulário de
   level design; mudar `runSpeed` reescreve o mapa inteiro.
3. **Wall slide consome energia por segundo.** Pode tornar poços altos cansativos.
   Escalar uma parede única bem alta drena uma quantidade previsível por ciclo
   (~2.5 de energia por wall jump + o dreno contínuo do slide) — dá pra escalar
   umas boas dezenas de tiles com a barra cheia, mas não é de graça.
4. **Intangibilidade do dash dura exatamente o tempo do dash, não um pouco a mais.**
   Se você começa o dash longe do perigo, o momentum residual (não-intangível)
   pode carregar você para dentro do retângulo depois que o dash já acabou —
   e aí toma dano mesmo com a habilidade ligada. Dashando bem colado na borda
   do perigo, atravessa ileso. É o comportamento clássico de i-frames de dash
   (Hollow Knight tem o mesmo problema), mas decide se quer um pequeno buffer
   extra de intangibilidade após o fim do dash para suavizar isso.

## Próximos passos sugeridos

1. Combate: empunhadura dupla (M1 mão direita / M2 mão esquerda), cadeia de
   combo por arma, ataque pesado, bloqueio.
2. Inimigo simples + dano, para a barra de energia finalmente alternar entre
   os modos combate e exploração em jogo de verdade.
3. Sistema de salas e transições (o metroidvania de fato).
4. Spritesheet e animação — hoje o Arauto é desenhado com retângulos.
