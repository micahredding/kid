// The rules. No canvas, no audio, no input listeners — those live in the shell
// and the renderer, so test_fruit_merge.mjs can play a whole game in Node.

import { Body, World } from './physics.js';
import { LAYOUT, RULES, W, radiusFor, mergeScore } from './config.js';

// Small deterministic PRNG (mulberry32). A seed means a replay is a replay.
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class Game {
  // fruits: the ladder from art/fruits.json — names and colours only; the game
  // decides the sizes.
  constructor(fruits, opts = {}) {
    this.fruits = fruits;
    this.topTier = fruits.length - 1;
    this.random = rng(opts.seed ?? 12345);
    this.world = new World({
      left: LAYOUT.left,
      right: LAYOUT.right,
      floor: LAYOUT.floor,
      gravity: RULES.gravity,
      maxSpeed: RULES.maxSpeed,
    });
    this.reset();
  }

  reset() {
    this.world.bodies.length = 0;
    this.state = 'playing';      // 'playing' | 'over'
    this.score = 0;
    this.merges = 0;
    this.drops = 0;
    this.best = 0;               // biggest tier reached
    this.chain = 0;
    this.chainTimer = 0;
    this.bestChain = 0;
    this.cooldown = 0;
    this.elapsed = 0;
    this.accumulator = 0;
    this.dangerFor = 0;
    this.overflowing = false;
    this.events = [];            // drained by the shell for sound and sparkle
    this.held = this.pickTier();
    this.next = this.pickTier();
    this.holdX = W / 2;
    this.aimAt(W / 2);
  }

  pickTier() {
    const weights = RULES.spawnWeights.slice(0, RULES.spawnTiers);
    const total = weights.reduce((a, b) => a + b, 0);
    let roll = this.random() * total;
    for (let i = 0; i < weights.length; i++) {
      roll -= weights[i];
      if (roll <= 0) return i;
    }
    return 0;
  }

  get heldRadius() { return radiusFor(this.held); }

  // Aim: the held fruit cannot hang over the rim.
  aimAt(x) {
    const r = this.heldRadius;
    this.holdX = Math.max(LAYOUT.left + r, Math.min(LAYOUT.right - r, x));
    return this.holdX;
  }

  nudge(dx) { return this.aimAt(this.holdX + dx); }

  get canDrop() { return this.state === 'playing' && this.cooldown <= 0; }

  drop() {
    if (!this.canDrop) return null;
    const tier = this.held;
    const body = this.world.add(new Body(this.holdX, LAYOUT.dropY, radiusFor(tier), tier));
    this.drops++;
    this.cooldown = RULES.dropCooldown;
    this.held = this.next;
    this.next = this.pickTier();
    this.chain = 0;                 // a new drop starts a new chain
    this.chainTimer = 0;
    this.aimAt(this.holdX);         // re-clamp: the new fruit may be wider
    this.events.push({ type: 'drop', tier, x: body.x, y: body.y });
    return body;
  }

  // dt is real seconds; the physics runs at a fixed step regardless.
  step(dt) {
    if (this.state !== 'playing') return;
    this.elapsed += dt;
    if (this.cooldown > 0) this.cooldown -= dt;
    if (this.chainTimer > 0) {
      this.chainTimer -= dt;
      if (this.chainTimer <= 0) this.chain = 0;
    }

    // Whole fixed steps only, with the remainder carried to the next frame.
    // Stepping a leftover sliver instead would integrate a dt so small that the
    // position change underflows, and the pile would quietly stop falling.
    this.accumulator = Math.min(this.accumulator + dt, 0.1);  // a long frame must not fling the pile
    const sub = RULES.fixedDt;
    while (this.accumulator >= sub) {
      this.world.step(sub);
      this.resolveMerges();
      this.accumulator -= sub;
    }

    this.checkDanger(dt);
  }

  resolveMerges() {
    const merged = new Set();
    for (const { a, b } of this.world.overlappingPairs()) {
      if (merged.has(a) || merged.has(b) || a.dead || b.dead) continue;
      merged.add(a); merged.add(b);
      a.dead = true; b.dead = true;
      this.world.remove(a);
      this.world.remove(b);

      const x = (a.x + b.x) / 2;
      const y = (a.y + b.y) / 2;
      const madeTier = a.tier + 1;
      this.merges++;
      this.chain++;
      this.chainTimer = RULES.comboWindow;
      if (this.chain > this.bestChain) this.bestChain = this.chain;

      if (a.tier >= this.topTier) {
        // Two of the biggest: they go, and that is the win you play for.
        this.score += RULES.finalBonus;
        this.events.push({ type: 'final', x, y, tier: a.tier, score: RULES.finalBonus });
        continue;
      }

      // Chains pay, but capped — an uncapped multiplier on a long cascade turns
      // one lucky drop into a score nothing else can touch.
      const multiplier = Math.min(this.chain, RULES.maxChainMultiplier);
      const gained = mergeScore(madeTier) * (multiplier > 1 ? multiplier : 1);
      this.score += gained;
      if (madeTier > this.best) {
        this.best = madeTier;
        this.events.push({ type: 'first', tier: madeTier, x, y });
      }

      const grown = this.world.add(new Body(x, y, radiusFor(madeTier), madeTier));
      // Inherit the pair's motion so a merge mid-fall keeps falling.
      grown.vx = (a.vx + b.vx) / 2;
      grown.vy = (a.vy + b.vy) / 2;
      grown.angle = a.angle;
      grown.squish = 0.55;         // pop into being
      this.events.push({ type: 'merge', tier: madeTier, x, y, gained, chain: this.chain });
    }
  }

  // You lose by *leaving* a fruit above the line. Each fruit carries its own
  // clock, and the clock has three states, because two different mistakes are
  // easy to make here:
  //
  //   below the line          -> clear it. Falling past the line on the way
  //                              down costs nothing.
  //   above it, settled       -> count. Not "at rest" — a full jar is never
  //                              quite still, and requiring rest makes the game
  //                              unloseable. Just "not a projectile".
  //   above it, still flying  -> hold. Neither count nor clear.
  //
  // The hold is the whole point. A fruit squeezed out of the pile can fly far
  // above the rim and take well over the grace period to come back down; timing
  // that flight as if the fruit had been abandoned up there ended the game on a
  // bounce. And holding rather than clearing means a fruit that pops up and
  // settles back above the line still runs out its clock, so the jar can fill.
  checkDanger(dt) {
    let over = false, worst = 0;
    for (const b of this.world.bodies) {
      if (b.y - b.r >= LAYOUT.dangerY) b.aboveFor = 0;
      else if (Math.abs(b.vx) + Math.abs(b.vy) <= RULES.dangerSettleSpeed) b.aboveFor += dt;
      if (b.aboveFor > worst) worst = b.aboveFor;
      if (b.aboveFor >= RULES.dangerGrace) over = true;
    }
    // Show the warning for the back half of the grace period, so there is time
    // to see it and drop somewhere else.
    this.dangerFor = worst;
    this.overflowing = worst > RULES.dangerGrace * 0.45;
    if (over) {
      this.state = 'over';
      this.events.push({ type: 'gameover', score: this.score, best: this.best });
    }
  }

  drainEvents() {
    const out = this.events;
    this.events = [];
    return out;
  }

  // For the harness and the log line: a one-glance summary.
  summary() {
    return {
      state: this.state,
      score: this.score,
      merges: this.merges,
      drops: this.drops,
      biggest: this.best,
      biggestName: this.fruits[this.best]?.name ?? '—',
      bestChain: this.bestChain,
      onBoard: this.world.bodies.length,
    };
  }
}
