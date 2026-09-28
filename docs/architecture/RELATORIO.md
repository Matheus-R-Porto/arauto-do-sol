# AUDITORIA DE COERÊNCIA ARQUITETÔNICA

Correção integrada em 24/09/2026. Reutiliza as texturas e sprites processados existentes; não houve geração nem alteração de RAW, escalas, câmera, animações ou combate.

## 1. Cela inicial

Reproduzida a imagem do pedido: bone pile e interior secreto visíveis; pilar sem ligação com o teto, com fundo distante dominando a cela. Agora a cela possui alvenaria posterior escura, nervuras e arco em relevo, sob o teto existente. A parede frontal encontra a cobertura superior.

**Correção localizada de colisão:** dez tiles de 8×8 na coluna 23, linhas 15–24, completam o lintel fixo. Antes, a parede quebrável começava em y=168, abaixo do teto em y=120, e após quebrar não havia colisão no topo que continuava desenhado. A faixa fixa vai de y=120 a y=200; a passagem inferior de 32 unidades continua livre após a quebra. Essa é a única mudança da geometria. Comparação tile a tile com `cemetery-before.js` garante que as demais células e todos os metadados do mapa permanecem iguais.

## 2. Segredo da Sala 1

Método: cobertura arquitetônica frontal opaca, texturizada com a mesma alvenaria. Ela é desenhada depois do mundo, atores, objetos e luzes locais, antes de HUD/debug. Usa preenchimento opaco sob a textura, portanto nem pixels transparentes da textura revelam o conteúdo. Não é redução de brilho.

- Intact: toda a câmara à esquerda fica coberta; os ossos, piso interno e fundo não aparecem.
- Damaged: a cobertura permanece completamente opaca; rachadura e partículas junto à face da parede respondem ao golpe.
- Breaking: a flag da quebra remove a cobertura no mesmo evento que abre a passagem; a animação e fragmentos continuam.
- Broken: interior, passagem e entulho ficam visíveis. Saída e retorno preservam a revelação e o rubble, sem repetir a simulação dos fragmentos.

Inspeção no navegador confirmou o bone pile oculto antes da quebra, revelação após dois golpes e persistência ao voltar. O interior revelado também recebe parede posterior, evitando a aparência de câmara aberta para uma paisagem distante.

## 3. Outras paredes quebráveis

Revisadas: `upperSecretWall` (Sala 3), `upperChamber` e `leverChamber` (Sala 4), `lowerShortcut` (Salas 4/5), `returnShortcut` (Salas 3/10), além de `cellWall`.

Câmaras internas das Salas 3 e 4 agora usam coberturas condicionais próprias. Sala 4: ossos e alavanca ficam ocultos até a quebra, com inspeção dos golpes e da revelação no navegador. Sala 3: condição da alavanca preservada, estados de dano/revelação inspecionados com controles de QA que chamam o evento existente. As câmaras reveladas têm alvenaria posterior.

## 4. Shortcuts

Atalhos 4↔5 e 3↔10 mantêm os lados permitidos de quebra. As salas do outro lado já são carregadas separadamente e não são desenhadas antes da travessia. Corrigidos vãos visuais entre o topo dos pilares e a primeira estrutura acima: o remanescente agora se conecta à alvenaria. Nenhuma nova sala foi escondida por deslocamento ou zoom.

Travessia manual do atalho 10→3 após quebra confirmou chegada e remanescente quebrado no outro lado. Testes cobrem bloqueio pelo lado inválido e persistência compartilhada dos dois lados.

A região posterior à porta final também fica sob cobertura opaca até a flag `finalDoor`; a arena, a chave e o ponto de interação continuam visíveis. A abertura e o acesso pós-boss foram exercitados no percurso completo.

## 5. Tetos e paredes

Corrigidos: encontro parede/teto da cela; grandes vazamentos visuais das câmaras secretas; vãos acima de pilares dos atalhos. A cela e câmaras laterais receberam fundo de pedra para leitura de recinto fechado. Os limites de colisão das outras salas já formam coberturas e pisos contínuos; não foram alterados. Pátios e vistas distantes mantêm sua composição aberta, sem cobrir plataformas ou combate.

## 6. Props

Ossos da cela e da torre, alavanca, baú inferior, repousos, urnas e portão selado foram inspecionados. Os objetos principais continuam apoiados no solo. Nesta passagem não apareceu um novo erro de offset que exigisse deslocá-los. O problema encontrado era a exposição através da parede, corrigida pela camada frontal.

## 7. Plataformas

Revisados os suportes das Salas 2, 3, 4, 5, 6, 7 e 9 e as plataformas pós-boss. Os suportes existentes permanecem atrás do gameplay e chegam à estrutura abaixo. Não foi necessário deslocar plataformas nem acrescentar colisores decorativos. Espinhos e inimigos continuam visíveis nas áreas alcançáveis.

## 8. Background e foreground

Ordem relevante: fundo → parede interna/relevos → decoração/terreno → gameplay/objetos → cobertura arquitetônica → debug/HUD. Coberturas têm coordenadas fixas do mundo e são recortadas apenas para eficiência, sem mudar com a câmera. Elas escondem também efeitos e iluminação local contidos no recinto fechado. Ao abrir, a flag persistente retira a cobertura.

As coberturas foram limitadas às câmaras bloqueadas e ao espaço após a porta final. Não há máscara sobre a arena ou rotas abertas. HUD continua legível. Debug de colisão é desenhado por cima para comparação explícita.

## 9. QA por sala

| Região | Resultado da revisão |
|---|---|
| Sala 1 — revisada | Antes/depois, dano, revelação, retorno, teto e debug comparados. |
| Sala 2 — revisada | Entrada e panorama completo; limites, piso e dois suportes. |
| Sala 3 — revisada | Panorama, segredo superior, alavanca/flag, revelação e chegada pelo atalho. |
| Sala 4 — revisada | Panorama vertical, câmaras de ossos/alavanca, danos e abertura. |
| Sala 5 — revisada | Panorama das duas rotas, espinhos, baú e parede do atalho inferior. |
| Sala 6 — revisada | Repouso, piso escalonado, plataformas e acesso vertical. |
| Sala 7 — revisada | Panorama, entrada, movimento, fechamento das portas e arena no percurso. |
| Sala 8 — revisada | Portão selado, base, moldura, teto e corredor completo. |
| Sala 9 — revisada | Panorama vertical/horizontal, combate e subida no percurso. |
| Sala 10 — revisada | Arena, limite posterior oculto, atalho de retorno e porta final. |
| Boss — revisado | Percurso completo executou o combate até a derrota do Guardião. |
| Pós-boss — revisado | Chave, abertura, plataformas e fim da demo alcançados. |

Capturas de tela foram visualizadas durante a auditoria. Panorama é uma ferramenta de inspeção: fora dos limites do mapa ele pode mostrar o fundo, diferentemente da câmera normal limitada ao mapa. Não foi usado para calibrar zoom ou escala do produto.

## 10. Playtest

Travessia completa no navegador com controlador de inputs, velocidade de execução 2×: 10/10 salas, Guardião, chave, porta e fim em 260,3 segundos simulados, uma morte. Complementada por inspeções locais pausadas, golpes reais nas paredes, controles de eventos de QA para estados difíceis de enquadrar, panoramas e comparação com greybox. Inspeções por teleporte não são contabilizadas como travessia completa. Após os últimos ajustes apenas decorativos, os testes de percurso e de regressão passaram novamente.

## 11. Testes

`npm test` passou: `tests-final.txt`. Testes adicionais em `architecture.test.mjs` verificam cobertura antes/durante dano, revelação persistente, separação entre segredo e spawn, regras direcionais, passagem inferior livre após quebra e alteração restrita aos dez tiles documentados. `polish.test.mjs` continua verificando hashes de física, combate, AI, configuração e demais arquivos do mundo; a única exceção explícita é o mapa, agora comparado estruturalmente.

Nenhum balanceamento, hitbox de combate, escala física, zoom ou timer foi alterado. As conexões superiores dos demais remanescentes são apresentação; não foram criados colisores de destroços. Não foi identificada passagem bloqueada ou erro visual simples pendente nos enquadramentos revisados.
