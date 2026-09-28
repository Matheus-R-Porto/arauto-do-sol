# Balanceamento após playtest — v0.1.1

Aplicados os três ajustes solicitados pelo autor após testar com um amigo.

## Energia

Todos os custos base foram divididos por dois, inclusive custos contínuos e habilidades de debug. Exploração continua multiplicando esses custos por 0,5.

| Ação | Antes, em combate | Agora, em combate | Agora, em exploração |
|---|---:|---:|---:|
| Pulo | 4 | 2 | 1 |
| Dash | 12 | 6 | 3 |
| Pulo de parede | 5 | 2,5 | 1,25 |
| Corrida, por segundo | 6 | 3 | 1,5 |
| Deslizar na parede, por segundo | 2 | 1 | 0,5 |
| Planar, por segundo | 6 | 3 | 1,5 |
| M1 | 9 | 4,5 | 2,25 |
| M2 | 9 | 4,5 | 2,25 |
| Ataque pesado, custo reservado | 22 | 11 | 5,5 |

Um combo de cinco golpes em combate custa 22,5 pontos, anteriormente 45.
O modo exploração volta após **10 segundos sem causar ou receber dano**, anteriormente 20. Uma nova troca de dano reinicia esse prazo.

A regeneração já era igual nos dois modos: **10 pontos/s depois de 1 segundo sem gasto**. Esse funcionamento foi mantido; o tempo para sair do combate altera o multiplicador de custo e o heartbeat, não o início/taxa da regeneração.

## Movimento

- Caminhar: 92 px/s.
- Pulo/queda comuns: 92 px/s, anteriormente 130.
- O teto comum usa a mesma constante em `config/tuning.js` para impedir divergência acidental.
- Saltos iniciados em corrida continuam preservando o impulso de 158 px/s para atravessar os vãos previstos no mapa.
- Altura do pulo, gravidade e aceleração não foram recalibradas.

## Verificação

`npm test` passou: 81 verificações/cenários, sem alterar os testes para acomodar o balanceamento. Inclui física, custos, regeneração, habilidades de debug, combo, IA e dois percursos completos usando ações normais.

- Percurso com 17 salas e quatro fragmentos: **238,3 segundos**, sem mortes.
- Percurso com morte antes do boss, morte no boss e vitória após retorno: **293,0 segundos**, duas mortes.
- Ambos concluíram sem habilidades futuras, teleporte ou energia artificial.

São tempos de teste automatizado com conhecimento do mapa, não uma nova medição humana. Nenhuma sala ou ataque do boss precisou ser alterado. Resultados completos em `TEST_RESULTS.txt`.

O servidor entrega os módulos sem cache. Recarregue a página para carregar os valores novos; isso reinicia a demo, pois não há save permanente.
