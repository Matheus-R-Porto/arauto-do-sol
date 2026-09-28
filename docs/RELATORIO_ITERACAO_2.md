# Entrega — exploração do Cemitério, v0.2.0

## 1. Resumo do redesign

A sequência linear tornou-se uma região de 17 salas distribuídas acima e abaixo de um patamar central. O Pátio, Ossuário e Repouso oferecem decisões reconhecíveis. Chave, contrapeso, queda e trancas mudam as possibilidades de circulação durante a run. Física, energia v0.1.1, ataques, IA, heartbeat e boss foram preservados; os encontros foram reposicionados.

## 2. Grafo

```text
                                     Poço ↔ Ponte [alavanca]
                                       ↕      ↓
Despertar ↔ Passagem ↔ Pátio ↔[chave]↔ Vigília ↔[portão]↔ Ossuário ↔[atalho 2]↔ Sentinelas ↔ Repouso ↔ Boss ↔ Fim
                         ↕                               ↕                    ↕             ↕
            Capela ↔ Cripta [chave] ↔[atalho 1]↔ Escadaria ↔ Jardim                   Escada do retorno
                         ↕                                                                  ↕
                         └─[tranca inferior]──────────── Alameda ─────────────────────────────┘
```

O [documento do mapa](CEMETERY_MAP.md) contém coordenadas, antes/depois e explicação de cada ligação. **F3** mostra o grafo na demo, pausa a simulação e indica a sala atual e estados de progressão.

## 3. Rota crítica

Despertar → Passagem → Pátio → Cripta/chave → Pátio/porta → Vigília → Poço → Ponte/alavanca → queda no Ossuário → Escadaria → Jardim/subida oeste → Sentinelas → Repouso → Guardião → Além. Visita 14 salas, sem habilidades futuras e sem recompensas opcionais obrigatórias.

## 4. Rotas opcionais

Capela a oeste da Cripta; plataforma alta do Pátio; leste do Jardim com fonte; atalho Escadaria/Cripta; retorno Sentinelas/Ossuário; descida do Repouso até a Alameda e reconexão inferior. O explorador visita 15 salas; o completionista, 17.

## 5. Gating

A chave está no patamar oriental da Cripta; a porta dourada é visível já na entrada do Pátio. A alavanca física da Ponte abre o portão azul entre Vigília e Ossuário, além da saída de queda. As interações usam E/LB. Molduras, símbolos, barras e mensagens distinguem requisitos. Portas abertas permanecem abertas.

## 6. Atalhos

**Escadaria → Cripta:** abre por leste e reduz o retorno ao setor inicial. **Sentinelas → Ossuário:** abre pelo lado das Sentinelas e evita repetir descida/subida nas galerias. Ambos podem ser usados nos dois sentidos. **Alameda → Cripta:** terceira tranca por baixo, reconexão segura e descoberta tardia; não pretende ser o caminho mais rápido.

## 7. Landmarks

Estátua com halo, sino, corrente azul, ponte, pilha de ossos, vitral, fonte, mausoléu e raízes. Portão, ossuário e corredor inferior são vistos antes de seus acessos. A arte continua procedural provisória.

## 8. Recompensas opcionais

Quatro fragmentos preservam o aumento de vida existente. O da Capela fica no altar rachado, revelado com a espada. O Jardim oferece restauração completa uma vez por run. Os retornos oferecem conveniência e reconhecimento espacial. A passagem pela parte oeste do Jardim não obriga visitar seu desvio de recompensa.

## 9. Arquivos importantes

- `src/world/rooms/cemetery.js`: layouts, coordenadas, conexões e encontros.
- `src/world/progression.js`: requisitos e estado permanente da run.
- `src/world/room-manager.js`: coleta, alavanca, trancas, fonte e segredo.
- `src/world/validate.js`: entradas seguras, adjacência, retornos e sobreposições.
- `src/ui/demo-view.js`, `src/ui/map-decor.js`: portas distintas, objetos, landmarks e mapa.
- `src/main.js`: F3 e pausa durante o mapa.
- `tests/exploration.test.mjs`, `tests/routes.test.mjs`: progressão, grafo e rotas.
- `tests/playthrough-driver.js`, `tests/playthrough.html`: percursos assistidos da nova topologia.
- `tests/demo.test.mjs`, `tests/respawn-playthrough.test.mjs`: fixtures de atalho/retorno atualizadas, cobertura anterior preservada.
- `README.md`, `package.json` e documentos desta iteração.

## 10. Testes

**95 verificações aprovadas.** 79 de regressão (física, áudio, combate, demo e input), 12 de exploração e quatro percursos até o final. O grafo revisou 154 combinações alcançáveis de sala e estados; todas alcançam o final. A rota crítica foi validada excluindo salas opcionais. Mortes isoladas após chave, porta, alavanca, atalhos, fonte e segredo conservam progresso; nova run limpa tudo.

O registro completo está em `TEST_RESULTS_ITERATION_2.txt`; a referência anterior em `BASELINE_ITERATION_2.txt`.

## 11. Playtests e tempos

| Percurso | Tempo simulado | Resultado |
|---|---:|---|
| Crítico | 2:38 | 14 salas; sem mortes ou fragmentos |
| Exploração normal | 3:49 | 15 salas; quatro fragmentos; gates e dois atalhos |
| Completionista | 4:40 | 17 salas; todas as recompensas e retorno profundo |
| Anti-softlock | 5:56 | 17 salas; cinco mortes deliberadas; final |

Os percursos são **assistidos por inputs normais**, com o mesmo mundo, física e combate da demo. Não houve teleporte, cura artificial ou liberação de habilidades. A revisão no navegador observa também a apresentação e as transições. Não se trata de teste humano sem conhecimento do mapa; a meta de 20–35 minutos de primeira experiência permanece a validar.

## 12. Problemas e limites

Nenhum softlock foi encontrado nos percursos ou no modelo de progressão. A câmera continuou dentro dos limites de todas as salas. O corredor inferior é longo, mas sem combates; pode ser menos atraente que os dois atalhos principais. Escadas e landmarks ainda são placeholders. A duração crítica conhecida é curta; evitei criar deslocamentos artificiais para fabricar tempo de jogo. As antevisões usam composições estáticas. Progresso existe apenas durante a run: fechar/recarregar reinicia.

## 13. Próximo teste humano

Observar se o jogador nota a porta antes da chave, associa a corrente à alavanca, reconhece a Cripta ao abrir A1 e prefere A2 após descobrir a rota inferior. Verificar se aprende a usar E nas conexões verticais, se a fonte compensa o desvio, se o altar rachado é descoberto e se o retorno profundo vale a caminhada. Cronometrar primeira partida e revisitas separadamente, principalmente as pausas por dúvida de navegação.

Revisão final no navegador: crítico 157,5 s / 14 salas; explorador 229,3 s / 15 salas; anti-softlock 355,7 s / 17 salas / cinco mortes, todos no final. Sem erros ou avisos no console da página. Conferidos visualmente Pátio, câmera vertical, arena e mapa F3. Comparação SHA-256 com o pacote v0.1.1 confirmou que tuning, player, boss, IA de inimigos, energia, vida, heartbeat, input e câmera permanecem idênticos.

## Pacote solicitado para compartilhar

O ZIP Windows com iniciador .exe está pronto; basta extrair tudo e executar. Não precisa instalar Node.js ou ter internet depois de baixar. O pacote foi validado após extração, inclusive abrindo o jogo pelo servidor embutido. Consulte [Pacote Windows](PACOTE_WINDOWS.md). Fonte e compilação do iniciador estão em `tools/WindowsLauncher.cs` e `tools/build-windows.ps1`.
