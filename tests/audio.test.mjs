// Testa a logica de fade do batimento cardiaco SEM WebAudio de verdade
// (Node nao tem isso). Um stub minimo cobre so a superficie que _thump()
// usa, pra podermos verificar fadeGain sem tocar som nenhum.
import { Heartbeat } from '../src/audio/heartbeat.js';
import { AUDIO } from '../config/tuning.js';

const DT = 1 / 60;

function fakeCtx() {
  const node = () => ({
    type: '',
    frequency: { setValueAtTime() {}, exponentialRampToValueAtTime() {} },
    gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} },
    connect() { return this; },
    start() {},
    stop() {},
  });
  return {
    currentTime: 0,
    state: 'running',
    createOscillator: node,
    createGain: node,
    destination: {},
    resume() {},
  };
}

function makeHeartbeat() {
  const hb = new Heartbeat();
  hb.enabled = true;
  hb.ctx = fakeCtx();
  hb.master = { gain: { value: AUDIO.heartbeat.volume } };
  return hb;
}

const results = [];
const check = (nome, ok, detalhe) => results.push({ nome, ok, detalhe });

// ---------------------------------------------------------------- teste 1 --
// Em combate, fadeGain vai pro maximo na hora (sem fade-in).
const hb1 = makeHeartbeat();
hb1.update(DT, { healthRatio: 1, active: true });
check('em combate, fadeGain vai a 1 imediatamente', hb1.fadeGain === 1,
  `fadeGain=${hb1.fadeGain}`);

// ---------------------------------------------------------------- teste 2 --
// Ao sair de combate, fadeGain decai gradualmente (nao corta pra 0 na hora).
const hb2 = makeHeartbeat();
hb2.update(DT, { healthRatio: 1, active: true });
hb2.update(DT, { healthRatio: 1, active: false }); // 1 frame fora de combate
const meioCaminho = hb2.fadeGain;
check('fadeGain nao zera no primeiro frame fora de combate', meioCaminho > 0 && meioCaminho < 1,
  `fadeGain apos 1 frame fora de combate=${meioCaminho.toFixed(3)}`);

// ---------------------------------------------------------------- teste 3 --
// Depois de fadeOutTime segundos fora de combate, fadeGain chega a 0.
const hb3 = makeHeartbeat();
hb3.update(DT, { healthRatio: 1, active: true });
const frames = Math.ceil(AUDIO.heartbeat.fadeOutTime / DT) + 5;
for (let i = 0; i < frames; i++) hb3.update(DT, { healthRatio: 1, active: false });
check('fadeGain chega a 0 apos fadeOutTime fora de combate', hb3.fadeGain === 0,
  `fadeGain apos ${AUDIO.heartbeat.fadeOutTime}s+ fora de combate=${hb3.fadeGain}`);

// ---------------------------------------------------------------- teste 4 --
// Voltar a levar dano no meio do fade cancela o fade na hora (volta ao maximo).
const hb4 = makeHeartbeat();
hb4.update(DT, { healthRatio: 1, active: true });
for (let i = 0; i < 20; i++) hb4.update(DT, { healthRatio: 1, active: false }); // fade parcial
const duranteFade = hb4.fadeGain;
hb4.update(DT, { healthRatio: 1, active: true }); // leva dano de novo
check('voltar a combate no meio do fade restaura o volume cheio na hora',
  duranteFade < 1 && hb4.fadeGain === 1,
  `durante o fade=${duranteFade.toFixed(3)}, apos voltar a combate=${hb4.fadeGain}`);

// ------------------------------------------------------------------ saida --
let falhas = 0;
for (const r of results) {
  if (!r.ok) falhas++;
  console.log(`${r.ok ? 'PASSOU' : 'FALHOU'}  ${r.nome}\n         ${r.detalhe}`);
}
console.log(`\n${results.length - falhas}/${results.length} testes de audio ok`);
process.exit(falhas ? 1 : 0);
