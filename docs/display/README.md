# Exibição Full HD — v0.5.7

O jogo agora desenha primeiro em um canvas interno de 960×540 e o apresenta em outro canvas. Em tela cheia 1920×1080, a apresentação é uma ampliação exata de 2×, com `imageSmoothingEnabled = false` nos dois contextos. O CSS usa `image-rendering: pixelated` e não aplica borda ao canvas.

As coordenadas existentes de layout permanecem 480×270. O zoom de câmera continua 1,5, separado da resolução raster; a área de mundo vista é 320×180 unidades nas três bases. HUD, física, tamanhos de sprites, mapa, colisões e câmera não foram recalibrados. A resolução de saída nunca entra na simulação.

## Comparação solicitada

As três opções foram desenhadas simultaneamente sobre o mesmo estado de gameplay e apresentadas em 1920×1080 na página `tests/display-review.html`.

| Base interna | Ampliação Full HD | Legibilidade | Estabilidade / distância |
|---|---|---|---|
| 480×270 | 4× | Caveiras, medalhão, ornamentos e texto perdem mais detalhe; blocos maiores. | Mesmo enquadramento. Zoom 1,5 produz passos fracionários no raster, com maior variação de contornos em movimento. |
| 640×360 | 3× | Melhora intermediária; formas do HUD mais reconhecíveis. | Mesmo enquadramento. Mundo recebe escala raster 2× incluindo zoom; HUD ainda usa transformação 4/3. |
| **960×540** | **2×** | Melhor leitura dos três para os sprites e HUD já aprovados. | Mesmo enquadramento. Layout raster 2× e mundo 3×; melhor regularidade de amostragem entre estas opções. Escolhida. |

Não foi necessário aumentar o zoom além dos 50% já aprovados. A comparação não usa a resolução maior para mostrar mais mapa. Nearest-neighbor mantém pixels discretos; não há promessa de eliminar todo aliasing de sprites cujo fator de amostragem é fracionário.

## Uso e encaixe

Botão **Tela cheia · F**, ou tecla **F**; **F** novamente / **Esc** para sair. Fullscreen é solicitado por interação do usuário, sem iniciar automaticamente. Em navegadores sem a API, o botão informa indisponibilidade; uma rejeição mostra mensagem e não impede o jogo em janela.

Em Full HD usa toda a tela. Em 2560×1080, mantém 1920×1080 com barras laterais; em 1920×1200, barras horizontais. A apresentação ocupa o maior retângulo 16:9 que cabe na área disponível, sem restringir a escala a números inteiros. A resolução física de saída considera devicePixelRatio: em Windows a 125%, 1536×864 pixels CSS ocupam 1920×1080 pixels físicos. Escalas fracionárias permanecem sem smoothing, embora possam apresentar pixels com larguras diferentes. Em janelas menores pode haver perda de detalhe. O HUD mantém coordenadas e proporções dentro da imagem do jogo. O resize não troca a câmera nem reinicia a partida.

## Verificação

- Comparação visual das três bases em cena idêntica do Pátio, incluindo HUD, arquitetura e plataformas.
- Travessia no navegador desenhando as três bases: 17/17 salas, 4/4 fragmentos, cinco mortes exercitadas, boss e final alcançados em 355,7s de simulação.
- Botão de fullscreen acionado na demo real; canvas de saída 1920×1080 observado. O navegador integrado pode sair do fullscreen ao alternar o foco entre inspeções.
- Testes de ampliação, proporção, redimensionamento, entrada/saída, tecla F, rejeição da API e navegador sem suporte passaram.
- Comparação com `main-before.js` comprova que todo o trecho de inicialização/update/render de gameplay ficou igual, exceto a apresentação final da imagem. `view-before.js` protege o layout, HUD e zoom; somente rótulo de versão pode mudar.
- Suíte existente preservada. As verificações históricas do hash de `main.js` usam o snapshot anterior, enquanto o novo teste compara explicitamente o código de gameplay atual com esse snapshot. Os demais hashes congelados continuam sendo conferidos nos arquivos atuais.

Log: `tests.txt`. Pacote: `release-check.json`.

## Correção v0.5.7

Removido o arredondamento da ampliação para números inteiros que causava grandes bordas em Windows a 125%. Testes cobrem 100%, 125%, 150% e 200%, além de 1366×768 e formatos diferentes de 16:9. Inspeção no navegador confirmou imagem preenchendo 1536×864 CSS, com saída física 1920×1080. Mantidos buffer 960×540, zoom 1,5 e todo o gameplay.
