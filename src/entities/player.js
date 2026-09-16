import { PLAYER, COMBAT } from '../../config/tuning.js';
import { approach, sign, aabbOverlap } from '../core/math.js';

// Gravidade e impulso derivados de altura/tempo definidos em tuning.js.
// v = 2h/t   |   g = 2h/t^2   (movimento uniformemente acelerado)
const GRAVITY = (2 * PLAYER.jumpHeight) / (PLAYER.jumpTimeToApex ** 2);
const JUMP_VELOCITY = (2 * PLAYER.jumpHeight) / PLAYER.jumpTimeToApex;
const DOUBLE_JUMP_VELOCITY = JUMP_VELOCITY * PLAYER.doubleJumpHeightMult;

export class Player {
  constructor(x, y) {
    // Origem do personagem: centro horizontal, base dos pes.
    // Facilita alinhar com o chao e posicionar sprites depois.
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.w = PLAYER.width;
    this.h = PLAYER.height;

    this.facing = 1;
    this.state = 'fall';

    this.onGround = false;
    this.wasOnGround = false;
    this.wallDir = 0;        // -1 parede a esquerda, 1 a direita, 0 nenhuma
    this.wallSliding = false;
    this.gliding = false;
    this.running = false;
    this.dashing = false;

    this.coyoteTimer = 0;
    this.jumpBufferTimer = 0;
    this.dashTimer = 0;
    this.dashCooldownTimer = 0;
    this.wallJumpLockTimer = 0;
    this.airDashesLeft = PLAYER.airDashes;
    this.airJumpsLeft = 0;   // so > 0 quando abilities.doubleJump estiver ligada
    this.squash = 1;         // feedback visual de pulo/pouso

    // --- combate (M1 basico, GDD 7.3) ---
    this.comboStep = 0;          // 0..4 = hit 1..5 do combo
    this.comboWindowTimer = 0;   // tempo restante pra emendar o proximo hit
    this.attackCooldownTimer = 0;
    this.attackFlashTimer = 0;   // so pro feedback visual do golpe (placeholder de arma)

    // Gating de metroidvania: tudo comeca desligado no jogo real.
    // Na sala de teste o main.js liga dash e wallClimb.
    this.abilities = {
      boneChain: false,    // Corrente de Ossos
      dash: false,
      dashIntangible: false,
      wallClimb: false,
      glide: false,        // Planar
      doubleJump: false,
      boneSplit: false,    // Divisao de Ossos
    };
  }

  get left() { return this.x - this.w / 2; }
  get right() { return this.x + this.w / 2; }
  get top() { return this.y - this.h; }
  get bottom() { return this.y; }
  get intangible() { return this.dashing && this.abilities.dashIntangible; }

  reset(x, y) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.dashing = false;
    this.dashTimer = 0;
    this.dashCooldownTimer = 0;
    this.wallJumpLockTimer = 0;
    this.jumpBufferTimer = 0;
    this.squash = 1;
    this.state = 'fall';
  }

  // ---------------------------------------------------------------- update --

  update(dt, input, map, energy) {
    this.wasOnGround = this.onGround;

    this._tickTimers(dt);
    this._readWalls(map);

    if (input.pressed.jump) this.jumpBufferTimer = PLAYER.jumpBuffer;

    if (this.dashing) this._maybeEndDash();
    this._tryDash(input, energy);

    if (!this.dashing) {
      const droppedThrough = this._tryDropThrough(input, map);
      this._updateHorizontal(dt, input, energy);
      this._updateWallSlide(dt, input, energy);
      if (!droppedThrough) this._tryJump(input, energy);
      this._updateGlide(dt, input, energy);
      this._applyGravity(dt, input);
    }

    this._moveX(dt, map);
    this._moveY(dt, map);
    this._updateGrounded(map);
    this._resolveState();

    this.squash = approach(this.squash, 1, dt * 3.5);
  }

  _tickTimers(dt) {
    this.jumpBufferTimer = Math.max(0, this.jumpBufferTimer - dt);
    this.dashTimer = Math.max(0, this.dashTimer - dt);
    this.dashCooldownTimer = Math.max(0, this.dashCooldownTimer - dt);
    this.wallJumpLockTimer = Math.max(0, this.wallJumpLockTimer - dt);
    if (!this.onGround) this.coyoteTimer = Math.max(0, this.coyoteTimer - dt);
  }

  _readWalls(map) {
    // Sonda fina nas laterais, encurtada em cima e embaixo para nao "grudar"
    // em quinas de chao/teto.
    const top = this.top + 3;
    const h = this.h - 6;
    const right = map.overlapsSolid(this.right, top, 1, h);
    const left = map.overlapsSolid(this.left - 1, top, 1, h);
    this.wallDir = right ? 1 : left ? -1 : 0;
  }

  // ------------------------------------------------------------------ dash --

  _tryDash(input, energy) {
    if (!input.pressed.dash || !this.abilities.dash) return;
    if (this.dashing || this.dashCooldownTimer > 0) return;
    if (!this.onGround && this.airDashesLeft <= 0) return;
    if (!energy.spend('dash')) return;

    if (!this.onGround) this.airDashesLeft--;
    const dir = input.moveX !== 0 ? input.moveX : this.facing;

    this.facing = dir;
    this.dashing = true;
    this.dashTimer = PLAYER.dashDuration;
    this.vx = dir * PLAYER.dashSpeed;
    this.vy = 0;
    this.wallJumpLockTimer = 0;
    this.squash = 0.8;
  }

  _maybeEndDash() {
    if (this.dashTimer > 0) return;
    this._endDash();
  }

  _endDash() {
    if (!this.dashing) return;
    this.dashing = false;
    this.dashCooldownTimer = PLAYER.dashCooldown;
    this.vx *= PLAYER.dashEndSpeedKeep;
  }

  // ------------------------------------------------------------ horizontal --

  _updateHorizontal(dt, input, energy) {
    const dir = input.moveX;

    // Correr usa o MESMO botao do dash (tocar = dash, segurar = correr),
    // como descrito no GDD. Se a energia acaba, volta a andar sozinho.
    const wantsRun = input.held.dash && this.onGround && dir !== 0;
    this.running = wantsRun && energy.drain('run', dt);

    // Durante o empurrao do wall jump o jogador nao tem controle horizontal.
    if (this.wallJumpLockTimer > 0) return;

    if (dir !== 0) this.facing = dir;

    // No ar o teto e o airSpeed (mais rapido que andar — pular nao pode ser
    // mais lento que caminhar), independente de estar "correndo" (running so
    // existe no chao, ver wantsRun acima).
    const maxSpeed = this.onGround ? (this.running ? PLAYER.runSpeed : PLAYER.walkSpeed) : PLAYER.airSpeed;
    const accel = this.onGround ? PLAYER.groundAccel : PLAYER.airAccel;
    const decel = this.onGround ? PLAYER.groundDecel : PLAYER.airDecel;

    if (dir === 0) {
      this.vx = approach(this.vx, 0, decel * dt);
      return;
    }

    const sameWay = sign(this.vx) === dir;

    // No ar, o impulso ja conquistado e PRESERVADO. Sem isso um pulo saindo
    // de uma corrida (vx=runSpeed=158) desaceleraria de volta ao teto do ar
    // assim que decolasse — matando dash-jump e vaos longos.
    if (!this.onGround && sameWay && Math.abs(this.vx) > maxSpeed) return;

    // Trocar de direcao NO AR e instantaneo: vai direto pra velocidade
    // maxima do ar na nova direcao, sem frear e reacelerar. Isso e o que
    // permite voltar rapido pra parede ao tentar escala-la (aperta pra la,
    // o personagem ja inverte na hora em vez de derrapar).
    if (!this.onGround && sign(this.vx) !== 0 && !sameWay) {
      this.vx = dir * PLAYER.airSpeed;
      return;
    }

    // No chao, trocar de direcao so usa a desaceleracao (mais forte): vira
    // mais rapido que simplesmente acelerar do zero, mas ainda e gradual.
    const turning = sign(this.vx) !== 0 && !sameWay;
    this.vx = approach(this.vx, dir * maxSpeed, (turning ? decel : accel) * dt);
  }

  // ------------------------------------------------------------------ pulo --

  _tryJump(input, energy) {
    if (this.jumpBufferTimer <= 0) return;

    const canGroundJump = this.onGround || this.coyoteTimer > 0;
    const canWallJump = this.abilities.wallClimb && !this.onGround && this.wallDir !== 0;
    // "Apertar 2 vezes": so libera o pulo extra quando ja se saiu do chao
    // SEM usar coyote/wall jump nesse instante — senao um pulo normal
    // "gastaria" o double jump por engano.
    const canAirJump =
      !canGroundJump && !canWallJump && this.abilities.doubleJump && this.airJumpsLeft > 0;

    if (canGroundJump) {
      if (!energy.spend('jump')) return;
      this.vy = -JUMP_VELOCITY;
      this.onGround = false;
      this.coyoteTimer = 0;
      this.jumpBufferTimer = 0;
      this.squash = 0.78;
    } else if (canWallJump) {
      if (!energy.spend('wallJump')) return;
      this.vx = -this.wallDir * PLAYER.wallJumpX;
      this.vy = -PLAYER.wallJumpY;
      this.facing = -this.wallDir;
      this.wallJumpLockTimer = PLAYER.wallJumpLockTime;
      this.jumpBufferTimer = 0;
      this.airDashesLeft = PLAYER.airDashes; // wall jump devolve o dash aereo
      this.airJumpsLeft = this.abilities.doubleJump ? 1 : 0;
      this.squash = 0.8;
    } else if (canAirJump) {
      if (!energy.spend('jump')) return;
      this.airJumpsLeft--;
      this.vy = -DOUBLE_JUMP_VELOCITY;
      this.jumpBufferTimer = 0;
      this.squash = 0.85;
    }
  }

  _tryDropThrough(input, map) {
    if (!this.onGround || !input.held.down || !input.pressed.jump) return false;
    if (map.overlapsSolid(this.left, this.top + 1, this.w, this.h)) return false;
    if (map.oneWayLandingY(this.left, this.w, this.y, this.y + 1) === null) return false;

    this.y += 1; // um pixel para dentro do tile: deixa de contar como pouso
    this.onGround = false;
    this.coyoteTimer = 0;
    this.jumpBufferTimer = 0;
    return true;
  }

  _updateWallSlide(dt, input, energy) {
    this.wallSliding = false;
    if (!this.abilities.wallClimb) return;
    if (this.onGround || this.wallDir === 0) return;
    if (input.moveX !== this.wallDir) return; // precisa empurrar contra a parede
    if (this.vy < 0) return;                  // so vale na descida
    if (!energy.drain('wallSlide', dt)) return;

    this.wallSliding = true;
    this.facing = this.wallDir;
  }

  // ----------------------------------------------------------------- planar --
  // Segurar o pulo depois do apice troca a queda normal por uma descida lenta
  // e controlada — funciona igual apos o 1o ou o 2o pulo (double jump), ja
  // que so depende de "esta caindo + segurando o botao", nao de qual pulo
  // originou a subida. Roda DEPOIS de _tryJump de proposito: se um pulo
  // (double jump, por exemplo) disparar nesse mesmo frame, vy volta a
  // negativo e o planar corretamente nao ativa.
  _updateGlide(dt, input, energy) {
    this.gliding = false;
    if (!this.abilities.glide) return;
    if (this.onGround || this.wallSliding) return;
    if (!input.held.jump) return;
    if (this.vy < 0) return; // so depois do apice, na descida
    if (!energy.drain('glide', dt)) return;

    this.gliding = true;
  }

  _applyGravity(dt, input) {
    let g = GRAVITY;
    if (this.vy > 0) g *= PLAYER.fallGravityMult;                       // cai mais rapido
    else if (this.vy < 0 && !input.held.jump) g *= PLAYER.lowJumpMult;  // pulo curto

    const tetoQueda = this.gliding ? PLAYER.glideFallSpeed : PLAYER.maxFallSpeed;
    this.vy = Math.min(this.vy + g * dt, tetoQueda);
    if (this.wallSliding) this.vy = Math.min(this.vy, PLAYER.wallSlideSpeed);
  }

  // -------------------------------------------------------------- colisao --
  // Move 1px por vez e desfaz o passo que colidiu. Simples, sem tunelamento,
  // e barato o bastante (no maximo ~8 iteracoes por eixo por frame).

  _moveX(dt, map) {
    const ts = map.tileSize;
    let remaining = this.vx * dt;
    while (Math.abs(remaining) > 1e-6) {
      const step = Math.sign(remaining) * Math.min(1, Math.abs(remaining));
      remaining -= step;
      this.x += step;
      if (map.overlapsSolid(this.left, this.top, this.w, this.h)) {
        // Encosta exatamente na face do tile (nao volta ao passo anterior:
        // isso deixaria ate 1px de folga visivel contra a parede).
        this.x =
          step > 0
            ? Math.floor(this.right / ts) * ts - this.w / 2
            : (Math.floor(this.left / ts) + 1) * ts + this.w / 2;
        this.vx = 0;
        this._endDash(); // dash que bate na parede termina ali
        return;
      }
    }
  }

  _moveY(dt, map) {
    const ts = map.tileSize;
    let remaining = this.vy * dt;
    while (Math.abs(remaining) > 1e-6) {
      const step = Math.sign(remaining) * Math.min(1, Math.abs(remaining));
      remaining -= step;
      const prev = this.y;
      this.y += step;

      if (map.overlapsSolid(this.left, this.top, this.w, this.h)) {
        this.y =
          step > 0
            ? Math.floor(this.y / ts) * ts                      // pousa no topo do tile
            : (Math.floor(this.top / ts) + 1) * ts + this.h;    // bate a cabeca
        this.vy = 0;
        return;
      }
      const landing = map.oneWayLandingY(this.left, this.w, prev, this.y);
      if (landing !== null) {
        this.y = landing;
        this.vy = 0;
        return;
      }
    }
  }

  _updateGrounded(map) {
    const solidBelow = map.overlapsSolid(this.left, this.top + 1, this.w, this.h);
    const oneWayBelow =
      this.vy >= 0 && map.oneWayLandingY(this.left, this.w, this.y, this.y + 1) !== null;

    this.onGround = solidBelow || oneWayBelow;

    if (this.onGround) {
      this.coyoteTimer = PLAYER.coyoteTime;
      this.airDashesLeft = PLAYER.airDashes;
      this.airJumpsLeft = this.abilities.doubleJump ? 1 : 0;
      if (!this.wasOnGround) this.squash = 1.22; // achata ao aterrissar
    }
  }

  _resolveState() {
    if (this.dashing) this.state = 'dash';
    else if (this.wallSliding) this.state = 'wallslide';
    else if (this.gliding) this.state = 'glide';
    else if (!this.onGround) this.state = this.vy < 0 ? 'jump' : 'fall';
    else if (Math.abs(this.vx) > 4) this.state = this.running ? 'run' : 'walk';
    else this.state = 'idle';
  }

  // --------------------------------------------------------------- combate --
  // Primeiro corte do combo de M1 (GDD 7.3): ate 5 hits em sequencia, cada
  // um com uma pequena janela pra emendar o proximo antes do combo resetar.
  // O 5o hit (finisher) da um knockback bem maior — "joga pra tras" de
  // verdade — e o combo reinicia do 1o hit em seguida (nao precisa esperar).
  //
  // Chamado separado de update() (nao dentro dele) porque precisa da lista
  // de inimigos, que as fisicas de movimento nao usam.
  updateAttack(dt, input, energy, enemies) {
    this.attackCooldownTimer = Math.max(0, this.attackCooldownTimer - dt);
    this.comboWindowTimer = Math.max(0, this.comboWindowTimer - dt);
    this.attackFlashTimer = Math.max(0, this.attackFlashTimer - dt);

    if (this.comboWindowTimer <= 0) this.comboStep = 0; // combo expirou, recomeca do hit 1

    if (!input.pressed.attackLight) return;
    if (this.attackCooldownTimer > 0) return;
    if (!energy.spend('attackLight')) return;

    const cfg = COMBAT.attackLight;
    const isFinisher = this.comboStep === cfg.comboHits - 1;
    const box = this._attackHitbox();

    for (const enemy of enemies) {
      if (enemy.dead) continue;
      if (!aabbOverlap(box.left, box.top, box.w, box.h, enemy.left, enemy.top, enemy.w, enemy.h)) continue;
      const kb = isFinisher ? cfg.finisherKnockback : cfg.knockback;
      if (enemy.takeHit(cfg.damage, this.facing * kb.vx, kb.vy)) energy.markCombat();
    }

    this.attackCooldownTimer = cfg.swingDuration;
    this.comboWindowTimer = cfg.comboWindow;
    this.comboStep = (this.comboStep + 1) % cfg.comboHits;
    this.attackFlashTimer = 0.12;
  }

  /** Caixa do golpe: um retangulo na frente do jogador, mesma altura do corpo. */
  _attackHitbox() {
    const reach = COMBAT.attackLight.reach;
    const left = this.facing > 0 ? this.right : this.left - reach;
    return { left, top: this.top, w: reach, h: this.h };
  }

  // ------------------------------------------------------------------ draw --
  // Placeholder proposital: bonequinho de ossos desenhado com retangulos.
  // Vai ser substituido por spritesheet quando houver arte.

  draw(ctx, invulnTimer = 0) {
    const sq = this.squash;
    const px = Math.round(this.x);
    const py = Math.round(this.y);

    // Sombra: ajuda a ler a altura no ar.
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(px - 5, py - 1, 10, 2);

    // Pisca durante a invulnerabilidade pos-dano (feedback de "acabei de ser
    // atingido"). O esqueleto some por metade dos frames, sombra continua.
    if (invulnTimer > 0 && Math.floor(invulnTimer * 18) % 2 === 0) return;

    ctx.save();
    ctx.translate(px, py);
    ctx.scale(1 / sq, sq);

    const bone = this.intangible ? 'rgba(232,228,217,0.45)' : '#e8e4d9';
    const boneDark = this.intangible ? 'rgba(150,146,136,0.45)' : '#9b9689';
    const f = this.facing;

    // pernas
    ctx.fillStyle = bone;
    ctx.fillRect(-3, -8, 2, 8);
    ctx.fillRect(1, -8, 2, 8);
    // bacia
    ctx.fillStyle = boneDark;
    ctx.fillRect(-3, -10, 6, 2);
    // coluna + costelas
    ctx.fillStyle = bone;
    ctx.fillRect(-1, -17, 2, 7);
    ctx.fillRect(-4, -16, 8, 1);
    ctx.fillRect(-4, -14, 8, 1);
    ctx.fillRect(-3, -12, 6, 1);
    // cranio
    ctx.fillRect(-4 + f, -23, 8, 6);
    ctx.fillStyle = boneDark;
    ctx.fillRect(-3 + f, -17, 6, 1); // mandibula
    // olhos: a brasa do Sol que nunca apagou
    ctx.fillStyle = this.intangible ? '#ffd9a0' : '#ff9a3c';
    ctx.fillRect(-3 + f, -21, 2, 2);
    ctx.fillRect(1 + f, -21, 2, 2);

    ctx.restore();

    // Golpe de M1: so um flash branco na caixa de ataque por enquanto —
    // sem arma de verdade ainda, isso e placeholder de feedback.
    if (this.attackFlashTimer > 0) {
      const box = this._attackHitbox();
      const t = this.attackFlashTimer / 0.12;
      ctx.fillStyle = `rgba(255,255,255,${(0.55 * t).toFixed(2)})`;
      ctx.fillRect(Math.round(box.left), Math.round(box.top), box.w, box.h);
    }
  }
}
