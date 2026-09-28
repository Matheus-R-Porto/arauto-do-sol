# Retrabalho visual do cenário — v0.5.3

## 1. Assets auditados

Auditoria das 17 salas concluída antes da substituição dos PNGs. Prioridades: árvore, estátua, sino, mausoléu e vitrais; depois portas, terreno, urnas, túmulos, objetos interativos e fundos. O diagnóstico inicial está em [AUDITORIA.md](scenery/AUDITORIA.md). As instâncias, coordenadas, camadas, pivots, bounds e relação com tiles estão em [positions-before.json](scenery/positions-before.json) e [positions-after.json](scenery/positions-after.json).

## 2. Assets retrabalhados

24 assets e quatro fundos reprocessados. Todos reutilizam RAW original imutável. A versão anterior permanece em `assets/sprites/world/frames` / `backgrounds`; a nova está em `assets/sprites/world/scenery/<família>`. O manifesto ativo aponta para a nova versão. [Comparação completa por arquivo](scenery/production.json).

| Asset | Salas / uso | RAW reutilizado |
|---|---|---|
| `statue` | Pátio da estátua | `landmarks.png` |
| `mausoleum` | Câmara do despertar; Repouso do guardião; Sepulcro do guardião | `landmarks.png` |
| `window` | Ponte do contrapeso; Cripta das raízes; Capela sem teto; Galeria das sentinelas; Repouso do guardião | `landmarks.png` |
| `bones` | Ponte do contrapeso; Grande ossuário | `landmarks.png` |
| `bell` | Poço dos sinos | `relics.png` |
| `dead-tree` | Passagem das lápides; Cripta das raízes; Alameda sob as raízes; Além do sepulcro | `relics.png` |
| `urns` | Todas as salas | `relics.png` |
| `gravestones` | Todas as salas | `relics.png` |
| `arch` | Câmara do despertar; Passagem das lápides; Pátio da estátua; Vigília da corrente; Poço dos sinos; Ponte do contrapeso; Cripta das raízes; Capela sem teto; Grande ossuário; Escadaria das urnas; Galeria das sentinelas; Jardim das cinzas; Repouso do guardião; Escada do retorno; Alameda sob as raízes; Além do sepulcro | `doors.png` |
| `sun-door` | Pátio da estátua; Vigília da corrente | `doors.png` |
| `chain-gate` | Vigília da corrente; Ponte do contrapeso; Grande ossuário; Escada do retorno | `doors.png` |
| `shortcut-gate` | Cripta das raízes; Grande ossuário; Escadaria das urnas; Galeria das sentinelas; Alameda sob as raízes; Sepulcro do guardião | `doors.png` |
| `stone-a` | Terreno de colisão correspondente, sem mudança na matriz | `terrain.png` |
| `ledge` | Terreno de colisão correspondente, sem mudança na matriz | `terrain.png` |
| `spikes` | Terreno de colisão correspondente, sem mudança na matriz | `terrain.png` |
| `stone-b` | Terreno de colisão correspondente, sem mudança na matriz | `terrain.png` |
| `shrine` | Pátio da estátua; Grande ossuário; Repouso do guardião | `interactions.png` |
| `fountain` | Jardim das cinzas | `interactions.png` |
| `lever` | Ponte do contrapeso | `interactions.png` |
| `sun-key` | Cripta das raízes | `interactions.png` |
| `fragment` | Pátio da estátua; Cripta das raízes; Jardim das cinzas | `secrets.png` |
| `secret-stone` | Capela sem teto | `secrets.png` |
| `end-arch` | Além do sepulcro | `secrets.png` |
| `ladder` | Pátio da estátua; Vigília da corrente; Poço dos sinos; Ponte do contrapeso; Cripta das raízes; Grande ossuário; Escadaria das urnas; Galeria das sentinelas; Jardim das cinzas; Repouso do guardião; Escada do retorno; Alameda sob as raízes | `secrets.png` |

Fundos `crypt`, `exterior`, `ossuary` e `arena`: RAWs homônimos, conservando a seleção de tema existente por sala.

## 3. Resolução

Props: canvas 128×128 → 512×512; terreno: 128×64 → 512×256. Escala de apresentação 0,25 mantém a presença no mundo. Isso corresponde à superfície de desenho atual de 1920×1080 sobre coordenadas lógicas 480×270, sem mudar o zoom 1,25. Os pixels vieram do RAW; não são ampliação do PNG antigo. Fundos: 480×270 → 960×540, preservando área lógica 480×270, em 12 painéis de 244×184 por fundo (240×180 úteis, margem 2).

| Asset | Bounds úteis anteriores (px) | Bounds úteis novos (px) | Tamanho novo no mundo |
|---|---:|---:|---:|
| `statue` | 47×115 | 189×464 | 47.25×116 |
| `mausoleum` | 86×112 | 344×448 | 86×112 |
| `window` | 48×108 | 190×432 | 47.5×108 |
| `bones` | 99×58 | 398×232 | 99.5×58 |
| `bell` | 60×99 | 240×395 | 60×98.75 |
| `dead-tree` | 108×117 | 435×472 | 108.75×118 |
| `urns` | 66×61 | 264×245 | 66×61.25 |
| `gravestones` | 60×47 | 240×187 | 60×46.75 |
| `arch` | 38×38 | 152×153 | 38×38.25 |
| `sun-door` | 38×38 | 152×153 | 38×38.25 |
| `chain-gate` | 38×38 | 152×151 | 38×37.75 |
| `shortcut-gate` | 38×38 | 152×151 | 38×37.75 |
| `stone-a` | 32×32 | 128×128 | 32×32 |
| `ledge` | 60×12 | 239×48 | 59.75×12 |
| `spikes` | 32×14 | 128×63 | 32×15.75 |
| `stone-b` | 32×32 | 128×128 | 32×32 |
| `shrine` | 33×42 | 133×168 | 33.25×42 |
| `fountain` | 27×42 | 110×168 | 27.5×42 |
| `lever` | 28×15 | 112×61 | 28×15.25 |
| `sun-key` | 10×17 | 40×73 | 10×18.25 |
| `fragment` | 9×9 | 36×38 | 9×9.5 |
| `secret-stone` | 24×32 | 96×127 | 24×31.75 |
| `end-arch` | 52×53 | 208×211 | 52×52.75 |
| `ladder` | 14×36 | 56×143 | 14×35.75 |

As pequenas diferenças subpixel dos bounds decorrem da amostragem e alpha; cada borda permanece a até 1,5 unidade da referência. Os tiles mantêm o tamanho de repetição anterior explicitamente, inclusive recortes parciais.

## 4. Posição

Todas as coordenadas de instâncias, orientação, camada e opacidade foram preservadas e comparadas automaticamente nas 17 salas. Nenhuma porta, chave, alavanca, fonte, checkpoint ou saída foi movida. A única compensação visual é a árvore descrita abaixo.

## 5. Pivot / origin

Pivots dos props: (64,124) → (256,496); terreno: (64,60) → (256,240). Divididos pela densidade 4, equivalem exatamente aos pivots antigos. Âncoras de recorte e escala foram recuperadas do manifesto congelado. Não há compensações por sala no renderer.

## 6. Alinhamento com solo

Árvore morta (`dead-tree`): antes, bounds [11,7,119,124] e pivot [64,124]. As raízes laterais alcançavam a baseline, mas a faixa central deixava cerca de 2 unidades de vão. Corrigido com `worldOffset: [0,2]` em metadata, mantendo a coordenada da instância. A camada de terreno cobre as pontas inferiores, assentando as raízes. Verificada na Passagem, Cripta, Alameda e Além do sepulcro. Demais bases mantidas; sino pendurado e vitrais/vistas elevadas são decoração existente, não props apoiados no chão.

## 7. Colisões

**NENHUMA alteração.** Tiles sólidos, plataformas atravessáveis, hazards, triggers, limites da arena e hitboxes permanecem iguais. A arte não gera colisões.

## 8. Geometria / level design

**NENHUMA alteração.** Mesmas 17 salas, caminhos, alturas, conexões, atalhos, encontros, câmera, parallax e progressão. Protagonista, Walker, Ranged, Lunger e boss não foram reprocessados nem recalibrados. Seus assets, animações e perfis existentes foram preservados.

## 9. Pipeline

Extensão incremental do builder existente `tools/sprite_pipeline/build_world.py --scenery`; continua usando `export_frame` → `process` → validação do pipeline existente. Configuração em `scenery-build.json` e perfis `scenery-props`, `scenery-terrain`, `scenery-background`. RAW → Lanczos → paleta fixa → alpha binário → canvas/pivot → PNG. Paletas anteriores de cenário mantidas: 32 cores para props/terreno, 64 para fundos; alpha threshold 128; sem dithering. Escalas após conversão permanecem sem smoothing / nearest-neighbor. Perfis específicos de personagens não foram alterados.

Grupos integrados e inspecionados sucessivamente: landmarks/relics; doors/terrain; interactions/secrets; backgrounds. A repetição do processamento dos mesmos RAWs e perfis resultou em SHA-256 idêntico de todos os PNGs finais e manifesto.

## 10. Assets regenerados

**Nenhum.** Os dez RAWs existentes eram adequados. Nenhuma chamada de geração nem edição destrutiva do original foi necessária.

## 11. Playtest

Percurso automatizado por comandos de gameplay reais, sem teleporte ou alteração de colisões, usando o mesmo RoomManager, renderer e animações da demo; inspeção visual das capturas pelo agente. Executado antes, durante a integração por grupos e após os fundos finais. Na execução final: 17/17 salas, 4/4 fragmentos, cinco mortes exercitadas, boss derrotado e fase `finished`, aos 355,7 segundos de simulação. Hitboxes de personagens/ataques ativadas na revisão final. O percurso não representa uma estimativa de duração de um jogador humano.

| Sala revisada | Foco da revisão final |
|---|---|
| Câmara do despertar | Arquitetura, plataforma sólida e porta |
| Passagem das lápides | Raízes no solo e legibilidade durante combate |
| Pátio da estátua | Estátua, checkpoint e plataformas em frente |
| Vigília da corrente | Plataformas, terreno e encontros |
| Poço dos sinos | Sino suspenso, portais e ledges |
| Ponte do contrapeso | Alavanca, hazard e vista distante |
| Cripta das raízes | Árvore, vitral e sobreposição de inimigos |
| Capela sem teto | Porta secreta e vitral |
| Grande ossuário | Fundo ósseo e subida vertical |
| Escadaria das urnas | Urnas e contraste do piso |
| Galeria das sentinelas | Vitrais e inimigos |
| Jardim das cinzas | Fontes e leitura dos objetos |
| Repouso do guardião | Repouso, mausoléu e transição |
| Escada do retorno | Passagens e retorno vertical |
| Alameda sob as raízes | Raízes repetidas e circulação |
| Sepulcro do guardião | Boss, ataques e cenário da arena |
| Além do sepulcro | Árvore sobre plataforma e acesso ao encerramento |

Fundos mantêm atmosfera escura e ficam atrás de superfícies claras; detalhes não cobrem atores. Não foram observadas novas emendas de painéis, halos, clipping de landmarks ou passagens visualmente bloqueadas nas capturas revisadas. O sino e as vistas elevadas mantêm as sobreposições previstas na composição original.

## 12. Problemas restantes

A repetição de túmulos/urnas e as vistas decorativas elevadas (por exemplo, ossos sobrepostos ao vitral na Ponte) continuam reconhecíveis como composição do protótipo. Foram preservadas para não reorganizar as salas. Nenhum RAW temporário substituiu arte final. HUD e VFX mantêm sua resolução anterior, pois não integram o escopo de cenário. A auditoria não é uma garantia de ausência de todo problema visual em qualquer resolução de janela.

## 13. Testes

- `npm test`: todas as 14 suítes passaram, incluindo os cinco testes novos de cenário e seis de alinhamento M1/M2. [Log](scenery/tests-node.txt).
- Pipeline genérico: 29 testes passaram. [Log](scenery/tests-pipeline.txt).
- Cenário: três testes Python passaram (paleta exata, validação e rebuild determinístico), sem reprocessar personagens. [Log](scenery/tests-scenery.txt).
- `validate_world.py`: 210 sprites e 48 painéis válidos; PNG, alpha, paleta, margem, bounds, hashes e reconstrução sem emendas.
- Pipeline 1.1.1: mantém cores exatas quando a entrada já é pixel art pertencente à paleta mestre, evitando a requantização aproximada de painéis. A comparação das emendas verifica explicitamente os canais RGB, além da validação de alpha.
- Verificações congeladas de RAWs, personagens, física, regras, mapas e câmera passaram. Comparação de draw calls confirmou os mesmos retângulos de mundo para repetição e recorte de tiles.
- Os testes de produção que recriam personagens deliberadamente não foram executados: a tarefa proíbe reprocessá-los. A validação dos arquivos existentes e os testes de animação/runtime foram executados.
- Pacote portátil v0.5.3 verificado: 327 arquivos, incluindo 292 PNGs; conteúdo igual ao projeto testado. O executável serviu os 325 arquivos de runtime no autoteste, sem Node.js. [Verificação do ZIP](scenery/release-check.json) · [Teste do iniciador](scenery/launcher.txt).
