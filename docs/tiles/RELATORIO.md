# Variação de alvenaria — 24/09/2026

1. **Tile original.** As pedras continham pequenos motivos ornamentais repetidos, contrastavam com o fundo e denunciavam a parede da cela. O piso repetia essa ornamentação.

2. **Três variantes novas.** A: pedras largas com quinas lascadas. B: juntas diferentes, pedras fraturadas e fissuras. C: pedras de comprimentos diferentes com manchas de umidade. São três fontes geradas separadamente com a ferramenta imagegen, não cópias espelhadas. Fontes imutáveis em `assets/raw/world/tiles/{a,b,c}.png`; prompts em `assets/raw/world/tiles/prompts.json`. Prévia em `variants.png`. PNGs finais em `assets/sprites/world/tiles/stone-{a,b,c}.png`.

3. **Distribuição.** Hash inteiro da sala e das coordenadas da célula visual de 32×32 unidades, com semente 1977, seleciona A/B/C. Paredes, chão, plataformas, coberturas, suportes e batentes amostram o mesmo material na mesma posição. A grade de colisão de 8 unidades não fragmenta a escolha da variante. Não há ciclo ABC, alternância por linha nem tabuleiro.

4. **Determinismo.** Nenhuma seleção depende de câmera, tempo ou aleatoriedade global. Recortes parciais usam as mesmas coordenadas de textura. O teste compara desenho de uma área inteira com a mesma área dividida em 36 partes, inclusive em coordenadas negativas. Reprocessar as fontes gerou os mesmos hashes. As bordas opostas são iguais entre todas as nove combinações de variantes.

5. **Parede quebrável.** A face intacta e danificada usa agora a própria alvenaria por posição, sem o pilar ornamental contrastante. Uma pequena fissura indica fragilidade e cresce com dano. A cobertura opaca, revelação permanente, colisão original e entulho continuam funcionando. Os quatro sprites de parede/entulho também foram reprocessados pela paleta nova, preservando fontes, posições e dimensões.

6. **Chão.** Paleta compartilhada de 32 cores frias e escuras, juntas profundas e desgaste substituem o padrão decorativo. Bordas superiores existentes continuam legíveis. Não foi aplicada apenas uma camada de escurecimento. Fundos, personagens, HUD e iluminação anterior foram preservados.

7. **QA visual.** Inspeção no navegador da cela intacta e após a quebra; galerias 2 e 9; pátio 3; poço 4; travessia 5; repouso 6; arena 7; portão 8; limiar/chefe 10 e saída pós-chefe. Revisados chão, degraus, plataformas, grandes massas de parede, contraste com personagens e junções. A textura continua sendo alvenaria modular: alguma recorrência natural de pedras permanece, mas os emblemas repetidos foram eliminados. A prévia foi inspecionada em pixels nativos e o material na câmera real do jogo.

8. **Resultado funcional.** Suíte existente aprovada; novo teste de tiles aprovado; validador dos 222 sprites aprovado. Travessia automatizada por controles de jogo no navegador concluída: 260,3 segundos simulados, uma morte, 10/10 salas, tela de fim. A inspeção individual de salas foi separada dessa travessia. Hashes confirmam que esta tarefa não modificou mundo, entidades, sistemas, física nem configurações de escala/zoom.

## Reprodução

`python tools/sprite_pipeline/build_tiles.py` exporta apenas os três tiles.
`python tools/sprite_pipeline/validate_tiles.py` reprocessa e verifica estabilidade e junções.
`python tools/sprite_pipeline/validate_world.py` verifica paletas, alpha, margens e fontes.
`node tests/tiles.test.mjs` verifica seleção, recortes parciais e preservação do jogo.
`npm test` executa a suíte completa, incluindo o teste novo.

Perfil: `tools/sprite_pipeline/profiles/aged-masonry.json`. Recortes explícitos por fonte; redução Lanczos para 128×128; transição determinística de 8 pixels para bordas compartilhadas antes da quantização; paleta mestre `aged-stone.json`; sem dithering; alpha binário; canvas 512×256 e pivot 256,240 mantidos; bounds 192,112–320,240; worldScale 0,25. O quadrado visível continua ocupando 32×32 unidades. A fonte B contém dois painéis; o recorte documentado utiliza apenas o esquerdo, sem a faixa branca separadora. Após conversão, a renderização permanece sem smoothing.
