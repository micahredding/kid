// =============================================================================
// INPUT — Keyboard input handling with press/release tracking
// =============================================================================

export class Input {
  constructor() {
    this.keys = {};
    this.justPressed = {};
    this.justReleased = {};
    this._prev = {};

    this._onKeyDown = (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'Shift'].includes(e.key)) {
        e.preventDefault();
      }
      this.keys[e.key] = true;
    };

    this._onKeyUp = (e) => {
      this.keys[e.key] = false;
    };

    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);
  }

  update() {
    for (const key in this.keys) {
      this.justPressed[key] = this.keys[key] && !this._prev[key];
      this.justReleased[key] = !this.keys[key] && this._prev[key];
    }
    this._prev = { ...this.keys };
  }

  isDown(key) {
    return !!this.keys[key];
  }

  wasPressed(key) {
    return !!this.justPressed[key];
  }

  wasReleased(key) {
    return !!this.justReleased[key];
  }

  // Convenience accessors
  get left() { return this.isDown('ArrowLeft') || this.isDown('a'); }
  get right() { return this.isDown('ArrowRight') || this.isDown('d'); }
  get up() { return this.isDown('ArrowUp') || this.isDown('w'); }
  get down() { return this.isDown('ArrowDown') || this.isDown('s'); }
  get jump() { return this.isDown('ArrowUp') || this.isDown('w') || this.isDown(' '); }
  get jumpPressed() { return this.wasPressed('ArrowUp') || this.wasPressed('w') || this.wasPressed(' '); }
  get jumpReleased() { return this.wasReleased('ArrowUp') || this.wasReleased('w') || this.wasReleased(' '); }
  get sprint() { return this.isDown('Shift') || this.isDown('z'); }
  get actionPressed() { return this.wasPressed('ArrowDown') || this.wasPressed('s') || this.wasPressed('x'); }
  get transformPressed() { return this.wasPressed('c') || this.wasPressed('e'); }

  destroy() {
    window.removeEventListener('keydown', this._onKeyDown);
    window.removeEventListener('keyup', this._onKeyUp);
  }
}
