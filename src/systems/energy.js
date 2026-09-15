import { ENERGY } from '../../config/tuning.js';

/**
 * Barra de energia UNICA (GDD secao 8).
 * Dash, correr, pular, rolar, atacar e magia bebem todos daqui.
 *
 * Dois modos:
 *   - combate:    custo cheio
 *   - exploracao: metade do custo (o jogo entra nesse modo apos
 *                 ENERGY.combatTimeout segundos sem trocar dano)
 */
export class Energy {
  constructor() {
    this.max = ENERGY.max;
    this.current = this.max;
    this.timeSinceAction = 99;
    this.timeSinceCombat = 99;
  }

  get ratio() {
    return this.current / this.max;
  }

  get mode() {
    return this.timeSinceCombat < ENERGY.combatTimeout ? 'combate' : 'exploracao';
  }

  get multiplier() {
    return this.mode === 'combate' ? 1 : ENERGY.explorationMultiplier;
  }

  get regenerating() {
    return this.timeSinceAction >= ENERGY.regenDelay && this.current < this.max;
  }

  costOf(action) {
    return (ENERGY.costs[action] ?? 0) * this.multiplier;
  }

  can(action) {
    return this.current >= this.costOf(action);
  }

  /** Custo pontual (pulo, dash, ataque). Retorna false se faltou energia. */
  spend(action) {
    const cost = this.costOf(action);
    if (this.current < cost) return false;
    this.current -= cost;
    this.timeSinceAction = 0;
    return true;
  }

  /** Custo continuo (correr, deslizar na parede). Cobrado por segundo. */
  drain(action, dt) {
    if (this.current <= 0) return false;
    this.current = Math.max(0, this.current - this.costOf(action) * dt);
    this.timeSinceAction = 0;
    return true;
  }

  refill() {
    this.current = this.max;
  }

  /** Chamar sempre que o jogador causar ou receber dano. */
  markCombat() {
    this.timeSinceCombat = 0;
  }

  update(dt) {
    this.timeSinceAction += dt;
    this.timeSinceCombat += dt;
    if (this.timeSinceAction >= ENERGY.regenDelay) {
      this.current = Math.min(this.max, this.current + ENERGY.regenPerSecond * dt);
    }
  }
}
