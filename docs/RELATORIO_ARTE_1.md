# Primeira iteração real de arte — Arauto do Sol v0.3.0

Entrega: protagonista raster animado dentro da demo, ferramenta reproduzível de processamento e pacote Windows atualizado. A referência enviada pelo usuário foi preservada. O idle foi integrado e inspecionado antes da geração das demais ações. Cenários, inimigos, chefe, UI, áudio e mapa não receberam arte nova.

## 1. Ferramenta criada

`tools/sprite_pipeline/pipeline.py`, Python 3.12 + Pillow 12.3.0, com configuração JSON externa. Recebe arquivo ou pasta de PNGs, trata transparência/fundo, recorta, reduz proporcionalmente, quantiza por perfil, alinha por pivot, valida e exporta PNG RGBA + relatório. Inclui `--info`, comparação de filtros, anchors por frame e previews de revisão. A ferramenta protege RAW/configurações contra sobrescrita, inclusive via hardlinks.

```sh
python tools/sprite_pipeline/pipeline.py assets/raw/protagonist/reference.png --info
python tools/sprite_pipeline/build_protagonist.py
python -m unittest discover -s tests/sprite_pipeline -v
npm test
```

O segundo comando reprocessa a produção a partir dos RAW e da receita medida; não chama geração de imagem. [Manual completo, dependência e comandos individuais](../tools/sprite_pipeline/README.md).

## 2. Pipeline realizado

Referência → geração pelo **image_gen integrado** → oito conjuntos pequenos de 2–4 quadros → PNGs RAW intactos → separação reproduzível por coordenadas medidas → preservação do alpha original → bbox e pivot originais → redução uniforme calibrada pela anatomia → **Lanczos** → alpha binário em 128 → paleta mestre fixa, sem dithering → canvas compartilhado → validações → PNGs finais → manifesto → carregamento e animação no jogo.

Depois da base pixel art, toda ampliação usa nearest. O jogo desenha cada PNG em 1:1 no canvas interno, sem smoothing ou deformação. A escala CSS do jogo continua inteira.

Piloto: três idles. Foram comparados nearest, BOX e Lanczos, sobre quadriculado, claro, escuro e vermelho, e no cenário nativo. Nearest fez detalhes dos ossos variarem e perdeu continuidade da espada; BOX ficou mais apagado; Lanczos preservou melhor o conjunto. A decisão ficou registrada no perfil. A página `tests/art-review.html` conserva os três candidatos para revisão no cenário, com flip, pausa e hitbox.

Todos os RAW desta produção já tinham alpha. A remoção de fundo não foi acionada neles. Para entradas opacas, a ferramenta dispõe de flood fill conectado às bordas, com estimativa por cantos, tolerância e proteção de áreas internas isoladas. Esse caminho foi testado com fixtures.

Correção estrutural durante a produção: o primeiro M1 extrapolava a divisão ideal em três células. Foram ajustados os recortes no arquivo de layout; a imagem original não foi editada e a lâmina não foi cortada. Não houve retoque manual de pixels para esconder erros de escala, paleta ou alinhamento.

## 3. Paleta

Paleta mestre: **16 cores RGB**, com transparência fora da contagem. As sete primeiras são as sete cores visíveis da referência original. A extensão permite meios-tons e aço sem trocar de paleta entre animações.

| Origem/função | Cores |
|---|---|
| Referência: osso, tecido e sombra | `#DBD3BA`, `#B5AC96`, `#8F8572`, `#695F4F`, `#42392F`, `#2E251E`, `#1A120B` |
| Luz e meios-tons adicionais | `#EEE7CF`, `#C7BEA6`, `#A49981`, `#7B705B`, `#544A3B` |
| Tons neutros para sombra e aço | `#242329`, `#515459`, `#8C8E8C`, `#C3C5B9` |

A produção final utiliza **13 dessas cores na união de todos os quadros**, no máximo **12 em um quadro**. Todas pertencem à mesma paleta. Nenhum frame precisa usar as 16 entradas. O limite 16 pertence ao perfil do protagonista; um perfil genérico com 32 cores é aceito e testado.

## 4. Resolução e origem

- Referência recebida: **32×96**, RGBA. Esse tamanho não foi imposto ao mundo.
- Jogo: **480×270**, tile **16 px**.
- Corpo em pé: aproximadamente **24 px**; poses curvadas ou aéreas mantêm o tamanho dos ossos, sem serem ampliadas para preencher o quadro.
- Todos os PNGs finais: **64×40**, RGBA, alpha somente 0/255.
- Pivot comum: **(32,36)**; baseline **36**, centro da base do personagem.
- Escala no renderer: **1:1**. A área transparente acomoda espada, passada e queda; não aumenta o collider.
- O teto **128×128** é validado como máximo, não usado como tamanho-alvo.

As calibrações dos RAW ficam em `protagonist-build.json`. Cada conjunto usa uma única escala anatômica; recortes de diferentes poses não são redimensionados individualmente para a mesma altura. Há margem transparente em todos os quadros.

## 5. Animações

| Animação | Quadros | Tempo | Comportamento |
|---|---:|---|---|
| Idle | 3 | 0,96 s | Loop |
| Caminhada | 4 | 0,52 s | Loop |
| Corrida | 4 | 0,36 s | Loop próprio, torso inclinado |
| Salto | 2 | 0,36 s | Segura a última pose enquanto sobe |
| Queda | 2 | 0,36 s | Segura a última pose enquanto desce |
| M1 | 3 | 0,25 s | Contato imediato, finalização e recuperação |
| M2 | 3 | 0,25 s | Corte diagonal distinto, contato imediato |
| Hurt | 2 | 0,14 s | Reação breve à queda real de vida |
| Morte | 4 | 0,85 s | Colapso durante o tempo existente de respawn |

**Total: 27 PNGs, nove animações.** Não são cópias de um mesmo placeholder: cada sequência contém quadros diferentes. Pouso retorna à animação de chão correspondente; não foi criado um travamento de landing inexistente na lógica. O squash geométrico do placeholder deixou de deformar o corpo raster. Habilidades futuras desligadas não receberam animações novas.

## 6. Assets e metadados

| Conteúdo | Caminho |
|---|---|
| Referência e gerações intactas | `assets/raw/protagonist/` |
| Prompts exatos / ferramenta usada | `assets/raw/protagonist/generation-prompts.json` |
| Recortes intermediários reproduzíveis | `assets/work/protagonist/` |
| PNGs usados no jogo | `assets/sprites/protagonist/{idle,walk,run,air,attack-light,attack-m2,hurt,death}/` |
| Frames, tempos e pivot do runtime | `assets/sprites/protagonist/manifest.json` |
| Relatórios por conjunto | `assets/sprites/protagonist/*/pipeline-report.json` |
| Perfil | `tools/sprite_pipeline/profiles/protagonist.json` |
| Paleta | `tools/sprite_pipeline/palettes/protagonist.json` |
| Layouts / calibrações | `tools/sprite_pipeline/protagonist-build.json` |
| Relatório consolidado / hashes RAW | `docs/art/production-report.json`, `docs/art/raw-sha256.json` |
| Folhas para revisão | `docs/art/contact-native.png`, `docs/art/contact-6x.png` |

Os oito RAW foram gerados com a ferramenta integrada, usando a imagem enviada e o idle aceito como referências. Os PNGs finais somam **14.892 bytes**. Não foi necessário um atlas: os pequenos arquivos individuais são carregados antes de começar o loop.

## 7. Integração

`src/ui/player-sprites.js` carrega e valida o manifesto, as dimensões e todos os PNGs. Só aceita caminhos em `assets/sprites/`. Falhas de carregamento ou animações obrigatórias ausentes geram mensagem visível antes da partida.

O `PlayerAnimator` observa o mundo no passo fixo de 60 Hz. Sua prioridade é **morte > hurt > ataque > salto/queda > locomoção > idle**. Ele não escreve no Player nem decide dano, velocidade, colisão ou progressão. Leitura de frames não avança o tempo, portanto a animação não depende da frequência de renderização. Transições, pausa e hitstop são respeitados.

`DemoView` recebe o renderer de sprites e substitui apenas o desenho do protagonista. Posição e câmera são alinhadas a pixels inteiros; a direção usa flip horizontal em torno do pivot. O desenho procedural antigo permanece disponível somente como fallback de desenvolvimento quando uma view é criada sem sprites. O jogo normal carrega a arte obrigatoriamente.

Os flashes procedurais de M1/M2 continuam separados do PNG. Os ataques são reconhecidos pelo reinício do cooldown real; o primeiro frame já está em contato, sem introduzir preparação. Alternar armas reinicia o visual correspondente. Hurt observa perda de vida, não a invulnerabilidade de chegada; a reação inicial permanece visível antes de voltar ao piscar existente.

## 8. Gameplay

**Nenhuma alteração de gameplay foi necessária.** Comparação byte a byte com o ZIP v0.2.0 confirmou **21 arquivos idênticos** de configuração, entidades, física/input, sistemas, mundo e áudio. Registro: `docs/art/gameplay-unchanged.json`.

Continuam os custos de energia reduzidos pela metade, os dez segundos para sair de combate, caminhada e salto comum a 92 px/s, corrida a 158 px/s, combo e timings originais. Um percurso pareado, usando os mesmos inputs em dois mundos — com e sem observador visual — terminou com estados iguais, inclusive após cinco mortes.

## 9. Hitboxes

Collider e hurtbox do jogador continuam **10×22**, com posição nos pés. M1/M2 mantêm alcance de **18 px além da frente do corpo** e altura 22. A arte não define nem redimensiona essas áreas. F2 continua desenhando as caixas por cima do sprite; foi conferido no idle espelhado e durante o golpe. A espada raster é menor que toda a área de alcance; o flash procedural existente continua mostrando a região do golpe.

## 10. Testes automatizados

- **104 verificações da demo/apresentação aprovadas**: 95 anteriores mais nove testes do sistema visual, incluindo prioridade, sincronização de golpes, invulnerabilidade de chegada, respawn, tempo independente de FPS, congelamento e percurso pareado.
- **32 testes Python aprovados**: 29 da ferramenta e três sobre a produção real. Cobrem cores por perfil, RGBA, alpha, flood fill, margem/tamanho, alinhamento, escala compartilhada, RAW imutável, comparação de filtros, preview seguro, assets/relatórios e recortes sem clipping.
- Reprocessamento completo: **27 PNGs byte-idênticos** e **nove PNGs de referência/RAW inalterados**.
- Pacote extraído: executável serviu **56 arquivos de runtime** integralmente, com MIME correto, sem Node.js. RAW e caminhos externos não ficam acessíveis.

Registros: `docs/art/game-tests.txt`, `pipeline-tests.txt`, `reproducibility-and-package.json` e `windows-package-test.txt`.

## 11. Playtest na demo

O idle foi visto nativamente no início da demo e na cripta, com comparação de filtros, fundos de contraste, espelhamento e F2. Após integração completa, o navegador executou o percurso completionista com inputs normais: **17/17 salas, 4/4 fragmentos, cinco mortes previstas, chefe derrotado e tela final**, em **355,7 segundos simulados**. Esse tempo pertence ao controlador de teste, não estima a duração de uma primeira partida humana.

O percurso acionou idle, andar, correr, salto, queda, M1, M2, hurt e death. Foram inspecionados separadamente o primeiro frame ativo de M1 à esquerda com hitbox, hurt na Vigília e a progressão do colapso na Cripta. As sequências e durações também foram revistas na folha nativa/6×. O pacote extraído foi aberto pelo seu próprio EXE, iniciou uma partida e carregou o protagonista sem avisos ou erros no console.

`tests/playthrough.html` conserva controles para pausar por animação e avançar um passo, sem alterar vida, posição, habilidades ou regras. A revisão de arte em salas estáticas é separada desse percurso de gameplay.

## 12. Limitações visuais

- A altura corporal de 24 px preserva a escala da demo, mas perde dentes, costelas individuais e parte da textura presentes na referência de 96 px.
- O pivot/baseline é estável; ainda há pequenas diferenças de contorno e luz entre gerações, perceptíveis como variação de aproximadamente um pixel em detalhes. A ferramenta não torna poses geradas artisticamente idênticas.
- Os ciclos de caminhada/corrida são curtos, de quatro quadros. Esta é uma primeira produção funcional, não uma animação final de alta fluidez.
- O corpo mantém a paleta escura da referência. Sobre regiões escuras, a leitura depende principalmente do crânio, dos ossos mais claros e da silhueta. A revisão incluiu contraste claro/escuro/vermelho.
- Os efeitos de ataque continuam sendo flashes geométricos do protótipo e podem cobrir parte da lâmina. Não foi feita uma iteração de VFX.
- A morte respeita a posição e o fade já existentes: se a morte ocorrer no ar, o mundo congela naquela posição e o colapso acompanha essa origem até o respawn. Não foi adicionada física de cadáver.
- Cenário, inimigos e chefe ainda usam arte procedural; a diferença de acabamento é esperada nesta etapa focada no protagonista.

## 13. Próximos passos

Para um inimigo ou chefe, começar pela auditoria da anatomia/collider e por um idle piloto no próprio cenário, criar seu perfil e paleta próprios, comparar a redução na escala real e só então produzir ações. Reutilizar remoção por bordas, escala anatômica, anchors, relatórios e validações. Não herdar automaticamente 16 cores, 64×40 ou o pivot do protagonista. Para este personagem, uma próxima revisão pode melhorar a consistência dos contornos e o ciclo de corrida, sempre corrigindo geração/perfil e reprocessando RAW.

## Pacote para enviar

`../Arauto-do-Sol-v0.3.0-Windows.zip` na pasta acima da raiz do jogo: **79.866 bytes**, 58 arquivos, aproximadamente 150 KiB extraídos. Extraia tudo e abra **Jogar Arauto do Sol.exe**. Funciona offline em Windows com navegador, sem instalação de Node.js ou Python. Não inclui RAW, intermediários, candidatos do piloto ou ferramentas. A v0.2.0 anterior foi preservada.

SHA-256: `6CFCCE317FE4891145B9E15C679D35EAD2B9A4F76935AFF3C6EC053A3FF5436D`.
