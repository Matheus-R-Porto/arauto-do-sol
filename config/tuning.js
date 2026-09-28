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

const WALK_SPEED = 92; // Caminhada e movimento aéreo comum compartilham o teto.

export const PLAYER = {
  width: 10,         // hitbox, nao o sprite
  height: 22,

  // --- chao ---
  walkSpeed: WALK_SPEED,
  runSpeed: 158,
  groundAccel: 900,
  groundDecel: 1400,

  // --- ar ---
  // Pular sem correr nao aumenta a velocidade horizontal. O impulso de uma
  // corrida iniciada no chao continua preservado durante o salto.
  airSpeed: WALK_SPEED,
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
  combatTimeout: 10,          // 10s sem causar/receber dano -> exploracao

  // Custos por acao. Valores "por segundo" estao marcados.
  costs: {
    jump: 2,
    dash: 6,
    wallJump: 2.5,
    run: 3,            // por segundo
    wallSlide: 1,      // por segundo
    glide: 3,          // por segundo
    attackLight: 4.5,  // combo de 5 hits = 22.5 em combate
    attackM2: 4.5,     // mesmo custo do M1 por enquanto — so o dano que dobra
    attackHeavy: 11,
  },
};

export const HEALTH = {
  invulnerability: 1.0,
  maxSkulls: 5,          // caveiras iniciais
  absoluteMaxSkulls: 10, // teto explorando tudo
  fragmentsPerSkull: 4,
  totalFragmentsInGame: 20,
};

// Vertical slice: gameplay values, kept separate from the established physics.
export const DEMO = {
  fade: 0.18, deathDelay: 0.85, arrivalGrace: 0.45, portalRadius: 22,
  checkpointRadius: 25, pickupRadius: 18, notificationTime: 3.5,
  damage: 1, hurtVx: 105, hurtVy: -95, hurtLock: 0.14,
  bossIntro: 1.8, bossSilence: 2.4, endFade: 1.2,
  hitFlash: 0.12, hitstop: 0.035, bossHitstop: 0.09,
  enemyStun: 0.18, patrolRadius: 64, verticalDetect: 45,
  safeEdgePadding: 8, safeFloorProbe: 4,
  projectile: { speed: 95, size: 6, life: 4.5, damage: 1 },
};
export const ENEMIES = {
  walker: { hp: 5, width: 14, height: 24, speed: 29, detect: 145, range: 27, reach: 30, windup: 0.65, active: 0.16, recovery: 1.25, damage: 1, color: '#91a68a' },
  lunger: { hp: 7, width: 22, height: 18, speed: 16, detect: 155, range: 135, reach: 8, windup: 0.85, active: 0.48, recovery: 1.8, chargeSpeed: 185, damage: 1, color: '#b88b72' },
  ranged: { hp: 4, width: 12, height: 32, speed: 22, detect: 210, range: 190, retreat: 70, reach: 0, windup: 0.9, active: 0.12, recovery: 2.3, damage: 1, color: '#afa0c7' },
};
export const BOSS = {
  hp: 100, width: 42, height: 65, speed: 38, approachTime: 2.3,
  range: 58, reach: 67, phaseRatio: 0.5, phaseRecovery: 0.85,
  slash: { windup: 0.95, active: 0.2, recovery: 2.1, hitHeight: 30, damage: 1 },
  charge: { windup: 1.15, active: 0.95, recovery: 2.4, speed: 180, hitHeight: 24, damage: 1 },
  slam: { windup: 1.2, active: 0.6, recovery: 2.6, radius: 60, height: 88, hitHeight: 12, damage: 2 },
};
export const EFFECTS = {
  volume: 0.16,
  tones: { hit:[170,0.07], hurt:[85,0.16], checkpoint:[520,0.3], death:[48,0.4], victory:[220,0.7] },
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
  // hurtInvuln e so uma trava de "nao registrar 2 hits no MESMO instante"
  // (ex.: dano duplicado por bug), nao uma janela de reacao de verdade —
  // cada golpe ja e um hit-check unico por definicao (ver Player.
  // _updateOneAttack). Por isso e tao curto: precisa ser MENOR que 1 frame
  // (1/60s ~= 0.0167s) pra nao atrapalhar intercalar M1/M2 rapido (o 2o
  // golpe pode chegar ja no frame seguinte ao 1o).
  hurtInvuln: 0.01,
  hurtFlashTime: 0.15,   // duracao do pisca-pisca visual ao levar dano (desacoplado do invuln)
  deathFadeTime: 0.4,    // segundos ate sumir de vez depois de morrer
};
