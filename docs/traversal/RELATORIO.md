# Correção de circulação — 28/09/2026

## 1. Sala 4

A plataforma `[36,38,9]` tinha 72 unidades de largura em y=304. A parede acima da ponta direita limitava o centro do jogador a x=363, mas ele precisaria ultrapassar x=365 para cair pela borda. À esquerda sobravam apenas 8 unidades para um collider de 10. Era possível usar o comando de descer por plataforma, o que mascarava o defeito no percurso automatizado anterior, mas não sair andando por uma borda.

Foi encurtada para `[36,38,7]`: 56 unidades, removendo somente dois tiles da ponta direita. A folga na região estreita passou a 24 unidades. Teste de regressão reproduz o jogador preso em y=304 na versão anterior e confirma descida andando na versão nova, sem pulo, comando de atravessar plataforma ou habilidades especiais.

Entrada superior real, 13 plataformas preservadas, quatro inimigos preservados, câmaras do fragmento e da alavanca preservadas, saída lateral para Sala 5 preservada. Navegação simulada com a física real confirma aproximação das duas paredes, acesso às câmaras abertas e retorno à rota principal. A travessia completa passa por 3 → 4 → 5 sem teleporte ou noclip.

## 2. Transições

A classificação individual das **22 exits**, com origem, destino, direção, tipo, implementação anterior, correção, trigger e spawn, está em [EXITS.md](EXITS.md).

As três ligações verticais são: Sala 3 desce para 4; Sala 6 sobe para 7; Sala 9 sobe para 10. Seus retornos percorrem o mesmo eixo. Passagens laterais comuns perderam as portas arbitrárias. A porta da cela, os shortcuts quebráveis, o portão de arena, o portão selado da Sala 8 e a porta pós-chefe permanecem estruturas reais.

## 3. Correções

Foram abertas seis extremidades de poços com 48 unidades de largura: piso de 3/teto de 4, teto de 6/piso de 7, teto de 9/piso de 10. A remoção de colisão é local às emendas já indicadas no greybox. Não há conexão nova nem remoção de salas. Arte usa o mesmo recorte de terreno, mostrando fundo, laterais de pedra e continuidade, sem sprite de porta deitado.

Os triggers verticais usam Y, velocidade na direção da passagem e espaço horizontal para o collider inteiro. São desenhados em verde na visão de colisão da página de teste. A abertura da arena recebe uma grade horizontal e colisão temporária durante as ondas; abre ao concluir a arena. A grade lateral também foi preservada.

## 4. Spawns

Ao descer, a chegada ocorre perto do topo do destino. Ao subir, emerge junto da borda inferior do destino, apoiado na margem para não cair de volta imediatamente. Foram testadas as seis direções com movimento/pulo/gravidade reais após a preparação isolada de cada caso. Nenhum spawn colide com pedra e todos ficam dentro da câmera. Os testes isolados não são apresentados como travessia completa.

## 5. Câmera

Mantidos zoom, resolução, limites, suavização e fade existentes. A câmera já se reposiciona sob o fade na troca de sala. Corrigir as posições de chegada foi suficiente; não houve alteração no algoritmo da câmera. Verificados enquadramento do jogador e limites da câmera nos seis destinos, além de inspeção visual das aberturas no navegador.

## 6. Bloqueios encontrados

- Ponta da plataforma da Sala 4 sem folga para sair andando: corrigida.
- Saídas verticais tratadas como portas laterais, sem recorte correspondente no chão/teto: corrigidas.
- Spawns e condição de movimento lateral nessas conexões: substituídos por posição e travessia verticais.
- Fechamento da arena precisava acompanhar a nova abertura: grade/colisão horizontal aplicadas durante as ondas.

Nenhum softlock foi observado no percurso testado. Topologia, física, pulo, habilidades, combate, arte dos atores e escalas permanecem iguais. A suíte confere exatamente os tiles autorizados e preserva os demais metadados do mapa.

## 7. Playtest

`npm test` passou. Novo teste `tests/traversal.test.mjs` verifica alteração local, folgas, acesso às câmaras, seis transições verticais, colisão e câmera. O teste antigo de animação foi ajustado para exercitar morte/respawn explicitamente, já que a nova rota deixou de produzir uma morte incidental.

Percurso automatizado completo, tanto em simulação quanto no navegador: **237,2 segundos simulados, zero mortes, 10/10 salas, chefe derrotado, chave coletada, porta pós-chefe aberta e fim da demo**. O controlador usa apenas as entradas normais do jogo; não escreve posições, vida ou flags. O percurso foi iniciado do começo. Inspeções visuais com carregamento de sala e collision debug foram feitas separadamente.

Evidência: [playtest.png](playtest.png). Log da suíte: [tests.txt](tests.txt). Auditoria reproduzível: `node tools/audit-transitions.mjs`.
