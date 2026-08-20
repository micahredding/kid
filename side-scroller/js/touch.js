// =============================================================================
// TOUCH — On-screen controls for tablets and phones.
//
// Writes into the same key map the keyboard uses, so the engine and player
// never know the difference. Layout: slide-aware d-pad bottom-left, the whole
// right half of the screen is jump, small localized buttons for the rest
// (sprint toggle, grab, transform, character switch), a climb pad above the
// d-pad for ladders, and numbered level chips that appear only on the title
// screen.
// =============================================================================

export function isTouchDevice() {
  return window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
}

const CSS = `
  #touch-ui {
    position: fixed;
    inset: 0;
    z-index: 10;
    pointer-events: none;
    font-family: monospace;
    -webkit-user-select: none;
    user-select: none;
    -webkit-touch-callout: none;
  }
  #touch-ui * {
    pointer-events: auto;
    touch-action: none;
  }

  #t-jump {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    width: 50%;
  }
  #t-jump .t-hint {
    position: absolute;
    right: max(24px, env(safe-area-inset-right));
    bottom: max(24px, env(safe-area-inset-bottom));
    color: rgba(255, 255, 255, 0.25);
    font-size: 18px;
    letter-spacing: 2px;
    pointer-events: none;
  }

  #t-dpad {
    position: absolute;
    left: max(16px, env(safe-area-inset-left));
    bottom: max(16px, env(safe-area-inset-bottom));
    display: flex;
    gap: 14px;
  }
  .t-half {
    width: 84px;
    height: 84px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.10);
    border: 2px solid rgba(255, 255, 255, 0.25);
    color: rgba(255, 255, 255, 0.6);
    font-size: 34px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .t-half.pressed {
    background: rgba(255, 255, 255, 0.30);
  }

  /* Climb pad: pure up/down, above the d-pad. Deliberately NOT wired to
     ArrowUp/ArrowDown — those double as jump and grab, and a ladder button
     that also jumps is worse than no button. */
  #t-climb {
    position: absolute;
    left: max(16px, env(safe-area-inset-left));
    bottom: calc(max(16px, env(safe-area-inset-bottom)) + 100px);
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  #t-climb .t-btn { width: 66px; height: 66px; font-size: 26px; }

  #t-buttons {
    position: absolute;
    top: max(12px, env(safe-area-inset-top));
    right: max(12px, env(safe-area-inset-right));
    display: flex;
    flex-direction: column;
    gap: 10px;
    z-index: 11;
  }
  .t-btn {
    width: 52px;
    height: 52px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.10);
    border: 2px solid rgba(255, 255, 255, 0.25);
    color: rgba(255, 255, 255, 0.7);
    font-size: 22px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .t-btn.pressed { background: rgba(255, 255, 255, 0.30); }
  .t-btn.active {
    background: rgba(255, 210, 60, 0.45);
    border-color: rgba(255, 210, 60, 0.9);
  }

  #t-levels {
    position: absolute;
    top: max(12px, env(safe-area-inset-top));
    left: max(12px, env(safe-area-inset-left));
    display: none;
    flex-wrap: wrap;
    gap: 8px;
    max-width: 45vw;
  }
  #t-levels.visible { display: flex; }
  .t-chip {
    width: 44px;
    height: 44px;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.10);
    border: 2px solid rgba(255, 255, 255, 0.25);
    color: rgba(255, 255, 255, 0.7);
    font-size: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .t-chip.pressed { background: rgba(255, 255, 255, 0.30); }
`;

export class TouchControls {
  constructor(input, engine, levelCount) {
    this.input = input;
    this.engine = engine;

    const style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);

    this.root = document.createElement('div');
    this.root.id = 'touch-ui';
    this.root.innerHTML = `
      <div id="t-jump"><span class="t-hint">TAP TO JUMP</span></div>
      <div id="t-dpad">
        <div class="t-half" data-dir="ArrowLeft">◀</div>
        <div class="t-half" data-dir="ArrowRight">▶</div>
      </div>
      <div id="t-climb">
        <div class="t-btn" data-key="i" title="climb up">▲</div>
        <div class="t-btn" data-key="k" title="climb down">▼</div>
      </div>
      <div id="t-buttons">
        <div class="t-btn" id="t-sprint" title="sprint">⚡</div>
        <div class="t-btn" data-key="s" title="grab">✋</div>
        <div class="t-btn" data-key="c" title="transform">✨</div>
        <div class="t-btn" data-key="q" title="switch">🔄</div>
      </div>
      <div id="t-levels"></div>
    `;
    document.body.appendChild(this.root);

    this._setupJump(this.root.querySelector('#t-jump'));
    this._setupDpad(this.root.querySelector('#t-dpad'));
    this._setupSprint(this.root.querySelector('#t-sprint'));
    for (const btn of this.root.querySelectorAll('.t-btn[data-key]')) {
      this._setupTapButton(btn, btn.dataset.key);
    }
    this._setupLevels(this.root.querySelector('#t-levels'), levelCount);

    // Kill rubber-band scroll / pinch zoom while playing
    this._blockScroll = (e) => e.preventDefault();
    document.addEventListener('touchmove', this._blockScroll, { passive: false });
    // iOS Safari fires proprietary gesture events for pinch — touchmove
    // preventDefault alone doesn't always stop it, and dblclick covers
    // double-tap zoom. Either one pans/zooms the visual viewport, which
    // strands the fixed-position controls off-screen.
    for (const type of ['gesturestart', 'gesturechange', 'gestureend', 'dblclick']) {
      document.addEventListener(type, this._blockScroll, { passive: false });
    }
    // Belt and braces: if the visual viewport drifts anyway, snap it back.
    this._snapBack = () => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
    };
    window.visualViewport?.addEventListener('scroll', this._snapBack);
    window.addEventListener('scroll', this._snapBack);

    // Level chips only make sense on the title screen
    this._stateTimer = setInterval(() => {
      this.root.querySelector('#t-levels')
        .classList.toggle('visible', this.engine.gameState === 'title');
    }, 200);
  }

  _set(key, down) {
    this.input.keys[key] = down;
  }

  // Whole right half jumps; holding = higher jump, same as the keyboard.
  _setupJump(zone) {
    const pointers = new Set();
    zone.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      pointers.add(e.pointerId);
      this._set(' ', true);
    });
    const release = (e) => {
      if (!pointers.delete(e.pointerId)) return;
      if (pointers.size === 0) this._set(' ', false);
    };
    zone.addEventListener('pointerup', release);
    zone.addEventListener('pointercancel', release);
  }

  // One pad, two halves; the thumb can slide between them without lifting.
  _setupDpad(pad) {
    const pointers = new Map(); // pointerId -> 'ArrowLeft' | 'ArrowRight'

    const apply = () => {
      const dirs = new Set(pointers.values());
      this._set('ArrowLeft', dirs.has('ArrowLeft'));
      this._set('ArrowRight', dirs.has('ArrowRight'));
      for (const half of pad.children) {
        half.classList.toggle('pressed', dirs.has(half.dataset.dir));
      }
    };
    const dirAt = (x) => {
      const r = pad.getBoundingClientRect();
      return x < r.left + r.width / 2 ? 'ArrowLeft' : 'ArrowRight';
    };

    pad.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      try { pad.setPointerCapture(e.pointerId); } catch { /* synthetic events have no capturable pointer */ }
      pointers.set(e.pointerId, dirAt(e.clientX));
      apply();
    });
    pad.addEventListener('pointermove', (e) => {
      if (!pointers.has(e.pointerId)) return;
      pointers.set(e.pointerId, dirAt(e.clientX));
      apply();
    });
    const release = (e) => {
      if (!pointers.delete(e.pointerId)) return;
      apply();
    };
    pad.addEventListener('pointerup', release);
    pad.addEventListener('pointercancel', release);
  }

  // Sprint is a toggle — small hands can't hold three things at once.
  _setupSprint(btn) {
    btn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      const on = !btn.classList.contains('active');
      btn.classList.toggle('active', on);
      this._set('Shift', on);
    });
  }

  _setupTapButton(btn, key) {
    btn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      btn.classList.add('pressed');
      this._set(key, true);
    });
    const release = () => {
      btn.classList.remove('pressed');
      this._set(key, false);
    };
    btn.addEventListener('pointerup', release);
    btn.addEventListener('pointercancel', release);
  }

  _setupLevels(row, count) {
    for (let i = 1; i <= count; i++) {
      const chip = document.createElement('div');
      chip.className = 't-chip';
      chip.textContent = i;
      this._setupTapButton(chip, String(i));
      row.appendChild(chip);
    }
  }

  destroy() {
    clearInterval(this._stateTimer);
    document.removeEventListener('touchmove', this._blockScroll);
    for (const type of ['gesturestart', 'gesturechange', 'gestureend', 'dblclick']) {
      document.removeEventListener(type, this._blockScroll);
    }
    window.visualViewport?.removeEventListener('scroll', this._snapBack);
    window.removeEventListener('scroll', this._snapBack);
    this.root.remove();
  }
}
