import { RENDER } from '../config/tuning.js';
import { createLoop } from './core/loop.js';
import { Input } from './core/input.js';
import { Camera } from './core/camera.js';
import { TileMap } from './world/tilemap.js';
import { Background } from './world/background.js';
import { salaDeTeste } from './world/rooms/sala-de-teste.js';
import { Player } from './entities/player.js';
import { Energy } from './systems/energy.js';
import { Health } from './systems/health.js';
import { drawHUD } from './ui/hud.js';
import { Heartbeat } from './audio/heartbeat.js';

// ----------------------------------------------------------------- canvas --

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d', { alpha: false });
canvas.width = RENDER.width;
canvas.height = RENDER.height;

function fitCanvas() {
  // Escala SEMPRE inteira: meio pixel destroi a leitura de pixel art.
  const scale = Math.max(
    1,
    Math.min(
      Math.floor(window.innerWidth / RENDER.width),
      Math.floor((window.innerHeight - 48) / RENDER.height)
    )
  );
  canvas.style.width = `${RENDER.width * scale}px`;
  canvas.style.height = `${RENDER.height * scale}px`;
}
window.addEventListener('resize', fitCanvas);
fitCanvas();

// ------------------------------------------------------------------ mundo --

const map = new TileMap(salaDeTeste);
const background = new Background(RENDER.width, RENDER.height);
const camera = new Camera(RENDER.width, RENDER.height);
const player = new Player(map.spawn.x, map.spawn.y);
const energy = new Energy();
const health = new Health();
const heartbeat = new Heartbeat();
const input = new Input();

// Na sala de teste as habilidades de movimento ja vem ligadas.
// No jogo de verdade elas sao destravadas na ordem do GDD (secao 12).
player.abilities.dash = true;
player.abilities.wallClimb = true;

camera.snapTo(player, map);

input.onFirstInput = () => heartbeat.resume();

// ------------------------------------------------------------------ debug --

const debugEl = document.getElementById('debug');
const debug = { visible: false, hitboxes: false };

const ABILITY_KEYS = {
  Digit1: 'dash',
  Digit2: 'wallClimb',
  Digit3: 'dashIntangible',
  Digit4: 'doubleJump',
  Digit5: 'glide',
};

window.addEventListener('keydown', (e) => {
  if (e.code === 'F1') {
    e.preventDefault();
    debug.visible = !debug.visible;
    debugEl.style.display = debug.visible ? 'block' : 'none';
  } else if (e.code === 'F2') {
    e.preventDefault();
    debug.hitboxes = !debug.hitboxes;
  } else if (e.code === 'KeyM') {
    heartbeat.toggle();
  } else if (e.code === 'KeyR') {
    player.reset(map.spawn.x, map.spawn.y);
    energy.refill();
    health.restore();
    camera.snapTo(player, map);
  } else if (e.code === 'KeyC') {
    // Simula uma troca de dano: entra em modo combate e perde 1 caveira.
    energy.markCombat();
    health.damage(1);
  } else if (ABILITY_KEYS[e.code]) {
    const key = ABILITY_KEYS[e.code];
    player.abilities[key] = !player.abilities[key];
  }
});

let elapsed = 0;

// ----------------------------------------------------------------- update --

function update(dt) {
  elapsed += dt;
  input.beginFrame();

  player.update(dt, input, map, energy);
  energy.update(dt);
  health.update(dt);
  camera.update(dt, player, map);
  heartbeat.update(dt, {
    healthRatio: health.ratio,
    active: energy.mode === 'combate',
  });

  // Rede de seguranca: se cair para fora do mundo, volta ao spawn.
  if (player.y > map.height + 64) {
    player.reset(map.spawn.x, map.spawn.y);
    camera.snapTo(player, map);
  }
}

// ----------------------------------------------------------------- render --

function render() {
  ctx.imageSmoothingEnabled = false;
  background.draw(ctx, camera, RENDER.width, RENDER.height, elapsed);

  ctx.save();
  ctx.translate(-camera.ox, -camera.oy);
  map.draw(ctx, camera, RENDER.width, RENDER.height);
  player.draw(ctx);

  if (debug.hitboxes) {
    ctx.strokeStyle = 'rgba(0,255,170,0.9)';
    ctx.lineWidth = 1;
    ctx.strokeRect(player.left + 0.5, player.top + 0.5, player.w - 1, player.h - 1);
  }
  ctx.restore();

  drawHUD(ctx, { health, energy });

  if (debug.visible) updateDebugPanel();
}

function updateDebugPanel() {
  const abilities = Object.entries(player.abilities)
    .filter(([, on]) => on)
    .map(([name]) => name)
    .join(', ') || '(nenhuma)';

  debugEl.textContent = [
    `estado     ${player.state}${player.intangible ? ' (intangivel)' : ''}`,
    `pos        ${player.x.toFixed(1)}, ${player.y.toFixed(1)}`,
    `vel        ${player.vx.toFixed(1)}, ${player.vy.toFixed(1)}`,
    `chao       ${player.onGround}   parede ${player.wallDir}`,
    `coyote     ${player.coyoteTimer.toFixed(3)}  buffer ${player.jumpBufferTimer.toFixed(3)}`,
    `dash cd    ${player.dashCooldownTimer.toFixed(2)}  aereos ${player.airDashesLeft}`,
    '',
    `energia    ${energy.current.toFixed(1)} / ${energy.max}  (${energy.mode}, x${energy.multiplier})`,
    `regen      ${energy.regenerating ? 'ativa' : 'aguardando'}`,
    `vida       ${health.skulls} / ${health.maxSkulls}  frag ${health.fragments}`,
    '',
    `habilidades ${abilities}`,
    '',
    'F1 debug   F2 hitbox   R reset',
    'C levar dano   M som',
    '1 dash  2 wall  3 intang  4 djump  5 planar',
  ].join('\n');
}

// ------------------------------------------------------------------- loop --

createLoop({ update, render }).start();
