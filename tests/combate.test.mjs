// Testa o combo basico de M1 (GDD 7.3) contra o zumbi de teste: dano por
// hit, o 5o hit (finisher) com knockback grande, o combo reiniciando depois
// dele, cooldown entre golpes, janela do combo expirando, alcance, custo de
// energia e as i-frames do proprio zumbi.
import { TileMap } from '../src/world/tilemap.js';
import { salaDeTeste } from '../src/world/rooms/sala-de-teste.js';
import { Player } from '../src/entities/player.js';
import { Zombie } from '../src/entities/zombie.js';
import { Energy } from '../src/systems/energy.js';
import { PLAYER, COMBAT, ZOMBIE } from '../config/tuning.js';

const DT = 1 / 60;

function fakeInput() {
  const keys = ['left','right','up','down','jump','dash','attackLight','attackHeavy','interact'];
  const zero = () => Object.fromEntries(keys.map(k => [k, false]));
  return {
    held: zero(), pressed: zero(), released: zero(),
    get moveX() { return (this.held.right ? 1 : 0) - (this.held.left ? 1 : 0); },
    clearPressed() { for (const k of keys) this.pressed[k] = false; },
  };
}

const map = new TileMap(salaDeTeste);
const results = [];
const check = (nome, ok, detalhe) => results.push({ nome, ok, detalhe });

/** So o frame do golpe em si — pra poder checar o knockback antes dele decair. */
function disparaGolpe(player, input, energy, enemies) {
  input.pressed.attackLight = true;
  player.updateAttack(DT, input, energy, enemies);
  input.clearPressed();
}

/**
 * Avanca frames depois do golpe ate o cooldown do swing terminar.
 * Atualiza os inimigos tambem — sem isso as i-frames do zumbi nunca decaem
 * e bloqueiam qualquer hit seguinte.
 */
function avancaFrames(player, input, energy, enemies, frames = 20) {
  for (let i = 0; i < frames; i++) {
    player.updateAttack(DT, input, energy, enemies);
    energy.update(DT);
    for (const e of enemies) e.update(DT, map);
  }
}

/** Um golpe completo: dispara e ja espera o cooldown terminar. */
function golpeia(player, input, energy, enemies, framesDeEspera = 20) {
  disparaGolpe(player, input, energy, enemies);
  avancaFrames(player, input, energy, enemies, framesDeEspera);
}

function novoDuo(distancia = 12) {
  const player = new Player(map.spawn.x, map.spawn.y);
  player.facing = 1;
  const zumbi = new Zombie(player.x + distancia, player.y);
  const energy = new Energy();
  const input = fakeInput();
  return { player, zumbi, energy, input };
}

// ---------------------------------------------------------------- teste 1 --
{
  const { player, zumbi, energy, input } = novoDuo();
  disparaGolpe(player, input, energy, [zumbi]);
  check('1o hit (nao-finisher) da so o empurraozinho pequeno',
    Math.abs(zumbi.vx) === COMBAT.attackLight.knockback.vx,
    `vx do zumbi logo apos o golpe=${zumbi.vx}`);
  avancaFrames(player, input, energy, [zumbi]);
  check('1o hit tira 1 de vida e nao mata',
    zumbi.health === ZOMBIE.maxHealth - 1 && !zumbi.dead,
    `vida=${zumbi.health}/${zumbi.maxHealth}, morto=${zumbi.dead}`);
}

// ---------------------------------------------------------------- teste 2 --
// 5 hits seguidos (dentro da janela de combo): o 5o e o finisher, com
// knockback bem maior, e o zumbi fica com 1 de vida (6-5).
{
  const { player, zumbi, energy, input } = novoDuo();
  for (let i = 0; i < 4; i++) golpeia(player, input, energy, [zumbi]);
  disparaGolpe(player, input, energy, [zumbi]); // 5o hit — checa o knockback antes dele decair
  check('5o hit (finisher) usa o knockback grande, nao o pequeno',
    Math.abs(zumbi.vx) === COMBAT.attackLight.finisherKnockback.vx,
    `vx do zumbi logo apos o 5o hit=${zumbi.vx} (esperado ${COMBAT.attackLight.finisherKnockback.vx})`);
  check('combo reinicia do zero depois do finisher',
    player.comboStep === 0,
    `comboStep apos o 5o hit=${player.comboStep}`);
  avancaFrames(player, input, energy, [zumbi]);
  check('depois de 5 hits em combo, vida = 1 e ainda nao morreu',
    zumbi.health === 1 && !zumbi.dead,
    `vida=${zumbi.health}, morto=${zumbi.dead}`);
}

// ---------------------------------------------------------------- teste 3 --
// 6 hits no total matam (5 do primeiro combo + 1 do combo seguinte). O
// finisher joga o zumbi pra fora de alcance de proposito (e o que "jogar
// pra tras" significa) — reaproxima ele antes do 6o golpe pra isolar so a
// questao "6 hits acumulados matam", ja que o afastamento em si e testado
// (e passa) no teste anterior.
function reaproxima(player, zumbi, distancia = 12) {
  zumbi.x = player.x + player.facing * distancia;
  zumbi.vx = 0;
}

{
  const { player, zumbi, energy, input } = novoDuo();
  for (let i = 0; i < 5; i++) {
    golpeia(player, input, energy, [zumbi]);
    reaproxima(player, zumbi);
  }
  golpeia(player, input, energy, [zumbi]);
  check('6 hits de M1 matam o zumbi', zumbi.dead && zumbi.health === 0,
    `vida=${zumbi.health}, morto=${zumbi.dead}`);
}

// ---------------------------------------------------------------- teste 4 --
// Zumbi morto some (finished) depois do deathFadeTime, nao antes.
{
  const { player, zumbi, energy, input } = novoDuo();
  for (let i = 0; i < 5; i++) {
    golpeia(player, input, energy, [zumbi]);
    reaproxima(player, zumbi);
  }
  golpeia(player, input, energy, [zumbi]);
  const aindaNao = zumbi.finished;
  const frames = Math.ceil(ZOMBIE.deathFadeTime / DT) + 5;
  for (let i = 0; i < frames; i++) zumbi.update(DT, map);
  check('zumbi morto so "finished" depois do deathFadeTime',
    aindaNao === false && zumbi.finished === true,
    `finished logo apos morrer=${aindaNao}, finished depois do fade=${zumbi.finished}`);
}

// ---------------------------------------------------------------- teste 5 --
// Cooldown entre golpes: apertar M1 de novo ANTES do swing anterior acabar
// nao registra um 2o hit.
{
  const { player, zumbi, energy, input } = novoDuo();
  input.pressed.attackLight = true;
  player.updateAttack(DT, input, energy, [zumbi]); // 1o hit
  input.clearPressed();
  input.pressed.attackLight = true; // tenta de novo no frame seguinte, sem esperar o cooldown
  player.updateAttack(DT, input, energy, [zumbi]);
  input.clearPressed();
  check('apertar M1 antes do cooldown acabar nao gera 2 hits',
    zumbi.health === ZOMBIE.maxHealth - 1,
    `vida=${zumbi.health} (esperado ${ZOMBIE.maxHealth - 1}, so 1 hit deveria ter valido)`);
}

// ---------------------------------------------------------------- teste 6 --
// Esperar alem da janela do combo reseta o combo — o proximo hit volta a
// ser "hit 1" (empurrao pequeno), nao continua de onde parou.
{
  const { player, zumbi, energy, input } = novoDuo();
  golpeia(player, input, energy, [zumbi]);
  golpeia(player, input, energy, [zumbi]);
  const framesFolga = Math.ceil(COMBAT.attackLight.comboWindow / DT) + 5;
  for (let i = 0; i < framesFolga; i++) { player.updateAttack(DT, input, energy, [zumbi]); energy.update(DT); }
  check('combo reseta sozinho depois da janela expirar',
    player.comboStep === 0,
    `comboStep apos esperar sem atacar=${player.comboStep}`);
}

// ---------------------------------------------------------------- teste 7 --
// Fora do alcance, o golpe nao acerta.
{
  const { player, zumbi, energy, input } = novoDuo(COMBAT.attackLight.reach + 40);
  golpeia(player, input, energy, [zumbi]);
  check('zumbi fora do alcance nao leva dano',
    zumbi.health === ZOMBIE.maxHealth,
    `vida=${zumbi.health}/${zumbi.maxHealth} (deveria estar intacto)`);
}

// ---------------------------------------------------------------- teste 8 --
// De costas (facing errado), o golpe tambem nao acerta um alvo na frente
// original — confirma que a caixa segue a direcao que o jogador encara.
{
  const { player, zumbi, energy, input } = novoDuo();
  player.facing = -1; // zumbi esta a DIREITA, jogador olhando pra ESQUERDA
  golpeia(player, input, energy, [zumbi]);
  check('golpe so acerta na direcao que o jogador esta olhando',
    zumbi.health === ZOMBIE.maxHealth,
    `vida=${zumbi.health}/${zumbi.maxHealth} (zumbi estava atras do golpe)`);
}

// ---------------------------------------------------------------- teste 9 --
// Cada hit consome energia (ENERGY.costs.attackLight, com o multiplicador
// do modo atual).
{
  const { player, zumbi, energy, input } = novoDuo();
  const antes = energy.current;
  // custo esperado ANTES do hit — o hit em si chama markCombat(), que muda
  // o multiplicador de exploracao (x0.5) pra combate (x1) so DEPOIS de ja
  // ter cobrado este golpe.
  const custoEsperado = energy.costOf('attackLight');
  golpeia(player, input, energy, [zumbi]);
  const gasto = antes - energy.current;
  check('golpe de M1 consome energia (attackLight)',
    gasto > 0 && Math.abs(gasto - custoEsperado) < 0.5,
    `gasto=${gasto.toFixed(2)}, custo esperado (modo exploracao)=${custoEsperado.toFixed(2)}`);
}

// --------------------------------------------------------------- teste 10 --
// I-frames do proprio zumbi: um segundo takeHit() bem em cima do primeiro
// (antes do hurtInvuln acabar) nao aplica dano nem troca o knockback.
{
  const zumbi = new Zombie(0, 0);
  const primeiro = zumbi.takeHit(1, 100, -50);
  const vidaApos1 = zumbi.health;
  const segundo = zumbi.takeHit(1, -999, -999); // tentativa imediata, ainda em i-frames
  check('2o hit durante i-frames nao aplica dano nem sobrescreve o knockback',
    primeiro === true && segundo === false && zumbi.health === vidaApos1 && zumbi.vx === 100,
    `1o hit=${primeiro}, 2o hit=${segundo}, vida=${zumbi.health}, vx=${zumbi.vx}`);
}

// ------------------------------------------------------------------ saida --
let falhas = 0;
for (const r of results) {
  if (!r.ok) falhas++;
  console.log(`${r.ok ? 'PASSOU' : 'FALHOU'}  ${r.nome}\n         ${r.detalhe}`);
}
console.log(`\n${results.length - falhas}/${results.length} testes de combate ok`);
process.exit(falhas ? 1 : 0);
