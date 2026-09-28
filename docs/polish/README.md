# Polish visual — 24/09/2026

Implementado diretamente na demo. Escala aprovada, zoom, resolução, HUD, mapa e regras de combate preservados.

## 1. Sprites substituídos

- Parede quebrável procedural: substituída por `wall-intact`, `wall-cracked`, `wall-broken` e `wall-rubble`, em `assets/sprites/world/polish/`. RAW novo preservado em `assets/raw/polish/wall.png`.
- Transição instantânea queda/locomoção: recebe três poses novas de pouso em `assets/sprites/protagonist/polish/`, provenientes de `assets/raw/polish/land.png`.
- `stone-a`, `stone-b`, `ledge` e `spikes`: reprocessados dos RAWs existentes com paleta de pedra úmida mais escura; mantêm dimensões e pivots.
- Walker, Lunger e Ranged mantêm os sprites existentes: a intervenção foi no relógio visual da passada. Guardião reutiliza sua pose processada de idle no término das recuperações. Não foi regenerado todo o elenco.

## 2. Animações polidas

| Entidade / estado | Frames antes → depois | Duração do clip antes → depois |
|---|---:|---:|
| Protagonista / land | inexistente → 3 | inexistente → 0,12 s visual |
| Protagonista / walk | 6 → 6 | 0,52 → 0,52 s nominal |
| Protagonista / run | 6 → 6 | 0,36 → 0,36 s nominal |
| Protagonista / jump e fall | 2 → 2 cada | 0,36 → 0,36 s cada |
| Protagonista / M1 e M2 | 4 → 4 cada | 0,25 → 0,25 s cada |
| Guardião / slash recovery | 2 → 3 | 2,10 → 2,10 s |
| Guardião / charge recovery | 2 → 3 | 2,40 → 2,40 s |
| Guardião / slam recovery | 3 → 4 | 2,60 → 2,60 s |
| Guardião / walk | 4 → 4 | 0,80 → 0,80 s nominal |

Walk/run agora avançam pela distância real percorrida, reduzindo deslizamento sem modificar velocidade. Walker, Lunger e Ranged usam o mesmo princípio, mantendo quantidade de frames e dados originais dos clips. Próximo do ápice, o protagonista usa a pose final do clip aéreo. Land pode ser interrompido imediatamente por salto, ataque ou dano; não bloqueia comandos. Idle, hurt, death e os clips de ataque originais permanecem intactos. A tabela completa de todos os clips está em `animation-audit.json`.

## 3. Contato

Faíscas de dano dependem da redução real de vida; alterações de flags/coletas deixaram de dispará-las. Golpes no vazio conservam apenas seu movimento/rastro. M1/M2 mantêm os alinhamentos e hitboxes aprovados. Passadas dependentes da distância e pouso em três poses melhoram o contato com o solo. Slam do Guardião emite poeira junto aos pés e a onda existente no início do impacto. Os efeitos também são desenhados no laboratório, que antes os ocultava.

## 4. Cenário

Fundo escurecido por composição fria, preservando silhuetas. Suportes de plataformas descem até o solo encontrado abaixo, como elementos decorativos sem colisão. Portas recebem espessura de alvenaria e interior escuro; a moldura final permanece apoiada após abrir.

## 5. Chão

Paleta `damp-stone.json`: 32 cores da pedra original com canais multiplicados por 0,76. Reprocessamento determinístico dos RAWs, sem ampliar um sprite pronto. Bordas superiores cinza-esverdeadas mantêm a leitura de onde pisar. Fundo mais escuro separa terreno e atores.

## 6. Atmosfera

Reuso controlado de árvores mortas, ossos, urnas, túmulos e arquitetura desgastada. Sombras frias, verdes discretos, pedra escura e pontos quentes existentes. Os backgrounds não foram regenerados: sua composição e contraste foram retrabalhados no render.

## 7. Problemas encontrados

Decoração mudava conforme a câmera; urna podia aparecer atrás de parede destruída; ossos cruzavam uma plataforma atravessável; lintel da porta final ficava suspenso; sala de testes ocultava efeitos de contato. A transição de queda ao movimento era seca e recuperações do Guardião terminavam abruptamente.

## 8. Correções

Props ancorados à grade do mundo; exclusão junto a paredes quebráveis, portas e interativos; teste de espaço livre inclui plataformas atravessáveis. Suportes prolongados até o solo. Moldura final com apoio permanente. Nenhum novo seam de painel foi identificado; a validação de 48 painéis continua passando. Não foi necessário deslocar chão, salas ou colisores.

## 9. Paredes quebráveis

Impacto de 0,12 s; quebra de 0,36 s com rachadura, desprendimento e estado final. Dez fragmentos por impacto, gravidade visual e vida curta. A abertura visual inferior tem aproximadamente 30–32 unidades de altura, suficiente para o protagonista; topo e detritos continuam visíveis. Paredes altas recebem continuação de alvenaria acima da passagem. O estado final é desenhado a partir da flag existente, inclusive ao sair e voltar, sem repetir a queda das pedras.

Os restos e a moldura são visuais: a colisão continua exatamente a anterior, que libera o bloqueio ao quebrar. Não foram adicionados colisores no topo remanescente nem nas pedras. A regra de quebra por um lado é preservada.

## 10. Gameplay

Nenhuma mudança de balanceamento. Hashes de todos os arquivos de entidades, física, sistemas, configuração e mundo conferidos contra `gameplay-before.json`. Velocidade, salto, energia, dano, AI, timers e geometria permanecem idênticos.

## 11. Hitboxes

Nenhuma alteração. Sprite, partículas e poses continuam separados de collider/hurtbox/attack hitbox. Testes existentes de M1/M2 e alinhamento continuam passando.

## 12. Playtest

Percurso completo no navegador com controlador de inputs a 2×: dez salas, parkour, arena, Guardião, chave e porta final; conclusão em 260,3 segundos simulados, uma morte. Inspeções adicionais por sala e objetos, quebra manual e retorno à parede para verificar entulho. Inspeção por teleporte é distinguida da travessia completa. No laboratório, M1 confirmado registrou um dano/um acerto; golpe voltado ao lado oposto não incrementou o contador.

## 13. Testes e reprodução

`npm test` passou (log `tests-final.txt`), incluindo percurso completo, laboratório e regressões de polish. Validador de arte: 221 sprites e 48 painéis; paletas, alpha, margens, hashes e RAW preservados. Reexecutar `tools/sprite_pipeline/build_polish.py` reproduziu os sete novos PNGs e ambos os manifests byte a byte (`reproducibility.json`).

Perfis em `tools/sprite_pipeline/profiles/polish/`. Protagonista: canvas 128×128, referência visual 96 px de altura, paleta mestre de 16 cores, escala de mundo 0,25, mesmo pivot/base do perfil original. Parede: canvas 192×256, pivot 96/248, referência 192 px para 654 px de origem, paleta world-stone de 32 cores. Downsample Lanczos, alpha threshold 128, sem dithering; escalas posteriores nearest-neighbor. Recortes, âncoras e hashes constam em `build.json`. Fontes RAW nunca sobrescritas.

## 14. Limites restantes

Não foi identificado bloqueio de percurso nesta revisão. A passada acompanha deslocamento, mas não usa travamento individual de cada pé; pode haver deslizamento residual dentro das poses existentes. Remanescentes das paredes não ganharam colisão: isso preserva a geometria funcional aprovada. Não há promessa de ausência de todo defeito visual fora dos percursos observados.
