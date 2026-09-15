/**
 * Fundo procedural com parallax.
 *
 * Detalhe de lore (GDD secao 3): sem o Sol, o "dia" e iluminado pela Lua de
 * Fogo e as estrelas continuam visiveis mesmo de dia. O ceu do jogo ja conta
 * essa historia sozinho, sem nenhum NPC precisar explicar.
 */

const STAR_COUNT = 110;

export class Background {
  constructor(viewW, viewH, seed = 20260915) {
    // PRNG determinista: o ceu e sempre o mesmo entre execucoes.
    let s = seed >>> 0;
    const rand = () => {
      s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
      return s / 4294967296;
    };

    this.fieldW = viewW * 2;
    this.fieldH = viewH * 2;
    this.stars = Array.from({ length: STAR_COUNT }, () => ({
      x: rand() * this.fieldW,
      y: rand() * this.fieldH,
      depth: 0.08 + rand() * 0.28, // quanto menor, mais longe
      brightness: 0.25 + rand() * 0.75,
      twinkle: rand() * Math.PI * 2,
    }));
  }

  draw(ctx, camera, viewW, viewH, time) {
    // Ceu
    const sky = ctx.createLinearGradient(0, 0, 0, viewH);
    sky.addColorStop(0, '#120c1c');
    sky.addColorStop(0.65, '#1b1024');
    sky.addColorStop(1, '#241326');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, viewW, viewH);

    // Lua de Fogo: o "sol" fraco deste mundo.
    const mx = viewW * 0.78 - camera.ox * 0.04;
    const my = viewH * 0.2 - camera.oy * 0.04;
    const glow = ctx.createRadialGradient(mx, my, 2, mx, my, 46);
    glow.addColorStop(0, 'rgba(214, 96, 52, 0.45)');
    glow.addColorStop(1, 'rgba(214, 96, 52, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(mx - 48, my - 48, 96, 96);
    ctx.fillStyle = '#8f3a24';
    ctx.beginPath();
    ctx.arc(mx, my, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#b6512c';
    ctx.beginPath();
    ctx.arc(mx - 2, my - 2, 8, 0, Math.PI * 2);
    ctx.fill();

    // Estrelas (visiveis mesmo "de dia")
    for (const star of this.stars) {
      const x = mod(star.x - camera.ox * star.depth, this.fieldW);
      const y = mod(star.y - camera.oy * star.depth, this.fieldH);
      if (x > viewW || y > viewH) continue;
      const flicker = 0.75 + 0.25 * Math.sin(time * 1.7 + star.twinkle);
      ctx.fillStyle = `rgba(226, 224, 245, ${(star.brightness * flicker).toFixed(3)})`;
      ctx.fillRect(Math.round(x), Math.round(y), 1, 1);
    }
  }
}

const mod = (v, m) => ((v % m) + m) % m;
