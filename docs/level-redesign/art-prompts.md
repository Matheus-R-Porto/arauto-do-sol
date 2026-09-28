# Direção de geração e reprodução

Três gerações originais, preservadas como RAW em assets/raw/level-redesign. A geração visual não é determinística; o reprocessamento do mesmo RAW é. Os briefs abaixo registram a direção artística; hashes e parâmetros efetivos estão em art-build.json e profiles/level/.

- **sealed-gate.png:** portão monumental fechado, visto frontalmente ao fundo de jogo 2D lateral, arco gótico de pedra azul-acinzentada, ferro escuro, correntes douradas cruzadas, selo solar mágico azul-claro, desgaste funerário, iluminação contida, silhueta limpa, fundo transparente, objeto completo sem texto ou interface.
- **bone-pile.png:** sequência horizontal de três estados de uma mesma pilha de ossos para jogo 2D, intacta, parcialmente quebrada e reduzida; paleta marfim envelhecido e sombras marrons, caveiras e costelas legíveis; mesma escala/perspectiva, células separadas, transparência, sem texto. Fragmento de moeda derivado por recorte reproduzível desse RAW.
- **chest.png:** sequência horizontal de dois estados do mesmo baú medieval funerário, fechado e aberto, madeira escura, ferragens bronze envelhecido, pequena fechadura de caveira; vista compatível com cenário lateral, dimensões e iluminação consistentes, transparência, sem texto.

Reprocessar com o Python/Pillow configurado: `python tools/sprite_pipeline/build_level_props.py`. Validar: `python tools/sprite_pipeline/validate_world.py`. O wrapper somente configura o pipeline existente; RAW não é sobrescrito. Os sprites finais são incorporados no manifesto do mundo e desenhados pelo cenário das salas.
