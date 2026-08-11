// =============================================================================
// CHARACTERS — Path-based drawing for the Grinch and Max.
//
// Everything here is a pure function: pose parameters in, pixels out.
// The rubbery 1966 feel comes from three things used everywhere:
//   - squash & stretch scaling around the feet
//   - a forward lean that rotates the whole torso around the hips
//   - limbs drawn as quadratic curves (never straight rectangles)
// =============================================================================

import { GRINCH_COLORS as GC, MAX_COLORS as MC } from './themes.js';

// -----------------------------------------------------------------------------
// THE GRINCH
//
// opts: {
//   cx, feetY      — feet-center anchor in world/screen coords
//   h              — target figure height in px (hitbox height; head pokes a bit above)
//   facing         — 1 right, -1 left
//   squashX, squashY — scale factors for squash & stretch (default 1)
//   lean           — forward lean in radians (positive = leaning ahead)
//   phase          — walk-cycle phase in radians (advances with distance moved)
//   mode           — 'idle' | 'sneak' | 'run' | 'jump' | 'fall' | 'skid' | 'wallslide'
//   grin           — 0..1 how wide the sly grin spreads
//   eyes           — 'sly' | 'wide' | 'happy'
//   armsUp         — true when carrying something overhead
//   suit           — true = Santa coat + hat
//   time           — frame counter for ambient wiggles (finger wiggle, hat bobble)
// }
// -----------------------------------------------------------------------------
export function drawGrinch(ctx, opts) {
  const {
    cx, feetY, h, facing = 1,
    squashX = 1, squashY = 1,
    lean = 0, phase = 0, mode = 'idle',
    grin = 0.4, eyes = 'sly', armsUp = false,
    suit = true, time = 0,
  } = opts;

  const u = h / 40; // unit: proportions designed on a 40px-tall figure

  ctx.save();
  ctx.translate(cx, feetY);
  ctx.scale(facing * squashX, squashY);

  // ---- legs (behind body) ----
  // Two legs from hips (y=-16u) to feet (y=0), knees as curve control points.
  const hipY = -16 * u;
  const legColor = GC.fur;
  ctx.strokeStyle = legColor;
  ctx.lineCap = 'round';
  ctx.lineWidth = 3.2 * u;

  let footA, footB; // {x, y, toe} foot positions for drawing feet after legs
  if (mode === 'sneak') {
    // The famous tiptoe: one knee lifted high, toes pointed
    const lift = Math.sin(phase);              // -1..1
    const front = kneeLeg(ctx, 2 * u, hipY, lift, u, true);
    const back = kneeLeg(ctx, -2 * u, hipY, -lift, u, true);
    footA = front; footB = back;
  } else if (mode === 'run' || mode === 'skid') {
    const swing = Math.sin(phase);
    const front = kneeLeg(ctx, 2 * u, hipY, swing * 0.7, u, false);
    const back = kneeLeg(ctx, -2 * u, hipY, -swing * 0.7, u, false);
    footA = front; footB = back;
  } else if (mode === 'jump' || mode === 'fall') {
    // Legs trail: one tucked, one extended
    footA = drawLegTo(ctx, 2 * u, hipY, 7 * u, -6 * u, 5 * u, u);
    footB = drawLegTo(ctx, -2 * u, hipY, -5 * u, -2 * u, -7 * u, u);
  } else {
    // idle / wallslide: straight-ish, slight bend
    footA = drawLegTo(ctx, 2 * u, hipY, 3.5 * u, 0, 3 * u, u);
    footB = drawLegTo(ctx, -2 * u, hipY, -2.5 * u, 0, -3 * u, u);
  }
  drawFoot(ctx, footA, u);
  drawFoot(ctx, footB, u);

  // ---- torso (rotates around the hips for the lean) ----
  ctx.save();
  ctx.translate(0, hipY);
  ctx.rotate(lean);

  // Pear-shaped body: wide hips, narrow shoulders (heights relative to hips)
  const bodyH = 16 * u;              // hips to shoulders
  const hipW = 8.5 * u;
  const shoulderW = 4.5 * u;

  ctx.fillStyle = suit ? GC.suit : GC.fur;
  ctx.beginPath();
  ctx.moveTo(-hipW, 2 * u);
  ctx.bezierCurveTo(-hipW - 2 * u, -bodyH * 0.45, -shoulderW - 2 * u, -bodyH * 0.85, -shoulderW, -bodyH);
  ctx.lineTo(shoulderW, -bodyH);
  ctx.bezierCurveTo(shoulderW + 2 * u, -bodyH * 0.85, hipW + 2 * u, -bodyH * 0.45, hipW, 2 * u);
  ctx.closePath();
  ctx.fill();

  if (suit) {
    // White trim: coat hem + button line
    ctx.fillStyle = GC.trim;
    ctx.beginPath();
    ctx.ellipse(0, 1.5 * u, hipW, 2.2 * u, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = GC.trim;
    ctx.lineWidth = 1.4 * u;
    ctx.beginPath();
    ctx.moveTo(1.5 * u, 0);
    ctx.lineTo(2.5 * u, -bodyH + 2 * u);
    ctx.stroke();
    // Belt
    ctx.fillStyle = '#3a2a1a';
    ctx.fillRect(-hipW * 0.9, -bodyH * 0.38, hipW * 1.8, 2 * u);
  } else {
    // Belly fur patch
    ctx.fillStyle = GC.belly;
    ctx.beginPath();
    ctx.ellipse(1.5 * u, -bodyH * 0.4, hipW * 0.55, bodyH * 0.42, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // ---- arms ----
  const shY = -bodyH + 1.5 * u; // shoulder joint height (in torso frame)
  ctx.strokeStyle = GC.fur;
  ctx.lineWidth = 2.6 * u;
  if (armsUp) {
    arm(ctx, 2 * u, shY, 5 * u, shY - 5 * u, 4 * u, shY - 10 * u, u, time, false);
    arm(ctx, -1 * u, shY, -4 * u, shY - 5 * u, -3 * u, shY - 10 * u, u, time, false);
  } else if (mode === 'sneak') {
    // Both arms reach ahead, hands drooped, fingers wiggling
    arm(ctx, 2 * u, shY, 8 * u, shY + 1 * u, 12 * u, shY + 4 * u, u, time, true);
    arm(ctx, -1 * u, shY, 6 * u, shY + 3 * u, 10 * u, shY + 6.5 * u, u, time + 2, true);
  } else if (mode === 'run' || mode === 'skid') {
    const swing = Math.sin(phase);
    arm(ctx, 2 * u, shY, 5 * u + swing * 3 * u, shY + 4 * u, 4 * u + swing * 6 * u, shY + 7 * u, u, time, false);
    arm(ctx, -1 * u, shY, -4 * u - swing * 3 * u, shY + 4 * u, -3 * u - swing * 6 * u, shY + 7 * u, u, time, false);
  } else if (mode === 'jump') {
    arm(ctx, 2 * u, shY, 7 * u, shY - 4 * u, 9 * u, shY - 8 * u, u, time, false); // one arm up!
    arm(ctx, -1 * u, shY, -5 * u, shY + 2 * u, -7 * u, shY + 5 * u, u, time, false);
  } else if (mode === 'fall') {
    arm(ctx, 2 * u, shY, 7 * u, shY - 2 * u, 10 * u, shY - 3 * u, u, time, true);
    arm(ctx, -1 * u, shY, -6 * u, shY - 2 * u, -9 * u, shY - 3 * u, u, time, true);
  } else if (mode === 'wallslide') {
    arm(ctx, 2 * u, shY, 6 * u, shY - 1 * u, 9 * u, shY + 1 * u, u, time, false);
    arm(ctx, -1 * u, shY, 2 * u, shY + 4 * u, 5 * u, shY + 6 * u, u, time, false);
  } else {
    // idle: hands folded low, fingers drumming
    arm(ctx, 2 * u, shY, 4.5 * u, shY + 5 * u, 3 * u, shY + 9 * u, u, time, true);
    arm(ctx, -1 * u, shY, -3.5 * u, shY + 5 * u, -1 * u, shY + 9 * u, u, time + 3, true);
  }

  // ---- head (seated into the shoulders, inherits the lean) ----
  ctx.save();
  ctx.translate(1 * u, -bodyH - 3.5 * u); // head center
  const hr = 6.5 * u; // head radius

  // Fur cheeks: head is a circle with two cheek tufts and a pointed chin
  ctx.fillStyle = GC.fur;
  ctx.beginPath();
  ctx.arc(0, 0, hr, 0, Math.PI * 2);
  ctx.fill();
  // cheek tufts (little triangles flaring back)
  ctx.beginPath();
  ctx.moveTo(-hr * 0.6, 2 * u);
  ctx.lineTo(-hr - 3 * u, 3.5 * u);
  ctx.lineTo(-hr * 0.5, 4.5 * u);
  ctx.closePath();
  ctx.fill();

  // Santa hat (flops backward, bobble swings)
  if (suit) {
    ctx.fillStyle = GC.suit;
    ctx.beginPath();
    ctx.moveTo(-hr + 1 * u, -hr * 0.55);
    ctx.quadraticCurveTo(0, -hr - 4 * u, hr - 1 * u, -hr * 0.55);
    const bob = Math.sin(time * 0.12) * 1.5 * u;
    ctx.quadraticCurveTo(-2 * u, -hr - 6 * u, -hr - 5 * u, -hr - 2 * u + bob);
    ctx.quadraticCurveTo(-hr - 1 * u, -hr * 0.2, -hr + 1 * u, -hr * 0.55);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = GC.trim;
    ctx.beginPath();
    ctx.ellipse(0, -hr * 0.55, hr, 1.8 * u, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(-hr - 5 * u, -hr - 2 * u + bob, 2 * u, 0, Math.PI * 2);
    ctx.fill();
  }

  // Eyes — yellow with red pupils, expression via lids
  const ex = 2.5 * u; // eyes sit toward the facing side
  drawGrinchEye(ctx, ex + 2 * u, -1.5 * u, 2.2 * u, eyes, u);
  drawGrinchEye(ctx, ex - 2.6 * u, -1.5 * u, 2.0 * u, eyes, u);

  // Brows — the scheming angle
  ctx.strokeStyle = GC.furShade;
  ctx.lineWidth = 1.3 * u;
  const browTilt = eyes === 'wide' ? -0.15 : 0.45;
  ctx.beginPath();
  ctx.moveTo(ex + 0.2 * u, -4.4 * u + browTilt * 2 * u);
  ctx.lineTo(ex + 4 * u, -4.4 * u - browTilt * 2 * u);
  ctx.moveTo(ex - 0.8 * u, -4.4 * u + browTilt * 1.4 * u);
  ctx.lineTo(ex - 4.2 * u, -4.6 * u - browTilt * 1.2 * u);
  ctx.stroke();

  // Snout + the grin that curls up at the far end
  ctx.strokeStyle = GC.furShade;
  ctx.lineWidth = 1.2 * u;
  ctx.beginPath();
  ctx.moveTo(ex + 4.6 * u, 0.5 * u); // nose tip
  ctx.quadraticCurveTo(ex + 5.4 * u, 1.8 * u, ex + 4 * u, 2.4 * u);
  ctx.stroke();
  // grin: from near the nose curling back and UP as it widens
  const gw = 4 * u + grin * 5 * u;
  const curl = 1 * u + grin * 3 * u;
  ctx.lineWidth = 1.4 * u;
  ctx.beginPath();
  ctx.moveTo(ex + 4 * u, 2.6 * u);
  ctx.quadraticCurveTo(ex - gw * 0.4, 4.5 * u, ex - gw, 2.6 * u - curl);
  ctx.stroke();

  ctx.restore(); // head
  ctx.restore(); // torso
  ctx.restore(); // figure
}

function drawGrinchEye(ctx, x, y, r, expression, u) {
  ctx.fillStyle = GC.eye;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = GC.pupil;
  ctx.beginPath();
  ctx.arc(x + r * 0.3, y, r * 0.45, 0, Math.PI * 2);
  ctx.fill();
  if (expression === 'sly') {
    // half-closed lid
    ctx.fillStyle = GC.fur;
    ctx.beginPath();
    ctx.arc(x, y - r * 0.5, r * 1.05, Math.PI, 0);
    ctx.fill();
  } else if (expression === 'happy') {
    // squeezed-happy: lower lid pushes up
    ctx.fillStyle = GC.fur;
    ctx.beginPath();
    ctx.arc(x, y + r * 0.9, r * 1.0, Math.PI, 0, true);
    ctx.fill();
  }
}

// Leg with a lifted knee (sneak) or swing (run). Returns foot pos {x,y,toe}.
function kneeLeg(ctx, hipX, hipY, lift, u, tiptoe) {
  // lift -1..1: 1 = knee fully raised, foot off ground
  const kneeX = hipX + 4 * u + lift * 2 * u;
  const kneeY = hipY + 6 * u - Math.max(0, lift) * 9 * u;
  const footX = hipX + 3 * u + lift * 5 * u;
  const footY = Math.max(0, lift) > 0.1 ? -Math.max(0, lift) * 7 * u : 0;
  ctx.beginPath();
  ctx.moveTo(hipX, hipY);
  ctx.quadraticCurveTo(kneeX, kneeY, footX, footY);
  ctx.stroke();
  return { x: footX, y: footY, toe: tiptoe ? 1 : 0.4 };
}

function drawLegTo(ctx, hipX, hipY, kneeX, kneeY, footX, u) {
  ctx.beginPath();
  ctx.moveTo(hipX, hipY);
  ctx.quadraticCurveTo(kneeX, hipY + (kneeY - hipY) * 0.6, footX, 0);
  ctx.stroke();
  return { x: footX, y: 0, toe: 0.4 };
}

function drawFoot(ctx, foot, u) {
  // long pointed foot (toe extends forward)
  ctx.fillStyle = GC.fur;
  ctx.save();
  ctx.translate(foot.x, foot.y);
  ctx.rotate(-foot.toe * 0.5);
  ctx.beginPath();
  ctx.ellipse(2.5 * u, -1 * u, 4.5 * u, 1.8 * u, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// Arm as a quadratic curve; optionally ends in wiggling fingers.
function arm(ctx, sx, sy, cx2, cy2, hx, hy, u, time, fingers) {
  ctx.beginPath();
  ctx.moveTo(sx, sy);
  ctx.quadraticCurveTo(cx2, cy2, hx, hy);
  ctx.stroke();
  if (fingers) {
    ctx.save();
    ctx.lineWidth = 1.1 * u;
    for (let i = 0; i < 4; i++) {
      const wig = Math.sin(time * 0.25 + i * 1.3) * 1.4 * u;
      ctx.beginPath();
      ctx.moveTo(hx, hy);
      ctx.quadraticCurveTo(hx + 1.5 * u, hy + 1 * u + i * 0.6 * u, hx + 3.2 * u, hy + 1 * u + i * 1.1 * u + wig);
      ctx.stroke();
    }
    ctx.restore();
  } else {
    // simple mitt
    ctx.beginPath();
    ctx.arc(hx, hy, 1.8 * u, 0, Math.PI * 2);
    ctx.fillStyle = ctx.strokeStyle;
    ctx.fill();
  }
}

// -----------------------------------------------------------------------------
// MAX — the dog with the tied-on antler.
//
// opts: { cx, feetY, h, facing, phase, mode ('idle'|'trot'|'jump'|'fall'),
//         time, earLag (px, trails vertical motion), antler = true }
// -----------------------------------------------------------------------------
export function drawMax(ctx, opts) {
  const {
    cx, feetY, h, facing = 1, phase = 0, mode = 'idle',
    time = 0, earLag = 0, antler = true,
    squashX = 1, squashY = 1,
  } = opts;

  const u = h / 24; // designed on a 24px-tall dog

  ctx.save();
  ctx.translate(cx, feetY);
  ctx.scale(facing * squashX, squashY);

  const bodyY = -11 * u;

  // legs — four thin trotting legs
  ctx.strokeStyle = MC.fur;
  ctx.lineCap = 'round';
  ctx.lineWidth = 2 * u;
  const legPairs = [
    { x: 6 * u, ph: 0 },
    { x: 3 * u, ph: Math.PI },
    { x: -4 * u, ph: Math.PI * 0.9 },
    { x: -7 * u, ph: Math.PI * 1.9 },
  ];
  for (const leg of legPairs) {
    let footX = leg.x, footY = 0;
    if (mode === 'trot') {
      footX = leg.x + Math.sin(phase + leg.ph) * 3 * u;
      footY = -Math.max(0, Math.cos(phase + leg.ph)) * 3 * u;
    } else if (mode === 'jump' || mode === 'fall') {
      footX = leg.x + (leg.x > 0 ? 2 * u : -2 * u);
      footY = -2 * u;
    }
    ctx.beginPath();
    ctx.moveTo(leg.x, bodyY + 2 * u);
    ctx.quadraticCurveTo(leg.x + (footX - leg.x) * 0.3, bodyY + 5 * u, footX, footY);
    ctx.stroke();
  }

  // tail — wags fast when trotting
  const wag = Math.sin(time * (mode === 'trot' ? 0.5 : 0.12)) * 0.6;
  ctx.beginPath();
  ctx.moveTo(-9 * u, bodyY);
  ctx.quadraticCurveTo(-12 * u, bodyY - 3 * u, -13 * u, bodyY - 5 * u + wag * 4 * u);
  ctx.stroke();

  // body
  ctx.fillStyle = MC.fur;
  ctx.beginPath();
  ctx.ellipse(-1 * u, bodyY, 9 * u, 5 * u, -0.08, 0, Math.PI * 2);
  ctx.fill();

  // head
  const headX = 8 * u;
  const headY = bodyY - 5 * u;
  ctx.beginPath();
  ctx.arc(headX, headY, 4.5 * u, 0, Math.PI * 2);
  ctx.fill();

  // muzzle
  ctx.fillStyle = MC.muzzle;
  ctx.beginPath();
  ctx.ellipse(headX + 4 * u, headY + 1.5 * u, 3 * u, 2 * u, 0.1, 0, Math.PI * 2);
  ctx.fill();
  // nose
  ctx.fillStyle = '#2a2a2a';
  ctx.beginPath();
  ctx.arc(headX + 6.5 * u, headY + 0.8 * u, 1.1 * u, 0, Math.PI * 2);
  ctx.fill();

  // floppy ear — hangs and lags behind vertical motion
  ctx.fillStyle = MC.earInner;
  ctx.beginPath();
  ctx.moveTo(headX - 2 * u, headY - 3.5 * u);
  ctx.quadraticCurveTo(headX - 6 * u, headY + earLag + 1 * u, headX - 4 * u, headY + earLag + 5 * u);
  ctx.quadraticCurveTo(headX - 1.5 * u, headY + 2 * u, headX - 1 * u, headY - 3 * u);
  ctx.closePath();
  ctx.fill();

  // eye — big and earnest
  ctx.fillStyle = '#FFF';
  ctx.beginPath();
  ctx.arc(headX + 1 * u, headY - 1 * u, 1.8 * u, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.arc(headX + 1.5 * u, headY - 0.8 * u, 0.9 * u, 0, Math.PI * 2);
  ctx.fill();

  // the single antler, tied on with a rope (flops with the ear lag)
  if (antler) {
    ctx.save();
    ctx.translate(headX + 0.5 * u, headY - 4 * u);
    ctx.rotate(-0.35 + earLag * 0.04 + Math.sin(time * 0.1) * 0.06);
    ctx.strokeStyle = MC.antler;
    ctx.lineWidth = 1.6 * u;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(1 * u, -4 * u, 0, -7 * u);       // main beam
    ctx.moveTo(0.4 * u, -3 * u);
    ctx.lineTo(3 * u, -5 * u);                            // fork 1
    ctx.moveTo(0, -5.5 * u);
    ctx.lineTo(-2.5 * u, -7.5 * u);                       // fork 2
    ctx.stroke();
    ctx.restore();
    // rope under the chin
    ctx.strokeStyle = MC.rope;
    ctx.lineWidth = 0.8 * u;
    ctx.beginPath();
    ctx.moveTo(headX - 1.5 * u, headY - 4 * u);
    ctx.quadraticCurveTo(headX, headY + 4.5 * u, headX + 2.5 * u, headY - 4.2 * u);
    ctx.stroke();
  }

  // tongue when trotting hard
  if (mode === 'trot') {
    ctx.fillStyle = '#e87a8a';
    ctx.beginPath();
    ctx.ellipse(headX + 5.5 * u, headY + 3 * u + Math.sin(time * 0.3) * 0.6 * u, 1 * u, 1.8 * u, 0.3, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

// -----------------------------------------------------------------------------
// PRESENT — wrapped gift box with ribbon and bow (collectible + HUD icon)
// -----------------------------------------------------------------------------
export function drawPresent(ctx, x, y, w, h, wrap, ribbon) {
  ctx.fillStyle = wrap;
  ctx.fillRect(x, y, w, h);
  // lid shade
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.fillRect(x, y, w, h * 0.22);
  // ribbon cross
  ctx.fillStyle = ribbon;
  ctx.fillRect(x + w / 2 - w * 0.09, y, w * 0.18, h);
  ctx.fillRect(x, y + h / 2 - h * 0.09, w, h * 0.18);
  // bow
  ctx.strokeStyle = ribbon;
  ctx.lineWidth = Math.max(1.5, w * 0.09);
  ctx.beginPath();
  ctx.ellipse(x + w / 2 - w * 0.18, y - h * 0.08, w * 0.16, h * 0.12, -0.5, 0, Math.PI * 2);
  ctx.ellipse(x + w / 2 + w * 0.18, y - h * 0.08, w * 0.16, h * 0.12, 0.5, 0, Math.PI * 2);
  ctx.stroke();
}

// -----------------------------------------------------------------------------
// HEART — for the HUD meter and the finale
// -----------------------------------------------------------------------------
export function drawHeart(ctx, cx, cy, size, color, outline = null) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(size / 20, size / 20);
  ctx.beginPath();
  ctx.moveTo(0, 6);
  ctx.bezierCurveTo(-2, 2, -10, -1, -10, -6);
  ctx.bezierCurveTo(-10, -12, -3, -13, 0, -8);
  ctx.bezierCurveTo(3, -13, 10, -12, 10, -6);
  ctx.bezierCurveTo(10, -1, 2, 2, 0, 6);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  if (outline) {
    ctx.strokeStyle = outline;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
  ctx.restore();
}

// -----------------------------------------------------------------------------
// SLEIGH — the level goal (replaces the flag)
// -----------------------------------------------------------------------------
export function drawSleigh(ctx, x, groundY, time = 0, sackScale = 1) {
  ctx.save();
  ctx.translate(x, groundY);

  // runners
  ctx.strokeStyle = '#d8a030';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-6, -2);
  ctx.lineTo(58, -2);
  ctx.quadraticCurveTo(66, -2, 66, -10);
  ctx.stroke();

  // body
  ctx.fillStyle = '#b02430';
  ctx.beginPath();
  ctx.moveTo(0, -6);
  ctx.quadraticCurveTo(-8, -18, 2, -26);
  ctx.quadraticCurveTo(6, -14, 14, -14);
  ctx.lineTo(48, -14);
  ctx.quadraticCurveTo(56, -14, 56, -6);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#d8a030';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // the great sack of presents (breathes gently)
  const s = sackScale * (1 + Math.sin(time * 0.05) * 0.02);
  if (s > 0.05) {
    ctx.save();
    ctx.translate(30, -14);
    ctx.scale(s, s);
    ctx.fillStyle = '#7a5a38';
    ctx.beginPath();
    ctx.moveTo(-16, 0);
    ctx.bezierCurveTo(-22, -18, -12, -34, 0, -36);
    ctx.bezierCurveTo(12, -34, 22, -18, 16, 0);
    ctx.closePath();
    ctx.fill();
    // tied neck
    ctx.fillStyle = '#5a4028';
    ctx.beginPath();
    ctx.ellipse(0, -35, 5, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    // presents peeking out
    drawPresent(ctx, -8, -46, 9, 9, '#3a9a5a', '#ffd700');
    drawPresent(ctx, 1, -44, 8, 8, '#4a6ad8', '#ffd700');
    ctx.restore();
  }

  ctx.restore();
}
