export const clamp = (v, min, max) => (v < min ? min : v > max ? max : v);

export const lerp = (a, b, t) => a + (b - a) * t;

export const sign = (v) => (v > 0 ? 1 : v < 0 ? -1 : 0);

/** Move `current` na direcao de `target` no maximo `delta`. Nunca passa do alvo. */
export function approach(current, target, delta) {
  if (current < target) return Math.min(current + delta, target);
  if (current > target) return Math.max(current - delta, target);
  return target;
}

/** Interpolacao suave independente de framerate (bom para camera). */
export const damp = (a, b, lambda, dt) => lerp(a, b, 1 - Math.exp(-lambda * dt));
