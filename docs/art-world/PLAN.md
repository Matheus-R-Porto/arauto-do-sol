# Iteração de arte completa — escopo autorizado

Objetivo: substituir a apresentação procedural da demo inteira por arte raster processada, preservando gameplay, mapa, hitboxes, tempos e balanceamento. Protagonista v0.3.0 mantido; novos VFX integram seus ataques.

- [x] Fundos: exterior sob lua, cripta de raízes, ossuário/galerias e sepulcro.
- [x] Terreno: pedra, bordas de piso, plataformas atravessáveis e espinhos.
- [x] Acessos: arco, porta dourada, portão da corrente, grade de atalho, escada/passagem vertical; estados abertos/fechados.
- [x] Interações: chave, alavanca, repouso, fonte, fragmentos, segredo e saída final.
- [x] Cenário: túmulos, raízes, estátua, sino, ossos, vitral, urnas e mausoléu.
- [x] Walker, lunger e ranged: locomoção, preparação, ação, recuperação, dano e morte.
- [x] Guardião: apresentação/locomoção, três preparações/ataques, recuperação, dano e morte; fase 2 legível.
- [x] VFX: M1/M2, golpes inimigos, impacto, investida/queda do chefe, projétil e coleta/repouso.
- [x] HUD: caveiras, energia, fragmentos, símbolos de progressão e barra do chefe; composição da tela inicial/final.
- [x] Integração via renderer observador, carregamento previsível e erro visível.
- [x] Testes de assets, invariância da simulação, percursos, revisão nativa no navegador.
- [x] Pacote Windows v0.4.0 e documentação.

Direção: gótico funerário, osso marfim, pedra azul/cinza fria, tecidos gastos, ouro velho e acentos brasa. Sinais: ouro para chave/porta, ciano para corrente/alavanca, cobre para atalhos, verde claro para repouso. Fundo menos contrastado que personagens e terreno. Textos continuam texto para legibilidade.

Pipeline: RAW imutáveis, perfis/paletas por categoria, Lanczos inicial selecionado no piloto; após base pixel, somente nearest. Animações/props com frames até128×128. Fundos amplos processados numa base480×270 e exportados em12 painéis120×90 com margem transparente, mantendo o teto por PNG. Conjuntos gerados pequenos e recortes registrados, sem sheet gigante no runtime.
