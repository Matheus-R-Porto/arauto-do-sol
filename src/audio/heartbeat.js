import { AUDIO } from '../../config/tuning.js';
import { clamp, lerp } from '../core/math.js';

/**
 * Batimento cardiaco diegetico (GDD secao 8).
 * Um esqueleto nao tem coracao — e exatamente esse o ponto: o som e a
 * lembranca de ter tido um. Acelera conforme a vida cai, silencia fora
 * de combate.
 *
 * Sintetizado com WebAudio (sem arquivo de audio): dois "thumps" graves
 * com queda de tom, no ritmo lub-dub.
 *
 * Ao sair de combate nao corta seco: os batimentos continuam tocando (no
 * bpm/intensidade atuais) enquanto um ganho de fade cai ate 0 ao longo de
 * AUDIO.heartbeat.fadeOutTime. Voltar a combate cancela o fade na hora.
 */
export class Heartbeat {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.enabled = AUDIO.heartbeat.enabled;
    this.timer = 0;
    this.fadeGain = 0; // 0 = silencioso (estado inicial, fora de combate)
  }

  /** Precisa ser chamado dentro de um gesto do usuario (regra dos navegadores). */
  resume() {
    if (!this.enabled) return;
    if (!this.ctx) {
      const Ctx = window.AudioContext ?? window.webkitAudioContext;
      if (!Ctx) {
        this.enabled = false;
        return;
      }
      this.ctx = new Ctx();
      this.master = this.ctx.createGain();
      this.master.gain.value = AUDIO.heartbeat.volume;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  toggle() {
    this.enabled = !this.enabled;
    if (this.master) this.master.gain.value = this.enabled ? AUDIO.heartbeat.volume : 0;
    return this.enabled;
  }

  /**
   * @param {number} dt
   * @param {{ healthRatio: number, active: boolean }} estado
   */
  update(dt, { healthRatio, active }) {
    if (!this.enabled || !this.ctx) {
      this.timer = 0;
      this.fadeGain = 0;
      return;
    }

    if (active) {
      this.fadeGain = 1; // volta pro combate: som cheio na hora, sem fade-in
    } else {
      this.fadeGain = Math.max(0, this.fadeGain - dt / AUDIO.heartbeat.fadeOutTime);
    }

    if (this.fadeGain <= 0) {
      this.timer = 0;
      return;
    }

    const t = clamp(healthRatio, 0, 1);
    const bpm = lerp(AUDIO.heartbeat.bpmEmpty, AUDIO.heartbeat.bpmFull, t);
    const interval = 60 / bpm;

    this.timer -= dt;
    if (this.timer > 0) return;
    this.timer = interval;

    // Perto da morte o coracao bate mais forte, nao so mais rapido.
    // fadeGain multiplica tudo: enquanto desaparece, os batimentos
    // continuam no ritmo certo, so cada vez mais fracos.
    const intensity = lerp(1.0, 0.55, t) * this.fadeGain;
    const now = this.ctx.currentTime + 0.01;
    this._thump(now, 0.9 * intensity);
    this._thump(now + Math.min(0.16, interval * 0.35), 0.6 * intensity);
  }

  _thump(time, gain) {
    const osc = this.ctx.createOscillator();
    const env = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(64, time);
    osc.frequency.exponentialRampToValueAtTime(32, time + 0.1);

    env.gain.setValueAtTime(0.0001, time);
    env.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), time + 0.012);
    env.gain.exponentialRampToValueAtTime(0.0001, time + 0.17);

    osc.connect(env).connect(this.master);
    osc.start(time);
    osc.stop(time + 0.22);
  }
}
