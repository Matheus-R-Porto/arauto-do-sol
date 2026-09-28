# Sala de testes

Acesso: http://localhost:5174/?test-room ou link abaixo do jogo.

Sala quadrada de 512×512 unidades. Duas plataformas sólidas de 160×16, lado a lado, sem descida através delas. Sprites, animações, física e ataques são os mesmos do jogo. Nenhuma arma nova foi criada nesta etapa; armas futuras integradas ao jogador poderão ser testadas aqui.

Boneco passivo de 100 HP ou Walker/Ranger/Lunger com IA original. O painel registra vida efetivamente removida por impactos aceitos, respeitando invulnerabilidade: último dano, total e acertos. Os indicadores aparecem também em tela cheia.

- F2: hitboxes (verde corpo, vermelho alvo, branco golpe, amarelo ataque inimigo).
- F4: reiniciar sala e zerar contadores.
- F5: repor alvo, mantendo contadores.
- F6: restaurar vida e energia.
- F1: painel existente de diagnóstico e habilidades.

Seleção de alvo e botões ficam abaixo do jogo. O ambiente é isolado do Cemitério; sair pelo link Cemitério inicia a demo normalmente. Sem persistência entre recargas.

Validação: sala quadrada e isolada, duas plataformas sólidas resistentes ao comando de descida, combate real e display/fullscreen passaram nos testes.
