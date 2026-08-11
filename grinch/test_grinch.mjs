// Headless playtest: drives the real Engine physics with a scripted bot.
// Run: node test_grinch.mjs   (exits non-zero on any failed check)

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

let failures = 0;
function check(label, cond, detail = '') {
  if (cond) {
    console.log(`  PASS  ${label}`);
  } else {
    console.log(`  FAIL  ${label} ${detail}`);
    failures++;
  }
}

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
  let gapAhead = true;
  for (let dc = 1; dc <= 2 && gapAhead; dc++)
    for (let dr = 1; dr <= 3; dr++)
      if (standable(col + dc, rowFeet + dr)) { gapAhead = false; break; }
  let enemyAhead = false;
  for (const e of engine.entities) {
    if ((e.type === 'goomba' || e.type === 'flyguy' || e.type === 'spiker') && e.alive !== false) {
      if (e.x > p.x && e.x - (p.x + p.width) < 40 && Math.abs(e.y - p.y) < 48) enemyAhead = true;
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

function resetKeys() {
  for (const k of Object.keys(input.keys)) input.keys[k] = false;
}

function run(label, levelIdx, { setup = null, maxSec = 180, expectComplete = true } = {}) {
  engine.player = null;
  engine.startLevel(levelIdx, { showStory: false });
  engine.gameState = 'playing';
  setup?.();
  resetKeys();
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
      events.push(`damage at col ${beforeCol} (lives ${lastLives}->${p.lives})`);
      lastLives = p.lives;
    }
    if (engine.gameState === 'level_complete') { completed = true; break; }
    if (engine.gameState === 'game_over') { events.push('GAME OVER'); break; }
    if (stuckFrames > 400 && stallLog < 3) {
      events.push(`stalled at col ${beforeCol}, row ${Math.floor(p.y / ts)}`);
      stallLog++; stuckFrames = 0;
    }
  }
  const p = engine.player;
  console.log(`${label}: completed=${completed} col=${Math.floor(p.x / ts)} row=${Math.floor(p.y / ts)} presents=${p.presents} housesLit=${p.housesLit} score=${p.score}`);
  for (const e of events.slice(0, 10)) console.log('    ', e);
  if (expectComplete) check(`${label} completes`, completed, `(ended at col ${Math.floor(p.x / ts)})`);
  return { completed, player: p };
}

console.log('=== World runs (hold-right bot) ===');
const w1 = run('W1 Down Mount Crumpit', 0);
check('W1 bot gathered presents', w1.player.presents > 3, `got ${w1.player.presents}`);

const w2 = run('W2 Whoville street route', 1);
check('W2 bot gathered presents', w2.player.presents > 6, `got ${w2.player.presents}`);

run('W3 The Climb', 2);

const w4 = run('W4 Christmas Morning', 3, { maxSec: 240 });
check('W4 all houses lit', w4.player.housesLit === engine.level.housesRequired,
  `lit ${w4.player.housesLit}/${engine.level.housesRequired}`);

console.log('=== W4 goal stays locked until every house is lit ===');
{
  engine.player = null;
  engine.startLevel(3, { showStory: false });
  engine.gameState = 'playing';
  resetKeys();
  // teleport to the goal with zero houses lit — must NOT complete
  engine.player.x = engine.level.goalCol + 10;
  engine.player.y = 19 * ts - engine.player.height;
  engine.camera.x = engine.player.x - 480;
  for (let f = 0; f < 60; f++) { input.update(); engine.update(); }
  check('goal locked with 0 houses', engine.gameState === 'playing');
}

console.log('=== W2 chimney drop: roof -> living room -> out the door ===');
{
  engine.player = null;
  engine.startLevel(1, { showStory: false });
  engine.gameState = 'playing';
  resetKeys();
  // stand on house 1's roof, left of the chimney (house at col 28, roof row 13)
  engine.player.x = 30 * ts;
  engine.player.y = 13 * ts - engine.player.height;
  engine.camera.x = engine.player.x - 480;
  let wasInside = false;
  let outTheDoor = false;
  // hold right, jump only at walls (a gap-jumping bot vaults the chimney
  // mouth; a kid strolling right falls in — that's the point)
  let hold = 0;
  for (let f = 0; f < 60 * 40; f++) {
    const p = engine.player;
    const col = Math.floor((p.x + p.width / 2) / ts);
    const rowFeet = Math.floor((p.y + p.height - 1) / ts);
    press('ArrowRight', true);
    const wallAhead = solidAt(col + 1, rowFeet) || solidAt(col + 1, rowFeet - 1);
    if (hold > 0) { hold--; press(' ', true); if (!hold) press(' ', false); }
    else if (p.onGround && wallAhead) { hold = 14; }
    else press(' ', false);
    input.update();
    engine.update();
    const c = (p.x + p.width / 2) / ts;
    const rf = (p.y + p.height) / ts;
    if (c > 29 && c < 41 && rf > 18.5) wasInside = true;
    if (wasInside && c > 42) { outTheDoor = true; break; }
    if (engine.gameState !== 'playing') break;
  }
  check('dropped down the chimney into the room', wasInside);
  check('walked out the door', outTheDoor);
}

console.log('=== Character switch: Q cycles Grinch/Max mid-run, still completes W1 ===');
{
  engine.player = null;
  engine.startLevel(0, { showStory: false });
  engine.gameState = 'playing';
  resetKeys();
  jumpHold = 0; prevX = 0; stuckFrames = 0;
  const seen = new Set([engine.player.character]);
  let completed = false;
  for (let f = 0; f < 60 * 180; f++) {
    if (f % 300 === 150) press('q', true); else press('q', false);
    stepFrame();
    seen.add(engine.player.character);
    if (engine.gameState === 'level_complete') { completed = true; break; }
    if (engine.gameState === 'game_over') break;
  }
  check('both characters played', seen.has('grinch') && seen.has('max'), [...seen].join(','));
  check('switching run completes W1', completed, `col ${Math.floor(engine.player.x / ts)}`);
}

console.log('=== Present carry-over between worlds ===');
{
  engine.player = null;
  engine.startLevel(0, { showStory: false });
  engine.gameState = 'playing';
  engine.player.presents = 7;
  engine.startLevel(1, { showStory: false });
  check('presents carry into the next world', engine.player.presents === 7, `got ${engine.player.presents}`);
  check('housesLit resets per level', engine.player.housesLit === 0);
}

console.log(failures === 0 ? '\nALL CHECKS PASSED' : `\n${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
