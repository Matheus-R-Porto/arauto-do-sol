import { HEALTH } from '../../config/tuning.js';

/**
 * Vida em caveiras (GDD secao 11).
 * 5 caveiras iniciais, 4 fragmentos = 1 caveira extra, teto de 10.
 */
export class Health {
  constructor() {
    this.maxSkulls = HEALTH.maxSkulls;
    this.skulls = this.maxSkulls;
    this.fragments = 0;
    this.invulnTimer = 0;
  }

  get ratio() {
    return this.skulls / this.maxSkulls;
  }

  get dead() {
    return this.skulls <= 0;
  }

  damage(amount = 1) {
    if (this.invulnTimer > 0 || this.dead) return false;
    this.skulls = Math.max(0, this.skulls - amount);
    this.invulnTimer = HEALTH.invulnerability;
    return true;
  }

  heal(amount = 1) {
    this.skulls = Math.min(this.maxSkulls, this.skulls + amount);
  }

  /** Fragmento de vida coletado no mapa. Retorna true se virou caveira nova. */
  addFragment() {
    if (this.maxSkulls >= HEALTH.absoluteMaxSkulls) return false;
    this.fragments++;
    if (this.fragments < HEALTH.fragmentsPerSkull) return false;
    this.fragments = 0;
    this.maxSkulls++;
    this.skulls = this.maxSkulls; // ganhar uma caveira cura por completo
    return true;
  }

  restore() {
    this.skulls = this.maxSkulls;
    this.invulnTimer = 0;
  }

  update(dt) {
    this.invulnTimer = Math.max(0, this.invulnTimer - dt);
  }
}
