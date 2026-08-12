// World 1-6 Doubling Cave playtest: waypoint-following bot over real engine physics.

const noop = () => {};
const ctxProxy = new Proxy({}, { get: (t, p) => (p === 'canvas' ? canvasStub : noop), set: () => true });
const canvasStub = { getContext: () => ctxProxy, width: 960, height: 540, style: {} };
globalThis.window = { addEventListener: noop, removeEventListener: noop };
globalThis.document = { addEventListener: noop, removeEventListener: noop };
globalThis.performance = { now: () => 0 };
globalThis.requestAnimationFrame = noop;
globalThis.Date = Date; // drawTitle uses Date.now, but draw() is never called here

const { Engine } = await import('./js/engine.js');
const { CONFIG } = await import('./js/config.js');
const engine = new Engine(canvasStub);
const ts = CONFIG.tile.size;
const input = engine.input;
const press = (k, on) => { input.keys[k] = on; };

// Waypoint follower: run toward col while (optionally) spam-jumping;
// waypoint done when horizontally there and feet at/above the target row.
function runRoute(label, waypoints, setup) {
  engine.player = null;
  engine.startLevel(5);
  engine.gameState = 'playing';
  setup?.(engine.player);
  let wi = 0, jumpHold = 0, cooldown = 0, lastProgress = 0, lastX = engine.player.x, grounded = 0;
  const events = [];
  let frames = 0;
  const MAX = 60 * 240;
  while (wi < waypoints.length && frames < MAX) {
    const wp = waypoints[wi];
    const p = engine.player;
    const col = (p.x + p.width / 2) / ts;
    const feetRow = (p.y + p.height) / ts;

    const tol = wp.settle ? 1.0 : 0.4;
    press('ArrowRight', col < wp.col - tol);
    press('ArrowLeft', col > wp.col + tol);

    const towardWp = Math.sign(wp.col * ts - (p.x + p.width / 2));
    grounded = p.onGround ? grounded + 1 : 0;
    const ready = wp.settle
      ? (grounded >= 8 && Math.abs(p.vx) < 1)
      : (p.onGround && (Math.abs(p.vx) < 1 || Math.sign(p.vx) === towardWp));
    const icol = Math.floor((p.x + p.width / 2) / ts);
    const irow = Math.floor((p.y + p.height - 1) / ts);
    const tl = engine.level.tiles;
    const at2 = (c, r) => (r < 0 || r >= tl.length || c < 0 || c >= tl[r].length) ? ' ' : tl[r][c];
    const atEdge = p.onGround && towardWp !== 0
      && at2(icol + towardWp, irow + 1) === ' ' && at2(icol + towardWp, irow + 2) === ' ';
    if (jumpHold > 0) { jumpHold--; press(' ', true); if (!jumpHold) { press(' ', false); cooldown = 8; } }
    else if (!wp.nojump && atEdge) { jumpHold = wp.hold ?? 22; cooldown = 0; }
    else if (cooldown > 0) { cooldown--; press(' ', false); }
    else if (!wp.nojump && ready) { jumpHold = wp.hold ?? 22; }
    else press(' ', false);

    input.update();
    engine.update();
    frames++;

    if (Math.abs(engine.player.x - lastX) > 4) { lastX = engine.player.x; lastProgress = frames; }
    if (frames - lastProgress > 60 * 20) { events.push(`STUCK at wp${wi} (${wp.col},${wp.row}) near col ${col.toFixed(1)} row ${feetRow.toFixed(1)}`); break; }

    const done = wp.until
      ? (Math.abs(col - wp.col) < 1.5 && wp.until(p))
      : (Math.abs(col - wp.col) < 0.8 && feetRow <= wp.row + 0.99);
    if (done) {
      wi++;
      lastProgress = frames;
    } else if (!wp.until && wp.row < 20 && feetRow > wp.row + 3.5 && p.onGround && wi > 0) {
      wi--;   // fell below a climb target: back up and redo the previous hop
      lastProgress = frames;
    }
    if (engine.gameState === 'level_complete') break;
    if (engine.gameState === 'game_over') { events.push('GAME OVER'); break; }
  }
  const p = engine.player;
  console.log(`${label}: waypoints ${wi}/${waypoints.length} | state=${engine.gameState} | col=${(p.x/ts).toFixed(1)} | keys=[${p.keys}] | coins=${p.coins} lives=${p.lives}`);
  for (const e of events) console.log('   ', e);
  return { wi, engine };
}


// Route A1: entry through the doubling chambers to the tower zone
runRoute('A1 doubling chambers', [
  { col: 18, row: 21 },               // 2-tall squeeze
  { col: 30, row: 21 },               // 4-tall
  { col: 45, row: 21 },               // 8-tall
  { col: 53, row: 23, nojump: true }, // trench 1
  { col: 58, row: 21 },               // out + over the pipe
  { col: 70, row: 21 },               // into the great cavern
]);

// Route B: monument climb 1 -> 2 -> 4 (the elevator does 4 -> 8)
runRoute('B monument climb    ', [
  { col: 74, row: 19 },
  { col: 77, row: 18 },
  { col: 81, row: 16 },
]);

// Route A2: east cavern with the key — trench 2, door, halving exit, flag
runRoute('A2 door + halving out', [
  { col: 105, row: 21 },              // along the lying-down 16
  { col: 113, row: 23, nojump: true },// trench 2 (backup key + gem live here)
  { col: 118, row: 21 },
  { col: 126, row: 21 },
  { col: 131, row: 21 },              // over the stalagmite
  { col: 138, row: 21 },              // through the gold door
  { col: 148, row: 21 },
  { col: 156, row: 21 },              // 4-tall
  { col: 165, row: 21 },              // flag hall
  { col: 172, row: 21 },              // flag
], (player) => {
  player.x = 97 * ts; player.y = 20 * ts - player.height;
  player.keys.push('gold');
  engine.camera.x = player.x - 480;
});

// Route T: ceiling trail — halving coins to the gem
runRoute('T halving coin trail', [
  { col: 104.5, row: 8, hold: 11 },
  { col: 110.5, row: 8, hold: 11 },
  { col: 116, row: 8, hold: 11 },
  { col: 120.5, row: 8, hold: 11 },
  { col: 126, row: 9, until: p => p.gems >= 1 },
], (player) => {
  player.x = 97 * ts; player.y = 7 * ts - player.height;   // on the upper ledge
  engine.camera.x = player.x - 480;
});

console.log('E1 rides rows', (14*32-96)/32, '-', (14*32+96)/32, '(board 4-top r16, alight 8-top r12)');
console.log('E2 rides rows', (8*32-128)/32, '-', (8*32+128)/32, '(board 8-top r12, alight ledge r5)');
