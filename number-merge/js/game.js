// The rules. No canvas, no audio, no input listeners — those live in the shell
// and the renderer, so test_number_merge.mjs can play a whole game in Node.

import { Body, World } from './physics.js';
import { LAYOUT, RULES, W, BEYOND, radiusFor, valueOf, mergeTier, mergeScore, isIdentity } from './config.js';

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
  // blocks: the ladder from art/blocks.json — values, names and colours only;
  // the game decides the sizes.
  constructor(blocks, opts = {}) {
    this.blocks = blocks;
    this.topTier = blocks.length - 1;
    this.random = rng(opts.seed ?? 12345);
    this.world = new World({
      left: LAYOUT.left,
      right: LAYOUT.right,
      floor: LAYOUT.floor,
      gravity: RULES.gravity,
    });
    this.reset();
  }

  reset() {
    this.world.bodies.length = 0;
    this.state = 'playing';      // 'playing' | 'over'
    this.score = 0;
    this.merges = 0;             // merges that made a bigger number
    this.absorbs = 0;            // Zeros that vanished into something
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

  // Aim: the held block cannot hang over the rim.
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
    this.aimAt(this.holdX);         // re-clamp: the new block may be wider
    this.events.push({ type: 'drop', tier, value: valueOf(tier), x: body.x, y: body.y });
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

  // Two blocks merge when their sum is on the ladder — see mergeTier.
  static canMerge(a, b) { return mergeTier(a.tier, b.tier) >= 0; }

  resolveMerges() {
    const merged = new Set();
    for (const { a, b } of this.world.overlappingPairs(Game.canMerge)) {
      if (merged.has(a) || merged.has(b) || a.dead || b.dead) continue;
      const made = mergeTier(a.tier, b.tier);
      if (made < 0) continue;

      merged.add(a); merged.add(b);
      a.dead = true; b.dead = true;
      this.world.remove(a);
      this.world.remove(b);

      // A Zero adds nothing, so the block it lands on is not moved, not
      // rescored, and not celebrated — it is exactly the block it already was,
      // one Zero lighter. Everything else appears between its parents.
      const identity = isIdentity(a.tier, b.tier);
      const keeper = a.tier === 0 ? b : a;   // if both are Zero, either will do
      const x = identity ? keeper.x : (a.x + b.x) / 2;
      const y = identity ? keeper.y : (a.y + b.y) / 2;

      if (made === BEYOND) {
        // Two 2048s: 4096 is past the top of the ladder, both leave, and that
        // is the game you are playing for.
        this.merges++;
        this.score += valueOf(BEYOND);
        this.events.push({ type: 'final', x, y, tier: a.tier, value: valueOf(BEYOND), score: valueOf(BEYOND) });
        continue;
      }

      const grown = this.world.add(new Body(x, y, radiusFor(made), made));
      // Inherit the pair's motion so a merge mid-fall keeps falling.
      grown.vx = identity ? keeper.vx : (a.vx + b.vx) / 2;
      grown.vy = identity ? keeper.vy : (a.vy + b.vy) / 2;
      grown.angle = identity ? keeper.angle : a.angle;
      grown.stillFor = identity ? keeper.stillFor : 0;

      if (identity) {
        this.absorbs++;
        this.events.push({ type: 'absorb', tier: made, value: valueOf(made), x, y });
        continue;    // no score, no chain, no fanfare: nothing was made
      }

      this.merges++;
      this.chain++;
      this.chainTimer = RULES.comboWindow;
      if (this.chain > this.bestChain) this.bestChain = this.chain;

      // Score is the value of the block made, with no chain multiplier, so the
      // score stays a number that means something: the exact total of every
      // block he has assembled this game.
      const gained = mergeScore(a.tier, b.tier);
      this.score += gained;
      grown.squish = 0.55;         // pop into being
      if (made > this.best) {
        this.best = made;
        this.events.push({ type: 'first', tier: made, value: valueOf(made), x, y });
      }
      this.events.push({ type: 'merge', tier: made, value: valueOf(made), x, y, gained, chain: this.chain });
    }
  }

  // You lose by leaving a block above the line — but each block gets its own
  // grace period, so falling past the line on the way down costs you nothing.
  // Timing it per block rather than "is anything above the line, and has it
  // stopped moving" matters: a full jar is never quite still, so a rest
  // requirement makes the game unloseable.
  checkDanger(dt) {
    let over = false, worst = 0;
    for (const b of this.world.bodies) {
      if (b.y - b.r < LAYOUT.dangerY) b.aboveFor += dt;
      else b.aboveFor = 0;
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
      absorbs: this.absorbs,
      drops: this.drops,
      biggest: this.best,
      biggestValue: valueOf(this.best),
      bestChain: this.bestChain,
      onBoard: this.world.bodies.length,
    };
  }
}
