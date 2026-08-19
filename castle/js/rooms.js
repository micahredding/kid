// =============================================================================
// ROOMS — the castle hub and four worlds, plus the puzzle each one holds.
//
// Every world works the same way: carry the right thing to the dark lamp and it
// lights, which lights that world's lamp back in the hall. Four lamps lit and
// the castle wakes up. No door is ever locked, so a small player cannot get
// stuck — the only thing gating progress is the lamp itself, and getting a lamp
// wrong costs nothing but a shake.
//
// The reading ramp lives in how a puzzle is DISPLAYED, not in new rules:
//   snow    plaque shows picture + word, things show picture + word   (match the picture)
//   garden  plaque shows word only,      things show picture + word   (match the word)
//   ark     plaque shows word only,      things are stencilled crates (word alone)
//   rail    plaque shows a sum,          things are numbered blocks   (arithmetic)
// =============================================================================

import { PALETTE as P } from './pixels.js';

// ---- scenery helpers -------------------------------------------------------

function stoneWall(p, x, y, w, h, dark = false) {
  p.dither(x, y, w, h, dark ? '#4a4f5c' : '#6d7484', dark ? '#3d4250' : '#5c6373', 2);
  // Mortar courses, offset every other row like real blockwork.
  for (let row = 0, j = y; j < y + h; j += 12, row++) {
    p.rect(x, j, w, 1, dark ? '#31353f' : '#474d5a');
    for (let i = x + (row % 2 ? 0 : 16); i < x + w; i += 32) {
      p.rect(i, j, 1, 12, dark ? '#31353f' : '#474d5a');
    }
  }
}

function checkerFloor(p, f, a, b) {
  p.rect(f.x, f.y, f.w, f.h, a);
  for (let j = 0; j < f.h; j += 8) {
    const shift = ((j / 8) % 2) * 8;
    for (let i = -8; i < f.w; i += 16) p.rect(f.x + i + shift, f.y + j, 8, 8, b);
  }
  p.rect(f.x, f.y, f.w, 1, '#2b2f38');
}

function firTree(p, x, base, h, color = '#235f27') {
  p.rect(x - 2, base - 6, 4, 6, '#3b2a1a');
  let w = 14, y = base - 6;
  const tiers = Math.max(3, Math.round(h / 8));
  for (let i = 0; i < tiers; i++) {
    const tw = Math.round(w * (1 - i / tiers));
    p.rect(x - tw / 2, y - 8, tw, 9, color);
    y -= 6;
  }
  p.rect(x - 1, y - 4, 2, 5, color);
}

function star(p, x, y, bright) {
  p.rect(x, y, 1, 1, bright ? '#ffffff' : '#9fb2c9');
}

// A warm pool of light on the ground under a lamp.
function glow(p, x, y, r, color) {
  for (let i = r; i > 0; i -= 2) {
    p.ctx.globalAlpha = 0.06;
    p.ctx.fillStyle = color;
    p.ctx.beginPath();
    p.ctx.ellipse(x, y, i, i * 0.42, 0, 0, Math.PI * 2);
    p.ctx.fill();
  }
  p.ctx.globalAlpha = 1;
}

function lampPost(p, x, base, t) {
  p.rect(x - 1, base - 46, 3, 46, '#20242c');
  p.rect(x - 5, base - 2, 11, 3, '#20242c');
  p.rect(x - 5, base - 58, 11, 12, '#20242c');
  const flick = 1 + Math.sin(t / 180) * 0.12;
  glow(p, x, base - 52, 30 * flick, '#ffd77a');
  p.rect(x - 3, base - 56, 7, 8, '#ffe9a8');
  p.rect(x - 2, base - 55, 5, 6, '#fff8dc');
}

// ---- lamp (the puzzle target) ---------------------------------------------

export function drawLamp(p, lamp, lit, t) {
  const { x, y } = lamp;
  if (lit) glow(p, x, y - 20, 40, '#ffcf6b');
  // Three legs and a stone bowl, so it reads as something you put things in.
  p.rect(x - 9, y - 2, 19, 3, '#2a2f38');
  p.rect(x - 7, y - 14, 3, 13, '#353b46');
  p.rect(x + 5, y - 14, 3, 13, '#353b46');
  p.rect(x - 1, y - 16, 3, 15, '#2f343d');
  p.rect(x - 12, y - 26, 25, 11, lit ? '#6b5238' : '#464c58');
  p.rect(x - 10, y - 28, 21, 3, lit ? '#7d6244' : '#565d6a');
  p.rect(x - 9, y - 24, 19, 6, lit ? '#3a2a18' : '#2b3038');
  if (lit) {
    const f = Math.sin(t / 120) * 2;
    p.rect(x - 5, y - 36 - f, 11, 9, '#ff8a2b');
    p.rect(x - 3, y - 39 - f, 7, 9, '#ffc21e');
    p.rect(x - 1, y - 41 - f, 3, 7, '#fff3b0');
  } else {
    p.rect(x - 4, y - 31, 9, 3, '#22262e');
  }
}

// ---- the rooms -------------------------------------------------------------

const HALL_DOORS = [
  { to: 'snow',   x: 52,  world: 'snow',   tint: '#cfe4ff', name: 'SNOW' },
  { to: 'garden', x: 120, world: 'garden', tint: '#8ede7a', name: 'GARDEN' },
  { to: 'ark',    x: 190, world: 'ark',    tint: '#c98f4e', name: 'ARK' },
  { to: 'rail',   x: 258, world: 'rail',   tint: '#7fd3ff', name: 'RAILWAY' },
];

export function buildRooms(puzzle) {
  return {
    // ---------------------------------------------------------------- HALL --
    hall: {
      id: 'hall',
      name: 'THE CASTLE',
      floor: { x: 20, y: 138, w: 280, h: 48 },
      spawn: { x: 160, y: 168 },
      things: [],
      doors: HALL_DOORS.map((d) => ({
        id: `door-${d.to}`, to: d.to, x: d.x, y: 130, w: 34, h: 52,
        tint: d.tint, name: d.name, world: d.world,
      })),
      paint(p, t, state) {
        const allLit = HALL_DOORS.every((d) => state.lit[d.world]);
        p.clear(allLit ? '#2c3242' : '#171a21');
        stoneWall(p, 0, 0, 320, 140, !allLit);
        // Doorways, each showing a slice of the world beyond.
        for (const d of this.doors) {
          const lit = state.lit[d.world];
          // Frame and opening, both carried up into a round arch.
          p.ctx.fillStyle = '#20242c';
          p.ctx.beginPath(); p.ctx.arc(d.x, 80, 21, Math.PI, Math.PI * 2); p.ctx.fill();
          p.rect(d.x - 21, 78, 43, 60, '#20242c');
          p.ctx.fillStyle = lit ? d.tint : '#0d0f14';
          p.ctx.beginPath(); p.ctx.arc(d.x, 80, 17, Math.PI, Math.PI * 2); p.ctx.fill();
          p.rect(d.x - 17, 80, 34, 58, lit ? d.tint : '#0d0f14');
          // A soft floor-to-ceiling fade, so it reads as depth beyond the arch.
          if (lit) {
            const grad = p.ctx.createLinearGradient(0, 78, 0, 138);
            grad.addColorStop(0, 'rgba(255,255,255,0.35)');
            grad.addColorStop(1, 'rgba(0,0,0,0.35)');
            p.ctx.fillStyle = grad;
            p.ctx.fillRect(d.x - 17, 62, 34, 76);
          }
          // The lamp above each door: this world's progress.
          const lampY = 50;
          if (lit) {
            glow(p, d.x, lampY, 22, '#ffcf6b');
            const f = Math.sin((t + d.x * 30) / 130) * 1.5;
            p.rect(d.x - 3, lampY - 6 - f, 7, 7, '#ff8a2b');
            p.rect(d.x - 2, lampY - 8 - f, 5, 7, '#ffc21e');
          } else {
            p.rect(d.x - 3, lampY - 4, 7, 6, '#2a2f38');
          }
          p.rect(d.x - 5, lampY + 1, 11, 3, '#20242c');
        }
        // Paint the floor edge to edge; `floor` is only where he may walk.
        checkerFloor(p, { x: 0, y: this.floor.y, w: 320, h: 200 - this.floor.y },
          allLit ? '#6a5140' : '#3a3f4a', allLit ? '#5c4634' : '#33373f');
        if (allLit) {
          // The castle awake: a rug, and the lion come to see it.
          p.rect(112, 150, 96, 30, '#8f1f16');
          p.rect(116, 154, 88, 22, '#a82a1e');
          p.strokeRect(112, 150, 96, 30, '#5e130d');
        }
      },
    },

    // ---------------------------------------------------------------- SNOW --
    // Narnia, evoked not copied: a lamp post in a snowy wood.
    snow: {
      id: 'snow', name: 'THE SNOWY WOOD', world: 'snow',
      floor: { x: 12, y: 132, w: 296, h: 54 },
      spawn: { x: 34, y: 162 },
      back: { to: 'hall', x: 16, y: 128, w: 30, h: 48, name: 'BACK' },
      lamp: { x: 250, y: 150 },
      lock: { kind: 'word', word: 'BEAR', showPicture: true },
      things: [
        { id: 'bear', sprite: 'bear', word: 'BEAR', x: 122, y: 156, scale: 2 },
        { id: 'cake', sprite: 'cake', word: 'CAKE', x: 180, y: 150, scale: 2 },
        { id: 'moon', sprite: 'moon', word: 'MOON', x: 90,  y: 148, scale: 2 },
      ],
      paint(p, t) {
        // Night sky in bands, darkest at the top.
        const bands = ['#0b1026', '#121a38', '#1b2749', '#26365c', '#33456e'];
        bands.forEach((c, i) => p.rect(0, i * 14, 320, 15, c));
        p.rect(0, 70, 320, 22, '#3c5079');
        for (let i = 0; i < 46; i++) {
          const sx = (i * 71) % 320, sy = (i * 37) % 66;
          star(p, sx, sy, (i + Math.floor(t / 600)) % 4 === 0);
        }
        // Treeline, then snow.
        for (let i = 0; i < 11; i++) firTree(p, 14 + i * 30, 96 + (i % 3), 26 + (i % 4) * 5, '#16321c');
        p.rect(0, 92, 320, 12, '#dfe9f5');
        p.rect(0, 100, 320, 10, '#e6eef8');
        p.rect(0, 108, 320, 92, '#eef4fb');
        p.dither(0, 130, 320, 70, '#eef4fb', '#dbe6f3', 4);
        lampPost(p, 296, 138, t);
        // Falling snow.
        for (let i = 0; i < 40; i++) {
          const sx = (i * 97 + Math.floor(t / 90) * (1 + i % 3)) % 320;
          const sy = (i * 53 + Math.floor(t / 40)) % 200;
          p.rect(sx, sy, 1, 1, '#ffffff');
        }
      },
    },

    // -------------------------------------------------------------- GARDEN --
    // The garden: an apple tree, and a serpent nowhere in sight.
    garden: {
      id: 'garden', name: 'THE GARDEN', world: 'garden',
      floor: { x: 12, y: 128, w: 296, h: 58 },
      spawn: { x: 32, y: 160 },
      back: { to: 'hall', x: 16, y: 124, w: 30, h: 48, name: 'BACK' },
      lamp: { x: 258, y: 152 },
      lock: { kind: 'word', word: 'APPLE', showPicture: false },
      things: [
        { id: 'apple',  sprite: 'apple',  word: 'APPLE',  x: 132, y: 152, scale: 2 },
        { id: 'flower', sprite: 'flower', word: 'FLOWER', x: 186, y: 150, scale: 2 },
        { id: 'fish',   sprite: 'fish',   word: 'FISH',   x: 96,  y: 148, scale: 2 },
      ],
      paint(p, t) {
        p.rect(0, 0, 320, 96, '#8fd0f0');
        p.dither(0, 60, 320, 36, '#8fd0f0', '#b6e3f7', 3);
        // Sun
        glow(p, 42, 26, 26, '#fff3b0');
        p.rect(36, 20, 13, 13, '#ffe9a8');
        p.rect(38, 18, 9, 17, '#ffe9a8');
        // Rolling hills
        p.rect(0, 84, 320, 14, '#3f8a37');
        p.dither(0, 90, 320, 10, '#3f8a37', '#4a9e3f', 2);
        p.rect(0, 96, 320, 104, '#4a9e3f');
        p.dither(0, 120, 320, 80, '#4a9e3f', '#3f8a37', 4);
        // Apple tree
        p.rect(214, 60, 10, 74, '#5c3a1e');
        p.rect(216, 60, 3, 74, '#7a4f2a');
        for (const [cx, cy, r] of [[204, 54, 20], [232, 52, 19], [218, 40, 21], [206, 36, 14], [234, 38, 14]]) {
          p.ctx.fillStyle = '#2f7a2c';
          p.ctx.beginPath(); p.ctx.ellipse(cx, cy, r, r * 0.8, 0, 0, Math.PI * 2); p.ctx.fill();
        }
        for (const [cx, cy] of [[200, 48], [228, 44], [214, 32], [236, 54], [208, 60]]) {
          p.rect(cx, cy, 3, 3, '#d43d2f');
        }
        // Pond
        p.ctx.fillStyle = '#3a6ea5';
        p.ctx.beginPath(); p.ctx.ellipse(72, 172, 40, 14, 0, 0, Math.PI * 2); p.ctx.fill();
        p.ctx.fillStyle = '#4f88c4';
        p.ctx.beginPath(); p.ctx.ellipse(72, 170, 34, 10, 0, 0, Math.PI * 2); p.ctx.fill();
        for (let i = 0; i < 4; i++) {
          const w = 10 + ((Math.floor(t / 200) + i) % 4) * 4;
          p.rect(72 - w / 2, 166 + i * 3, w, 1, '#8fd0f0');
        }
      },
    },

    // ----------------------------------------------------------------- ARK --
    // Inside the ark: crates stencilled with names, rain at the porthole.
    ark: {
      id: 'ark', name: 'THE ARK', world: 'ark',
      floor: { x: 14, y: 136, w: 292, h: 50 },
      spawn: { x: 58, y: 162 },
      back: { to: 'hall', x: 18, y: 132, w: 30, h: 46, name: 'BACK' },
      lamp: { x: 262, y: 156 },
      lock: { kind: 'word', word: 'LION', showPicture: false },
      // No pictures at all: the word on the crate is the only clue.
      things: [
        { id: 'c-lion', word: 'LION', x: 120, y: 158, render: 'crate' },
        { id: 'c-bear', word: 'BEAR', x: 176, y: 158, render: 'crate' },
        { id: 'c-dove', word: 'DOVE', x: 224, y: 158, render: 'crate' },
      ],
      paint(p, t) {
        p.clear('#3a2717');
        // Plank wall
        for (let j = 0; j < 140; j += 10) {
          const shade = j % 20 === 0 ? '#5c3a1e' : '#4d301a';
          p.rect(0, j, 320, 9, shade);
          p.rect(0, j + 9, 320, 1, '#2b1a0e');
          for (let i = (j % 20) ? 24 : 60; i < 320; i += 72) p.rect(i, j, 1, 9, '#33200f');
        }
        // Ribs
        for (const x of [46, 150, 288]) { p.rect(x, 0, 6, 140, '#3f2713'); p.rect(x + 1, 0, 2, 140, '#59371c'); }
        // Porthole with rain outside
        p.ctx.fillStyle = '#20242c';
        p.ctx.beginPath(); p.ctx.arc(90, 52, 25, 0, Math.PI * 2); p.ctx.fill();
        p.ctx.fillStyle = '#46536b';
        p.ctx.beginPath(); p.ctx.arc(90, 52, 21, 0, Math.PI * 2); p.ctx.fill();
        p.ctx.save();
        p.ctx.beginPath(); p.ctx.arc(90, 52, 21, 0, Math.PI * 2); p.ctx.clip();
        for (let i = 0; i < 26; i++) {
          const rx = 70 + ((i * 29) % 42);
          const ry = 32 + ((i * 17 + Math.floor(t / 25)) % 42);
          p.rect(rx, ry, 1, 4, '#9fb2c9');
        }
        p.ctx.restore();
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * Math.PI * 2;
          p.rect(90 + Math.cos(a) * 24 - 1, 52 + Math.sin(a) * 24 - 1, 3, 3, '#7a4f2a');
        }
        // A dove on the beam, watching.
        p.rect(180, 34, 120, 5, '#3f2713');
        p.sprite(SPRITE_REFS.dove, 214, 22, { scale: 1 });
        // Hay floor
        p.rect(0, 136, 320, 64, '#8a6a35');
        p.dither(0, 140, 320, 60, '#8a6a35', '#a5823f', 3);
        for (let i = 0; i < 60; i++) {
          const hx = (i * 113) % 320, hy = 140 + ((i * 71) % 56);
          p.rect(hx, hy, 3, 1, '#c8a24f');
        }
      },
    },

    // ---------------------------------------------------------------- RAIL --
    // The railway: a blue engine that will not go until the signal adds up.
    rail: {
      id: 'rail', name: 'THE RAILWAY', world: 'rail',
      floor: { x: 12, y: 140, w: 296, h: 46 },
      spawn: { x: 54, y: 164 },
      back: { to: 'hall', x: 16, y: 136, w: 30, h: 46, name: 'BACK' },
      lamp: { x: 266, y: 158 },
      lock: { kind: 'math', prompt: puzzle.prompt, answer: puzzle.answer },
      things: puzzle.choices.map((v, i) => ({
        id: `num-${v}`, word: String(v), value: v, render: 'number',
        x: 94 + i * 62, y: 160, hue: i,
      })),
      paint(p, t) {
        p.rect(0, 0, 320, 108, '#7fd3ff');
        p.dither(0, 66, 320, 42, '#7fd3ff', '#b6e8ff', 3);
        for (const [cx, cy, s] of [[54, 26, 1], [150, 18, 0.8], [246, 30, 1.1]]) {
          for (const [ox, oy, r] of [[0, 0, 15], [-13, 4, 11], [14, 4, 10]]) {
            p.ctx.fillStyle = '#ffffff';
            p.ctx.beginPath(); p.ctx.ellipse(cx + ox * s, cy + oy * s, r * s, r * 0.7 * s, 0, 0, Math.PI * 2); p.ctx.fill();
          }
        }
        // Distant hills
        for (const [cx, r] of [[40, 60], [130, 70], [240, 66], [310, 54]]) {
          p.ctx.fillStyle = '#4f8f4a';
          p.ctx.beginPath(); p.ctx.ellipse(cx, 116, r, 26, 0, 0, Math.PI * 2); p.ctx.fill();
        }
        p.rect(0, 108, 320, 34, '#6aa35f');
        p.dither(0, 116, 320, 26, '#6aa35f', '#7db870', 3);
        // The engine, waiting at the platform.
        const TX = 132, TY = 76;
        p.sprite(SPRITE_REFS.train, TX, TY, { scale: 3 });
        const puff = Math.floor(t / 260) % 3;
        for (let i = 0; i <= puff; i++) {
          p.ctx.fillStyle = 'rgba(255,255,255,0.85)';
          p.ctx.beginPath(); p.ctx.arc(TX + 18 + i * 12, TY - 8 - i * 9, 5 + i * 2, 0, Math.PI * 2); p.ctx.fill();
        }
        // Platform and rails
        p.rect(0, 138, 320, 6, '#9aa2ad');
        p.dither(0, 140, 320, 4, '#9aa2ad', '#7d8a99', 2);
        p.rect(0, 144, 320, 56, '#6b5a45');
        p.dither(0, 150, 320, 50, '#6b5a45', '#7d6a52', 4);
        // Kept above y=174, where the carrying strip begins.
        for (let i = 0; i < 12; i++) p.rect(i * 28, 164, 20, 4, '#4a3a28'); // sleepers
        p.rect(0, 161, 320, 3, '#b9c2cc');
        p.rect(0, 169, 320, 3, '#b9c2cc');
      },
    },
  };
}

// Sprite tables the painters reach for. Filled by the engine at boot so this
// module does not have to know about the sprite sheet's shape.
export const SPRITE_REFS = {};

// ---- the arithmetic --------------------------------------------------------
// Pitched at four operations, decimals and thousands. Distractors sit close to
// the answer so it pays to actually work it out rather than pick the odd one.
export const SUMS = [
  { prompt: '6 x 7',     answer: 42,  near: [24, 48] },
  { prompt: '8 x 8',     answer: 64,  near: [16, 46] },
  { prompt: '9 x 9',     answer: 81,  near: [18, 72] },
  { prompt: '12 x 12',   answer: 144, near: [124, 121] },
  { prompt: '100 + 250', answer: 350, near: [305, 260] },
  { prompt: '1000 - 1',  answer: 999, near: [909, 1001] },
  { prompt: '20 x 5',    answer: 100, near: [25, 105] },
  { prompt: '144 / 12',  answer: 12,  near: [14, 24] },
  { prompt: '0.5 + 0.5', answer: 1,   near: [0.1, 10] },
  { prompt: '3.5 + 1.5', answer: 5,   near: [4.5, 3.55] },
  { prompt: '500 + 500', answer: 1000, near: [100, 550] },
  { prompt: '7 x 8',     answer: 56,  near: [54, 15] },
];

export function pickSum(pick = Math.random) {
  const sum = SUMS[Math.floor(pick() * SUMS.length) % SUMS.length];
  const choices = [sum.answer, ...sum.near];
  // Shuffle deterministically from the same source so tests can pin it.
  for (let i = choices.length - 1; i > 0; i--) {
    const j = Math.floor(pick() * (i + 1)) % (i + 1);
    [choices[i], choices[j]] = [choices[j], choices[i]];
  }
  return { prompt: sum.prompt, answer: sum.answer, choices };
}
