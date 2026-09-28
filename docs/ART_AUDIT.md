# Auditoria — primeira iteração de arte

Estado inicial: demo v0.2.0, antes de qualquer troca visual. `npm test`: 95 verificações aprovadas; registro em `BASELINE_ART_ITERATION.txt`. A demo foi executada no navegador, com observação do placeholder durante salto/locomoção e percurso crítico concluído (157,5 s simulados).

- Canvas interno: 480×270; tile: 16 px. Escala CSS inteira e `imageSmoothingEnabled=false` em `DemoView.draw`.
- Não existe carregador de sprites nem animação raster. `Player.draw` desenha ossos com retângulos, sombra, squash e flashes. A espada ociosa é outro retângulo em `DemoView.draw`.
- Corpo visual básico: aproximadamente 8–10 px de largura e 23 px de altura; collider/hurtbox: 10×22. Origem real: centro horizontal e base dos pés. O PNG nunca definirá collider.
- Estados normais: idle, walk, run, jump, fall. Dash, wallslide e glide são habilidades futuras desabilitadas; não exigem arte nesta etapa.
- Landing existe como transição `wasOnGround` → `onGround`, sem travamento. Pode receber feedback visual curto, subordinado aos estados importantes.
- Ataques M1/M2 usam timers independentes e combo compartilhado. Ambos têm cooldown de 0,25 s e alcance de 18 px para além do corpo. O dano ocorre imediatamente ao aceitar o input. NÃO existe startup separado nem janela contínua de dano: inserir windup antes do contato visual mentiria sobre o combate. Arte deverá começar na pose ativa, seguindo com finalização/recuperação; lógica continua intacta.
- Dano: vida e invulnerabilidade pertencem ao mundo; hurt pode observar queda de vida, sem tratar a invulnerabilidade de chegada como ferimento. Morte: fase `dying`, 0,85 s antes do respawn.
- Prioridade visual proposta: morte > impacto de dano > ataque > salto/queda > pouso curto > corrida/caminhada > idle. O renderer acompanha tempo do passo fixo; não decide dano ou movimento.
- Sprites devem ter base próxima de 24 px de altura corporal. Canvas maior serve para espada/margem, não para multiplicar o personagem. 32×96 é referência externa, incompatível como tamanho nativo direto neste collider; a escolha final depende da referência e do piloto.

## Referência recebida e analisada

A referência foi recebida após a auditoria: `Imagem do Codex 18 de set. de 2026, 14_47_06.png`, 32×96 RGBA, sete cores visíveis. Cópia preservada em `assets/raw/protagonist/reference.png`. Identidade: esqueleto esguio, crânio descoberto voltado à direita, costelas expostas, tecidos castanho/oliva gastos, pernas longas com faixas e espada simples. As imagens de outros jogos do início da conversa não foram utilizadas para gerar o protagonista.

Os 96 px da referência não foram impostos à demo: isso quadruplicaria a altura visual relativa ao collider. A anatomia foi adaptada para aproximadamente 24 px de altura em pé, mantendo a resolução interna de 480×270. A referência tem mais detalhe do que cabe nessa escala; silhueta, crânio, tecido e espada foram priorizados.

## Gate de produção

Comparar nearest, BOX e Lanczos de forma reproduzível; escolher um método após observar o idle em tamanho nativo. Fixar a paleta mestre e perfil. Integrar/validar idle na demo antes de gerar locomoção, poses aéreas, ataques e dano/morte. RAW preservado; todos os PNGs finais passam pela ferramenta. Nenhuma alteração de gameplay prevista.
