import { ZOMBIE } from '../../config/tuning.js';
import { approach } from '../core/math.js';

/**
 * Zumbi de teste — SEM IA e SEM ataque proprio ainda. So um alvo com vida,
 * gravidade e knockback, pra validar o combo basico de M1 antes de desenhar
 * comportamento de inimigo de verdade.
 */
export class Zombie {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.w = ZOMBIE.width;
    this.h = ZOMBIE.height;
    this.facing = -1;

    this.maxHealth = ZOMBIE.maxHealth;
    this.health = this.maxHealth;
    this.dead = false;
    this.deathTimer = 0;
    this.hurtTimer = 0;  // i-frames curtas por hit
    this.flashTimer = 0; // feedback visual de "acabei de levar um hit"
    this.onGround = false;
  }

  get left() { return this.x - this.w / 2; }
  get right() { return this.x + this.w / 2; }
  get top() { return this.y - this.h; }
  get bottom() { return this.y; }
  /** Morreu e ja terminou de sumir — hora de tirar da lista em main.js. */
  get finished() { return this.dead && this.deathTimer <= 0; }

  /** @returns {boolean} true se o hit realmente aconteceu (nao estava em i-frames). */
  takeHit(damage, knockbackVx, knockbackVy) {
    if (this.dead || this.hurtTimer > 0) return false;

    this.health = Math.max(0, this.health - damage);
    this.hurtTimer = ZOMBIE.hurtInvuln;
    this.flashTimer = ZOMBIE.hurtFlashTime;
    this.vx = knockbackVx;
    this.vy = knockbackVy;
    if (knockbackVx !== 0) this.facing = Math.sign(knockbackVx);

    if (this.health <= 0) {
      this.dead = true;
      this.deathTimer = ZOMBIE.deathFadeTime;
    }
    return true;
  }

  update(dt, map) {
    if (this.dead) {
      this.deathTimer = Math.max(0, this.deathTimer - dt);
      this._applyPhysics(dt, map); // continua acomodando no chao enquanto some
      return;
    }

    this.hurtTimer = Math.max(0, this.hurtTimer - dt);
    this.flashTimer = Math.max(0, this.flashTimer - dt);
    this._applyPhysics(dt, map);
  }

  _applyPhysics(dt, map) {
    this.vy = Math.min(this.vy + ZOMBIE.gravity * dt, ZOMBIE.maxFallSpeed);
    this.vx = approach(this.vx, 0, ZOMBIE.knockbackDrag * dt);

    this._moveAxis(map, 'x', this.vx * dt);
    this._moveAxis(map, 'y', this.vy * dt);

    this.onGround = map.overlapsSolid(this.left, this.top + 1, this.w, this.h);
  }

  // Colisao simples 1px-por-vez contra o tilemap — mesma ideia do player,
  // sem as sutilezas de plataforma de uma via (zumbi ainda nao precisa disso).
  _moveAxis(map, axis, distance) {
    let remaining = distance;
    while (Math.abs(remaining) > 1e-6) {
      const step = Math.sign(remaining) * Math.min(1, Math.abs(remaining));
      remaining -= step;
      this[axis] += step;
      if (map.overlapsSolid(this.left, this.top, this.w, this.h)) {
        this[axis] -= step;
        if (axis === 'x') this.vx = 0;
        else this.vy = 0;
        return;
      }
    }
  }

  draw(ctx) {
    const px = Math.round(this.x);
    const py = Math.round(this.y);
    const alpha = this.dead ? Math.max(0, this.deathTimer / ZOMBIE.deathFadeTime) : 1;
    const flashing = this.flashTimer > 0 && Math.floor(this.flashTimer * 40) % 2 === 0;
    const f = this.facing;

    ctx.save();
    ctx.globalAlpha = alpha;

    // sombra
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(px - 6, py - 1, 12, 2);

    const skin = flashing ? '#f2f2f2' : '#5c7a4a';
    const skinDark = flashing ? '#cfcfcf' : '#3d5230';

    ctx.translate(px, py);

    // pernas
    ctx.fillStyle = skinDark;
    ctx.fillRect(-4, -9, 3, 9);
    ctx.fillRect(1, -9, 3, 9);
    // tronco
    ctx.fillStyle = skin;
    ctx.fillRect(-5, -20, 10, 11);
    // bracos caidos (visual de "zumbi")
    ctx.fillRect(-7, -18, 2, 8);
    ctx.fillRect(5, -18, 2, 8);
    // cabeca
    ctx.fillRect(-4 + f, -26, 8, 7);
    // olho
    ctx.fillStyle = '#c23b3b';
    ctx.fillRect(-1 + f * 2, -24, 2, 2);

    ctx.restore();

    // barra de vida (fora do save/translate: sempre no tamanho normal)
    if (!this.dead) {
      const barW = 16;
      ctx.fillStyle = '#100d1c';
      ctx.fillRect(px - barW / 2 - 1, py - 31, barW + 2, 4);
      ctx.fillStyle = '#c23b3b';
      ctx.fillRect(px - barW / 2, py - 30, barW * (this.health / this.maxHealth), 2);
    }
  }
}
