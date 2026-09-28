# Cemitério — mapa da v0.2.0

## Antes: auditoria da v0.1.1

A rota crítica era Despertar → Passagem → Vigília → Encruzilhada → Poço → Pontes → Sentinelas → Ossuário → Escadaria → Alameda → Repouso → Antecâmara → Guardião → Além. Capela e Galeria eram becos de fragmentos; Cripta oferecia uma pequena alternativa entre Sentinelas e Ossuário. Havia um atalho Ossuário/Encruzilhada, mas quase todo o avanço era linear e as portas internas não tinham coordenadas mundiais.

Poço, Escadaria, encontros com preparação legível, checkpoints e arena funcionavam bem. Alameda e Antecâmara prolongavam a linha sem oferecer decisões. As subidas foram reaproveitadas em conexões verticais; Alameda e Antecâmara passaram a compor o retorno inferior. Os três tipos de inimigo, o chefe e suas regras foram mantidos.

Antes de alterar as salas, foi registrado o grafo proposto com dois níveis de retorno e executado o percurso anterior no navegador: 293 s simulados, 17 salas, duas mortes deliberadas e final. A suíte de referência está em `BASELINE_ITERATION_2.txt`. Esse percurso foi assistido por um controlador de inputs, não foi um teste humano cego.

## Depois: relações entre salas

Legenda: ↔ dois sentidos; ↓ queda sem retorno direto; K chave; L alavanca; A atalho inicialmente fechado; R repouso.

```text
                                     Poço ↔ Ponte [L]
                                       ↕      ↓ queda
Despertar ↔ Passagem ↔ PÁTIO [R] ↔[K]↔ Vigília ↔[L]↔ OSSUÁRIO [R] ↔[A2]↔ Sentinelas ↔ REPOUSO [R] ↔ BOSS ↔ FIM
                         ↕                              ↕                 ↕             ↕
            Capela ↔ CRIPTA [chave] ↔[A1]↔ Escadaria ↔ Jardim das cinzas          Escada do retorno
                         ↕                                                             ↕
                   [tranca inferior] ↔────────── Alameda sob as raízes ──────────────────┘
```

O desenho representa conectividade, não distâncias. O overlay **F3** usa os retângulos mundiais reais, mostra a sala atual e o estado das passagens. As coordenadas são em tiles; as laterais compartilham altura de piso e as escadas compartilham eixo horizontal. O validador rejeita sobreposições e conexões entre retângulos não adjacentes.

| Sala / id | Origem mundial | Dimensão |
|---|---:|---:|
| Despertar / awakening | -80, 0 | 40 × 24 |
| Passagem / passage | -40, 0 | 40 × 24 |
| Pátio / crossroads | 0, 0 | 30 × 24 |
| Vigília / watch | 30, 0 | 40 × 24 |
| Poço / shaft | 30, -24 | 40 × 24 |
| Ponte / bridge | 70, -24 | 40 × 24 |
| Cripta / crypt | 0, 24 | 70 × 24 |
| Capela / chapel | -40, 24 | 40 × 24 |
| Ossuário / ossuary | 70, 0 | 40 × 24 |
| Escadaria / ascent | 70, 24 | 40 × 24 |
| Sentinelas / sentries | 110, 0 | 40 × 24 |
| Jardim / balcony | 110, 24 | 40 × 24 |
| Repouso / refuge | 150, 0 | 40 × 24 |
| Escada do retorno / antechamber | 150, 24 | 40 × 48 |
| Alameda / procession | 0, 48 | 150 × 24 |
| Guardião / guardian | 190, 4 | 40 × 20 |
| Além / beyond | 230, 3 | 48 × 21 |

## Rota crítica

Despertar → Passagem → Pátio → Cripta (chave) → Pátio (porta) → Vigília → Poço → Ponte (alavanca) → queda no Ossuário → Escadaria → Jardim (subida pelo lado oeste) → Sentinelas → Repouso → Guardião → Além.

São 14 salas distintas. Capela, Escada do retorno e Alameda não são necessárias. A fonte e a urna no lado leste do Jardim também podem ser ignoradas. Nenhum gate exige dash, parede, pulo duplo ou planar. Plataformas obrigatórias sobem em degraus de 32 px, abaixo do salto de 52 px; patamares largos permitem corrigir a aproximação.

## Hubs e loops

- **Pátio:** introdução a oeste, fechadura dourada a leste, escada para a Cripta. Cabe em uma tela de largura, mostrando a porta desde a chegada. A estátua e o repouso orientam o retorno com a chave.
- **Ossuário:** Vigília a oeste, grade das Sentinelas a leste, Escadaria abaixo. Recebe a queda da Ponte acima. O piso elevado de chegada não permite voltar à Ponte.
- **Repouso:** Sentinelas a oeste, boss a leste, retorno inferior abaixo. Checkpoint próximo da entrada da arena.
- Loop alto: Vigília → Poço → Ponte → queda → Ossuário → portão de volta à Vigília.
- Loop da Cripta: Pátio → Vigília → Ossuário → Escadaria → A1 → Cripta → Pátio.
- Loop das galerias: Ossuário → Escadaria → Jardim → Sentinelas → A2 → Ossuário.
- Loop tardio: Repouso → Escada do retorno → Alameda → Cripta → caminho já aberto de volta ao Repouso.

## Gates e persistência

| Elemento | Local e efeito |
|---|---|
| Chave física | Patamar oriental da Cripta, coordenada local 55,16; exige atravessar a ramificação e subir. Mensagem relaciona a chave à porta do Pátio. |
| Porta do sol | Leste do Pátio. Moldura dourada e símbolo igual à chave. E/LB abre somente com a chave. |
| Alavanca | Contrapeso físico na Ponte, local 16,22. E/LB aciona; som e mensagem identificam o portão da Vigília. |
| Portão da corrente | Vigília/Ossuário; moldura azul e barras. A corrente é repetida no caminho alto. A mesma alavanca libera a descida da Ponte. |
| A1 | Cripta/Escadaria. Abre somente da Escadaria; depois funciona nos dois sentidos. Evita o retorno por Vigília e Pátio para entrar na Cripta. |
| A2 | Ossuário/Sentinelas. Abre somente das Sentinelas; depois elimina a descida e subida pelas galerias inferiores. |
| Tranca inferior | Cripta/Alameda. Abre por baixo. É uma reconexão tardia e rota sem inimigos; não é apresentada como a rota mais rápida. |
| Segredo | Pedra rachada do altar alto da Capela; golpe revela uma urna com fragmento. |
| Fonte | Desvio leste do Jardim. E/LB recupera toda a vida e energia uma vez por run. |

`Progression` centraliza os estados em um Set: cemeteryKey, cemeteryDoor, mainGateLever, shortcutWest, shortcutGallery, shortcutDeep, secret e fountain. A morte conserva todos, assim como os fragmentos; uma nova run ou recarregamento reinicia tudo. A chave não é consumida. A porta já aberta não volta a consultá-la. Inimigos reaparecem após morte; chefe não derrotado volta inteiro.

## Opcionais e recompensas

- Capela: encontro evitável, vitral, altar elevado e segredo com fragmento.
- Plataforma do Pátio: fragmento visível desde baixo, alcançado por três patamares.
- Leste da Cripta: fragmento além da rota da chave e grade de A1 vista antes da abertura.
- Leste do Jardim: encontro com investida, fonte restauradora e fragmento; sair pela escada oeste não exige coletá-los.
- Escadaria → A1: descoberta de caminho curto à Cripta.
- Sentinelas → A2: retorno rápido ao Ossuário.
- Escada do retorno/Alameda: reconhecimento das raízes vistas antes, abertura da tranca inferior e conexão segura com o hub inicial.

Quatro fragmentos mantêm a regra anterior: cada um cura uma caveira, e quatro concedem a sexta caveira. A primeira descoberta do segredo é por ataque, não por um novo menu ou inventário.

## Landmarks e antevisões

Estátua com halo e espada no Pátio; sino suspenso no Poço; corrente azul e contrapeso; ponte com guarda-corpo; grande pilha de ossos no Ossuário; vitral na Capela; fonte no Jardim; mausoléu junto ao boss; raízes recorrentes em dois níveis.

Antevisões: porta dourada visível ao chegar ao Pátio; portão azul antes de subir até a alavanca; composição da pilha de ossos vista pela abertura na Ponte e reencontrada abaixo; corredor inferior visível pelas grades da Cripta; silhueta do Guardião vista do Repouso. São representações procedurais estáticas, não renderização simultânea de outra sala.

## Rotas de playtest

- **Crítica:** 14 salas; ignora fragmentos e ramificações opcionais; segue os três gates obrigatórios até o final.
- **Exploratória:** primeiro tenta a porta e o portão fechados; visita Capela, pega chave, abre porta/alavanca, A1 e A2; visita fonte e recolhe os quatro fragmentos; volta pela Vigília para conferir o portão aberto. 15 salas.
- **Completionista:** acrescenta o retorno profundo e usa suas conexões nos dois sentidos. 17 salas, quatro fragmentos, segredo, fonte e três trancas destravadas.
- **Anti-softlock:** percurso completionista com mortes deliberadas separadas após chave, porta, alavanca, primeiro atalho e na arena. Usa somente inputs normais para caminhar até inimigos e receber dano. Cinco mortes; chega ao final.

## Validação

Suíte completa: 95 verificações aprovadas (79 verificações de física/áudio/combate/demo/input, 12 de exploração e quatro percursos completos). A fixture do antigo atalho foi atualizada para sua localização nova; os comportamentos anteriores continuam cobertos. O grafo com progressão enumerou 154 estados alcançáveis; todos têm caminho até o final. Também foi validado o final excluindo salas opcionais.

Cobertura adicional: coleta e abertura por interação, requisitos dos gates, persistência após morte em cada etapa, uso bidirecional, queda sem saída reversa, reinício completo, segredo, fonte, entradas seguras, retângulos mundiais e câmera em todos os limites. Percursos completos mantêm todas as habilidades futuras desligadas. Testes unitários usam estados controlados; percursos de integração não teleportam nem alteram HP/energia/flags.

| Percurso assistido | Tempo simulado | Salas | Mortes |
|---|---:|---:|---:|
| Crítico | 2 min 38 s | 14 | 0 |
| Explorador | 3 min 49 s | 15 | 0 |
| Completionista | 4 min 40 s | 17 | 0 |
| Anti-softlock | 5 min 56 s | 17 | 5 |

Os tempos são de um controlador que conhece os objetivos, com simulação normal a 60 Hz. A reprodução no navegador pode ocorrer a 4×. **Não são estimativas de primeira exploração humana.** A referência solicitada de 20–35 minutos ainda precisa ser medida com pessoas. Não foram adicionadas esperas ou distâncias artificiais para tentar atingir esse número.

Resultados detalhados: `TEST_RESULTS_ITERATION_2.txt`. O navegador oferece os quatro percursos, pausa por sala, velocidade 1× e mapa em `tests/playthrough.html`.

## Riscos de pacing e próxima observação humana

A Alameda é uma rota segura comprida; verificar se a descoberta da ligação compensa a caminhada. O padrão de escadas ainda é provisório e repetitivo; observar confusão entre subir plataformas e usar E na conexão. O caminho crítico ficou compacto para quem já o conhece. Medir tempo real de descoberta de chave, associação alavanca/portão, memória do Pátio e vontade de visitar a fonte. A capela é inteiramente opcional; confirmar se a rachadura do altar é percebida sem indicação explícita. A arte continua procedural provisória.

Revisão final no navegador: crítico 157,5 s / 14 salas; explorador 229,3 s / 15 salas; anti-softlock 355,7 s / 17 salas / cinco mortes, todos no final. Sem erros ou avisos no console da página. Conferidos visualmente Pátio, câmera vertical, arena e mapa F3. Comparação SHA-256 com o pacote v0.1.1 confirmou que tuning, player, boss, IA de inimigos, energia, vida, heartbeat, input e câmera permanecem idênticos.
