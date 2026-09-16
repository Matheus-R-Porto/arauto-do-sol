// Testa o combo basico de M1 e M2 (GDD 7.3) contra o zumbi de teste: dano
// por hit, o 5o hit (finisher) com knockback grande, o combo reiniciando
// depois dele, cooldown entre golpes, janela do combo expirando, alcance,
// custo de energia, as i-frames do proprio zumbi, e que o combo e
// COMPARTILHADO entre M1 e M2 (intercalar as duas maos conta pro mesmo
// combo, e o 5o hit finisher pode ser de qualquer uma das duas).
import { TileMap } from '../src/world/tilemap.js';
import { salaDeTeste } from '../src/world/rooms/sala-de-teste.js';
import { Player } from '../src/entities/player.js';
import { Zombie } from '../src/entities/zombie.js';
import { Energy } from '../src/systems/energy.js';
import { PLAYER, COMBAT, ZOMBIE } from '../config/tuning.js';

const DT = 1 / 60;

function fakeInput() {
  const keys = ['left','right','up','down','jump','dash','attackLight','attackM2','attackHeavy','interact'];
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

const cfgDe = (acao) => (acao === 'attackM2' ? COMBAT.attackM2 : COMBAT.attackLight);

/** So o frame do golpe em si — pra poder checar o knockback antes dele decair. */
function disparaGolpe(player, input, energy, enemies, acao = 'attackLight') {
  input.pressed[acao] = true;
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
function golpeia(player, input, energy, enemies, acao = 'attackLight', framesDeEspera = 20) {
  disparaGolpe(player, input, energy, enemies, acao);
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

function reaproxima(player, zumbi, distancia = 12) {
  zumbi.x = player.x + player.facing * distancia;
  zumbi.vx = 0;
}

/**
 * Bate `n` vezes seguidas, reaproximando o zumbi apos cada golpe (o
 * finisher joga ele pra longe de proposito — ver teste dedicado a isso).
 * Reenche a energia entre golpes: o objetivo aqui e testar a matematica de
 * dano acumulado, nao quantos hits cabem numa barra de energia so (isso e
 * testado separadamente).
 */
function bateVarias(player, input, energy, zumbi, acao, n) {
  for (let i = 0; i < n; i++) {
    energy.refill();
    golpeia(player, input, energy, [zumbi], acao);
    reaproxima(player, zumbi);
  }
}

for (const acao of ['attackLight', 'attackM2']) {
  const rotulo = acao === 'attackM2' ? 'M2' : 'M1';
  const cfg = cfgDe(acao);

  // -------------------------------------------------------------- hit 1 --
  {
    const { player, zumbi, energy, input } = novoDuo();
    disparaGolpe(player, input, energy, [zumbi], acao);
    check(`${rotulo}: 1o hit (nao-finisher) da so o empurraozinho pequeno`,
      Math.abs(zumbi.vx) === cfg.knockback.vx,
      `vx do zumbi logo apos o golpe=${zumbi.vx}`);
    avancaFrames(player, input, energy, [zumbi]);
    check(`${rotulo}: 1o hit tira ${cfg.damage} de vida e nao mata`,
      zumbi.health === ZOMBIE.maxHealth - cfg.damage && !zumbi.dead,
      `vida=${zumbi.health}/${zumbi.maxHealth}, morto=${zumbi.dead}`);
  }

  // ------------------------------------------------------- combo de 5 --
  {
    const { player, zumbi, energy, input } = novoDuo();
    for (let i = 0; i < 4; i++) golpeia(player, input, energy, [zumbi], acao);
    disparaGolpe(player, input, energy, [zumbi], acao); // 5o hit — checa o knockback antes dele decair
    check(`${rotulo}: 5o hit (finisher) usa o knockback grande, nao o pequeno`,
      Math.abs(zumbi.vx) === cfg.finisherKnockback.vx,
      `vx do zumbi logo apos o 5o hit=${zumbi.vx} (esperado ${cfg.finisherKnockback.vx})`);
    check(`${rotulo}: combo reinicia do zero depois do finisher`,
      player.combo.step === 0,
      `combo.step apos o 5o hit=${player.combo.step}`);
    avancaFrames(player, input, energy, [zumbi]);
    check(`${rotulo}: depois de 5 hits em combo, vida = ${ZOMBIE.maxHealth - 5 * cfg.damage}`,
      zumbi.health === ZOMBIE.maxHealth - 5 * cfg.damage && !zumbi.dead,
      `vida=${zumbi.health}, morto=${zumbi.dead}`);
  }

  // --------------------------------------------------- hits acumulados --
  // Quantos hits (contando so esse ataque) matam o zumbi = maxHealth/damage.
  {
    const { player, zumbi, energy, input } = novoDuo();
    const hitsPraMatar = Math.ceil(ZOMBIE.maxHealth / cfg.damage);
    bateVarias(player, input, energy, zumbi, acao, hitsPraMatar - 1);
    check(`${rotulo}: ainda nao morreu com ${hitsPraMatar - 1} hits`,
      !zumbi.dead, `vida=${zumbi.health}, morto=${zumbi.dead}`);
    golpeia(player, input, energy, [zumbi], acao);
    check(`${rotulo}: ${hitsPraMatar} hits matam o zumbi (${ZOMBIE.maxHealth} de vida / ${cfg.damage} de dano)`,
      zumbi.dead && zumbi.health === 0,
      `vida=${zumbi.health}, morto=${zumbi.dead}`);
  }

  // ------------------------------------------------------------ cooldown --
  {
    const { player, zumbi, energy, input } = novoDuo();
    input.pressed[acao] = true;
    player.updateAttack(DT, input, energy, [zumbi]); // 1o hit
    input.clearPressed();
    input.pressed[acao] = true; // tenta de novo no frame seguinte, sem esperar o cooldown
    player.updateAttack(DT, input, energy, [zumbi]);
    input.clearPressed();
    check(`${rotulo}: apertar de novo antes do cooldown acabar nao gera 2 hits`,
      zumbi.health === ZOMBIE.maxHealth - cfg.damage,
      `vida=${zumbi.health} (esperado ${ZOMBIE.maxHealth - cfg.damage}, so 1 hit deveria ter valido)`);
  }

  // -------------------------------------------------------- janela do combo --
  {
    const { player, zumbi, energy, input } = novoDuo();
    golpeia(player, input, energy, [zumbi], acao);
    golpeia(player, input, energy, [zumbi], acao);
    const framesFolga = Math.ceil(cfg.comboWindow / DT) + 5;
    for (let i = 0; i < framesFolga; i++) { player.updateAttack(DT, input, energy, [zumbi]); energy.update(DT); }
    check(`${rotulo}: combo reseta sozinho depois da janela expirar`,
      player.combo.step === 0,
      `combo.step apos esperar sem atacar=${player.combo.step}`);
  }

  // -------------------------------------------------------------- alcance --
  {
    const { player, zumbi, energy, input } = novoDuo(cfg.reach + 40);
    golpeia(player, input, energy, [zumbi], acao);
    check(`${rotulo}: zumbi fora do alcance nao leva dano`,
      zumbi.health === ZOMBIE.maxHealth,
      `vida=${zumbi.health}/${zumbi.maxHealth} (deveria estar intacto)`);
  }

  // -------------------------------------------------------------- direcao --
  {
    const { player, zumbi, energy, input } = novoDuo();
    player.facing = -1; // zumbi esta a DIREITA, jogador olhando pra ESQUERDA
    golpeia(player, input, energy, [zumbi], acao);
    check(`${rotulo}: golpe so acerta na direcao que o jogador esta olhando`,
      zumbi.health === ZOMBIE.maxHealth,
      `vida=${zumbi.health}/${zumbi.maxHealth} (zumbi estava atras do golpe)`);
  }

  // -------------------------------------------------------------- energia --
  {
    const { player, zumbi, energy, input } = novoDuo();
    const antes = energy.current;
    // custo esperado ANTES do hit — o hit em si chama markCombat(), que muda
    // o multiplicador de exploracao (x0.5) pra combate (x1) so DEPOIS de ja
    // ter cobrado este golpe.
    const custoEsperado = energy.costOf(acao);
    golpeia(player, input, energy, [zumbi], acao);
    const gasto = antes - energy.current;
    check(`${rotulo}: golpe consome energia (${acao})`,
      gasto > 0 && Math.abs(gasto - custoEsperado) < 0.5,
      `gasto=${gasto.toFixed(2)}, custo esperado (modo exploracao)=${custoEsperado.toFixed(2)}`);
  }
}

// --------------------------------------------------------------- extra 0 --
// Zumbi morto some (finished) depois do deathFadeTime, nao antes.
{
  const { player, zumbi, energy, input } = novoDuo();
  const hitsPraMatar = Math.ceil(ZOMBIE.maxHealth / COMBAT.attackLight.damage);
  bateVarias(player, input, energy, zumbi, 'attackLight', hitsPraMatar);
  const aindaNao = zumbi.finished;
  const frames = Math.ceil(ZOMBIE.deathFadeTime / DT) + 5;
  for (let i = 0; i < frames; i++) zumbi.update(DT, map);
  check('zumbi morto so "finished" depois do deathFadeTime',
    aindaNao === false && zumbi.finished === true,
    `finished logo apos morrer=${aindaNao}, finished depois do fade=${zumbi.finished}`);
}

// --------------------------------------------------------------- extra 1 --
// M2 causa o dobro de dano do M1 (dano configurado, nao so o resultado
// acumulado dos testes acima).
check('M2 causa o dobro de dano do M1',
  COMBAT.attackM2.damage === COMBAT.attackLight.damage * 2,
  `M1=${COMBAT.attackLight.damage}, M2=${COMBAT.attackM2.damage}`);

// --------------------------------------------------------------- extra 2 --
// Intercalar M1 e M2 conta pro MESMO combo (GDD: "combos alternados entre
// as duas armas"). Sequencia M1,M2,M1,M2,M1 — 5 hits alternados terminando
// em M1 — o 5o (M1) deve ser o finisher.
{
  const { player, zumbi, energy, input } = novoDuo();
  const sequencia = ['attackLight', 'attackM2', 'attackLight', 'attackM2', 'attackLight'];
  for (let i = 0; i < sequencia.length - 1; i++) golpeia(player, input, energy, [zumbi], sequencia[i]);
  disparaGolpe(player, input, energy, [zumbi], sequencia[4]); // 5o hit (M1) — checa antes do knockback decair
  check('intercalando M1/M2, o 5o hit (M1 nesse caso) e o finisher',
    Math.abs(zumbi.vx) === COMBAT.attackLight.finisherKnockback.vx,
    `vx do zumbi logo apos o 5o hit=${zumbi.vx} (esperado ${COMBAT.attackLight.finisherKnockback.vx})`);
  check('combo compartilhado reinicia do zero depois do finisher intercalado',
    player.combo.step === 0,
    `combo.step apos o 5o hit=${player.combo.step}`);
}

// --------------------------------------------------------------- extra 3 --
// Mesma coisa, mas terminando em M2 — o finisher (com o dano E o knockback
// do M2) precisa disparar mesmo o combo tendo comecado com M1.
{
  const { player, zumbi, energy, input } = novoDuo();
  const sequencia = ['attackM2', 'attackLight', 'attackM2', 'attackLight', 'attackM2'];
  for (let i = 0; i < sequencia.length - 1; i++) golpeia(player, input, energy, [zumbi], sequencia[i]);
  const vidaAntesDoFinisher = zumbi.health;
  disparaGolpe(player, input, energy, [zumbi], sequencia[4]); // 5o hit (M2)
  check('intercalando M1/M2, o 5o hit (M2 nesse caso) e o finisher',
    Math.abs(zumbi.vx) === COMBAT.attackM2.finisherKnockback.vx,
    `vx do zumbi logo apos o 5o hit=${zumbi.vx} (esperado ${COMBAT.attackM2.finisherKnockback.vx})`);
  check('o finisher intercalado ainda causa o dano da arma que bateu (M2 = 2)',
    vidaAntesDoFinisher - zumbi.health === COMBAT.attackM2.damage,
    `vida antes=${vidaAntesDoFinisher}, depois=${zumbi.health}`);
}

// --------------------------------------------------------------- extra 4 --
// Cada arma tem seu PROPRIO cooldown de swing — da pra bater M1 e, ja no
// frame seguinte (sem esperar o cooldown do M1), encaixar um M2. E o ganho
// de DPS de intercalar. Simula a ordem real de um frame do jogo (main.js):
// updateAttack() e DEPOIS zumbi.update() a cada frame.
{
  const { player, zumbi, energy, input } = novoDuo();
  input.pressed.attackLight = true;
  player.updateAttack(DT, input, energy, [zumbi]); // frame N: M1 — cooldown do M1 comeca a contar
  input.clearPressed();
  zumbi.update(DT, map); // fim do frame N

  input.pressed.attackM2 = true; // frame N+1: M2, sem esperar o cooldown do M1
  player.updateAttack(DT, input, energy, [zumbi]);
  input.clearPressed();
  check('M2 acerta no frame seguinte ao M1, mesmo com o cooldown do M1 ainda ativo',
    zumbi.health === ZOMBIE.maxHealth - COMBAT.attackLight.damage - COMBAT.attackM2.damage,
    `vida=${zumbi.health} (esperado ${ZOMBIE.maxHealth - COMBAT.attackLight.damage - COMBAT.attackM2.damage}, os 2 hits deveriam ter valido)`);
  check('os 2 hits intercalados avancaram o MESMO combo (2 hits = passo 2)',
    player.combo.step === 2,
    `combo.step apos M1 seguido de M2=${player.combo.step}`);
}

// --------------------------------------------------------------- extra 5 --
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
