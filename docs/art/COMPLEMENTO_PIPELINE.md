# Revalidação do complemento de sprites

O complemento foi aplicado ao protagonista existente, sem gerar arte adicional nem modificar mapa, combate, física ou hitboxes. As artes de mundo produzidas por autorização separada foram preservadas.

## Perfil mantido

Arquivo: `tools/sprite_pipeline/profiles/protagonist.json`.

| Parâmetro | Valor |
|---|---|
| Teto por frame | 128×128 |
| Canvas da produção | 64×40 |
| Corpo em pé | aproximadamente 24 px |
| Envelope visual configurado | 48×24, distinto do canvas e das poses |
| Pivot / baseline | (32,36) / 36 |
| Margem mínima | 1 px |
| Conversão high-res | Lanczos |
| Métodos comparados | nearest, BOX e Lanczos |
| Paleta | `palettes/protagonist.json`, 16 entradas compartilhadas |
| Cores efetivas | união de 13 cores; máximo 12 por quadro |
| Alpha | limiar 128, saída 0/255 |
| Dithering | desativado |
| Fundo | alpha preservado; remoção por bordas para fonte opaca, tolerância 20 |
| Escala posterior | nearest, smoothing desativado |

Lanczos mantém melhor a continuidade da lâmina e os volumes pequenos. Nearest apresenta mais pixels isolados; BOX perde contraste em detalhes. A escolha permanece global para os 27 quadros. Calibração anatômica e recortes constam de `protagonist-build.json`; não se força toda pose à mesma altura.

## Piloto e integração

O registro histórico do gate de idle está em `docs/RELATORIO_ARTE_1.md`: comparação, integração e inspeção precederam as demais animações. Esta revisão não afirma refazer a ordem histórica de produção. Revalidou os três candidatos em resolução nativa na Câmara do despertar e o escolhido na Cripta, com flip e hitbox.

A página `tests/art-review.html` agora fixa a escala de revisão em 1× mesmo com o zoom de 1,25× solicitado para o jogo. A comparação usa os fundos atuais. A lupa permanece nearest e não substitui o canvas nativo.

Foi removido o contorno adicionado posteriormente pelo renderer, que usava uma cor fora da paleta e alpha parcial. O corpo exibido volta a corresponder exatamente aos PNGs processados. Não houve pintura manual dos arquivos. O zoom de câmera solicitado foi mantido, sem smoothing; em 1,25× a repetição dos pixels pode ser desigual por ser uma escala fracionária.

## Evidência

- 34 testes Python aprovados, incluindo dois novos testes permanentes: hashes dos RAW originais e reconstrução byte-idêntica dos 27 PNGs.
- Nove testes de animação do protagonista e quatro da integração visual aprovados.
- Percursos pareados concluídos: 17 salas, quatro fragmentos e cinco mortes, com resultado de gameplay idêntico.
- Revisão visual em navegador: comparação nativa, origem dos pés, flip e compatibilidade com collider 10×22.
- PNGs, RAW e perfil preservados; somente o renderer, a página de revisão, testes e documentação precisaram de ajuste.

Reproduzir: `python -m unittest discover -s tests/sprite_pipeline`, `node tests/sprites.test.mjs` e `node tests/world-art.test.mjs`. O teste de produção reprocessa os mesmos RAW e compara os bytes finais.

Persistem as limitações já documentadas: detalhes da referência de 96 px se perdem no corpo de 24 px, ciclos curtos e pequenas variações de contorno entre poses geradas. O protagonista permanece escuro sobre lápides; não se mascara isso com cores adicionais no renderer.
