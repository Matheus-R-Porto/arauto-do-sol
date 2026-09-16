// Testa o combo basico de M1 e M2 (GDD 7.3) contra o zumbi de teste: dano
// por hit, o 5o hit (finisher) com knockback grande, o combo reiniciando
// depois dele, cooldown entre golpes, janela do combo expirando, alcance,
// custo de energia, as i-frames do proprio zumbi, e que M1/M2 tem combos
// independentes um do outro.
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

/** Estado do combo (M1 ou M2) dentro do player — os dois sao independentes. */
const estadoDe = (player, acao) => (acao === 'attackM2' ? player.attacks.m2 : player.attacks.light);
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
      estadoDe(player, acao).comboStep === 0,
      `comboStep apos o 5o hit=${estadoDe(player, acao).comboStep}`);
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
      estadoDe(player, acao).comboStep === 0,
      `comboStep apos esperar sem atacar=${estadoDe(player, acao).comboStep}`);
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
// M1 e M2 tem combos INDEPENDENTES: bater com um nao avanca nem reseta o
// combo do outro.
{
  const { player, zumbi, energy, input } = novoDuo();
  golpeia(player, input, energy, [zumbi], 'attackLight');
  golpeia(player, input, energy, [zumbi], 'attackLight');
  check('golpear com M1 nao mexe no combo do M2',
    player.attacks.light.comboStep === 2 && player.attacks.m2.comboStep === 0,
    `comboStep M1=${player.attacks.light.comboStep}, M2=${player.attacks.m2.comboStep}`);

  // So o frame do golpe (nao golpeia() inteiro): queremos ver o instante
  // logo apos o hit de M2, sem deixar tempo suficiente passar pra janela
  // do combo de M1 expirar sozinha (isso e esperado e testado a parte —
  // "independente" significa que M2 nao MEXE no contador do M1, nao que
  // o tempo para de passar pro M1 enquanto se usa o M2).
  disparaGolpe(player, input, energy, [zumbi], 'attackM2');
  check('golpear com M2 avanca so o combo do M2, M1 continua onde estava',
    player.attacks.light.comboStep === 2 && player.attacks.m2.comboStep === 1,
    `comboStep M1=${player.attacks.light.comboStep}, M2=${player.attacks.m2.comboStep}`);
}

// --------------------------------------------------------------- extra 3 --
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
