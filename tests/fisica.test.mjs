import { TileMap } from '../src/world/tilemap.js';
import { salaDeTeste } from '../src/world/rooms/sala-de-teste.js';
import { Player } from '../src/entities/player.js';
import { Energy } from '../src/systems/energy.js';
import { Health } from '../src/systems/health.js';
import { PLAYER } from '../config/tuning.js';

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
const energy = new Energy();
const input = fakeInput();

function step(n = 1) {
  for (let i = 0; i < n; i++) {
    player.update(DT, input, map, energy);
    energy.update(DT);
    input.clearPressed();
  }
}

const results = [];
const check = (nome, ok, detalhe) => results.push({ nome, ok, detalhe });

// ---------------------------------------------------------------- teste 1 --
const player = new Player(map.spawn.x, map.spawn.y);
player.abilities.dash = true;
player.abilities.wallClimb = true;

step(60);
check('cai e pousa no chao', player.onGround && player.vy === 0,
  `y=${player.y} onGround=${player.onGround}`);

const chaoY = player.y;
check('pousa na altura do chao (linha 19 => y=304)', chaoY === 19 * 16,
  `y=${chaoY}`);

// ---------------------------------------------------------------- teste 2 --
// Altura do pulo segurando o botao: deve bater com PLAYER.jumpHeight.
energy.refill();
input.pressed.jump = true;
input.held.jump = true;
let alturaMax = 0;
for (let i = 0; i < 90; i++) {
  player.update(DT, input, map, energy);
  energy.update(DT);
  input.clearPressed();
  alturaMax = Math.max(alturaMax, chaoY - player.y);
  if (i > 3 && player.onGround) break;
}
input.held.jump = false;
const erro = Math.abs(alturaMax - PLAYER.jumpHeight);
check('altura do pulo ~= jumpHeight', erro < 3,
  `alcancou ${alturaMax.toFixed(1)}px, configurado ${PLAYER.jumpHeight}px (erro ${erro.toFixed(1)})`);

// ---------------------------------------------------------------- teste 3 --
// Pulo curto (solta o botao logo) precisa ser sensivelmente menor.
step(70); // recupera energia
player.reset(map.spawn.x, chaoY);
step(5);
energy.refill();
input.pressed.jump = true;
input.held.jump = true;
let alturaCurta = 0;
for (let i = 0; i < 90; i++) {
  if (i === 5) input.held.jump = false;  // solta cedo
  player.update(DT, input, map, energy);
  energy.update(DT);
  input.clearPressed();
  alturaCurta = Math.max(alturaCurta, chaoY - player.y);
  if (i > 3 && player.onGround) break;
}
check('pulo curto < pulo longo', alturaCurta < alturaMax * 0.75,
  `curto ${alturaCurta.toFixed(1)}px vs longo ${alturaMax.toFixed(1)}px`);

// ---------------------------------------------------------------- teste 4 --
// Correndo, o vao de 5 tiles (colunas 34-38) tem que ser transponivel.
player.reset(24 * 16, chaoY);
step(5);
energy.refill();
input.held.right = true;
input.held.dash = true;   // segurar = correr
step(60);                 // ganha velocidade ate a borda
const velCorrida = player.vx;
let atravessou = false;
for (let i = 0; i < 200; i++) {
  // pula assim que estiver perto da borda do vao (coluna 34 => x=544)
  if (player.onGround && player.x > 528 && player.x < 544) input.pressed.jump = true;
  input.held.jump = input.pressed.jump || input.held.jump;
  player.update(DT, input, map, energy);
  energy.update(DT);
  input.clearPressed();
  if (player.x > 39 * 16 && player.onGround) { atravessou = true; break; }
  if (player.y > chaoY + 8) break; // caiu no vao
}
input.held.right = false;
input.held.dash = false;
input.held.jump = false;
check('vence o vao de 5 tiles correndo', atravessou,
  `vel corrida ${velCorrida.toFixed(0)}px/s, x final ${player.x.toFixed(0)}, y ${player.y.toFixed(0)}`);

// ---------------------------------------------------------------- teste 5 --
// Energia: custo em exploracao e metade do custo em combate.
const e = new Energy();
const custoExploracao = e.costOf('dash');
e.markCombat();
const custoCombate = e.costOf('dash');
check('custo em exploracao e metade do de combate',
  Math.abs(custoCombate / 2 - custoExploracao) < 1e-9,
  `combate ${custoCombate}, exploracao ${custoExploracao}`);

// ---------------------------------------------------------------- teste 6 --
// Regeneracao: ~10%/s comecando 1s apos a ultima acao.
const e2 = new Energy();
e2.markCombat();
e2.current = 0;
e2.timeSinceAction = 0;
for (let i = 0; i < 60; i++) e2.update(DT);   // 1s de espera
const aposEspera = e2.current;
for (let i = 0; i < 60; i++) e2.update(DT);   // +1s regenerando
check('regen so comeca apos 1s e rende ~10%/s',
  aposEspera < 0.2 && Math.abs(e2.current - 10) < 0.5,
  `apos 1s: ${aposEspera.toFixed(2)}, apos 2s: ${e2.current.toFixed(2)}`);

// ---------------------------------------------------------------- teste 7 --
// Wall jump: precisa subir o poco (colunas 27-29, do chao ate a linha 5).
const p2 = new Player(28 * 16 + 8, chaoY);
p2.abilities.dash = true;
p2.abilities.wallClimb = true;
const e3 = new Energy();
const input2 = fakeInput();
let alturaPoco = chaoY;
let dir = 1;
for (let i = 0; i < 900; i++) {
  input2.held.left = dir < 0;
  input2.held.right = dir > 0;
  // pula sempre que encostar numa parede no ar, ou estando no chao
  if (p2.onGround || (p2.wallDir !== 0 && p2.vy >= 0)) {
    input2.pressed.jump = true;
    input2.held.jump = true;
    if (p2.wallDir !== 0) dir = -p2.wallDir;
  } else {
    input2.held.jump = p2.vy < 0;
  }
  p2.update(DT, input2, map, e3);
  e3.update(DT);
  input2.clearPressed();
  alturaPoco = Math.min(alturaPoco, p2.y);
}
check('wall jump sobe o poco ate a saida (linha 6 => y<=112)', alturaPoco <= 6 * 16,
  `subiu ate y=${alturaPoco.toFixed(0)} (chao era ${chaoY})`);

// ---------------------------------------------------------------- teste 8 --
// Double jump: SO libera o segundo pulo com a habilidade ligada, e apenas
// um pulo extra por salto (nao vira pulo infinito).
const p3 = new Player(map.spawn.x, chaoY);
const e4 = new Energy();
const input3 = fakeInput();

function pular(p, inp, e) {
  inp.pressed.jump = true;
  inp.held.jump = true;
  p.update(DT, inp, map, e);
  e.update(DT);
  inp.clearPressed();
  inp.held.jump = false;
}

// sem a habilidade: o segundo toque no ar nao deve fazer nada
p3.abilities.doubleJump = false;
pular(p3, input3, e4);                 // 1o pulo (do chao)
for (let i = 0; i < 10; i++) { p3.update(DT, input3, map, e4); e4.update(DT); } // sobe um pouco
const vyAntes = p3.vy;
pular(p3, input3, e4);                 // tenta pulo extra no ar
const vyDepoisSemHabilidade = p3.vy;
const semHabilidade = vyDepoisSemHabilidade >= vyAntes; // nao deve impulsionar pra cima

p3.reset(map.spawn.x, chaoY);
p3.abilities.doubleJump = true;
e4.refill();
pular(p3, input3, e4);                 // 1o pulo (do chao)
for (let i = 0; i < 15; i++) { p3.update(DT, input3, map, e4); e4.update(DT); } // sobe e comeca a cair
const vyAntesSegundo = p3.vy;
pular(p3, input3, e4);                 // 2o pulo (double jump)
const vyDepoisSegundo = p3.vy;
const subiuNoSegundo = vyDepoisSegundo < vyAntesSegundo - 50; // impulso pra cima nitido
const pulosRestantes = p3.airJumpsLeft;
pular(p3, input3, e4);                 // tenta um 3o pulo no ar: nao pode ter efeito
const vyDepoisTerceiro = p3.vy;
const naoVirouInfinito = vyDepoisTerceiro >= vyDepoisSegundo; // gravidade, nao outro impulso
for (let i = 0; i < 3; i++) { p3.update(DT, input3, map, e4); e4.update(DT); }

check('sem doubleJump, 2o toque no ar nao impulsiona',
  semHabilidade, `vy antes=${vyAntes.toFixed(1)}, depois=${vyDepoisSemHabilidade.toFixed(1)}`);
check('com doubleJump, 2o toque no ar impulsiona pra cima',
  subiuNoSegundo, `vy antes=${vyAntesSegundo.toFixed(1)}, apos pulo=${vyDepoisSegundo.toFixed(1)}`);
check('depois de usar, um 3o toque no ar nao impulsiona de novo',
  naoVirouInfinito, `vy apos 2o pulo=${vyDepoisSegundo.toFixed(1)}, apos tentar 3o=${vyDepoisTerceiro.toFixed(1)}`);
check('double jump consome o unico pulo aereo disponivel (nao e infinito)',
  pulosRestantes === 0, `airJumpsLeft apos usar = ${pulosRestantes}`);

// ---------------------------------------------------------------- teste 9 --
// Tile de perigo: nao bloqueia, mas machuca — exceto durante dash intangivel.
// Retangulo de perigo da sala de teste fica em x=[240,272), y=[272,304)
// (colunas 15-16, linhas 17-18).
const p4 = new Player(238, 288);
p4.abilities.dash = true;
p4.abilities.dashIntangible = false;
const e5 = new Energy();
const h1 = new Health();
const input4 = fakeInput();

input4.held.right = true;
input4.pressed.dash = true;
let tomouDano = false;
for (let i = 0; i < 30; i++) {
  p4.update(DT, input4, map, e5);
  e5.update(DT);
  input4.clearPressed();
  if (!p4.intangible && map.overlapsHazard(p4.left, p4.top, p4.w, p4.h)) {
    if (h1.damage(1)) tomouDano = true;
  }
}
check('dash SEM intangibilidade atravessa o hazard tomando dano',
  tomouDano && h1.skulls === h1.maxSkulls - 1,
  `dano tomado=${tomouDano}, vida=${h1.skulls}/${h1.maxSkulls}`);

const p5 = new Player(238, 288);
p5.abilities.dash = true;
p5.abilities.dashIntangible = true; // upgrade do dash ligado
const e6 = new Energy();
const h2 = new Health();
const input5 = fakeInput();

input5.held.right = true;
input5.pressed.dash = true;
let tomouDano2 = false;
for (let i = 0; i < 30; i++) {
  p5.update(DT, input5, map, e6);
  e6.update(DT);
  input5.clearPressed();
  if (!p5.intangible && map.overlapsHazard(p5.left, p5.top, p5.w, p5.h)) {
    if (h2.damage(1)) tomouDano2 = true;
  }
}
check('dash COM intangibilidade atravessa o hazard ileso',
  !tomouDano2 && h2.skulls === h2.maxSkulls,
  `dano tomado=${tomouDano2}, vida=${h2.skulls}/${h2.maxSkulls}`);

// --------------------------------------------------------------- teste 10 --
// Escalar uma parede UNICA (sem parede oposta por perto): o jogador precisa
// conseguir regarrar a MESMA parede mais alto depois de cada wall jump,
// segurando o pulo (pra ganhar altura) e apertando de volta em direcao a
// parede — nao so pular de uma parede pra outra num poco estreito.
// Sala isolada: uma unica coluna solida, sem nada do outro lado por muitos
// tiles, entao so da pra subir se a MESMA parede puder ser regarrada.
function paredeUnica(cols, rows, wallCol) {
  const floorRow = rows - 2;
  const linhas = [];
  for (let r = 0; r < rows; r++) {
    let linha = '';
    for (let c = 0; c < cols; c++) {
      if (r === 0 || r === rows - 1 || c === 0 || c === cols - 1) linha += '#';
      else if (r === floorRow) linha += '#';
      else if (c === wallCol && r >= 2 && r < floorRow) linha += '#';
      else linha += '.';
    }
    linhas.push(linha);
  }
  return { rows: linhas, tileSize: 16 };
}

const mapParedeUnica = new TileMap(paredeUnica(30, 40, 5));
const startXParede = 5 * 16 + 16 + PLAYER.width / 2 + 1;
const startYParede = mapParedeUnica.height - 2 * 16;
const p6 = new Player(startXParede, startYParede);
p6.abilities.wallClimb = true;
const e7 = new Energy();
const input6 = fakeInput();
input6.held.left = true;   // sempre tentando voltar pra parede
input6.pressed.jump = true;
input6.held.jump = true;

let wallSlidingAntes = false;
let pousouNaParedeUnica = false;
let alturaMaximaParede = 0;

for (let frame = 0; frame < 60 * 8; frame++) {
  input6.held.jump = p6.vy < 0; // segura enquanto sobe, solta ao comecar a cair
  p6.update(DT, input6, mapParedeUnica, e7);
  e7.update(DT);
  input6.clearPressed();

  alturaMaximaParede = Math.max(alturaMaximaParede, startYParede - p6.y);

  if (p6.wallSliding && !wallSlidingAntes) {
    input6.pressed.jump = true;
    input6.held.jump = true;
  }
  wallSlidingAntes = p6.wallSliding;

  if (p6.onGround && frame > 2) { pousouNaParedeUnica = true; break; }
}

check('escala uma parede unica por varios ciclos sem pousar (>= 6 tiles)',
  !pousouNaParedeUnica && alturaMaximaParede >= 6 * 16,
  `pousou=${pousouNaParedeUnica}, altura maxima=${alturaMaximaParede.toFixed(1)}px (${(alturaMaximaParede / 16).toFixed(1)} tiles)`);

// --------------------------------------------------------------- teste 11 --
// Trocar de direcao NO AR e instantanea e vai direto pra velocidade maxima
// do ar (nao freia ate 0 pra so depois acelerar de volta).
const p7 = new Player(map.spawn.x, chaoY - 40); // no ar, longe do chao
const e8 = new Energy();
const input7 = fakeInput();

input7.held.right = true;
p7.update(DT, input7, map, e8); // ganha velocidade pra direita no ar
const vxAntesDaTroca = p7.vx;

input7.held.right = false;
input7.held.left = true;
p7.update(DT, input7, map, e8); // troca de direcao no MESMO frame seguinte

check('troca de direcao no ar e instantanea (direto no airSpeed, sem frear)',
  vxAntesDaTroca > 0 && p7.vx === -PLAYER.airSpeed,
  `vx antes=${vxAntesDaTroca.toFixed(1)}, vx logo apos trocar=${p7.vx.toFixed(1)} (esperado -${PLAYER.airSpeed})`);

// No chao, a mesma troca continua sendo GRADUAL (nao instantanea) — feel
// diferente de proposito entre chao e ar.
const p8 = new Player(map.spawn.x, chaoY);
const e9 = new Energy();
const input8 = fakeInput();
input8.held.right = true;
for (let i = 0; i < 20; i++) { p8.update(DT, input8, map, e9); e9.update(DT); }
const vxNoChaoAntes = p8.vx;
input8.held.right = false;
input8.held.left = true;
p8.update(DT, input8, map, e9);
check('no chao, trocar de direcao continua sendo gradual (nao instantanea)',
  vxNoChaoAntes > 0 && p8.vx > 0 && p8.vx < vxNoChaoAntes,
  `vx antes=${vxNoChaoAntes.toFixed(1)}, vx 1 frame apos trocar=${p8.vx.toFixed(1)} (ainda positivo e decaindo, nao pulou direto pra -${PLAYER.walkSpeed})`);

// --------------------------------------------------------------- teste 12 --
// Planar: segurar o pulo depois do apice troca a queda normal por uma
// descida lenta. Testado numa sala aberta e alta (sem parede, chao bem
// longe) pra ter espaco de sobra e nao pousar no meio do teste.
const mapQuedaLivre = new TileMap(paredeUnica(20, 60, -1)); // wallCol=-1 = sem parede interna
const spawnQuedaLivre = { x: 10 * 16, y: 4 * 16 }; // bem no topo, longe do chao

function segueSegurandoPuloAtePassarOApice(p, inp, e, mapa, maxFrames = 200) {
  inp.pressed.jump = true;
  inp.held.jump = true;
  let passouDoApice = false;
  for (let i = 0; i < maxFrames; i++) {
    p.update(DT, inp, mapa, e);
    e.update(DT);
    inp.clearPressed();
    if (p.vy >= 0) { passouDoApice = true; break; } // comecou a cair
  }
  return passouDoApice;
}

const p9 = new Player(spawnQuedaLivre.x, spawnQuedaLivre.y);
p9.abilities.glide = true;
const e10 = new Energy();
const input9 = fakeInput();

segueSegurandoPuloAtePassarOApice(p9, input9, e10, mapQuedaLivre);
// mais alguns frames de queda planando, ainda segurando o pulo
for (let i = 0; i < 30; i++) { p9.update(DT, input9, mapQuedaLivre, e10); e10.update(DT); }

check('segurando o pulo apos o apice, entra em planar (estado e vy travado)',
  p9.state === 'glide' && Math.abs(p9.vy - PLAYER.glideFallSpeed) < 0.5,
  `estado=${p9.state}, vy=${p9.vy.toFixed(1)} (esperado ~${PLAYER.glideFallSpeed})`);

// --------------------------------------------------------------- teste 13 --
// Planar funciona igual depois do 2o pulo (double jump), nao so do 1o —
// e o que o usuario pediu explicitamente.
const p10 = new Player(spawnQuedaLivre.x, spawnQuedaLivre.y);
p10.abilities.glide = true;
p10.abilities.doubleJump = true;
const e11 = new Energy();
const input10 = fakeInput();

input10.pressed.jump = true;
input10.held.jump = true;
p10.update(DT, input10, mapQuedaLivre, e11); // 1o pulo (chao)
input10.clearPressed();
input10.held.jump = false; // solta rapido, pulo curto de proposito
for (let i = 0; i < 8; i++) { p10.update(DT, input10, mapQuedaLivre, e11); e11.update(DT); }

input10.pressed.jump = true; // 2o pulo (double jump), no ar
input10.held.jump = true;
p10.update(DT, input10, mapQuedaLivre, e11);
input10.clearPressed();

segueSegurandoPuloAtePassarOApice(p10, input10, e11, mapQuedaLivre);
for (let i = 0; i < 30; i++) { p10.update(DT, input10, mapQuedaLivre, e11); e11.update(DT); }

check('planar tambem ativa depois do 2o pulo (double jump), nao so do 1o',
  p10.state === 'glide' && Math.abs(p10.vy - PLAYER.glideFallSpeed) < 0.5,
  `estado=${p10.state}, vy=${p10.vy.toFixed(1)} (esperado ~${PLAYER.glideFallSpeed})`);

// --------------------------------------------------------------- teste 14 --
// Soltar o pulo no meio do planar cancela na hora — volta a cair normal.
input9.held.jump = false;
const vyAoSoltar = p9.vy;
for (let i = 0; i < 15; i++) p9.update(DT, input9, mapQuedaLivre, e10);
check('soltar o pulo cancela o planar (volta a acelerar a queda)',
  p9.state !== 'glide' && p9.vy > vyAoSoltar + 20,
  `vy ao soltar=${vyAoSoltar.toFixed(1)}, vy 15 frames depois=${p9.vy.toFixed(1)}, estado=${p9.state}`);

// --------------------------------------------------------------- teste 15 --
// Planar drena energia continuamente e acaba quando a energia zera.
const p11 = new Player(spawnQuedaLivre.x, spawnQuedaLivre.y);
p11.abilities.glide = true;
const e12 = new Energy();
e12.current = 1; // quase nada, pra esgotar rapido
const input11 = fakeInput();

segueSegurandoPuloAtePassarOApice(p11, input11, e12, mapQuedaLivre);
let energiaZerouEPlanarParou = false;
for (let i = 0; i < 60; i++) {
  p11.update(DT, input11, mapQuedaLivre, e12);
  e12.update(DT);
  if (e12.current <= 0 && p11.state !== 'glide') { energiaZerouEPlanarParou = true; break; }
}
check('planar drena energia e para quando ela acaba',
  energiaZerouEPlanarParou,
  `energia final=${e12.current.toFixed(2)}, estado final=${p11.state}`);

// --------------------------------------------------------------- teste 16 --
// Sem a habilidade, segurar o pulo caindo NAO ativa planar (queda normal).
const p12 = new Player(spawnQuedaLivre.x, spawnQuedaLivre.y);
p12.abilities.glide = false;
const e13 = new Energy();
const input12 = fakeInput();
segueSegurandoPuloAtePassarOApice(p12, input12, e13, mapQuedaLivre);
for (let i = 0; i < 30; i++) { p12.update(DT, input12, mapQuedaLivre, e13); e13.update(DT); }
check('sem abilities.glide, segurar o pulo caindo nao trava a queda',
  p12.state !== 'glide' && p12.vy > PLAYER.glideFallSpeed * 2,
  `estado=${p12.state}, vy=${p12.vy.toFixed(1)} (bem acima do teto de planar, ${PLAYER.glideFallSpeed})`);

// ------------------------------------------------------------------ saida --
let falhas = 0;
for (const r of results) {
  if (!r.ok) falhas++;
  console.log(`${r.ok ? 'PASSOU' : 'FALHOU'}  ${r.nome}\n         ${r.detalhe}`);
}
console.log(`\n${results.length - falhas}/${results.length} testes ok`);
process.exit(falhas ? 1 : 0);
