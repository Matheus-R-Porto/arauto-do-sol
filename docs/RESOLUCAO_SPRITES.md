# Correção de resolução — v0.5.1

As medidas de 24/18/32/65 usadas anteriormente são unidades do mundo, não a resolução aprovada para os arquivos. A correção segue a confirmação do usuário: melhorar os sprites sem aumentar personagens em relação ao mapa. O zoom continua 1,25 e as colisões, física, AI e tempos de combate permanecem iguais.

| Asset | Canvas | Altura anatômica de referência no arquivo | Bounds medidos no idle, incluindo arma/roupa | Escala arquivo → mundo |
|---|---|---|---|---|
| Protagonista | 128×128 | 96 | 43–47×95 | 24/96 |
| Walker | 128×128 | 88 | 76×86–87 | 24/88 |
| Ranged | 128×128 | 88 | 54–58×86 | 32/88 |
| Lunger | 64×64 | 27 | 46–48×27 | 18/27 |
| Guardião | 256×256 | 144 | 87–89×141–142 | 65/144 |

Bounds incluem a silhueta completa; não são uma medida isolada da largura do tronco. A espada levantada/estendida do Guardião ultrapassa a largura do corpo em repouso, mas cabe no canvas de 256×256. Poses abaixadas e morte conservam a escala anatômica, sem serem esticadas para atingir a altura de idle. Walker/Ranged usam referência 88 para que as poses de morte também caibam no canvas; o Lunger mantém todas as poses dentro de 64×48.

Os 140 frames de personagens foram reprocessados diretamente dos RAW preservados. Não houve ampliação das versões pequenas. Lanczos na conversão inicial, paletas fixas existentes (16 cores máximas para o protagonista), alpha binário, sem dithering. Escalas posteriores usam nearest-neighbor. O ajuste de margem exporta o pivot de cada frame: ele muda somente a posição no canvas transparente, mantendo a âncora anatômica no mundo. Nenhuma pose recebe uma escala individual para caber.

A superfície de desenho passou de 480×270 para 1920×1080, mantendo as coordenadas lógicas de 480×270 e o mesmo tamanho CSS. Isso evita descartar os novos detalhes num buffer de baixa resolução antes da ampliação. Cenários e efeitos mantêm seus arquivos. Em janelas menores, a tela naturalmente exibe menos pixels do que em uma janela ampla.

Perfis: `tools/sprite_pipeline/profiles/protagonist.json` e `{walker,ranged,lunger,boss}-animation.json`. A ferramenta 1.1.0 respeita o limite de canvas de cada perfil, incluindo o novo limite de 256 para o Guardião.

Reprodução: executar `python tools/sprite_pipeline/build_protagonist.py` e depois `python tools/sprite_pipeline/build_animations.py`. A primeira chamada também reaplica as animações expandidas do protagonista. Os relatórios de cada frame registram escala, anchor, pivot, paleta e hashes. Pranchas em resolução nativa: `docs/animations-v2/*-native.png`.

Validação: testes de gameplay/apresentação; reprodução byte a byte; dimensões mínimas no idle, canvas de todos os frames, limites do Lunger, paletas, alpha, margens, pivots e escala de mundo. Validador de mundo confere 210 sprites e os 48 painéis inalterados. Playtest no navegador concluído em 355,7 segundos simulados: 17/17 salas, cinco mortes deliberadas, Guardião derrotado e fim da demo. Todos os nove estados do protagonista observados. Console sem erros/avisos. Desenho médio observado: 0,64 ms, pico de 10,10 ms neste computador; isso não é uma garantia de desempenho em outras máquinas.

O relatório anterior de animações permanece como histórico da expansão; esta nota substitui suas dimensões de sprites e de renderização.
