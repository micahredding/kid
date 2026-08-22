// Headless playtest: drives the real physics and rules, no browser.
// Run: node test_fruit_merge.mjs   (exits non-zero on any failed check)

import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const { Game } = await import('./js/game.js');
const { Body } = await import('./js/physics.js');
const { LAYOUT, RULES, radiusFor, mergeScore, W } = await import('./js/config.js');

const manifest = JSON.parse(readFileSync(join(__dirname, 'art', 'fruits.json'), 'utf8'));
const FRUITS = manifest.fruits;

let failures = 0;
function check(label, cond, detail = '') {
  if (cond) console.log(`  PASS  ${label}`);
  else { console.log(`  FAIL  ${label} ${detail}`); failures++; }
}
const section = (name) => console.log(`\n=== ${name} ===`);

// Run the game forward in 60fps frames.
function run(game, seconds) {
  for (let i = 0; i < Math.round(seconds * 60); i++) game.step(1 / 60);
}
const newGame = (seed = 7) => new Game(FRUITS, { seed });

// --------------------------------------------------------------------------
section('Asher\'s art');

check('11 fruits in the ladder', FRUITS.length === 11, `got ${FRUITS.length}`);
check('every sprite file is on disk',
  FRUITS.every((f) => existsSync(join(__dirname, 'art', f.file))),
  FRUITS.filter((f) => !existsSync(join(__dirname, 'art', f.file))).map((f) => f.file).join(','));
check('every fruit names a source drawing', FRUITS.every((f) => /^drawing-asher-.*\.png$/.test(f.drawing)));
check('tiers are 0..n in order', FRUITS.every((f, i) => f.tier === i));
check('no duplicate source drawings', new Set(FRUITS.map((f) => f.drawing)).size === FRUITS.length);
check('every fruit has a colour', FRUITS.every((f) => /^#[0-9a-f]{6}$/.test(f.color)));

// --------------------------------------------------------------------------
section('sizes');

const radii = FRUITS.map((f, i) => radiusFor(i));
check('each fruit is bigger than the one below', radii.every((r, i) => i === 0 || r > radii[i - 1] * 1.1),
  radii.map((r) => r.toFixed(1)).join(' '));
check('the biggest fruit fits in the jar', radii.at(-1) * 2 < LAYOUT.right - LAYOUT.left,
  `${(radii.at(-1) * 2).toFixed(0)} vs ${LAYOUT.right - LAYOUT.left}`);
check('the biggest fruit is over half the jar wide', radii.at(-1) * 2 > (LAYOUT.right - LAYOUT.left) * 0.5);
check('the smallest fruit clears the floor-to-line gap',
  radii[0] * 2 < LAYOUT.floor - LAYOUT.dangerY);

// --------------------------------------------------------------------------
section('a fruit falls and settles');

{
  const g = newGame();
  const b = g.world.add(new Body(240, 200, radiusFor(0), 0));
  run(g, 3);
  check('lands on the floor', Math.abs(b.y + b.r - LAYOUT.floor) < 1.5,
    `y+r=${(b.y + b.r).toFixed(2)} floor=${LAYOUT.floor}`);
  check('comes to a stop', Math.abs(b.vy) < 20 && b.resting, `vy=${b.vy.toFixed(2)}`);
  check('stays where it was dropped', Math.abs(b.x - 240) < 1, `x=${b.x.toFixed(2)}`);
  check('nothing went NaN', Number.isFinite(b.x) && Number.isFinite(b.y));
}

{
  const g = newGame();
  // Aimed at the wall: it must end up inside, touching it.
  const b = g.world.add(new Body(LAYOUT.left + 2, 200, radiusFor(3), 3));
  run(g, 3);
  check('a fruit against the wall stays inside', b.x - b.r >= LAYOUT.left - 0.5,
    `x-r=${(b.x - b.r).toFixed(2)} left=${LAYOUT.left}`);
}

// --------------------------------------------------------------------------
section('merging');

{
  const g = newGame();
  g.world.add(new Body(240, 300, radiusFor(0), 0));
  g.world.add(new Body(244, 200, radiusFor(0), 0));
  run(g, 3);
  check('two cherries become one blueberry',
    g.world.bodies.length === 1 && g.world.bodies[0].tier === 1,
    `${g.world.bodies.length} bodies, tiers ${g.world.bodies.map((b) => b.tier)}`);
  check('the merge scored', g.score === mergeScore(1), `score=${g.score}`);
  check('the merge was counted once', g.merges === 1, `merges=${g.merges}`);
  check('biggest-reached advanced', g.best === 1);
}

{
  const g = newGame();
  g.world.add(new Body(240, 300, radiusFor(0), 0));
  g.world.add(new Body(244, 200, radiusFor(2), 2));
  run(g, 3);
  check('different fruits do not merge', g.world.bodies.length === 2,
    `${g.world.bodies.length} bodies`);
  check('no score for touching', g.score === 0, `score=${g.score}`);
}

{
  // Four cherries in a column should cascade: 4 -> 2 -> 1 lime.
  const g = newGame();
  for (let i = 0; i < 4; i++) g.world.add(new Body(240 + (i % 2), 620 - i * 44, radiusFor(0), 0));
  run(g, 5);
  check('four cherries cascade to one lime',
    g.world.bodies.length === 1 && g.world.bodies[0].tier === 2,
    `${g.world.bodies.length} bodies, tiers ${g.world.bodies.map((b) => b.tier)}`);
  check('three merges happened', g.merges === 3, `merges=${g.merges}`);
  check('the cascade counted as a chain', g.bestChain >= 2, `bestChain=${g.bestChain}`);
}

{
  // The two biggest merge away entirely, for the bonus.
  const g = newGame();
  const top = FRUITS.length - 1;
  g.world.add(new Body(240, 500, radiusFor(top), top));
  g.world.add(new Body(242, 200, radiusFor(top), top));
  run(g, 4);
  check('two watermelons leave the jar', g.world.bodies.length === 0,
    `${g.world.bodies.length} bodies left`);
  check('the big merge pays the bonus', g.score === RULES.finalBonus, `score=${g.score}`);
  check('nothing merged past the top tier',
    !g.world.bodies.some((b) => b.tier > top));
}

// --------------------------------------------------------------------------
section('dropping');

{
  const g = newGame();
  check('a fresh game is ready to drop', g.canDrop);
  const b = g.drop();
  check('dropping puts a fruit in the jar', !!b && g.world.bodies.length === 1);
  check('the fruit is the one that was held', b.tier === 0 || b.tier < RULES.spawnTiers);
  check('there is a cooldown after a drop', !g.canDrop);
  check('a second drop during cooldown does nothing', g.drop() === null && g.world.bodies.length === 1);
  run(g, RULES.dropCooldown + 0.1);
  check('the cooldown clears', g.canDrop);
  check('only small fruit is ever handed over',
    g.held < RULES.spawnTiers && g.next < RULES.spawnTiers, `held=${g.held} next=${g.next}`);
}

{
  const g = newGame();
  g.held = FRUITS.length - 1;             // widest possible, for the clamp test
  const r = radiusFor(g.held);
  check('aim clamps at the left wall', g.aimAt(-500) === LAYOUT.left + r);
  check('aim clamps at the right wall', g.aimAt(9999) === LAYOUT.right - r);
  check('aim passes through in the middle', Math.abs(g.aimAt(240) - 240) < 0.001);
  g.nudge(-1000);
  check('nudging also clamps', g.holdX === LAYOUT.left + r);
}

// --------------------------------------------------------------------------
section('a pile of fruit');

{
  const g = newGame(99);
  let dropped = 0;
  for (let i = 0; i < 40 && g.state === 'playing'; i++) {
    g.aimAt(60 + ((i * 97) % 360));
    if (g.drop()) dropped++;
    run(g, 0.5);
  }
  const escaped = g.world.bodies.filter((b) =>
    b.x - b.r < LAYOUT.left - 1 || b.x + b.r > LAYOUT.right + 1 || b.y + b.r > LAYOUT.floor + 1);
  check(`${dropped} fruits dropped, none escaped the jar`, escaped.length === 0,
    escaped.map((b) => `(${b.x.toFixed(0)},${b.y.toFixed(0)})`).join(' '));
  check('no fruit went NaN', g.world.bodies.every((b) => Number.isFinite(b.x) && Number.isFinite(b.y)));
  check('fruits merged as they piled up', g.merges > 3, `merges=${g.merges}`);
  check('score went up', g.score > 0, `score=${g.score}`);

  // Overlap: after settling, a pile should be nearly overlap-free.
  run(g, 3);
  let worst = 0;
  const bs = g.world.bodies;
  for (let i = 0; i < bs.length; i++) {
    for (let j = i + 1; j < bs.length; j++) {
      const d = Math.hypot(bs[j].x - bs[i].x, bs[j].y - bs[i].y);
      worst = Math.max(worst, bs[i].r + bs[j].r - d);
    }
  }
  check('the settled pile is not squashed into itself', worst < 4, `worst overlap ${worst.toFixed(2)}px`);
  check('the settled pile is asleep',
    g.world.bodies.every((b) => Math.abs(b.vy) < 40), 'something is still moving');
}

// --------------------------------------------------------------------------
section('losing');

{
  // A genuinely overfull jar: the six even-numbered tiers dropped down one line.
  // No two are equal so nothing can merge it back down, and stacked they are
  // taller than the jar, so the pile has to settle above the line.
  //
  // The obvious version of this test — a tall column of nine equal fruits — was
  // passing for the wrong reason. Nine overlapping fruits explode apart, fly
  // above the rim, and time out up there; the pile they eventually settle into
  // sits well below the line. It was testing the bounce bug, not a full jar.
  const g = newGame();
  let playingEarly = null;
  for (const tier of [10, 8, 6, 4, 2, 0]) {
    g.world.add(new Body(240, 240, radiusFor(tier), tier));
    run(g, 0.5);
    if (tier === 6) playingEarly = g.state;   // three in, still room
  }
  check('not over while there is still room', playingEarly === 'playing', `was ${playingEarly}`);
  run(g, 8);
  const settledAbove = g.world.bodies.filter((b) =>
    b.y - b.r < LAYOUT.dangerY && Math.abs(b.vx) + Math.abs(b.vy) <= RULES.dangerSettleSpeed);
  check('the jar really is overfull', settledAbove.length > 0,
    `highest top ${Math.min(...g.world.bodies.map((b) => b.y - b.r)).toFixed(0)}`);
  check('a fruit left resting above the line ends the game', g.state === 'over',
    `state=${g.state} worst aboveFor=${Math.max(...g.world.bodies.map((b) => b.aboveFor)).toFixed(2)}`);
  check('nothing merged, so the jar filled honestly', g.merges === 0, `merges=${g.merges}`);
  check('the game over event fired once', g.summary().state === 'over');
  const beforeScore = g.score;
  run(g, 2);
  check('a finished game stops simulating', g.score === beforeScore);
  check('a finished game refuses drops', g.drop() === null);
}

{
  // A fruit squeezed out of the pile flies above the rim and takes longer than
  // the grace period to come back down. That is a bounce, not an abandoned
  // fruit, and it must not end the game.
  const g = newGame();
  const b = g.world.add(new Body(240, LAYOUT.floor - 30, radiusFor(3), 3));
  run(g, 1);
  b.vy = -2600;                     // fired straight up out of the jar
  run(g, 0.5);
  check('the pop-up really does leave the jar', b.y - b.r < 0, `top=${(b.y - b.r).toFixed(0)}`);
  let aloft = 0;
  for (let i = 0; i < 60 * 5; i++) {
    g.step(1 / 60);
    if (b.y - b.r < LAYOUT.dangerY) aloft += 1 / 60;
  }
  check('it was above the line for longer than the grace period', aloft > RULES.dangerGrace,
    `aloft=${aloft.toFixed(2)}s grace=${RULES.dangerGrace}s`);
  check('a bounce above the line does not end the game', g.state === 'playing', `state=${g.state}`);
  check('it came back down and settled on the floor',
    Math.abs(b.y + b.r - LAYOUT.floor) < 2, `y+r=${(b.y + b.r).toFixed(1)}`);
  check('and its clock was cleared on the way back in', b.aboveFor === 0);
}

{
  // The three states of a fruit's above-the-line clock, driven by hand: below
  // the line clears it, above and settled counts, above and flying holds. The
  // hold must not be a reset, or a fruit that pops up and settles back above the
  // line would keep restarting its clock and the jar could never fill.
  const g = newGame();
  const b = g.world.add(new Body(240, LAYOUT.dangerY - 40, radiusFor(4), 4));
  const pin = (y, vy, seconds) => {
    for (let i = 0; i < Math.round(seconds * 60); i++) {
      b.y = y; b.x = 240; b.vx = 0; b.vy = vy;
      g.step(1 / 60);
    }
  };
  pin(LAYOUT.dangerY - 40, -3000, 0.8);
  check('flying above the line does not run the clock', b.aboveFor === 0,
    `aboveFor=${b.aboveFor.toFixed(2)}`);
  check('and flying does not end the game', g.state === 'playing');
  pin(LAYOUT.dangerY - 40, 0, 0.6);
  check('settled above the line runs the clock', b.aboveFor > 0.5, `aboveFor=${b.aboveFor.toFixed(2)}`);
  const held = b.aboveFor;
  pin(LAYOUT.dangerY - 40, -3000, 0.4);
  check('a flight in the middle holds the clock rather than resetting it',
    Math.abs(b.aboveFor - held) < 0.02, `${held.toFixed(2)} -> ${b.aboveFor.toFixed(2)}`);
  pin(LAYOUT.floor - 60, 0, 0.2);
  check('dropping below the line clears the clock', b.aboveFor === 0);
  pin(LAYOUT.dangerY - 40, 0, RULES.dangerGrace + 0.3);
  check('settled above the line long enough still ends the game', g.state === 'over');
}

{
  // The clamp has to hold over whole games, not just one staged collision.
  let worst = 0;
  for (const seed of [3, 17, 41]) {
    const g = newGame(seed);
    while (g.state === 'playing') {
      if (g.canDrop) { g.aimAt(LAYOUT.left + 40 + ((g.drops * 97) % 340)); g.drop(); }
      g.step(1 / 60);
      for (const b of g.world.bodies) worst = Math.max(worst, Math.hypot(b.vx, b.vy));
    }
  }
  check('the speed cap holds across whole games', worst <= RULES.maxSpeed + 1,
    `worst ${worst.toFixed(0)}px/s vs clamp ${RULES.maxSpeed}`);
}

{
  // Brushing the line on the way down must NOT end the game.
  const g = newGame();
  const b = g.world.add(new Body(240, LAYOUT.dangerY - 10, radiusFor(2), 2));
  b.vy = 40;
  run(g, 3);
  check('falling past the line is not a loss', g.state === 'playing', `state=${g.state}`);
  check('it made it to the floor', Math.abs(b.y + b.r - LAYOUT.floor) < 2);
}

{
  const g = newGame();
  g.reset();
  check('reset clears the jar', g.world.bodies.length === 0 && g.score === 0 && g.state === 'playing');
}

// --------------------------------------------------------------------------
section('same seed, same game');

{
  const play = (seed) => {
    const g = newGame(seed);
    for (let i = 0; i < 30; i++) { g.aimAt(80 + ((i * 61) % 320)); g.drop(); run(g, 0.45); }
    return g.summary();
  };
  const a = play(4242), b = play(4242), c = play(777);
  check('the same seed replays identically', JSON.stringify(a) === JSON.stringify(b),
    `${JSON.stringify(a)} vs ${JSON.stringify(b)}`);
  check('a different seed plays differently', JSON.stringify(a) !== JSON.stringify(c));
  console.log(`        seed 4242 -> ${JSON.stringify(a)}`);
}

// --------------------------------------------------------------------------
section('long game');

{
  // Play until the jar fills, the way a kid actually would: aim at gaps.
  const g = newGame(2026);
  let frames = 0;
  while (g.state === 'playing' && frames < 60 * 300) {
    if (g.canDrop) {
      // Drop on the shortest column, so the bot survives long enough to climb.
      let bestX = 240, bestTop = -Infinity;
      for (let x = LAYOUT.left + 40; x < LAYOUT.right - 40; x += 34) {
        let top = LAYOUT.floor;
        for (const b of g.world.bodies) if (Math.abs(b.x - x) < b.r + 18) top = Math.min(top, b.y - b.r);
        if (top > bestTop) { bestTop = top; bestX = x; }
      }
      g.aimAt(bestX);
      g.drop();
    }
    g.step(1 / 60);
    frames++;
  }
  const s = g.summary();
  console.log(`        ${JSON.stringify(s)} after ${(frames / 60).toFixed(0)}s`);
  check('the game ends on its own', g.state === 'over', `still ${g.state} after ${(frames / 60).toFixed(0)}s`);
  check('a real game climbs the ladder', s.biggest >= 4, `only reached ${s.biggestName}`);
  check('a real game scores', s.score > 50, `score=${s.score}`);
  check('fruit was still on the board at the end', s.onBoard > 3, `onBoard=${s.onBoard}`);
}

// --------------------------------------------------------------------------
section('frame-rate independence');

{
  const settle = (dt) => {
    const g = newGame();
    const b = g.world.add(new Body(240, 200, radiusFor(4), 4));
    for (let i = 0; i < Math.round(3 / dt); i++) g.step(dt);
    return b.y;
  };
  const at60 = settle(1 / 60), at30 = settle(1 / 30), at144 = settle(1 / 144);
  check('a slow frame rate settles the same', Math.abs(at60 - at30) < 2, `${at60.toFixed(2)} vs ${at30.toFixed(2)}`);
  check('a fast frame rate settles the same', Math.abs(at60 - at144) < 2, `${at60.toFixed(2)} vs ${at144.toFixed(2)}`);

  const g = newGame();
  const b = g.world.add(new Body(240, 300, radiusFor(0), 0));
  g.step(3);   // one absurd frame, e.g. tab was in the background
  check('a huge frame does not fling the pile', b.y + b.r <= LAYOUT.floor + 1 && Number.isFinite(b.y),
    `y=${b.y.toFixed(1)}`);
}

console.log(failures ? `\n${failures} CHECK(S) FAILED` : '\nALL CHECKS PASSED');
process.exit(failures ? 1 : 0);
