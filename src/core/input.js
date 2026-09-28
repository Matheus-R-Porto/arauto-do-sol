// Input por ACAO, nao por tecla. O resto do codigo pergunta "o jogador quer
// pular?", nunca "a tecla Space esta pressionada?". Isso mantem teclado e
// controle intercambiaveis e facilita remapeamento depois.

export const BINDINGS = {
  left:        ['ArrowLeft', 'KeyA'],
  right:       ['ArrowRight', 'KeyD'],
  up:          ['ArrowUp', 'KeyW'],
  down:        ['ArrowDown', 'KeyS'],
  jump:        ['Space', 'KeyK'],
  dash:        ['ShiftLeft', 'ShiftRight', 'KeyL'],   // tocar = dash, segurar = correr
  attackLight: ['KeyJ'], // Alternativas de teclado; mouse continua funcionando.
  attackM2:    ['KeyU'],
  attackHeavy: ['KeyI'],
  interact:    ['KeyE'],
};

// M1 = botao esquerdo, M2 = botao direito — como na maioria dos jogos de acao.
const MOUSE_BUTTONS = {
  0: 'attackLight', // MouseEvent.button: 0 = esquerdo, 1 = meio, 2 = direito
  2: 'attackM2',
};

// Botoes de gamepad no layout padrao (Xbox): A=0, B=1, X=2, Y=3, LB=4, RB=5,
// LT=6, RT=7 (analogicos, mas tambem chegam como booleano em .pressed).
const PAD_BUTTONS = {
  jump: [0],
  dash: [1, 5],
  attackLight: [2],
  attackM2: [7],
  attackHeavy: [3],
  interact: [4],
  left: [14],
  right: [15],
  up: [12],
  down: [13],
};

const ACTIONS = Object.keys(BINDINGS);
const AXIS_DEADZONE = 0.35;

export class Input {
  constructor() {
    this.held = Object.fromEntries(ACTIONS.map((a) => [a, false]));
    this.pressed = Object.fromEntries(ACTIONS.map((a) => [a, false]));
    this.released = Object.fromEntries(ACTIONS.map((a) => [a, false]));

    this._keyToActions = new Map();
    for (const [action, codes] of Object.entries(BINDINGS)) {
      for (const code of codes) {
        if (!this._keyToActions.has(code)) this._keyToActions.set(code, []);
        this._keyToActions.get(code).push(action);
      }
    }

    this._downQueue = new Set();
    this._upQueue = new Set();
    this._keysDown = new Set();
    this._mouseHeld = new Set();
    this._padHeld = Object.fromEntries(ACTIONS.map((a) => [a, false]));
    this._padPrev = Object.fromEntries(ACTIONS.map((a) => [a, false]));

    /** Chamado na primeira interacao real do jogador (necessario para o WebAudio). */
    this.onFirstInput = null;
    this._gotFirstInput = false;

    window.addEventListener('keydown', (e) => this._onKey(e, true));
    window.addEventListener('keyup', (e) => this._onKey(e, false));
    window.addEventListener('mousedown', (e) => this._onMouse(e, true));
    window.addEventListener('mouseup', (e) => this._onMouse(e, false));
    // Botao direito nao faz nada no jogo ainda, mas o menu de contexto
    // atrapalharia cliques rapidos repetidos.
    window.addEventListener('contextmenu', (e) => e.preventDefault());
    window.addEventListener('blur', () => this._releaseAll());
  }

  _onKey(e, isDown) {
    const actions = this._keyToActions.get(e.code);
    if (!actions) return;
    e.preventDefault();
    if (isDown && e.repeat) return;

    if (isDown) this._keysDown.add(e.code);
    else this._keysDown.delete(e.code);

    for (const action of actions) {
      // Uma acao so "solta" quando nenhuma das teclas dela esta pressionada.
      const stillDown = BINDINGS[action].some((c) => this._keysDown.has(c));
      if (isDown) this._downQueue.add(action);
      else if (!stillDown) this._upQueue.add(action);
    }

    if (isDown && !this._gotFirstInput) {
      this._gotFirstInput = true;
      this.onFirstInput?.();
    }
  }

  _onMouse(e, isDown) {
    const action = MOUSE_BUTTONS[e.button];
    if (!action) return;
    e.preventDefault();
    if (isDown) this._mouseHeld.add(action);
    else this._mouseHeld.delete(action);

    if (isDown) this._downQueue.add(action);
    else this._upQueue.add(action);

    if (isDown && !this._gotFirstInput) {
      this._gotFirstInput = true;
      this.onFirstInput?.();
    }
  }

  _releaseAll() {
    this._keysDown.clear();
    this._mouseHeld.clear();
    for (const a of ACTIONS) {
      if (this.held[a]) this._upQueue.add(a);
    }
  }

  /** Chamar no inicio de cada update de passo fixo. */
  beginFrame() {
    for (const a of ACTIONS) {
      this.pressed[a] = false;
      this.released[a] = false;
    }

    for (const a of this._downQueue) {
      if (!this.held[a]) this.pressed[a] = true;
      this.held[a] = true;
    }
    for (const a of this._upQueue) {
      if (this.held[a]) this.released[a] = true;
      this.held[a] = false;
    }
    this._downQueue.clear();
    this._upQueue.clear();

    this._pollGamepad();
  }

  _pollGamepad() {
    const pad = navigator.getGamepads?.().find((p) => p && p.connected);
    for (const a of ACTIONS) {
      this._padPrev[a] = this._padHeld[a];
      this._padHeld[a] = false;
    }
    for (const [action, indices] of Object.entries(PAD_BUTTONS)) {
      this._padHeld[action] = indices.some((i) => pad?.buttons[i]?.pressed);
    }
    const ax = pad?.axes[0] ?? 0;
    const ay = pad?.axes[1] ?? 0;
    if (ax < -AXIS_DEADZONE) this._padHeld.left = true;
    if (ax > AXIS_DEADZONE) this._padHeld.right = true;
    if (ay < -AXIS_DEADZONE) this._padHeld.up = true;
    if (ay > AXIS_DEADZONE) this._padHeld.down = true;

    for (const a of ACTIONS) {
      if (this._padHeld[a] && !this._padPrev[a]) {
        if (!this.held[a]) this.pressed[a] = true;
        this.held[a] = true;
        if (!this._gotFirstInput) {
          this._gotFirstInput = true;
          this.onFirstInput?.();
        }
      } else if (!this._padHeld[a] && this._padPrev[a]) {
        const keyStillDown = BINDINGS[a].some((c) => this._keysDown.has(c)) || this._mouseHeld.has(a);
        if (!keyStillDown && this.held[a]) {
          this.released[a] = true;
          this.held[a] = false;
        }
      }
      this.held[a] = this._padHeld[a] || this._mouseHeld.has(a) || BINDINGS[a].some((c) => this._keysDown.has(c));
      if (this.held[a]) this.released[a] = false;
    }
  }

  /** -1, 0 ou 1: direcao horizontal desejada. */
  get moveX() {
    return (this.held.right ? 1 : 0) - (this.held.left ? 1 : 0);
  }
}
