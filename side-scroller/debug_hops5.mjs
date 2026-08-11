// Scripted single hops for Numberland's remaining connections
const noop = () => {};
const ctxProxy = new Proxy({}, { get: (t, p) => (p === 'canvas' ? canvasStub : noop), set: () => true });
const canvasStub = { getContext: () => ctxProxy, width: 960, height: 540, style: {} };
globalThis.window = { addEventListener: noop, removeEventListener: noop };
globalThis.document = { addEventListener: noop, removeEventListener: noop };
globalThis.performance = { now: () => 0 };
globalThis.requestAnimationFrame = noop;
const { Engine } = await import('./js/engine.js');
const { CONFIG } = await import('./js/config.js');
const engine = new Engine(canvasStub);
const ts = CONFIG.tile.size;
const input = engine.input;

function hop(label, fromCol, fromRow, jumpAtCol, dir, holdFrames, wantCols, wantRow) {
  engine.player = null;
  engine.startLevel(4);
  engine.gameState = 'playing';
  const p = engine.player;
  p.x = fromCol * ts - p.width / 2; p.y = fromRow * ts - p.height;
  engine.camera.x = Math.max(0, p.x - 480);
  let jumped = false, hold = 0;
  for (let f = 0; f < 240; f++) {
    const col = (p.x + p.width / 2) / ts;
    input.keys['ArrowRight'] = dir > 0;
    input.keys['ArrowLeft'] = dir < 0;
    if (!jumped && (dir === 0 ? f >= 5 : dir * (col - jumpAtCol) >= 0)) { jumped = true; hold = holdFrames; }
    input.keys[' '] = hold > 0; if (hold > 0) hold--;
    input.update();
    engine.update();
    if (jumped && hold === 0 && p.onGround) {
      const c = (p.x + p.width / 2) / ts, r = (p.y + p.height) / ts;
      const ok = c >= wantCols[0] && c <= wantCols[1] && Math.abs(r - wantRow) < 0.3;
      console.log(`${label}: landed col ${c.toFixed(1)} row ${r.toFixed(1)} -> ${ok ? 'OK' : 'MISS'}`);
      return;
    }
  }
  console.log(`${label}: no landing`);
}

// squares garden: 3x3 -> 4x4 -> 5x5 (gap 3, rise 1 each)
hop('3x3 -> 4x4          ', 112, 12, 113.1, +1, 12, [117, 120.9], 11);
hop('4x4 -> 5x5          ', 119, 11, 120.1, +1, 16, [124, 128.9], 10);
// sky run: P1->P2 (gap 1), P2->P3 (gap 2), P3->P4 (gap 4)
hop('sky gap 1           ', 55, 6, 56.2, +1, 12, [58, 61.9], 6);
hop('sky gap 2           ', 60, 6, 61.2, +1, 14, [64, 67.9], 6);
hop('sky gap 4           ', 66, 6, 67.2, +1, 18, [72, 75.9], 6);
// 13-tower top -> P1 (walk-off style with a small hop)
hop('13-top -> P1        ', 49.5, 2, 50.2, +1, 8, [53, 56.9], 6);
// vault stairs: floor -> step1 -> step2 -> step3 -> ground
hop('floor -> stair 1    ', 150.5, 23, 151.6, +1, 14, [153, 154.9], 21);
hop('stair 1 -> stair 2  ', 154, 21, 154.4, +1, 14, [155, 156.9], 19);
hop('stair 2 -> stair 3  ', 156, 19, 156.4, +1, 14, [157, 158.9], 17);
hop('stair 3 -> ground   ', 158, 17, 158.4, +1, 14, [159, 163], 15);
// Hundred scaffold: straight-up hop at the overlap column, then onto the top
hop('scaffold 9 -> 6     ', 186, 9, 999, 0, 22, [184, 186.9], 6);
hop('scaffold 6 -> summit', 185, 6, 186.2, +1, 16, [190, 194], 5);
// gold key grab from the 5x5 (key at row 8 above top row 10)
{
  engine.player = null; engine.startLevel(4); engine.gameState = 'playing';
  const p = engine.player;
  p.x = 122 * ts - p.width / 2; p.y = 10 * ts - p.height;
  engine.camera.x = p.x - 480;
  for (let f = 0; f < 120 && !p.keys.includes('gold'); f++) {
    input.keys[' '] = (f % 30) < 14;
    input.update(); engine.update();
  }
  console.log('key grab on 5x5     :', p.keys.includes('gold') ? 'OK' : 'MISS');
}

// A1's missing link: running jump from the ground onto the 3x3
hop('ground -> 3x3       ', 108.5, 15, 109.6, +1, 18, [111, 113.9], 12);
// A2's first scaffold hop: ground onto (12,184-186)
hop('ground -> scaffold 1', 181, 15, 182.2, +1, 22, [184, 186.9], 12);
// scaffold 1 -> 2: (12,184-186) up-right to (9,186-188)
hop('scaffold 1 -> 2     ', 185, 12, 185.4, +1, 16, [186, 188.9], 9);
// sky spawn: standstill first hop P1 -> P2 with a longer hold
hop('P1 -> P2 standstill ', 55.5, 6, 55.6, +1, 16, [58, 61.9], 6);
