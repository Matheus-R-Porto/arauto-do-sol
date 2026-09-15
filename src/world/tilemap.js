export const TILE = {
  EMPTY: 0,
  SOLID: 1,
  ONEWAY: 2, // plataforma atravessavel por baixo
};

const CHAR_TO_TILE = {
  '.': TILE.EMPTY,
  ' ': TILE.EMPTY,
  '@': TILE.EMPTY, // marcador de spawn, vira vazio
  '#': TILE.SOLID,
  '=': TILE.ONEWAY,
};

export class TileMap {
  /**
   * @param {{ rows: string[], tileSize: number }} def
   */
  constructor({ rows, tileSize }) {
    const width = rows[0].length;
    const bad = rows.findIndex((r) => r.length !== width);
    if (bad !== -1) {
      throw new Error(
        `Sala mal formada: linha ${bad} tem ${rows[bad].length} chars, esperado ${width}.`
      );
    }

    this.tileSize = tileSize;
    this.cols = width;
    this.rows = rows.length;
    this.width = this.cols * tileSize;
    this.height = this.rows * tileSize;
    this.spawn = { x: tileSize * 1.5, y: tileSize * 2 };

    this.grid = new Uint8Array(this.cols * this.rows);
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const ch = rows[r][c];
        const tile = CHAR_TO_TILE[ch];
        if (tile === undefined) throw new Error(`Char desconhecido "${ch}" em ${r},${c}`);
        this.grid[r * this.cols + c] = tile;
        if (ch === '@') {
          // Spawn: centro horizontal do tile, pes na base do tile.
          this.spawn = { x: c * tileSize + tileSize / 2, y: (r + 1) * tileSize };
        }
      }
    }
  }

  at(col, row) {
    if (col < 0 || row < 0 || col >= this.cols || row >= this.rows) return TILE.SOLID; // fora do mapa = parede
    return this.grid[row * this.cols + col];
  }

  /**
   * Faixa de tiles tocada pelo intervalo semiaberto [start, start+size).
   * Usa ceil()-1 no fim, nao floor(start+size-1): posicoes sao floats, e o
   * "-1" so funciona com coordenadas inteiras (encostar exatamente na borda
   * de um tile nao pode contar como colisao).
   */
  _span(start, size) {
    const ts = this.tileSize;
    return [Math.floor(start / ts), Math.ceil((start + size) / ts) - 1];
  }

  /** Retangulo [left, left+w) x [top, top+h) encosta em algum tile solido? */
  overlapsSolid(left, top, w, h) {
    const [c0, c1] = this._span(left, w);
    const [r0, r1] = this._span(top, h);
    for (let r = r0; r <= r1; r++) {
      for (let c = c0; c <= c1; c++) {
        if (this.at(c, r) === TILE.SOLID) return true;
      }
    }
    return false;
  }

  /**
   * Plataformas de uma via: so bloqueiam quando os pes CRUZAM o topo do tile
   * de cima para baixo. Retorna o Y onde parar, ou null se nao bloqueia.
   */
  oneWayLandingY(left, w, prevFeetY, newFeetY) {
    if (newFeetY <= prevFeetY) return null; // subindo ou parado: atravessa
    const ts = this.tileSize;
    const row = Math.floor(newFeetY / ts);
    const top = row * ts;
    if (prevFeetY > top) return null; // ja estava abaixo do topo
    const [c0, c1] = this._span(left, w);
    for (let c = c0; c <= c1; c++) {
      if (this.at(c, row) === TILE.ONEWAY) return top;
    }
    return null;
  }

  draw(ctx, camera, viewW, viewH) {
    const ts = this.tileSize;
    const c0 = Math.max(0, Math.floor(camera.ox / ts));
    const c1 = Math.min(this.cols - 1, Math.floor((camera.ox + viewW) / ts));
    const r0 = Math.max(0, Math.floor(camera.oy / ts));
    const r1 = Math.min(this.rows - 1, Math.floor((camera.oy + viewH) / ts));

    for (let r = r0; r <= r1; r++) {
      for (let c = c0; c <= c1; c++) {
        const tile = this.at(c, r);
        if (tile === TILE.EMPTY) continue;
        const x = c * ts;
        const y = r * ts;

        if (tile === TILE.SOLID) {
          ctx.fillStyle = '#211d30';
          ctx.fillRect(x, y, ts, ts);
          // Aresta clara so onde ha ar em cima: da leitura de "chao".
          if (this.at(c, r - 1) !== TILE.SOLID) {
            ctx.fillStyle = '#3b3352';
            ctx.fillRect(x, y, ts, 2);
          }
        } else {
          ctx.fillStyle = '#4a3f63';
          ctx.fillRect(x, y, ts, 3);
          ctx.fillStyle = '#6d5e8c';
          ctx.fillRect(x, y, ts, 1);
        }
      }
    }
  }
}
