// One place for every number worth arguing about.

export const W = 480;
export const H = 800;

// The ladder. Zero, then One, then doubling all the way up.
export const VALUES = [0, 1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048];

export const TOP_TIER = VALUES.length - 1;   // 2048
export const BEYOND = VALUES.length;         // 4096 — off the ladder, and the win
export const BEYOND_VALUE = 4096;

export const LAYOUT = {
  headerH: 100,        // score, best, next-up
  wall: 9,             // drawn thickness of the jar
  left: 26,            // inner faces of the jar
  right: 454,
  top: 132,            // rim
  floor: 718,
  dangerY: 186,        // leave a block above this line and it is over
  dropY: 138,          // where the held block hangs, just inside the mouth
  ladderBallY: 748,    // the little chart along the bottom
  ladderLabelY: 772,
};

export const RULES = {
  gravity: 2600,
  substeps: 2,         // physics steps per rendered frame
  fixedDt: 1 / 120,
  dropCooldown: 0.34,  // seconds before the next block is handed over
  dangerGrace: 1.2,    // seconds a block may sit above the line before it ends
  // A block only counts as "left above the line" once it has stopped flying.
  // Requiring it to be fully at rest makes the game unloseable (a full jar is
  // never quite still); requiring only that it is not a projectile is the
  // distinction that actually matters. Measured: a settled full pile moves at
  // 2px/s median, 16px/s at the 95th centile, while a block squeezed out of the
  // pile leaves at hundreds to thousands.
  dangerSettleSpeed: 260,
  // The solver resolves a deep overlap in one step, which can imply an absurd
  // velocity and fire a block clear out of the jar. A ball falling the full
  // height of the jar reaches ~1740px/s, so this clamp never touches normal
  // motion — it only takes the top off a squeeze-out.
  maxSpeed: 2600,
  comboWindow: 0.9,    // merges within this of each other count as a chain
  spawnTiers: 5,       // only 0, 1, 2, 4 and 8 ever drop
  spawnWeights: [7, 30, 27, 21, 15],   // Zero is the rare one
  baseRadius: 17,
  radiusRatio: 1.18,
};

// Radii climb geometrically, so each rung reads as clearly bigger than the one
// below it. Thirteen rungs at 1.18 lands 2048 at the same size the biggest
// fruit was: just over half the jar wide.
export function radiusFor(tier) {
  return RULES.baseRadius * Math.pow(RULES.radiusRatio, tier);
}

export function valueOf(tier) {
  return tier === BEYOND ? BEYOND_VALUE : VALUES[tier];
}

// The whole rule of the game, in one function: two blocks merge when their sum
// is itself a number on the ladder.
//
//   1 + 1 = 2      merges
//   2 + 2 = 4      merges — every pair of equals doubles, that is what a
//                  ladder of powers of two means
//   1 + 2 = 3      no. Three is not on this ladder, so a One and a Two just
//                  sit next to each other.
//   128 + 0 = 128  merges, and nothing changes. Zero adds nothing, so it
//                  disappears into whatever it lands on.
//   2048 + 2048    = 4096, past the top of the ladder. Both leave, and that
//                  is the game you are playing for.
//
// Returns the tier of the block made, BEYOND for the win, or -1 for no merge.
export function mergeTier(tierA, tierB) {
  const sum = VALUES[tierA] + VALUES[tierB];
  if (sum === BEYOND_VALUE) return BEYOND;
  const t = VALUES.indexOf(sum);
  return t >= 0 ? t : -1;
}

// A merge with a Zero makes nothing new, so it pays nothing. Every other merge
// pays exactly what it made, which means the score is the honest total of every
// block you have ever assembled.
export function isIdentity(tierA, tierB) {
  return tierA === 0 || tierB === 0;
}

export function mergeScore(tierA, tierB) {
  const made = mergeTier(tierA, tierB);
  if (made < 0 || isIdentity(tierA, tierB)) return 0;
  return valueOf(made);
}
