import { HEALTH } from '../../config/tuning.js';

// Caveira 7x7 desenhada em pixels. '#' = osso, 'o' = orbita, '.' = vazio.
const SKULL = [
  '.#####.',
  '#######',
  '#.###.#',
  '#.###.#',
  '#######',
  '.#####.',
  '.#.#.#.',
];
const SKULL_W = 7;
const SKULL_H = 7;
const SKULL_GAP = 2;

function drawSkull(ctx, x, y, filled) {
  const body = filled ? '#f1ece0' : '#3a3450';
  const socket = filled ? '#2a1a12' : '#221e33';
  for (let r = 0; r < SKULL_H; r++) {
    for (let c = 0; c < SKULL_W; c++) {
      const ch = SKULL[r][c];
      if (ch === '.') continue;
      ctx.fillStyle = ch === '#' ? body : socket;
      ctx.fillRect(x + c, y + r, 1, 1);
    }
  }
  if (filled) {
    // orbitas com a mesma brasa dos olhos do Arauto
    ctx.fillStyle = '#ff9a3c';
    ctx.fillRect(x + 1, y + 2, 1, 2);
    ctx.fillRect(x + 5, y + 2, 1, 2);
  }
}

const BAR_X = 8;
const BAR_Y = 20;
const BAR_W = 92;
const BAR_H = 6;

export function drawHUD(ctx, { health, energy }) {
  // --- caveiras ---
  for (let i = 0; i < health.maxSkulls; i++) {
    drawSkull(ctx, BAR_X + i * (SKULL_W + SKULL_GAP), 8, i < health.skulls);
  }

  // --- barra de energia ---
  ctx.fillStyle = '#100d1c';
  ctx.fillRect(BAR_X - 1, BAR_Y - 1, BAR_W + 2, BAR_H + 2);
  ctx.fillStyle = '#241f36';
  ctx.fillRect(BAR_X, BAR_Y, BAR_W, BAR_H);

  const filled = Math.round(BAR_W * energy.ratio);
  // Em exploracao a barra fica mais fria; em combate, quente.
  const emCombate = energy.mode === 'combate';
  ctx.fillStyle = emCombate ? '#ffb347' : '#8fd3e8';
  ctx.fillRect(BAR_X, BAR_Y, filled, BAR_H);
  ctx.fillStyle = emCombate ? '#ffe0a8' : '#d6f2fa';
  ctx.fillRect(BAR_X, BAR_Y, filled, 1);

  // Marca discreta de regeneracao ativa.
  if (energy.regenerating && filled < BAR_W) {
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillRect(BAR_X + filled, BAR_Y, 1, BAR_H);
  }

  // --- fragmentos de vida coletados ---
  if (health.fragments > 0) {
    ctx.fillStyle = '#c9c2b4';
    for (let i = 0; i < HEALTH.fragmentsPerSkull; i++) {
      const on = i < health.fragments;
      ctx.fillStyle = on ? '#f1ece0' : '#3a3450';
      ctx.fillRect(BAR_X + i * 4, BAR_Y + BAR_H + 3, 3, 3);
    }
  }
}
