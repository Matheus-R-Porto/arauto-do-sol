import { CAMERA } from '../../config/tuning.js';
import { clamp, damp } from './math.js';

export class Camera {
  constructor(viewWidth, viewHeight) {
    this.w = viewWidth;
    this.h = viewHeight;
    this.x = 0;
    this.y = 0;
  }

  _targetFor(t) {
    return {
      x: t.x + t.facing * CAMERA.lookAheadX - this.w / 2,
      y: t.y - t.h / 2 - CAMERA.lookAheadY - this.h / 2,
    };
  }

  update(dt, target, bounds) {
    const want = this._targetFor(target);
    this.x = damp(this.x, want.x, CAMERA.smoothing, dt);
    this.y = damp(this.y, want.y, CAMERA.smoothing, dt);
    this._clamp(bounds);
  }

  snapTo(target, bounds) {
    const want = this._targetFor(target);
    this.x = want.x;
    this.y = want.y;
    this._clamp(bounds);
  }

  _clamp(bounds) {
    this.x = clamp(this.x, 0, Math.max(0, bounds.width - this.w));
    this.y = clamp(this.y, 0, Math.max(0, bounds.height - this.h));
  }

  // Offsets inteiros: pixel art tremendo em subpixel fica feio.
  get ox() { return Math.round(this.x); }
  get oy() { return Math.round(this.y); }
}
