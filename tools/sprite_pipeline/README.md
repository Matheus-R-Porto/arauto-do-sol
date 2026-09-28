# Pipeline de sprites

Ferramenta offline de desenvolvimento, Python 3.12 + Pillow 12.3.0. O jogo e o EXE não precisam de Python. Instale a dependência num ambiente de desenvolvimento com `python -m pip install -r tools/sprite_pipeline/requirements.txt`. Execute os exemplos na raiz do jogo.

## Comandos

```sh
# Inspecionar um PNG sem modificá-lo
python tools/sprite_pipeline/pipeline.py assets/raw/protagonist/reference.png --info

# Reproduzir os 27 frames a partir dos oito RAW e layouts já medidos
python tools/sprite_pipeline/build_protagonist.py

# Processar só o conjunto idle, com a calibração aprovada
python tools/sprite_pipeline/pipeline.py assets/work/protagonist/idle assets/sprites/protagonist/idle --profile tools/sprite_pipeline/profiles/protagonist.json --anchors assets/work/protagonist/idle/anchors.json

# Repetir a comparação do piloto, sem tocar nos sprites usados pelo jogo
python tools/sprite_pipeline/pipeline.py assets/work/protagonist/idle assets/work/comparacao --profile tools/sprite_pipeline/profiles/protagonist.json --anchors assets/work/protagonist/idle/anchors.json --compare nearest box lanczos --preview docs/art/comparacao.png --preview-scale 1

# Entrada individual; usa o pivot original da primeira célula do idle
python tools/sprite_pipeline/pipeline.py assets/work/protagonist/idle/idle-0.png assets/work/idle-final.png --profile tools/sprite_pipeline/profiles/protagonist.json --anchors assets/work/protagonist/idle/anchors.json

# Testes da ferramenta e dos assets reais
python -m unittest discover -s tests/sprite_pipeline -v
```

`--preview-scale 1` mantém pixels nativos; `6` amplia por nearest. O preview mostra transparência sobre quadriculado, fundo claro, fundo escuro e vermelho. Preview não é sprite final. `--downsample box` troca somente o filtro inicial; as opções são nearest, box, bicubic e lanczos. `--help` lista a CLI. A exportação não exige conexão nem uma nova geração.

## Perfis e calibração

`profiles/protagonist.json` é o único perfil de arte entregue. Os parâmetros ficam fora do código:

| Campo | Função |
|---|---|
| `max_frame` | Limite final, inclusive após `pixel_scale`; até 128×128 |
| `canvas` / `pivot` | Área transparente e origem comum dentro dela; opcionais para recorte automático genérico |
| `visible_size` | Limite usado no ajuste automático quando não há calibração anatômica |
| `scale_reference` | Razão `target_pixels/source_pixels`, uniforme no batch; impede que espadas ou poses curvadas determinem o tamanho do corpo |
| `source_pivot` / `--anchors` | Origem no RAW: um ponto comum ou pontos específicos por nome de arquivo |
| `source_kind` | `high_res` permite escolher redução; `pixel_art` força nearest |
| `downsample_method` | Filtro da primeira redução, antes da paleta final |
| `pixel_scale` | Ampliação inteira posterior, sempre nearest; 1 no protagonista |
| `max_colors` / `palette` | Limite por perfil e arquivo de paleta, relativo ao perfil |
| `require_fixed_palette` | Exige paleta compartilhada; true no protagonista |
| `alpha_threshold` / `dither` | Alpha binário e dithering; 128 / false nesta entrega |
| `margin` | Margem transparente mínima de um pixel na base |
| `background` | Modo, cor opcional e tolerância da remoção por bordas |

A ferramenta não impõe 16 cores globalmente: um perfil com limite 32 é testado. Para o protagonista, a paleta mestre é obrigatória e tem 16 entradas RGB. Um quadro pode usar menos cores. Transparência não conta. Perfis genéricos sem paleta fixa podem quantizar a própria imagem; essa opção não é usada pelo protagonista.

Sem calibração, o batch calcula uma única escala que cabe no maior conteúdo do conjunto. Para reprocessar animações em chamadas separadas, mantenha a calibração explícita: usar ajuste automático em cada animação poderia mudar o tamanho do personagem. Com calibração, `visible_size` não redimensiona a pose; margem/canvas/limite final continuam sendo validados e uma pose que não caiba falha claramente.

O perfil fornece altura-alvo 24, canvas 64×40 e pivot 32,36. `protagonist-build.json` registra a altura anatômica de referência de cada geração e os recortes/pivots originais. Poses aéreas usam a projeção dos pés da postura em pé, para que recolher joelhos não puxe o crânio para baixo. Poses de morte conservam o tamanho dos ossos ao se deitarem. Diferenças anatômicas residuais de geração são descritas no relatório de arte.

## Ordem exata

1. Abrir PNG e calcular SHA-256; nunca gravar no RAW.
2. Para pequenos conjuntos gerados, `split_strip.py RAW layout.json pasta-work` separa as células medidas. Rejeita recortes que cortam pixels visíveis; não desenha nem retoca pixels. A lâmina do primeiro M1 ultrapassou a grade imaginária da geração, então seu recorte foi corrigido no layout, sem editar o PNG original.
3. Se existir alpha abaixo de 255, preservá-lo. Para imagem opaca, estimar o fundo pelos cantos (consenso de três) ou usar a cor do perfil; flood fill apenas nos pixels semelhantes conectados às bordas, com distância RGB máxima por canal. Regiões internas isoladas são preservadas. Fundo ambíguo gera erro.
4. Localizar bbox visível pelo limiar de alpha; remover sobra transparente, mantendo o ponto de origem no sistema original.
5. Reduzir proporcionalmente pela escala compartilhada, arredondando para pixels inteiros. O piloto escolheu Lanczos após comparação com nearest e BOX.
6. Binarizar alpha; mapear as cores para a paleta mestre sem dithering; zerar RGB dos pixels transparentes.
7. Colocar no canvas comum pelo pivot. Não esticar, cortar ou centralizar automaticamente pela espada.
8. Qualquer escala posterior usa nearest. Validar RGBA, transparência, alpha binário, paleta, margem e tamanho. Validar todos os frames do batch antes de gravar qualquer PNG final.
9. Gravar PNGs e relatório JSON com hashes, bbox, origem, escala, método, baseline, pivot e versões. Arquivos individuais usam substituição atômica. A produção gera manifesto relativo para o jogo e folhas de revisão somente em `docs/art/`.

A ferramenta bloqueia saída sobre RAW, perfil, paleta e anchors, inclusive hardlinks. Batch não pode exportar dentro da pasta de entrada. Preview não pode sobrescrever RAW, configuração, sprite final ou relatório. Use destinos separados para testes. Preserve os RAW originais e a versão fixada do Pillow para reproduzir os mesmos bytes.

## Diretórios

- `assets/raw/protagonist/`: referência, oito gerações intactas, prompts exatos.
- `assets/work/`: recortes intermediários reproduzíveis, ignorados pelo Git.
- `assets/sprites/protagonist/`: 27 PNGs finais, manifesto e relatórios por conjunto.
- `assets/sprites/pilot/`: candidatos processados do piloto, somente para a página de revisão; não vão no ZIP.
- `tools/sprite_pipeline/palettes/protagonist.json`: paleta compartilhada.
- `docs/art/`: comparação, folhas nativa/6×, relatórios, hashes e registros de testes.

Não há editor, serviço de arte no runtime nem atlas universal. A demo carrega os 27 PNGs pequenos diretamente; não depende de cortar a folha gerada pela IA durante o jogo.
