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
  // airSpeed e o teto horizontal so pra quando NAO esta no chao (pulando ou
  // caindo) — deliberadamente mais rapido que o walkSpeed, senao pular fica
  // mais lento que andar, o que e estranho.
  airSpeed: 130,
  // airAccel: taxa pra ACELERAR ate o airSpeed (saindo do zero ou mantendo
  // a mesma direcao). Trocar de direcao no ar NAO usa isso — e instantaneo
  // (ver player.js _updateHorizontal), pra dar retorno rapido a parede ao
  // tentar escalar. airDecel so entra quando solta a direcao (freia ate 0).
  airAccel: 1100,
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

  // --- planar (Planar do GDD, secao 12) --------------------------------------
  // Segurar o pulo depois do apice (em vez de soltar) troca a queda normal
  // por uma descida lenta, drenando energia continuamente (ver
  // ENERGY.costs.glide). Funciona igual apos o 1o ou o 2o pulo (double
  // jump) — so depende de estar caindo e segurando o botao.
  glideFallSpeed: 45, // bem mais lento que maxFallSpeed (430) e que o wall slide (52)

  // --- dash -----------------------------------------------------------------
  dashSpeed: 330,
  dashDuration: 0.16,
  dashCooldown: 0.32,
  dashEndSpeedKeep: 0.45, // fracao da velocidade mantida ao fim do dash
  airDashes: 1,           // dashes disponiveis no ar ate tocar o chao

  // --- parede ---------------------------------------------------------------
  // wallJumpX e a distancia que o wall jump te chuta pra longe da parede.
  // Antes de trocar de direcao no ar virar instantanea (ver player.js
  // _updateHorizontal), esse valor era bem sensivel: acima de ~95 o jogador
  // nao conseguia mais voltar a tempo pra REGARRAR A MESMA parede (o que e
  // o que permite escalar uma parede unica, nao so pular entre duas de
  // frente tipo poco). Com a troca instantanea, isso deixou de ser um
  // problema — testado ate 220 sem quebrar nem a escalada nem a travessia
  // do poco de duas paredes, e o ganho de altura por ciclo so melhora com
  // um empuxo maior. 185 e calibrado pra, pulando da parede SEM segurar
  // nenhuma direcao, o personagem se afastar uns 50px antes de parar
  // horizontalmente (ex.: sai de x=21 e para por volta de x=71).
  wallSlideSpeed: 52,
  wallJumpX: 185,
  wallJumpY: 275,
  wallJumpLockTime: 0.09, // curto o bastante pra retomar o controle a tempo de voltar

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
    glide: 6,        // por segundo
    attackLight: 9,  // combo de 5 hits ~= 45 (bate com o GDD)
    attackM2: 9,     // mesmo custo do M1 por enquanto — so o dano que dobra
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
    fadeOutTime: 1.4, // segundos pra sumir de vez ao sair de combate (nao corta seco)
  },
};

// =============================================================================
// COMBATE — primeiro corte, M1 e M2 (GDD 7.3). As duas so tem UM combo cada
// (nao alternam entre si ainda — isso e coisa de empunhadura dupla de
// verdade, que ainda nao existe). Por enquanto sao dois ataques paralelos
// e independentes, mesma mecanica de combo, so o dano do M2 e o dobro.
// =============================================================================

const KNOCKBACK_PADRAO = { vx: 60, vy: -30 };            // hits 1-4: so um empurraozinho (hitstun)
const FINISHER_KNOCKBACK_PADRAO = { vx: 260, vy: -170 }; // 5o hit: o combo "joga pra tras" de verdade

export const COMBAT = {
  attackLight: {
    comboHits: 5,        // depois do 5o hit, o combo reinicia do 1o
    comboWindow: 0.6,    // segundos pra emendar o proximo hit antes do combo resetar
    swingDuration: 0.25, // tempo minimo entre dois hits (nao da pra spammar mais rapido)
    reach: 18,           // alcance a partir da frente do jogador (altura = a do proprio jogador)
    damage: 1,
    knockback: KNOCKBACK_PADRAO,
    finisherKnockback: FINISHER_KNOCKBACK_PADRAO,
  },
  attackM2: {
    // "mesma coisa" do M1 — so o dano que e diferente (o dobro, por enquanto).
    comboHits: 5,
    comboWindow: 0.6,
    swingDuration: 0.25,
    reach: 18,
    damage: 2,
    knockback: KNOCKBACK_PADRAO,
    finisherKnockback: FINISHER_KNOCKBACK_PADRAO,
  },
};

// Inimigo de teste — sem IA nem ataque proprio ainda. So um alvo com vida,
// gravidade e knockback, pra validar o combo de M1/M2 antes de desenhar
// comportamento de inimigo de verdade.
export const ZOMBIE = {
  width: 14,
  height: 24,
  maxHealth: 12,         // 12 hits de M1 (dano 1 cada) ou 6 de M2 (dano 2 cada) matam
  gravity: 1400,
  maxFallSpeed: 500,
  knockbackDrag: 900,    // desaceleracao horizontal do empurrao
  hurtInvuln: 0.15,      // curto — bem menor que swingDuration, nao atrapalha o combo do jogador
  deathFadeTime: 0.4,    // segundos ate sumir de vez depois de morrer
};
