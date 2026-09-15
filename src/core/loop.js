// Game loop de passo fixo.
// Motivo: fisica de plataforma com passo variavel produz alturas de pulo
// diferentes em monitores diferentes. O passo fixo mantem o jogo deterministico.
export function createLoop({ update, render, step = 1 / 60, maxFrameTime = 0.25 }) {
  let accumulator = 0;
  let last = 0;
  let rafId = 0;
  let running = false;

  const frame = (nowMs) => {
    if (!running) return;
    rafId = requestAnimationFrame(frame);

    const now = nowMs / 1000;
    let delta = now - last;
    last = now;

    // Aba em background / breakpoint no debugger -> evita "espiral da morte".
    if (delta > maxFrameTime) delta = maxFrameTime;
    accumulator += delta;

    let steps = 0;
    while (accumulator >= step && steps < 5) {
      update(step);
      accumulator -= step;
      steps++;
    }
    render();
  };

  return {
    start() {
      if (running) return;
      running = true;
      last = performance.now() / 1000;
      rafId = requestAnimationFrame(frame);
    },
    stop() {
      running = false;
      cancelAnimationFrame(rafId);
    },
  };
}
