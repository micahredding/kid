// Headless playtest: drives the real physics and rules, no browser.
// Run: node test_number_merge.mjs   (exits non-zero on any failed check)

import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const { Game } = await import('./js/game.js');
const { Body } = await import('./js/physics.js');
const { LAYOUT, RULES, VALUES, TOP_TIER, BEYOND, radiusFor, valueOf, mergeTier, mergeScore, W } =
  await import('./js/config.js');

const manifest = JSON.parse(readFileSync(join(__dirname, 'art', 'blocks.json'), 'utf8'));
const BLOCKS = manifest.blocks;

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
const newGame = (seed = 7) => new Game(BLOCKS, { seed });
const tierOf = (value) => VALUES.indexOf(value);

// --------------------------------------------------------------------------
section('Asher\'s art');

check('13 rungs in the ladder', BLOCKS.length === 13, `got ${BLOCKS.length}`);
check('the ladder is zero then the powers of two',
  BLOCKS.map((b) => b.value).join(',') === '0,1,2,4,8,16,32,64,128,256,512,1024,2048',
  BLOCKS.map((b) => b.value).join(','));
check('the manifest agrees with config',
  BLOCKS.every((b, i) => b.value === VALUES[i] && b.tier === i));
check('every rung but Zero has a sprite on disk',
  BLOCKS.every((b) => b.blank || existsSync(join(__dirname, 'art', b.file))),
  BLOCKS.filter((b) => !b.blank && !existsSync(join(__dirname, 'art', b.file))).map((b) => b.file).join(','));
check('Zero is the blank one, and the only one',
  BLOCKS.filter((b) => b.blank).length === 1 && BLOCKS[0].blank);
check('every rung names a source drawing',
  BLOCKS.every((b) => /^\d{4}-drawing-asher-.*\.png$/.test(b.drawing)));
check('the source filename matches the value it stands for',
  BLOCKS.every((b) => Number(b.drawing.slice(0, 4)) === b.value));
check('no drawing is used twice', new Set(BLOCKS.map((b) => b.drawing)).size === BLOCKS.length);
check('every rung has a colour', BLOCKS.every((b) => /^#[0-9a-f]{6}$/.test(b.color)));
check('every rung has a word to say', BLOCKS.every((b) => /^[a-z -]+$/.test(b.word)));
check('the specks are gone: no sprite is freakishly wide',
  BLOCKS.every((b) => b.blank || b.art.w / b.art.h < 2.5),
  BLOCKS.filter((b) => !b.blank && b.art.w / b.art.h >= 2.5).map((b) => `${b.value}:${b.art.w}x${b.art.h}`).join(' '));

// --------------------------------------------------------------------------
section('the rule: two blocks merge when their sum is on the ladder');

check('1 + 1 = 2', mergeTier(tierOf(1), tierOf(1)) === tierOf(2));
check('2 + 2 = 4', mergeTier(tierOf(2), tierOf(2)) === tierOf(4));
check('1024 + 1024 = 2048', mergeTier(tierOf(1024), tierOf(1024)) === tierOf(2048));
check('every pair of equals doubles',
  VALUES.slice(1, -1).every((v) => valueOf(mergeTier(tierOf(v), tierOf(v))) === v * 2));
check('1 + 2 does not merge — 3 is not on this ladder',
  mergeTier(tierOf(1), tierOf(2)) === -1);
check('no unequal pair above Zero ever merges',
  VALUES.slice(1).every((a) => VALUES.slice(1).every((b) =>
    a === b || mergeTier(tierOf(a), tierOf(b)) === -1)));
check('128 + 0 = 128', valueOf(mergeTier(tierOf(128), tierOf(0))) === 128);
check('0 + 128 = 128', valueOf(mergeTier(tierOf(0), tierOf(128))) === 128);
check('0 + 0 = 0', valueOf(mergeTier(0, 0)) === 0);
check('a Zero merges with every single rung',
  VALUES.every((v) => valueOf(mergeTier(0, tierOf(v))) === v));
check('2048 + 2048 goes past the top of the ladder',
  mergeTier(TOP_TIER, TOP_TIER) === BEYOND && valueOf(BEYOND) === 4096);
check('a merge scores exactly what it made',
  VALUES.slice(1, -1).every((v) => mergeScore(tierOf(v), tierOf(v)) === v * 2));
check('a Zero merge scores nothing',
  VALUES.every((v) => mergeScore(0, tierOf(v)) === 0));
check('a pair that cannot merge scores nothing', mergeScore(tierOf(1), tierOf(2)) === 0);

// --------------------------------------------------------------------------
section('sizes');

const radii = BLOCKS.map((b, i) => radiusFor(i));
check('each rung is bigger than the one below', radii.every((r, i) => i === 0 || r > radii[i - 1] * 1.1),
  radii.map((r) => r.toFixed(1)).join(' '));
check('2048 fits in the jar', radii.at(-1) * 2 < LAYOUT.right - LAYOUT.left,
  `${(radii.at(-1) * 2).toFixed(0)} vs ${LAYOUT.right - LAYOUT.left}`);
check('2048 is over half the jar wide', radii.at(-1) * 2 > (LAYOUT.right - LAYOUT.left) * 0.5);
check('Zero clears the floor-to-line gap', radii[0] * 2 < LAYOUT.floor - LAYOUT.dangerY);
check('only 0, 1, 2, 4 and 8 can ever drop',
  RULES.spawnTiers === 5 && VALUES.slice(0, RULES.spawnTiers).join(',') === '0,1,2,4,8');

// --------------------------------------------------------------------------
section('a block falls and settles');

{
  const g = newGame();
  const b = g.world.add(new Body(240, 200, radiusFor(1), 1));
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
  const b = g.world.add(new Body(LAYOUT.left + 2, 200, radiusFor(4), 4));
  run(g, 3);
  check('a block against the wall stays inside', b.x - b.r >= LAYOUT.left - 0.5,
    `x-r=${(b.x - b.r).toFixed(2)} left=${LAYOUT.left}`);
}

// --------------------------------------------------------------------------
section('merging, in play');

{
  const g = newGame();
  g.world.add(new Body(240, 300, radiusFor(1), 1));
  g.world.add(new Body(244, 200, radiusFor(1), 1));
  run(g, 3);
  check('two Ones become a Two',
    g.world.bodies.length === 1 && valueOf(g.world.bodies[0].tier) === 2,
    `${g.world.bodies.length} bodies, values ${g.world.bodies.map((b) => valueOf(b.tier))}`);
  check('the merge scored 2', g.score === 2, `score=${g.score}`);
  check('the merge was counted once', g.merges === 1, `merges=${g.merges}`);
  check('biggest-reached advanced', valueOf(g.best) === 2);
}

{
  const g = newGame();
  g.world.add(new Body(240, 300, radiusFor(tierOf(1)), tierOf(1)));
  g.world.add(new Body(244, 200, radiusFor(tierOf(4)), tierOf(4)));
  run(g, 3);
  check('a One and a Four do not merge', g.world.bodies.length === 2,
    `${g.world.bodies.length} bodies`);
  check('no score for touching', g.score === 0, `score=${g.score}`);
}

{
  // Four Ones in a column should cascade: 1+1=2, 1+1=2, 2+2=4.
  const g = newGame();
  for (let i = 0; i < 4; i++) g.world.add(new Body(240 + (i % 2), 620 - i * 48, radiusFor(1), 1));
  run(g, 5);
  check('four Ones cascade to a Four',
    g.world.bodies.length === 1 && valueOf(g.world.bodies[0].tier) === 4,
    `${g.world.bodies.length} bodies, values ${g.world.bodies.map((b) => valueOf(b.tier))}`);
  check('three merges happened', g.merges === 3, `merges=${g.merges}`);
  check('the score is the total of everything made: 2 + 2 + 4', g.score === 8, `score=${g.score}`);
  check('the cascade counted as a chain', g.bestChain >= 2, `bestChain=${g.bestChain}`);
}

{
  // Score is the honest sum: no chain multiplier inflates it.
  const g = newGame();
  for (let i = 0; i < 8; i++) g.world.add(new Body(240 + (i % 2), 660 - i * 48, radiusFor(1), 1));
  run(g, 6);
  check('eight Ones become an Eight',
    g.world.bodies.length === 1 && valueOf(g.world.bodies[0].tier) === 8,
    `values ${g.world.bodies.map((b) => valueOf(b.tier))}`);
  check('the score is 4×2 + 2×4 + 8 = 24', g.score === 24, `score=${g.score}`);
}

// --------------------------------------------------------------------------
section('Zero adds nothing');

{
  const g = newGame();
  const big = g.world.add(new Body(240, 600, radiusFor(tierOf(128)), tierOf(128)));
  run(g, 2);
  const restingY = big.y, restingX = big.x;
  const zero = g.world.add(new Body(240, 300, radiusFor(0), 0));
  run(g, 3);
  check('the Zero is gone', !g.world.bodies.includes(zero));
  check('one block left, still 128',
    g.world.bodies.length === 1 && valueOf(g.world.bodies[0].tier) === 128,
    `${g.world.bodies.length} bodies, values ${g.world.bodies.map((b) => valueOf(b.tier))}`);
  check('it did not move', Math.abs(g.world.bodies[0].y - restingY) < 1.5
    && Math.abs(g.world.bodies[0].x - restingX) < 1.5,
    `moved to (${g.world.bodies[0].x.toFixed(1)},${g.world.bodies[0].y.toFixed(1)}) from (${restingX.toFixed(1)},${restingY.toFixed(1)})`);
  check('nothing was scored', g.score === 0, `score=${g.score}`);
  check('it counted as an absorb, not a merge', g.absorbs === 1 && g.merges === 0,
    `absorbs=${g.absorbs} merges=${g.merges}`);
  check('the biggest-reached did not advance', g.best === 0, `best=${g.best}`);
  check('it did not start a chain', g.bestChain === 0, `bestChain=${g.bestChain}`);
}

{
  const g = newGame();
  g.world.add(new Body(240, 500, radiusFor(0), 0));
  g.world.add(new Body(242, 300, radiusFor(0), 0));
  run(g, 3);
  check('two Zeros leave one Zero',
    g.world.bodies.length === 1 && g.world.bodies[0].tier === 0,
    `${g.world.bodies.length} bodies, values ${g.world.bodies.map((b) => valueOf(b.tier))}`);
  check('still nothing scored', g.score === 0, `score=${g.score}`);
}

{
  // A column of Zeros must reduce itself away, not wedge. Zeros that land in
  // separate columns never touch, so they are left alone — which is correct,
  // and why this test drops them all down one line.
  const g = newGame();
  for (let i = 0; i < 9; i++) g.world.add(new Body(240 + (i % 2), 640 - i * 40, radiusFor(0), 0));
  run(g, 8);
  check('a column of nine Zeros collapses to one', g.world.bodies.length === 1,
    `${g.world.bodies.length} left`);
  check('a jar of Zeros scores nothing at all', g.score === 0, `score=${g.score}`);
  check('and nothing was ever made', g.merges === 0 && g.best === 0,
    `merges=${g.merges} best=${g.best}`);
}

{
  // Zeros must not be a free ladder: dropping a Zero on a One leaves a One.
  const g = newGame();
  g.world.add(new Body(240, 600, radiusFor(1), 1));
  run(g, 2);
  g.world.add(new Body(240, 400, radiusFor(0), 0));
  run(g, 3);
  check('a Zero on a One leaves a One, not a Two',
    g.world.bodies.length === 1 && valueOf(g.world.bodies[0].tier) === 1,
    `values ${g.world.bodies.map((b) => valueOf(b.tier))}`);
}

// --------------------------------------------------------------------------
section('reaching 4096');

{
  const g = newGame();
  g.world.add(new Body(240, 480, radiusFor(TOP_TIER), TOP_TIER));
  g.world.add(new Body(242, 200, radiusFor(TOP_TIER), TOP_TIER));
  run(g, 4);
  check('two 2048s leave the jar', g.world.bodies.length === 0,
    `${g.world.bodies.length} bodies left`);
  check('the big merge pays 4096', g.score === 4096, `score=${g.score}`);
  check('nothing was created past the top rung',
    !g.world.bodies.some((b) => b.tier > TOP_TIER));
}

// --------------------------------------------------------------------------
section('dropping');

{
  const g = newGame();
  check('a fresh game is ready to drop', g.canDrop);
  const b = g.drop();
  check('dropping puts a block in the jar', !!b && g.world.bodies.length === 1);
  check('there is a cooldown after a drop', !g.canDrop);
  check('a second drop during cooldown does nothing', g.drop() === null && g.world.bodies.length === 1);
  run(g, RULES.dropCooldown + 0.1);
  check('the cooldown clears', g.canDrop);
  check('only small numbers are ever handed over',
    g.held < RULES.spawnTiers && g.next < RULES.spawnTiers, `held=${g.held} next=${g.next}`);
}

{
  const g = newGame(11);
  const seen = new Set();
  for (let i = 0; i < 400; i++) seen.add(g.pickTier());
  check('the drop pool really is 0, 1, 2, 4, 8',
    [...seen].sort((a, b) => a - b).join(',') === '0,1,2,3,4', [...seen].join(','));
}

{
  const g = newGame();
  g.held = TOP_TIER;                      // widest possible, for the clamp test
  const r = radiusFor(g.held);
  check('aim clamps at the left wall', g.aimAt(-500) === LAYOUT.left + r);
  check('aim clamps at the right wall', g.aimAt(9999) === LAYOUT.right - r);
  check('aim passes through in the middle', Math.abs(g.aimAt(240) - 240) < 0.001);
  g.nudge(-1000);
  check('nudging also clamps', g.holdX === LAYOUT.left + r);
}

// --------------------------------------------------------------------------
section('a pile of blocks');

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
  check(`${dropped} blocks dropped, none escaped the jar`, escaped.length === 0,
    escaped.map((b) => `(${b.x.toFixed(0)},${b.y.toFixed(0)})`).join(' '));
  check('no block went NaN', g.world.bodies.every((b) => Number.isFinite(b.x) && Number.isFinite(b.y)));
  check('blocks merged as they piled up', g.merges > 3, `merges=${g.merges}`);
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
  check('no unmergeable pair is left overlapping and ignored',
    g.world.overlappingPairs(Game.canMerge).length === 0);
}

// --------------------------------------------------------------------------
section('losing');

{
  // Stack big blocks above the line and leave them there.
  const g = newGame();
  let y = LAYOUT.floor - 46;
  for (let i = 0; i < 9; i++) { g.world.add(new Body(240, y, radiusFor(7), 7)); y -= 90; }
  check('not over the moment they appear', g.state === 'playing');
  run(g, 1.0);
  check('still playing while it all settles', g.state === 'playing');
  run(g, 4);
  check('a block left resting above the line ends the game', g.state === 'over');
  const beforeScore = g.score;
  run(g, 2);
  check('a finished game stops simulating', g.score === beforeScore);
  check('a finished game refuses drops', g.drop() === null);
}

{
  // Brushing the line on the way down must NOT end the game.
  const g = newGame();
  const b = g.world.add(new Body(240, LAYOUT.dangerY - 10, radiusFor(3), 3));
  b.vy = 40;
  run(g, 3);
  check('falling past the line is not a loss', g.state === 'playing', `state=${g.state}`);
  check('it made it to the floor', Math.abs(b.y + b.r - LAYOUT.floor) < 2);
}

{
  const g = newGame();
  g.reset();
  check('reset clears the jar', g.world.bodies.length === 0 && g.score === 0 && g.state === 'playing');
  check('reset clears the absorb count', g.absorbs === 0);
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
  check('a real game climbs the ladder', s.biggestValue >= 32, `only reached ${s.biggestValue}`);
  check('a real game scores', s.score > 100, `score=${s.score}`);
  check('some Zeros were absorbed along the way', s.absorbs > 0, `absorbs=${s.absorbs}`);
  check('blocks were still on the board at the end', s.onBoard > 3, `onBoard=${s.onBoard}`);
}

// --------------------------------------------------------------------------
section('frame-rate independence');

{
  const settle = (dt) => {
    const g = newGame();
    const b = g.world.add(new Body(240, 200, radiusFor(5), 5));
    for (let i = 0; i < Math.round(3 / dt); i++) g.step(dt);
    return b.y;
  };
  const at60 = settle(1 / 60), at30 = settle(1 / 30), at144 = settle(1 / 144);
  check('a slow frame rate settles the same', Math.abs(at60 - at30) < 2, `${at60.toFixed(2)} vs ${at30.toFixed(2)}`);
  check('a fast frame rate settles the same', Math.abs(at60 - at144) < 2, `${at60.toFixed(2)} vs ${at144.toFixed(2)}`);

  const g = newGame();
  const b = g.world.add(new Body(240, 300, radiusFor(1), 1));
  g.step(3);   // one absurd frame, e.g. tab was in the background
  check('a huge frame does not fling the pile', b.y + b.r <= LAYOUT.floor + 1 && Number.isFinite(b.y),
    `y=${b.y.toFixed(1)}`);
}

console.log(failures ? `\n${failures} CHECK(S) FAILED` : '\nALL CHECKS PASSED');
process.exit(failures ? 1 : 0);
