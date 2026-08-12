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
  engine.startLevel(5);
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

// Doubling Cave: ceiling trail + trench exits + stalagmite + door reach
hop('ledge -> trail 1    ', 98, 7, 99.6, +1, 11, [103, 106.9], 8);
hop('trail 1 -> 2        ', 104, 8, 105.6, +1, 11, [109, 112.9], 8);
hop('trail 2 -> 3        ', 110, 8, 111.6, +1, 11, [115, 117.9], 8);
hop('trail 3 -> 4        ', 116, 8, 116.6, +1, 11, [120, 121.9], 8);
hop('trail 4 -> 5        ', 120.5, 8, 120.9, +1, 12, [125, 127.9], 9);
hop('trench 1 hop out    ', 53.5, 22, 54.2, +1, 14, [55, 58], 20);
hop('trench 2 hop out    ', 113.5, 22, 114.2, +1, 14, [115, 118], 20);
hop('stalagmite 128 hop  ', 125.5, 20, 126.6, +1, 22, [129, 133], 20);
// gem grab at the trail's end
{
  engine.player = null; engine.startLevel(5); engine.gameState = 'playing';
  const p = engine.player;
  p.x = 126 * ts - p.width / 2; p.y = 9 * ts - p.height;
  engine.camera.x = p.x - 480;
  for (let f = 0; f < 120 && p.gems < 1; f++) {
    input.keys[' '] = (f % 30) < 14;
    input.update(); engine.update();
  }
  console.log('gem grab at trail end:', p.gems >= 1 ? 'OK' : 'MISS');
}
// key grab on the 8-tower top
{
  engine.player = null; engine.startLevel(5); engine.gameState = 'playing';
  const p = engine.player;
  p.x = 88 * ts - p.width / 2 + 4; p.y = 12 * ts - p.height;
  engine.camera.x = p.x - 480;
  for (let f = 0; f < 120 && !p.keys.includes('gold'); f++) {
    input.keys[' '] = (f % 30) < 14;
    input.update(); engine.update();
  }
  console.log('key grab on 8-tower  :', p.keys.includes('gold') ? 'OK' : 'MISS');
}
