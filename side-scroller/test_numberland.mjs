// World 1-5 Numberland playtest: waypoint-following bot over real engine physics.

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
  engine.startLevel(4);
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


// Route A1: meadow through squares garden to the gold key
// (the tower zone is impassable at ground level by design — the Fibonacci
//  climb or the elevator is the way; bots can't time the elevator, so A1
//  starts east of the towers)
runRoute('A1 squares + gold key', [
  { col: 60, row: 16 },
  { col: 90, row: 16 },
  { col: 96, row: 16 },               // across pit 1 (edge-jump)
  { col: 106, row: 16 },              // across pit 2 (edge-jump)
  { col: 112, row: 12 },              // 3x3
  { col: 118.5, row: 11 },            // 4x4
  { col: 126, row: 10, until: p => p.keys.includes('gold') }, // key on the 5x5
  { col: 130.4, row: 16 },
], (player) => {
  player.x = 55 * ts; player.y = 15 * ts - player.height;
  engine.camera.x = player.x - 480;
});

// Route A2: gate, pi meadow, and the Hundred climb to the flag
runRoute('A2 gate + the Hundred', [
  { col: 168, row: 16 },              // through the gold gate
  { col: 180, row: 16 },              // pi meadow
  { col: 185, row: 12 },              // scaffold
  { col: 187, row: 9 },
  { col: 185.5, row: 6, settle: true },
  { col: 192, row: 5 },               // onto the Hundred
  { col: 199, row: 5 },               // past the flag
], (player) => {
  player.x = 160 * ts; player.y = 15 * ts - player.height;
  player.keys.push('gold');
  engine.camera.x = player.x - 480;
});

// Route B: Fibonacci towers — every hop is the sequence (0,1,1,2,3)
runRoute('B fibonacci climb   ', [
  { col: 18, row: 14 }, { col: 22, row: 14 },
  { col: 26, row: 13 }, { col: 30, row: 12 },
  { col: 34, row: 10 }, { col: 38, row: 7 },
]);

// (Route C sky-run hops verified individually in debug_hops5.mjs)

// Route D: vault backup key + ten-frames
runRoute('D vault backup key  ', [
  { col: 131, row: 25, nojump: true },
  { col: 127, row: 21, until: p => p.keys.includes('gold') },
  { col: 143, row: 25 },
  { col: 153.5, row: 21 }, { col: 155.5, row: 19 }, { col: 157.5, row: 17 },
  { col: 161, row: 16 },
], (player) => {
  player.x = 129.5 * ts; player.y = 15 * ts - player.height;
  engine.camera.x = player.x - 480;
});

// static check: the ferry's swing covers the 8-wide gap (76-83)
{
  const c = 79 * ts, r = 112, w = 3 * ts;
  console.log('ferry coverage:', ((c - r) / ts).toFixed(1), '->', ((c + r + w) / ts).toFixed(1),
              '(needs to bridge cols 76-84)');
}
