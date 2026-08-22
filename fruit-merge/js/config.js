// One place for every number worth arguing about.

export const W = 480;
export const H = 800;

export const LAYOUT = {
  headerH: 100,        // score, best, next-up
  wall: 9,             // drawn thickness of the jar
  left: 26,            // inner faces of the jar
  right: 454,
  top: 132,            // rim
  floor: 718,
  dangerY: 186,        // leave a fruit above this line and it is over
  dropY: 138,          // where the held fruit hangs, just inside the mouth
  ladderY: 730,        // the little chart along the bottom
};

export const RULES = {
  gravity: 2600,
  substeps: 2,         // physics steps per rendered frame
  fixedDt: 1 / 120,
  dropCooldown: 0.34,  // seconds before the next fruit is handed over
  dangerGrace: 1.2,    // seconds a fruit may sit above the line before it ends
  // A fruit only counts as "left above the line" once it has stopped flying.
  // Requiring it to be fully at rest makes the game unloseable (a full jar is
  // never quite still); requiring only that it is not a projectile is the
  // distinction that actually matters. Measured: a settled full pile moves at a
  // couple of px/s, while a fruit squeezed out of the pile leaves at hundreds
  // to thousands.
  dangerSettleSpeed: 260,
  // The solver resolves a deep overlap in one step, which can imply an absurd
  // velocity and fire a fruit clear out of the jar. A fruit falling the full
  // height of this jar reaches ~1740px/s, so this clamp never touches normal
  // motion — it only takes the top off a squeeze-out.
  maxSpeed: 2600,
  comboWindow: 0.9,    // merges within this of each other count as a chain
  maxChainMultiplier: 5,
  spawnTiers: 5,       // only the smallest five ever drop
  spawnWeights: [30, 26, 20, 14, 10],
  baseRadius: 17,
  radiusRatio: 1.22,
  finalBonus: 100,     // for merging the two biggest away
};

// Radii climb geometrically, so each fruit reads as clearly bigger than the one
// below it even when Asher painted two of them the same colour.
export function radiusFor(tier) {
  return RULES.baseRadius * Math.pow(RULES.radiusRatio, tier);
}

// Classic triangular scoring: the higher the fruit, the more the merge is worth.
export function mergeScore(tierMade) {
  return (tierMade * (tierMade + 1)) / 2;
}
