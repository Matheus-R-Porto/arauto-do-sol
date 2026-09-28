# Arauto do Sol â€” demo v0.6.0 do CemitÃ©rio

Vertical slice em **HTML5, JavaScript ES Modules e Canvas 2D**. Sem engine, build ou dependÃªncias externas no jogo. Arte integrada em todas as categorias, agora com animaÃ§Ãµes ampliadas e sincronizadas ao gameplay. GDD original preservado em `docs/GDD.md`.

## Pacote para enviar a outra pessoa

O ZIP **Arauto-do-Sol-v0.6.0-Windows.zip** fica na pasta acima do projeto. No Windows, basta extrair tudo e abrir **Jogar Arauto do Sol.exe**. Abre no navegador, funciona offline e dispensa Node.js. Mantenha a janela do iniciador aberta enquanto joga. [RelatÃ³rio do cenÃ¡rio v0.6.0](docs/RELATORIO_CENARIO.md) Â· [RelatÃ³rio das animaÃ§Ãµes v0.5](docs/RELATORIO_ANIMACOES_V2.md).

## Arte do protagonista

ReferÃªncia preservada, RAW separados e processamento reproduzÃ­vel em Python/Pillow. Corpo de referÃªncia de 96 pixels no asset, renderizado em 24 unidades de mundo, canvas 128Ã—128, origem nos pÃ©s e paleta mestre de 16 cores. A fÃ­sica, hitboxes e lÃ³gica de combate permanecem iguais Ã  v0.2.0. [RelatÃ³rio da arte](docs/RELATORIO_ARTE_1.md) Â· [Uso da ferramenta](tools/sprite_pipeline/README.md).

## Tela cheia

Use o botÃ£o **Tela cheia** ou **F**. **Esc** sai do fullscreen. Base raster 960Ã—540, saÃ­da Full HD em 2Ã— sem smoothing, zoom de mundo 1,5 separado da resoluÃ§Ã£o. ProporÃ§Ã£o 16:9 com barras quando necessÃ¡rio. [ComparaÃ§Ã£o das trÃªs bases](docs/display/README.md).

## Executar

Ã‰ necessÃ¡rio Node.js. Dentro desta pasta:

```sh
npm run dev
```

Abra **http://localhost:5174**. NÃ£o Ã© preciso `npm install`. O `index.html` precisa do servidor, nÃ£o funciona por duplo clique. Se a porta estiver ocupada, no PowerShell: `$env:PORT='5175'; npm run dev`.

Na tela inicial, pressione **EspaÃ§o / E / A do controle**. Ao terminar, os mesmos comandos reiniciam tudo. Para facilitar no Windows, tambÃ©m hÃ¡ `JOGAR.bat` (inicia o servidor e abre o navegador).

## Controles

| AÃ§Ã£o | Teclado / mouse | Controle padrÃ£o Xbox |
|---|---|---|
| Mover | A/D, setas | AnalÃ³gico / d-pad |
| Pular, altura variÃ¡vel | EspaÃ§o / K; solte para pulo curto | A |
| Correr | Segurar Shift / L | Segurar B / RB |
| Descer plataforma | â†“ / S + EspaÃ§o | â†“ + A |
| Espada, golpe 1 | M1 / J | X |
| Espada, golpe 2 | M2 / U | RT |
| Interagir, repousar | E | LB |
| Pausar | Esc | â€” |
| Silenciar | M | â€” |
| Retornar ao checkpoint | R | â€” |

Os ataques preservam o combo compartilhado de cinco golpes do protÃ³tipo. M2 mantÃ©m provisoriamente o dobro do dano, com o mesmo custo. A demo apresenta os dois como variaÃ§Ãµes de uma espada simples. Andar, correr, pular e atacar estÃ£o disponÃ­veis; **dash, parede, planar e pulo duplo comeÃ§am desligados**.

A energia Ã© Ãºnica. ApÃ³s o playtest, todos os custos foram reduzidos pela metade e o retorno Ã  exploraÃ§Ã£o ocorre apÃ³s 10 segundos sem causar ou receber dano. M1/M2 custam 4,5 pontos em combate e 2,25 em exploraÃ§Ã£o; correr custa 3 ou 1,5 pontos por segundo, respectivamente. A regeneraÃ§Ã£o continua em 10 pontos por segundo, apÃ³s 1 segundo sem gastar energia, em ambos os modos. Energia insuficiente nÃ£o trava o personagem: ainda Ã© possÃ­vel andar e esperar.

Caminhada e movimento horizontal do pulo comum tÃªm o mesmo teto: 92 px/s. Saltar a partir de uma corrida preserva o impulso de 158 px/s. Veja `docs/BALANCEAMENTO.md` para todos os valores alterados.

## Fluxo e geografia

Dez salas principais reconstruídas a partir dos 12 recortes Dungeon Scrawl. A cela contém o segredo inicial; a Sala 3 possui segredo ligado à alavanca da Sala 4; a Sala 5 tem dois percursos e retorno por parede quebrável. A arena da Sala 7 tem ondas de 2 e 3 inimigos. A Sala 8 apresenta o portão selado; a Sala 10 contém repouso, retorno ao Pátio, Guardião, chave e porta final.

As portas de conexão são atravessadas caminhando pela abertura. E aciona alavanca, repousos, baú e porta final. Pilhas de ossos exigem quatro golpes e concedem moeda, sem aumentar vida. Estados de exploração e arena concluída persistem durante a run; recarregar a página inicia outra partida.

Veja [o relatório completo do redesenho](docs/level-redesign/README.md).

## Inimigos e boss

- **Walker:** patrulha, aproximaÃ§Ã£o, golpe frontal anunciado e recuperaÃ§Ã£o.
- **Lunger:** preparaÃ§Ã£o longa, investida em direÃ§Ã£o fixa, pausa para contra-atacar.
- **Ranged:** recua quando hÃ¡ espaÃ§o, anuncia e dispara um projÃ©til lento.
- **GuardiÃ£o do CemitÃ©rio:** nome provisÃ³rio, sem lore nova. Corte frontal, investida baixa que pode ser pulada e salto com local de queda marcado. Abaixo de 50% de vida, recuperaÃ§Ã£o um pouco menor. NÃ£o causa dano de contato permanente. SÃ³ o slam causa duas caveiras. DerrotÃ¡-lo abre a arena apÃ³s uma breve pausa; o final fica na cÃ¢mara seguinte.

## Debug

F1: painel de sala, checkpoint, estados, FPS, energia e habilidades. F2: corpos, ataques e projÃ©teis. **F3: mapa de debug, pausando o jogo.** R: checkpoint. M: Ã¡udio. Com **F1 aberto**, C causa dano, 6 cria o dummy original, 1â€“5 alternam dash, parede, intangibilidade, pulo duplo e planar. Nenhuma tecla de debug Ã© necessÃ¡ria para concluir.

A sala original continua em `src/world/rooms/sala-de-teste.js`, usada pelos testes de regressÃ£o. O jogo inicia no CemitÃ©rio.

## Testes

```sh
npm test
```

A suÃ­te cobre: fÃ­sica, Ã¡udio, combate, salas, IA, boss, input, progressÃ£o e quatro percursos completos. O percurso anti-softlock inclui cinco mortes deliberadas em etapas diferentes. NÃ£o hÃ¡ teleporte, cura artificial ou desbloqueio de habilidades nos percursos. Os testes unitÃ¡rios isolados usam estados controlados para validar casos especÃ­ficos.

Para observar o teste de integraÃ§Ã£o no navegador: **http://localhost:5174/tests/playthrough.html**. Ele Ã© separado da demo normal e oferece rota crÃ­tica, explorador, completionista e anti-softlock, reproduÃ§Ã£o a 4Ã—/1Ã— e pausa por sala.

## Arquitetura e ediÃ§Ã£o

- `config/tuning.js`: fÃ­sica original, valores da demo, inimigos, boss e efeitos.
- `src/world/rooms/cemetery.js`: dados das 17 salas; retÃ¢ngulos em tiles geram ASCII. Aqui se editam geometria, spawns, saÃ­das e encontros.
- `src/world/validate.js`: valida grid, destinos, entradas, pickups, checkpoints, boss e conectividade.
- `src/world/progression.js`: estado centralizado dos gates, chave e recompensas da run.
- `src/ui/map-decor.js`: landmarks, antevisÃµes e mapa F3.
- `src/world/room-manager.js`: sala ativa, persistÃªncia da sessÃ£o, transiÃ§Ã£o, morte, checkpoint e final.
- `src/entities/enemies/`: IA simples e projÃ©teis; reaproveita fÃ­sica do Zombie.
- `src/entities/boss/guardian.js`: estados e trÃªs ataques do boss.
- `src/ui/demo-view.js`: cenÃ¡rio procedural, portas, prompts, barra do boss, inÃ­cio e fim.
- `src/audio/effects.js`: sons sintetizados no contexto do heartbeat.
- `src/main.js`: montagem, loop, pausa e debug.

Somente a sala atual Ã© atualizada. FÃ­sica de 60 Hz, resoluÃ§Ã£o 480Ã—270, escala inteira, cÃ¢mera com look-ahead e smoothing preservados.

Veja `docs/DEMO_IMPLEMENTATION.md` para decisÃµes provisÃ³rias, mediÃ§Ãµes e limitaÃ§Ãµes de playtest.




ResoluÃ§Ã£o dos personagens corrigida em v0.5.1, preservando o tamanho no mundo e o zoom: [detalhes e reproduÃ§Ã£o](docs/RESOLUCAO_SPRITES.md).

Alinhamento local dos feixes M1/M2: [correÃ§Ã£o e testes](docs/attack-alignment/README.md). Escalas aprovadas preservadas.


Revisão estrutural: todas as plataformas do Cemitério são sólidas. Desça pelas bordas e aberturas. F1 mostra também os blocos de colisão e os hazards. Veja [o relatório por anexo](docs/structural-review/RELATORIO.md) e a página de inspeção em `/tests/greybox-review.html`.
