// =============================================================================
// TUNING — todos os numeros que definem o "feel" do jogo ficam aqui.
// Regra do projeto: nenhum valor magico espalhado pelo resto do codigo.
// Se voce quer mudar como o jogo SE SENTE, mexe so neste arquivo.
// =============================================================================

export const RENDER = {
  width: 480,        // resolucao interna (pixel art). 480x270 = 16:9, escala 4x -> 1920x1080
  height: 270,
  tileSize: 16,
  background: '#0a0913',
};

export const PLAYER = {
  width: 10,         // hitbox, nao o sprite
  height: 22,

  // --- chao ---
  walkSpeed: 92,
  runSpeed: 158,
  groundAccel: 900,
  groundDecel: 1400,

  // --- ar ---
  airAccel: 620,
  airDecel: 420,

  // --- pulo -----------------------------------------------------------------
  // Definido por altura + tempo (nao por gravidade crua): e muito mais
  // intuitivo balancear "quero pular 3 tiles em 0.36s" do que chutar px/s2.
  jumpHeight: 52,        // px de altura do pulo segurando o botao (~3.2 tiles)
  jumpTimeToApex: 0.36,  // segundos ate o topo
  fallGravityMult: 1.55, // cai mais rapido do que sobe -> pulo "snappy"
  lowJumpMult: 2.4,      // soltar o botao cedo corta o pulo
  maxFallSpeed: 430,
  coyoteTime: 0.10,      // ainda pode pular logo depois de sair da borda
  jumpBuffer: 0.12,      // pulo apertado pouco antes de aterrissar ainda vale

  // --- dash -----------------------------------------------------------------
  dashSpeed: 330,
  dashDuration: 0.16,
  dashCooldown: 0.32,
  dashEndSpeedKeep: 0.45, // fracao da velocidade mantida ao fim do dash
  airDashes: 1,           // dashes disponiveis no ar ate tocar o chao

  // --- parede ---------------------------------------------------------------
  wallSlideSpeed: 52,
  wallJumpX: 175,
  wallJumpY: 275,
  wallJumpLockTime: 0.16, // tempo sem controle horizontal apos o wall jump

  // --- double jump (temporario: prototipo usa "apertar 2x") --------------
  // O double jump de verdade do GDD (secao 12) e outra coisa — o torso se
  // ejeta das pernas. Aqui e so o padrao classico de plataforma para testar
  // movimento aereo; a implementacao definitiva substitui isso depois.
  doubleJumpHeightMult: 0.82, // segundo pulo levemente mais fraco que o primeiro
};

export const ENERGY = {
  max: 100,
  regenPerSecond: 10,          // GDD: ~10% por segundo
  regenDelay: 1.0,             // comeca 1s apos a ultima acao
  explorationMultiplier: 0.5,  // fora de combate custa metade
  combatTimeout: 20,           // 20s sem trocar dano -> volta para exploracao

  // Custos por acao. Valores "por segundo" estao marcados.
  costs: {
    jump: 4,
    dash: 12,
    wallJump: 5,
    run: 6,          // por segundo
    wallSlide: 2,    // por segundo
    attackLight: 9,  // combo de 5 hits ~= 45 (bate com o GDD)
    attackHeavy: 22,
  },
};

export const HEALTH = {
  maxSkulls: 5,          // caveiras iniciais
  absoluteMaxSkulls: 10, // teto explorando tudo
  fragmentsPerSkull: 4,
  totalFragmentsInGame: 20,
};

export const CAMERA = {
  lookAheadX: 26,  // camera olha na direcao que o jogador encara
  lookAheadY: 10,
  smoothing: 7.5,  // maior = mais grudada no jogador
};

export const AUDIO = {
  heartbeat: {
    enabled: true,
    bpmFull: 68,    // vida cheia
    bpmEmpty: 165,  // 1 caveira
    volume: 0.35,
  },
};
