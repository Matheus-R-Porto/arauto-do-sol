# Implementação da demo — decisões e validação

## Escopo realizado

17 salas originais do Cemitério, jogador com kit básico, espada usando o combo existente, três arquétipos de IA, boss de três ataques, checkpoints, morte, retorno, quatro fragmentos, três desvios, segredo, atalho e sequência até Fim da Demo. Sem engine, build, assets baixados ou alterações no GDD.

## O que foi preservado

Movimento e valores de caminhada/corrida/pulo/gravidade/coyote/buffer; arquitetura de habilidades; combo M1/M2; caveiras e energia única; heartbeat; Canvas 480×270; colisão por tiles; passo fixo; câmera. O Zombie e a sala original continuam presentes, com seus testes. A extração do ZIP tinha git status limpo. Fontes sincronizadas e anexos originais não foram modificados.

## Decisões provisórias

- Nomes de todas as salas e do guardião são identificadores de gameplay, não canon.
- Espada simples: M1 e M2 reaproveitam exatamente os golpes existentes; M2 ainda custa o mesmo e causa o dobro do dano. Isso favorece M2 e precisa de futura decisão de moveset.
- Três pontos de repouso: Encruzilhada, Ossuário e Último repouso. O despertar funciona como checkpoint inicial.
- Reentrar preserva entidades da sala. Morrer limpa as entidades de todas as salas; fragmentos, atalho, segredo e boss já derrotado persistem na sessão.
- Coletar um fragmento cura uma caveira; quatro aumentam o máximo conforme a regra existente.
- Perigo de plataforma: uma caveira e reposicionamento na última superfície segura. Não há perda de recurso ou corpse run.
- Boss possui 100 HP, resistência a knockback e não interrompe a preparação ao ser atingido. Investida anuncia dano na faixa baixa; corpo fora dela não causa dano de contato. O jogador pode atravessar a silhueta sem contato passivo.
- Sem i-frames de dash na rota normal. Todos os padrões podem ser evitados com deslocamento e pulo comum. Slam fixa o destino no início da preparação, não acompanha perfeitamente o jogador.
- Hitstop curto; camera shake adiado para preservar leitura. Partículas, túmulos, arcos, névoa e iluminação são procedurais e decorativos.
- Portais internos usam E/LB, saídas laterais usam direção. Isso evita transições acidentais durante exploração.
- Nenhum save permanente. Nenhuma narrativa além do despertar e travessia.

## Verificação

`npm test` inclui física, áudio e combate originais, validação de mapas, transições, checkpoints, morte/respawn, persistência, IA, projéteis, boss, liberação da arena e final. Os dois testes de percurso criam um jogador novo, com todas as habilidades desligadas, e enviam ações normais a cada update; não alteram posição, vida, energia ou boss.

O navegador foi usado para conferir início, controles básicos e reprodução visual de uma travessia inteira, incluindo a tela Fim da Demo. A página de testes usa os mesmos módulos e renderer do jogo; o controlador automatizado escolhe ações com conhecimento do estado. Isso não equivale a uma primeira sessão humana às cegas.

Medições da primeira entrega, antes do ajuste de energia/movimento documentado em `BALANCEAMENTO.md`:

- Exploração das 17 salas e dos quatro fragmentos, com duas mortes emergentes: aproximadamente **6 min 34 s** de tempo simulado.
- Cenário de morte antes do boss, morte para o boss, retorno e vitória: aproximadamente **5 min 46 s** de tempo simulado.
- Luta bem executada: aproximadamente **2 minutos**.
- Reprodução visual pode ser acelerada em 4×; esse tempo de parede não é a duração do jogo.

O alvo de **20–35 minutos para primeira exploração humana ainda não está validado**. O controlador conhece o mapa e os estados exatos dos ataques. Não há espera artificial para inflar duração; caso a primeira sessão fique muito curta, o próximo ajuste é densidade/geografia dos encontros e exploração.

## Limitações e pontos de atenção

- Placeholders simples, sem animação final nem trilha. Não representam o visual final do jogo.
- IA deliberadamente simples, sem navegação complexa. Inimigos são posicionados no chão, não nas plataformas one-way.
- Teclado/mouse verificados; não havia controle físico para validar ergonomia do gamepad. Mapeamento e desconexão têm testes lógicos.
- Sem mapa mundial ou inventário. O caminho principal segue as saídas laterais; os desvios usam portas internas.
- A suite prova conectividade e executa a rota, mas não prova matematicamente todas as sequências possíveis de ações do jogador.
- O programa de playtest conhece estados internos. Valide principalmente se telegraphs são igualmente compreensíveis para uma pessoa.

## Roteiro recomendado para playtest humano

1. Comece sem abrir F1. Observe leitura das plataformas e dos portais E.
2. Compare pulo curto, pulo completo e pulo correndo. Nas pontes, deixe energia recuperar antes do salto maior.
3. Use só M1 por um trecho e depois alterne M1/M2; avalie alcance e domínio provisório do M2.
4. Explore as três entradas internas e procure os quatro fragmentos. Teste ↓ + Espaço no retorno.
5. Volte ao Ossuário e abra a grade por dentro; confirme se o atalho ajuda a orientar-se.
6. Morra antes e durante o boss. Avalie distância do retorno e se inimigos restaurados são cansativos.
7. No boss, observe corte, investida baixa e marca de queda. Ataque durante a faixa azul de recuperação.
8. Anote duração real, quantidade de mortes, momentos sem energia, salas confusas e ataques que pareceram injustos.
