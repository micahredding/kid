// World 1-3 Castle playtest: waypoint-following bot over real engine physics.

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
  engine.startLevel(2);
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

// shared tail: courtyard -> gate -> tower -> rooftop flag
const TAIL = [
  { col: 166, row: 16 },              // east courtyard, key in hand
  { col: 174, row: 16 },              // through the gold gate
  { col: 184, row: 23 },              // drop into the tower shaft
  { col: 182, row: 19 }, { col: 186, row: 16 },
  { col: 182, row: 13 }, { col: 186, row: 10 },
  { col: 182, row: 7 },  { col: 186, row: 4 },
  { col: 200, row: 6 },               // out onto the keep rooftop
  { col: 223, row: 6 },               // flag
];

// Route A: fall in the moat -> secret tunnel -> dungeon -> backup key -> stairs -> tail
runRoute('A moat/dungeon route', [
  { col: 29, row: 16 },               // hop the pedestal
  { col: 35, row: 25, nojump: true }, // walk off into the moat, no hopping
  { col: 45, row: 25 },               // tunnel
  { col: 60, row: 25 },               // past the spiker
  { col: 101, row: 25 },              // dungeon mid
  { col: 150, row: 21, until: p => p.keys.includes('gold') }, // backup gold key
  { col: 159, row: 22 }, { col: 161, row: 20 }, { col: 163, row: 18 }, // stairs
  ...TAIL,
]);

// Route B0: grab the silver key from its pedestal
const b0 = runRoute('B0 silver key grab  ', [
  { col: 27, row: 13, until: p => p.keys.includes('silver') },
]);
if (!b0.engine.player.keys.includes('silver')) console.log('    FAIL: silver key not collected');

// Route B: bridge skipped (teleport past moat w/ silver key) -> door -> hall ->
//          roof ladder -> battlements -> courtyard -> pedestal key -> tail
runRoute('B hall/roof route   ', [
  { col: 44, row: 16, nojump: true },
  { col: 52, row: 16 },               // silver door
  { col: 90, row: 16 },               // across the hall
  { col: 103.5, row: 13 },            // ladder
  { col: 106.5, row: 10 },
  { col: 103, row: 7, settle: true },
  { col: 108, row: 5, settle: true }, // up through the roof hole
  { col: 118, row: 5 },               // battlements run
  { col: 130, row: 16 },              // drop into courtyard
  { col: 156, row: 13, until: p => p.keys.includes('gold') }, // gold key pedestal
  ...TAIL,
], (player) => {
  player.x = 42 * ts; player.y = 15 * ts - player.height;
  player.keys.push('silver');
  engine.camera.x = player.x - 480;
});
