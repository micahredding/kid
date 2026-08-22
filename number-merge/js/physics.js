// Circles in a box. Nothing else.
//
// Position-based dynamics: predict where every block wants to be, then push
// overlaps apart a few times per step and read the velocity back off the
// movement. Piles of thirty blocks settle without the jitter an
// impulse-only solver gives you, which matters here — the whole game is a pile.
//
// No DOM, no randomness, no time source: the test harness drives this module
// directly and gets the same answer every run.

export class Body {
  constructor(x, y, r, tier) {
    this.x = x; this.y = y;
    this.px = x; this.py = y;   // where it was before the last predict
    this.vx = 0; this.vy = 0;
    this.r = r;
    this.tier = tier;
    this.angle = 0;
    this.av = 0;                // spin, for looks
    this.mass = r * r;          // area, near enough
    this.dead = false;
    this.stillFor = 0;          // seconds spent essentially motionless
    this.squish = 0;            // 0..1, visual only: set on a hard landing
    this.age = 0;
    this.justLanded = 0;        // impact speed of the last hard contact
    this.aboveFor = 0;          // seconds spent poking above the danger line
  }

  get resting() { return this.stillFor > 0.25; }
}

export class World {
  constructor(opts) {
    this.left = opts.left;
    this.right = opts.right;
    this.floor = opts.floor;
    this.gravity = opts.gravity ?? 2600;
    this.iterations = opts.iterations ?? 8;
    this.damping = opts.damping ?? 0.995;   // air, so nothing rolls forever
    this.restitution = opts.restitution ?? 0.14;
    this.friction = opts.friction ?? 0.28;
    this.maxSpeed = opts.maxSpeed ?? Infinity;
    this.bodies = [];
    this.contacts = [];   // [a, b, impactSpeed] pairs from the last step
  }

  add(body) { this.bodies.push(body); return body; }

  remove(body) {
    const i = this.bodies.indexOf(body);
    if (i >= 0) this.bodies.splice(i, 1);
  }

  // One fixed step. Call at a fixed dt (the game runs two per frame).
  step(dt) {
    // A step this short cannot be integrated: (x - px) underflows to zero and
    // reading the velocity back off it would wipe the velocity entirely. The
    // game feeds whole steps only; this is the belt to that braces.
    if (!(dt > 1e-6)) return;

    const bodies = this.bodies;
    this.contacts.length = 0;

    // ---- predict ----
    for (const b of bodies) {
      b.px = b.x; b.py = b.y;
      b.vy += this.gravity * dt;
      b.vx *= this.damping;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.angle += b.av * dt;
      b.av *= 0.97;
      b.age += dt;
      if (b.squish > 0) b.squish = Math.max(0, b.squish - dt * 6);
      b.justLanded = 0;
    }

    // ---- solve ----
    // Track the hardest approach speed per pair on the first iteration only:
    // that is the real impact, before the solver has bled it off.
    for (let iter = 0; iter < this.iterations; iter++) {
      const first = iter === 0;

      for (let i = 0; i < bodies.length; i++) {
        const a = bodies[i];
        for (let j = i + 1; j < bodies.length; j++) {
          const b = bodies[j];
          let dx = b.x - a.x, dy = b.y - a.y;
          const minDist = a.r + b.r;
          let d2 = dx * dx + dy * dy;
          if (d2 >= minDist * minDist) continue;

          let d = Math.sqrt(d2);
          if (d < 1e-6) {
            // Dead centre: shove them apart on a fixed axis rather than
            // dividing by zero. Deterministic, so tests stay repeatable.
            dx = 0; dy = -1; d = 1e-6;
          } else { dx /= d; dy /= d; }

          const overlap = minDist - d;
          const total = a.mass + b.mass;
          const aShare = b.mass / total, bShare = a.mass / total;

          // Relax rather than fully separating: repeated passes converge, and
          // a partial push stops a deep pile from exploding.
          const push = overlap * 0.8;
          a.x -= dx * push * aShare; a.y -= dy * push * aShare;
          b.x += dx * push * bShare; b.y += dy * push * bShare;

          if (first) {
            const rvx = b.vx - a.vx, rvy = b.vy - a.vy;
            const approach = -(rvx * dx + rvy * dy);
            this.contacts.push([a, b, approach > 0 ? approach : 0]);
            if (approach > 260) {
              const hit = Math.min(1, approach / 2200);
              a.squish = Math.max(a.squish, hit); a.justLanded = Math.max(a.justLanded, approach);
              b.squish = Math.max(b.squish, hit); b.justLanded = Math.max(b.justLanded, approach);
            }
            // Friction, purely so a block spins as it rolls off a shoulder.
            const tangent = rvx * -dy + rvy * dx;
            a.av -= (tangent * this.friction) / (a.r * 12);
            b.av -= (tangent * this.friction) / (b.r * 12);
          }
        }
      }

      // Walls and floor, after the pairs, so the box always wins.
      for (const b of bodies) {
        if (b.x - b.r < this.left) b.x = this.left + b.r;
        if (b.x + b.r > this.right) b.x = this.right - b.r;
        if (b.y + b.r > this.floor) {
          if (first) {
            const approach = b.vy;
            if (approach > 260) {
              b.squish = Math.max(b.squish, Math.min(1, approach / 2200));
              b.justLanded = Math.max(b.justLanded, approach);
            }
            b.av += (b.vx * this.friction) / (b.r * 6);
          }
          b.y = this.floor - b.r;
        }
      }
    }

    // ---- read velocity back off the actual movement ----
    for (const b of bodies) {
      let nvx = (b.x - b.px) / dt;
      let nvy = (b.y - b.py) / dt;
      // A little bounce, but only against the direction the solver reversed.
      // Read off b.vy before it is overwritten: that is the incoming speed.
      nvy = nvy < 0 && b.vy > 0 ? nvy - b.vy * this.restitution : nvy;
      // Reading velocity back off a single step's movement is what makes this
      // solver stable, but a deep overlap relaxed in one step implies a speed
      // nothing physical would reach and fires the body out of the box. Clamp
      // the final magnitude — after the bounce, so the cap actually holds — and
      // normal falling never comes near it: the full height of this jar is worth
      // about 1740px/s.
      const implied = Math.hypot(nvx, nvy);
      if (implied > this.maxSpeed) {
        const k = this.maxSpeed / implied;
        nvx *= k; nvy *= k;
      }
      b.vx = nvx;
      b.vy = nvy;

      const speed = Math.abs(b.vx) + Math.abs(b.vy);
      b.stillFor = speed < 14 ? b.stillFor + dt : 0;
      if (Math.abs(b.av) < 0.02) b.av = 0;
    }
  }

  // Deepest overlap first: merging the tightest pair first looks right when a
  // three-of-a-kind lands at once, and keeps the outcome deterministic.
  //
  // What counts as a mergeable pair is the rules' business, not the solver's —
  // here that is "their sum is on the ladder", which is not the same as "same
  // tier" once Zero is in play. Pass a predicate; the default is same-tier.
  overlappingPairs(canMerge = (a, b) => a.tier === b.tier) {
    const out = [];
    for (const [a, b] of this.contacts) {
      if (a.dead || b.dead) continue;
      if (!canMerge(a, b)) continue;
      const dx = b.x - a.x, dy = b.y - a.y;
      const d = Math.sqrt(dx * dx + dy * dy);
      const overlap = a.r + b.r - d;
      if (overlap > 0) out.push({ a, b, overlap });
    }
    out.sort((p, q) => q.overlap - p.overlap);
    return out;
  }
}
