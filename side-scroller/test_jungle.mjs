// World 1-4 Jungle playtest: waypoint-following bot over real engine physics.

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
  engine.startLevel(3);
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

    press('ArrowRight', col < wp.col - 0.4);
    press('ArrowLeft', col > wp.col + 0.4);

    const towardWp = Math.sign(wp.col * ts - (p.x + p.width / 2));
    grounded = p.onGround ? grounded + 1 : 0;
    const ready = wp.settle
      ? (grounded >= 8 && Math.abs(p.vx) < 1)
      : (p.onGround && (Math.abs(p.vx) < 1 || Math.sign(p.vx) === towardWp));
    if (jumpHold > 0) { jumpHold--; press(' ', true); if (!jumpHold) { press(' ', false); cooldown = 8; } }
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


// Route A: floor lane, through the gorge and the temple pit
runRoute('A jungle floor route', [
  { col: 35, row: 16 },               // under tree 1
  { col: 55, row: 16 },
  { col: 60.5, row: 16 },
  { col: 66, row: 25, nojump: true }, // drop into the croc gorge
  { col: 72, row: 25 },               // past the crocs
  { col: 74.5, row: 20 }, { col: 76.5, row: 18 }, { col: 78.5, row: 16 }, // stairs
  { col: 92, row: 16 },
  { col: 112, row: 16 },
  { col: 124, row: 15 }, { col: 128, row: 13 }, { col: 132, row: 11 }, { col: 136, row: 9 }, // pyramid up
  { col: 139, row: 8 },               // plateau
  { col: 148, row: 16 },              // hop down the east face
  { col: 158, row: 25, nojump: true },// drop into the temple pit
  { col: 166, row: 25 },
  { col: 170.5, row: 20 }, { col: 172.5, row: 18 }, { col: 174.5, row: 16 }, // stairs
  { col: 190, row: 16 },
  { col: 223, row: 16 },              // flag
]);

// Canopy verified in segments (the full chain compounds bot chaos)
runRoute('B1 climb tree 1     ', [
  { col: 27.5, row: 12 }, { col: 30, row: 9 }, { col: 32.8, row: 8 },
], (player) => {
  player.x = 23 * ts; player.y = 15 * ts - player.height;
  engine.camera.x = player.x - 480;
});

runRoute('B2 branches to key  ', [
  { col: 37.5, row: 7, hold: 12 }, { col: 44.5, row: 5, hold: 15 }, { col: 51.5, row: 7, hold: 12 },
  { col: 59.5, row: 6, hold: 12 }, { col: 67.5, row: 5, hold: 15 }, { col: 75.5, row: 7, hold: 12 },
  { col: 80.5, row: 8, hold: 12 }, { col: 85.5, row: 6, hold: 15 },
  { col: 92.5, row: 4, hold: 15, until: p => p.keys.includes('silver') },
], (player) => {
  player.x = 32.5 * ts - player.width / 2; player.y = 8 * ts - player.height;
  engine.camera.x = player.x - 480;
});

runRoute('B3 key to pyramid   ', [
  { col: 99.5, row: 6, hold: 12 }, { col: 107.5, row: 5, hold: 15 }, { col: 114.5, row: 5, hold: 15 },
  { col: 125, row: 14, hold: 10 }, { col: 132, row: 11, hold: 12 }, { col: 136, row: 9, hold: 12 }, { col: 139, row: 8, hold: 12 },
], (player) => {
  player.x = 92 * ts; player.y = 4 * ts - player.height;
  engine.camera.x = player.x - 480;
});

runRoute('B4 pyramid to flag  ', [
  { col: 141.5, row: 10, hold: 10 }, { col: 147.5, row: 7 },
  { col: 154.5, row: 7 }, { col: 162.5, row: 5 }, { col: 170.5, row: 7 },
  { col: 177, row: 6 }, { col: 181.5, row: 5 }, { col: 189.5, row: 4 },
  { col: 196.5, row: 8 }, { col: 200.5, row: 12 }, { col: 210, row: 16 },
  { col: 223, row: 16 },
], (player) => {
  player.x = 138 * ts; player.y = 7 * ts - player.height;
  engine.camera.x = player.x - 480;
});

// Route C: pyramid chamber (silver door) — enter, grab the red gem, leave
runRoute('C hidden chamber    ', [
  { col: 144, row: 15, nojump: true },
  { col: 131, row: 15, until: p => p.gems >= 1 },
  { col: 150, row: 16, nojump: true },
], (player) => {
  player.x = 150 * ts; player.y = 15 * ts - player.height;
  player.keys.push('silver');
  engine.camera.x = player.x - 480;
});
