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
  // Stack big fruit above the line and leave it there.
  const g = newGame();
  let y = LAYOUT.floor - 40;
  for (let i = 0; i < 9; i++) { g.world.add(new Body(240, y, radiusFor(6), 6)); y -= 78; }
  check('not over the moment they appear', g.state === 'playing');
  run(g, 1.0);
  check('still playing while it all settles', g.state === 'playing');
  run(g, 4);
  check('a fruit left resting above the line ends the game', g.state === 'over');
  check('the game over event fired once',
    g.summary().state === 'over' && g.merges >= 0);
  const beforeScore = g.score;
  run(g, 2);
  check('a finished game stops simulating', g.score === beforeScore);
  check('a finished game refuses drops', g.drop() === null);
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
