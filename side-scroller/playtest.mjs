// Headless playtest: drives the real Engine physics with scripted input.

const noop = () => {};
const ctxProxy = new Proxy({}, {
  get: (t, prop) => (prop === 'canvas' ? canvasStub : noop),
  set: () => true,
});
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
const press = (k, on) => { input.keys[k] = on; };

function tileAt(col, row) {
  const t = engine.level.tiles;
  if (row < 0 || row >= t.length || col < 0 || col >= t[row].length) return ' ';
  return t[row][col];
}
const solidAt = (col, row) => { const ch = tileAt(col, row); return ch !== ' ' && ch !== 'I'; };
const standable = (col, row) => tileAt(col, row) !== ' ';

let jumpHold = 0, prevX = 0, stuckFrames = 0;

function stepFrame() {
  const p = engine.player;
  const col = Math.floor((p.x + p.width / 2) / ts);
  const rowFeet = Math.floor((p.y + p.height - 1) / ts);

  press('ArrowRight', true);

  const wallAhead = solidAt(col + 1, rowFeet) || solidAt(col + 1, rowFeet - 1);
  // gap ahead: nothing standable in the next 2 columns for up to 3 rows below feet
  let gapAhead = true;
  for (let dc = 1; dc <= 2 && gapAhead; dc++)
    for (let dr = 1; dr <= 3; dr++)
      if (standable(col + dc, rowFeet + dr)) { gapAhead = false; break; }
  // enemy just ahead → jump (to stomp or clear)
  let enemyAhead = false;
  for (const e of engine.entities) {
    if ((e.type === 'goomba' || e.type === 'flyguy' || e.type === 'spiker') && e.alive !== false) {
      if (e.x > p.x && e.x - (p.x + p.width) < 40 && Math.abs(e.y - p.y) < 48) enemyAhead = true;
    }
    // locked door or pushblock jammed ahead → hop over it (entity collisions
    // make onGround flicker, so the stuck-detector never fires against them)
    if ((e.type === 'door' && !e.opened) || e.type === 'pushblock') {
      if (e.x > p.x && e.x - (p.x + p.width) < 40 && Math.abs(e.y - p.y) < 64) enemyAhead = true;
    }
  }

  if (Math.abs(p.x - prevX) < 0.2 && p.onGround) stuckFrames++; else stuckFrames = 0;
  prevX = p.x;

  if (jumpHold > 0) {
    jumpHold--;
    press(' ', true);
    if (jumpHold === 0) press(' ', false);
  } else if (p.onGround && (wallAhead || gapAhead || enemyAhead || stuckFrames > 10)) {
    jumpHold = 14;
    stuckFrames = 0;
  } else {
    press(' ', false);
  }

  input.update();
  engine.update();
}

function run(label, setup, maxSec = 150, levelIdx = 0) {
  engine.startLevel(levelIdx);
  engine.gameState = 'playing';
  setup?.();
  jumpHold = 0; prevX = 0; stuckFrames = 0;
  let lastLives = engine.player.lives;
  const events = [];
  let completed = false;
  let stallLog = 0;
  for (let f = 0; f < 60 * maxSec; f++) {
    const beforeCol = Math.floor(engine.player.x / ts);
    stepFrame();
    const p = engine.player;
    if (p.lives < lastLives) {
      events.push(`damage/death at col ${beforeCol} (lives ${lastLives}->${p.lives})`);
      lastLives = p.lives;
    }
    if (engine.gameState === 'level_complete') { completed = true; break; }
    if (engine.gameState === 'game_over') { events.push('GAME OVER'); break; }
    if (stuckFrames > 300 && stallLog < 3) { events.push(`stalled at col ${beforeCol}, row ${Math.floor(p.y / ts)}`); stallLog++; stuckFrames = 0; }
  }
  const p = engine.player;
  console.log(`${label}: completed=${completed} col=${Math.floor(p.x / ts)} row=${Math.floor(p.y / ts)} coins=${p.coins} score=${p.score}`);
  for (const e of events.slice(0, 12)) console.log('   ', e);
}

run('L1 surface->sky route');
run('L1 tunnel route      ', () => {
  engine.player.x = 152 * ts; engine.player.y = 7 * ts - engine.player.height;
  engine.camera.x = engine.player.x - 480;
});
run('L1 sky route from P2 ', () => {
  engine.player.x = 163 * ts; engine.player.y = 6 * ts - engine.player.height;
  engine.camera.x = engine.player.x - 480;
});
run('L2 from start        ', null, 150, 1);
run('L2 lower route       ', () => {
  engine.player.x = 135 * ts; engine.player.y = 6 * ts - engine.player.height;
  engine.camera.x = engine.player.x - 480;
}, 150, 1);
run('L2 upper route       ', () => {
  engine.player.x = 146 * ts; engine.player.y = 5 * ts - engine.player.height;
  engine.camera.x = engine.player.x - 480;
}, 150, 1);

// Character switching: press Q every 4 seconds during a tunnel run, expect no crash
{
  engine.startLevel(0);
  engine.gameState = 'playing';
  engine.player.x = 152 * ts; engine.player.y = 7 * ts - engine.player.height;
  engine.camera.x = engine.player.x - 480;
  jumpHold = 0; prevX = 0; stuckFrames = 0;
  const seen = new Set([engine.player.character]);
  let completed = false;
  for (let f = 0; f < 60 * 150; f++) {
    if (f % 240 === 120) press('q', true); else press('q', false);
    stepFrame();
    seen.add(engine.player.character);
    if (engine.gameState === 'level_complete') { completed = true; break; }
    if (engine.gameState === 'game_over') break;
  }
  console.log('SWITCH test: characters seen =', [...seen].join(','),
              ' completed =', completed,
              ' final col =', Math.floor(engine.player.x / ts));
}
