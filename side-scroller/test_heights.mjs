// World 1-7 The Cloud Elevators: ladder/elevator mechanics, the route through,
// and the two safety properties the level is built on — nothing is a death
// fall, and the flag cannot be reached from the valley floor.

const noop = () => {};
const ctxProxy = new Proxy({}, { get: (t, p) => (p === 'canvas' ? canvasStub : noop), set: () => true });
const canvasStub = { getContext: () => ctxProxy, width: 960, height: 540, style: {} };
globalThis.window = { addEventListener: noop, removeEventListener: noop };
globalThis.document = { addEventListener: noop, removeEventListener: noop };
globalThis.performance = { now: () => 0 };
globalThis.requestAnimationFrame = noop;

const { Engine } = await import('./js/engine.js');
const { CONFIG } = await import('./js/config.js');
const { LEVELS } = await import('./js/level.js');

const LEVEL = 6;
const ts = CONFIG.tile.size;
const engine = new Engine(canvasStub);
const input = engine.input;

let failures = 0;
const ok = (cond, label, extra = '') => {
  console.log(`${cond ? '  ok  ' : ' FAIL '} ${label}${extra ? '  ' + extra : ''}`);
  if (!cond) failures++;
};

const press = (k, on) => { input.keys[k] = on; };
const clearKeys = () => { for (const k of Object.keys(input.keys)) input.keys[k] = false; };
const feetRow = (p) => (p.y + p.height) / ts;
const centerCol = (p) => (p.x + p.width / 2) / ts;
let reachedFlag = false;
const step = (n = 1) => {
  for (let i = 0; i < n; i++) {
    input.update();
    engine.update();
    if (engine.gameState === 'level_complete') reachedFlag = true;
  }
};

function start(col, row) {
  reachedFlag = false;
  engine.player = null;
  engine.startLevel(LEVEL);
  engine.gameState = 'playing';
  clearKeys();
  if (col != null) {
    engine.player.x = col * ts;
    engine.player.y = row * ts - engine.player.height;
    engine.camera.x = Math.max(0, engine.player.x - 480);
    engine.camera.y = Math.max(0, engine.player.y - 270);
  }
  return engine.player;
}

// =============================================================================
// 1. Ladders
// =============================================================================
console.log('\nladders');
{
  // The tutorial ladder: col 10 runs from the valley floor (43) to the ledge (38)
  const p = start(10, 43);
  press('ArrowUp', true);
  step(240);
  press('ArrowUp', false);
  ok(Math.abs(feetRow(p) - 38) < 0.2, 'climbs to the lookout ledge', `feet row ${feetRow(p).toFixed(2)}`);
  ok(!p.climbing && p.onGround, 'lets go at the top, standing on the ledge');
}
{
  // ...and back down again
  const p = start(10, 38);
  step(4);
  press('ArrowDown', true);
  step(240);
  press('ArrowDown', false);
  step(20);
  ok(Math.abs(feetRow(p) - 43) < 0.2, 'climbs back down to the valley', `feet row ${feetRow(p).toFixed(2)}`);
}
{
  // Left/right must not walk a climber off into the air
  const p = start(10, 43);
  press('ArrowUp', true);
  step(30);
  const rowMid = feetRow(p);
  press('ArrowRight', true);
  step(20);
  press('ArrowUp', false); press('ArrowRight', false);
  ok(p.climbing, 'holding right mid-climb keeps hold of the ladder');
  ok(feetRow(p) < rowMid, 'and keeps climbing', `${rowMid.toFixed(1)} -> ${feetRow(p).toFixed(1)}`);
}
{
  // Space is the deliberate way off
  const p = start(10, 43);
  press('ArrowUp', true);
  step(30);
  press(' ', true);
  step(2);
  press(' ', false); press('ArrowUp', false);
  ok(!p.climbing, 'space lets go of the ladder');
  step(120);
  ok(p.onGround, 'and lands on something', `feet row ${feetRow(p).toFixed(1)}`);
}
{
  // A ladder let into a walkway is a floor, not a trapdoor: L1's top rung is
  // in deck B's floor at col 42.
  const p = start(42, 31);
  step(90);
  ok(Math.abs(feetRow(p) - 31) < 0.2, 'standing on a ladder tile does not fall through', `feet row ${feetRow(p).toFixed(2)}`);
  press('ArrowLeft', true);
  step(6);
  press('ArrowLeft', false);
  step(4);
  ok(feetRow(p) < 33, 'walking across one does not fall through either', `feet row ${feetRow(p).toFixed(2)}`);
}

{
  // Every character can climb: grip is measured at the feet, so the 4-tall
  // numberblock lets go of the top rung at the same height the short one does.
  for (const [name, form] of [['block', null], ['numberblock4', 'square'], ['numberblock4', 'tall'], ['caterpillar', null]]) {
    const p = start(10, 43);
    p.character = name;
    if (form) p.blockForm = form;
    p.applyCharacterSize();
    p.y = 43 * ts - p.height;
    press('ArrowUp', true);
    step(300);
    press('ArrowUp', false);
    step(20);
    ok(Math.abs(feetRow(p) - 38) < 0.3, `${name}${form ? '/' + form : ''} climbs the ladder`,
       `feet row ${feetRow(p).toFixed(2)}`);
  }
}

// =============================================================================
// 2. Elevators
// =============================================================================
console.log('\nelevators');
for (const [label, col, fromRow, toRow] of [
  ['E1 valley -> deck A', 57, 43, 37],
  ['E2 deck B -> deck C', 91, 31, 25],
  ['E3 deck D -> deck E', 125, 19, 13],
  ['E4 deck E -> the clouds', 101, 13, 7],
]) {
  const p = start(col, fromRow);
  let arrived = false;
  for (let i = 0; i < 60 * 20 && !arrived; i++) {
    step(1);
    if (Math.abs(feetRow(p) - toRow) < 0.3) arrived = true;
  }
  ok(arrived, `${label}: stand still and be carried up`, `feet row ${feetRow(p).toFixed(2)}`);
  step(120);
  ok(Math.abs(feetRow(p) - toRow) < 0.3 && p.onGround, `${label}: stays on the deck once the cab leaves`,
     `feet row ${feetRow(p).toFixed(2)}`);
}

// =============================================================================
// 3. The cliffs really are cliffs — no jump gets between bands
// =============================================================================
console.log('\ncliffs');
{
  // Deck A's right end butts into the face below deck B's shelf
  const p = start(74, 37);
  press('ArrowRight', true);
  for (let i = 0; i < 60 * 8; i++) { press(' ', i % 40 < 22); step(1); }
  press('ArrowRight', false); press(' ', false);
  ok(feetRow(p) > 32.5, 'sprint-jumping at the rock face does not reach the shelf above',
     `feet row ${feetRow(p).toFixed(1)}`);
}

// =============================================================================
// 4. The route through, lift by lift
// =============================================================================
console.log('\nroute');

// Walk toward a column. Jumps only when it has to: an edge it must clear, or
// an enemy in the way. `nojump` turns that off where a gap must be ferried.
function walkTo(col, { nojump = false, budget = 60 * 30 } = {}) {
  const p = engine.player;
  let hold = 0, cool = 0, lastX = p.x, stall = 0;
  for (let i = 0; i < budget; i++) {
    const c = centerCol(p);
    if (Math.abs(c - col) < 0.55) break;
    const dir = c < col ? 1 : -1;
    press('ArrowRight', dir > 0);
    press('ArrowLeft', dir < 0);

    const icol = Math.floor(c);
    const irow = Math.floor((p.y + p.height - 1) / ts);
    const tl = engine.level.tiles;
    const at = (cc, rr) => (rr < 0 || rr >= tl.length || cc < 0 || cc >= tl[rr].length) ? ' ' : tl[rr][cc];
    const edge = p.onGround && at(icol + dir, irow + 1) === ' ' && at(icol + dir, irow + 2) === ' ';
    // A step up worth jumping for: only solid rock/deck counts. One-way tiles
    // (planks, ladders, clouds) are walked into, not over.
    const ahead = at(icol + dir, irow);
    const rise = p.onGround && ahead !== ' ' && !'I=c'.includes(ahead);
    const foe = engine.entities.some(e => (e.type === 'goomba' || e.type === 'flyguy')
      && Math.abs(e.y - p.y) < ts * 1.6
      && (e.x - p.x) * dir > 0 && Math.abs(e.x - p.x) < ts * 2.5);

    if (hold > 0) { hold--; press(' ', true); if (!hold) { press(' ', false); cool = 10; } }
    else if (cool > 0) { cool--; press(' ', false); }
    else if (!nojump && (edge || rise || foe) && p.onGround) { hold = rise && !edge ? 12 : 22; }
    else press(' ', false);

    step(1);
    if (Math.abs(p.x - lastX) > 3) { lastX = p.x; stall = 0; } else if (++stall > 60 * 6) break;
  }
  clearKeys();
  return Math.abs(centerCol(p) - col) < 1.2;
}

// Hold a climb key until the feet pass a row.
function climb(dir, targetRow, budget = 60 * 20) {
  const p = engine.player;
  const key = dir === 'up' ? 'ArrowUp' : 'ArrowDown';
  press(key, true);
  for (let i = 0; i < budget; i++) {
    step(1);
    if (dir === 'up' ? feetRow(p) <= targetRow + 0.2 : feetRow(p) >= targetRow - 0.2) break;
  }
  clearKeys();
  step(10);   // the last-rung assist sets the climber down on the deck
  return Math.abs(feetRow(p) - targetRow) < 0.4;
}

// Board a ferry from the deck: step aboard only while it is alongside, then
// stand still and let it carry you across the gap.
function ferryAcross(targetCol, budget = 60 * 40) {
  const p = engine.player;
  const tl = engine.level.tiles;
  const supported = () => {
    const row = Math.floor((p.y + p.height + 1) / ts);
    for (let c = Math.floor(p.x / ts); c <= Math.floor((p.x + p.width - 1) / ts); c++) {
      const ch = (row < 0 || row >= tl.length || c < 0 || c >= tl[row].length) ? ' ' : tl[row][c];
      if (ch !== ' ' && ch !== 'C') return true;
    }
    return false;
  };
  for (let i = 0; i < budget; i++) {
    const alongside = engine.entities.some(e => e.type === 'platform'
      && Math.abs(e.y - (p.y + p.height)) < 8
      && p.x + p.width > e.x + 2 && p.x < e.x + e.width - 2);
    press('ArrowRight', alongside && supported() && centerCol(p) < targetCol);
    step(1);
    if (centerCol(p) > targetCol && p.onGround && supported()) { clearKeys(); return true; }
    if (feetRow(p) > 26) break;   // fell into the gap
  }
  clearKeys();
  return false;
}

// Stand still and let a cab do the work.
function ride(test, budget = 60 * 25) {
  const p = engine.player;
  clearKeys();
  for (let i = 0; i < budget; i++) {
    step(1);
    if (test(p)) return true;
  }
  return false;
}

start(null);
const legs = [
  ['valley: walk to the first shaft', () => walkTo(57)],
  ['E1 up to deck A', () => ride(p => Math.abs(feetRow(p) - 37) < 0.3)],
  ['deck A: walk left to the ladder', () => walkTo(42.5)],
  ['L1 climb to deck B', () => climb('up', 31)],
  ['deck B: walk right to the shaft', () => walkTo(91)],
  ['E2 up to deck C', () => ride(p => Math.abs(feetRow(p) - 25) < 0.3)],
  ['deck C: walk left to the ladder', () => walkTo(87.5)],
  ['L2 climb to deck D', () => climb('up', 19)],
  ['ferry across deck D\'s gap', () => ferryAcross(97.6)],
  ['deck D: walk right to the shaft', () => walkTo(125, { nojump: true })],
  ['E3 up to deck E', () => ride(p => Math.abs(feetRow(p) - 13) < 0.3)],
  ['deck E: walk left to the cloud lift', () => walkTo(101)],
  ['E4 up into the clouds', () => ride(p => Math.abs(feetRow(p) - 7) < 0.3)],
  ['cloud chain out to the ferry landing', () => walkTo(127.5)],
  ['sky ferry across the chasm', () => ferryAcross(139)],
  ['last cloud to the summit shelf', () => walkTo(150)],
  ['up the steps to the flag', () => walkTo(173)],
];
for (const [label, run] of legs) {
  const before = { col: centerCol(engine.player).toFixed(1), row: feetRow(engine.player).toFixed(1) };
  const good = run();
  const after = `col ${centerCol(engine.player).toFixed(1)} row ${feetRow(engine.player).toFixed(1)}`;
  ok(good, label, `from ${before.col}/${before.row} -> ${after}`);
  if (!good) break;
  if (reachedFlag) break;
}
ok(reachedFlag, 'reaches the flag', `state=${engine.gameState}`);
ok(engine.player.lives >= CONFIG.player.startingLives - 2, 'without being whittled down on the way',
   `lives ${engine.player.lives}`);
ok(engine.player.coins > 20, 'and the coin trail pays out', `coins ${engine.player.coins}`);

// =============================================================================
// 4b. The hollow inside the mountain: down the ladder, gem, and back out
// =============================================================================
console.log('\npocket');
{
  const p = start(100, 25);
  step(4);
  const gemsBefore = p.gems;
  ok(climb('down', 31), 'presses down and climbs into the hollow', `feet row ${feetRow(p).toFixed(1)}`);
  ok(walkTo(105.5), 'walks to the gem', `col ${centerCol(p).toFixed(1)}`);
  ok(p.gems > gemsBefore, 'and picks it up', `gems ${p.gems}`);
  ok(walkTo(100.5), 'back to the ladder');
  ok(climb('up', 25), 'and climbs back out to deck C', `feet row ${feetRow(p).toFixed(1)}`);
}

// =============================================================================
// 5. The flag is not reachable from the valley
// =============================================================================
console.log('\nsafety');
{
  const p = start(null);
  let completed = false;
  press('ArrowRight', true);
  for (let i = 0; i < 60 * 90; i++) {
    press(' ', i % 45 < 22);           // hold right, jump forever
    step(1);
    if (reachedFlag) { completed = true; break; }
  }
  clearKeys();
  ok(!completed && !reachedFlag, 'holding right + jump never stumbles onto the flag',
     `ended col ${centerCol(p).toFixed(1)} row ${feetRow(p).toFixed(1)}`);
  ok(p.lives > 0, 'and never runs out of lives doing it', `lives ${p.lives}`);
}

// =============================================================================
// 6. No fall in the level costs more than one band
// =============================================================================
{
  const rows = LEVELS[LEVEL].tiles;
  const SOLID = new Set(['M', 'W']);
  const ONEWAY = new Set(['I', '=', 'c']);
  const at = (c, r) => (r < 0 || r >= rows.length || c < 0 || c >= rows[r].length) ? ' ' : rows[r][c];
  const stand = (c, r) => SOLID.has(at(c, r)) || ONEWAY.has(at(c, r));
  const surface = (c, r) => stand(c, r) && !SOLID.has(at(c, r - 1));
  const width = Math.max(...rows.map(r => r.length));

  const worst = { drop: 0, where: null };
  let voids = 0;
  for (let c = 0; c < width; c++) {
    for (let r = 0; r < rows.length; r++) {
      if (!surface(c, r) || r === 0) continue;   // row 0 is the top of a boundary wall
      for (const d of [-1, 1]) {
        const n = c + d;
        if (n < 0 || n >= width) continue;
        if (stand(n, r) || SOLID.has(at(n, r - 1))) continue;   // floor carries on, or a wall
        let below = null;
        for (let rr = r; rr < rows.length; rr++) if (surface(n, rr)) { below = rr; break; }
        if (below == null) { voids++; continue; }
        if (below - r > worst.drop) { worst.drop = below - r; worst.where = `col ${c} row ${r}`; }
      }
    }
  }
  ok(voids === 0, 'no edge drops out of the world', `${voids} found`);
  ok(worst.drop <= 8, 'worst fall in the level is at most one band',
     `${worst.drop} rows at ${worst.where}`);
}

console.log(`\n${failures === 0 ? 'all checks passed' : failures + ' CHECK(S) FAILED'}`);
process.exit(failures === 0 ? 0 : 1);
