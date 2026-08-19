// =============================================================================
// ROOMS — the castle hall and four worlds, plus the puzzles each one holds.
//
// Every world holds TWO braziers, each asking for one thing. Light both and that
// world is done, which lights its lamp over the doorway back in the hall. All
// four worlds done and the hall becomes a banquet with the player's name on the
// banner. Dishes arrive on the table one world at a time, so the reward is
// visible long before the end.
//
// One verb throughout: pick a thing up, carry it to a brazier. Word braziers
// want a matching word, number braziers want a matching value.
//
// The reading ramp lives in how a puzzle is DISPLAYED, not in new rules:
//   snow    signs show picture + word, things show picture + word  (match the picture)
//   garden  signs show the word only,  things show picture + word  (match the word)
//   ark     signs show the word only,  things are stencilled crates (word alone)
//   rail    one sign is a sum,         things are numbered blocks   (arithmetic)
//
// Props are scenery you can tap to hear its name. They teach nothing new and
// gate nothing — they are there so the room rewards poking at it, and so words
// he is not being tested on still go past his eyes and ears.
// =============================================================================

// Shared stage layout. Braziers stand at the back with their signs above them;
// the things you carry sit in a front row with labels underneath, clear of the
// carrying strip at y=174. Nothing overlaps horizontally by construction.
const FLOOR = { x: 12, y: 126, w: 296, h: 46 };
const LAMP_X = [78, 230], LAMP_Y = 138;
const SLOT_X = [40, 116, 192, 268], SLOT_Y = 158;
const SPAWN = { x: 160, y: 168 };
const BACK = { to: 'hall', x: 16, y: 122, w: 30, h: 44, name: 'BACK' };

// ---- scenery helpers -------------------------------------------------------

function stoneWall(p, x, y, w, h, dark = false) {
  p.dither(x, y, w, h, dark ? '#4a4f5c' : '#6d7484', dark ? '#3d4250' : '#5c6373', 2);
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

// ---- brazier ---------------------------------------------------------------

export function drawLamp(p, lamp, lit, t) {
  const { x, y } = lamp;
  if (lit) glow(p, x, y - 20, 40, '#ffcf6b');
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

// ---- the hall's banquet ----------------------------------------------------

const DISHES = { snow: 'cake', garden: 'apple', ark: 'pie', rail: 'fish' };
const DISH_X = { snow: 84, garden: 128, ark: 172, rail: 216 };

function nameBanner(p, name, t) {
  const text = (name || 'WELCOME').toUpperCase().slice(0, 12);
  const tw = p.textWidth(text, 2);
  const w = Math.max(tw + 26, 70), x = 160 - w / 2;
  p.rect(x - 5, 10, w + 10, 3, '#5c3a1e');
  p.rect(x, 13, w, 30, '#8f1f16');
  p.rect(x + 3, 16, w - 6, 24, '#a82a1e');
  // A notched tail along the bottom edge.
  for (let i = 0; i < w / 2; i++) {
    const d = Math.abs(i - (w / 2 - 1) / 2) / ((w / 2) / 2);
    p.rect(x + i * 2, 43, 2, Math.max(0, Math.round(7 * (1 - d))), '#8f1f16');
  }
  p.text(text, 160 - tw / 2, 21, { scale: 2, color: '#ffe9a8', shadow: '#5e130d' });
  for (const cx of [x - 12, x + w + 9]) {
    p.rect(cx - 1, 26, 3, 16, '#e8e0cf');
    const f = Math.sin((t + cx * 40) / 150) * 1.2;
    glow(p, cx, 24, 12, '#ffcf6b');
    p.rect(cx - 1, 21 - f, 3, 5, '#ffc21e');
  }
}

// Index just past the last row with any pixels in it, so a dish can be stood on
// a surface rather than floated by its blank bottom rows.
function solidBottom(rows) {
  for (let i = rows.length - 1; i >= 0; i--) if (/[^.]/.test(rows[i])) return i + 1;
  return rows.length;
}

// The table turns up with the first dish, so the reward is visible early.
function feastTable(p, done, sprites) {
  if (!done.length) return;
  p.rect(52, 148, 216, 7, '#7a4f2a');
  p.rect(52, 148, 216, 2, '#9c6a36');
  p.rect(58, 155, 6, 13, '#5c3a1e');
  p.rect(256, 155, 6, 13, '#5c3a1e');
  p.rect(56, 155, 208, 4, '#e8e0cf');
  p.rect(56, 158, 208, 2, '#cfc6b4');
  for (const world of done) {
    const rows = sprites[DISHES[world]];
    if (!rows) continue;
    p.sprite(rows, DISH_X[world] - rows[0].length, 149 - solidBottom(rows) * 2, { scale: 2 });
  }
}

// ---- the rooms -------------------------------------------------------------

const HALL_DOORS = [
  { to: 'snow',   x: 52,  world: 'snow',   tint: '#cfe4ff', name: 'SNOW' },
  { to: 'garden', x: 120, world: 'garden', tint: '#8ede7a', name: 'GARDEN' },
  { to: 'ark',    x: 190, world: 'ark',    tint: '#c98f4e', name: 'ARK' },
  { to: 'rail',   x: 258, world: 'rail',   tint: '#7fd3ff', name: 'RAILWAY' },
];

export const WORLDS = HALL_DOORS.map((d) => d.world);

export function buildRooms(puzzle, who = '') {
  return {
    // ---------------------------------------------------------------- HALL --
    hall: {
      id: 'hall',
      name: 'THE CASTLE',
      who,
      // Walkable only in front of the table, so he never stands inside it.
      floor: { x: 16, y: 164, w: 288, h: 22 },
      spawn: { x: 160, y: 178 },
      things: [],
      lamps: [],
      // Each doorway's name, readable and speakable, inside the arch.
      props: HALL_DOORS.map((d) => ({ word: d.name, x: d.x, y: 100, plaque: true })),
      doors: HALL_DOORS.map((d) => ({
        id: `door-${d.to}`, to: d.to, x: d.x, y: 168,
        tint: d.tint, name: d.name, world: d.world,
      })),
      paint(p, t, ctx) {
        const done = WORLDS.filter((w) => ctx.worldDone(w));
        const allDone = done.length === WORLDS.length;
        p.clear(allDone ? '#2c3242' : '#171a21');
        stoneWall(p, 0, 0, 320, 140, !allDone);
        for (const d of this.doors) {
          const lit = ctx.worldDone(d.world);
          p.ctx.fillStyle = '#20242c';
          p.ctx.beginPath(); p.ctx.arc(d.x, 80, 21, Math.PI, Math.PI * 2); p.ctx.fill();
          p.rect(d.x - 21, 78, 43, 60, '#20242c');
          p.ctx.fillStyle = lit ? d.tint : '#0d0f14';
          p.ctx.beginPath(); p.ctx.arc(d.x, 80, 17, Math.PI, Math.PI * 2); p.ctx.fill();
          p.rect(d.x - 17, 80, 34, 58, lit ? d.tint : '#0d0f14');
          if (lit) {
            const grad = p.ctx.createLinearGradient(0, 62, 0, 138);
            grad.addColorStop(0, 'rgba(255,255,255,0.35)');
            grad.addColorStop(1, 'rgba(0,0,0,0.35)');
            p.ctx.fillStyle = grad;
            p.ctx.fillRect(d.x - 17, 62, 34, 76);
          }
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
          // How far into this world he has got: one pip per brazier.
          const lamps = ctx.lampStates(d.world);
          if (lamps.length && !lit) {
            const pw = lamps.length * 6 - 2;
            lamps.forEach((on, i) => {
              p.rect(d.x - pw / 2 + i * 6, 112, 4, 4, on ? '#ffc21e' : '#3a4152');
            });
          }
        }
        checkerFloor(p, { x: 0, y: 138, w: 320, h: 62 },
          allDone ? '#6a5140' : '#3a3f4a', allDone ? '#5c4634' : '#33373f');
        feastTable(p, done, ctx.sprites);
        if (allDone) {
          nameBanner(p, this.who, t);
          // The friends he met, come to the feast.
          p.sprite(ctx.sprites.bear, 14, 149 - solidBottom(ctx.sprites.bear) * 2, { scale: 2 });
          p.sprite(ctx.sprites.lion, 272, 149 - solidBottom(ctx.sprites.lion) * 2, { scale: 2 });
          p.sprite(ctx.sprites.dove, 34, 58, { scale: 1 });
        }
      },
    },

    // ---------------------------------------------------------------- SNOW --
    // Narnia, evoked not copied: a lamp post in a snowy wood.
    snow: {
      id: 'snow', name: 'THE SNOWY WOOD', world: 'snow',
      floor: FLOOR, spawn: SPAWN, back: BACK,
      lamps: [
        { x: LAMP_X[0], y: LAMP_Y, lock: { kind: 'word', word: 'BEAR', showPicture: true } },
        { x: LAMP_X[1], y: LAMP_Y, lock: { kind: 'word', word: 'MOON', showPicture: true } },
      ],
      things: [
        { id: 'bear', sprite: 'bear', word: 'BEAR', x: SLOT_X[0], y: SLOT_Y },
        { id: 'cake', sprite: 'cake', word: 'CAKE', x: SLOT_X[1], y: SLOT_Y },
        { id: 'moon', sprite: 'moon', word: 'MOON', x: SLOT_X[2], y: SLOT_Y },
        { id: 'fish', sprite: 'fish', word: 'FISH', x: SLOT_X[3], y: SLOT_Y },
      ],
      props: [
        { word: 'STAR', x: 56,  y: 30,  w: 26, h: 22 },
        { word: 'LAMP', x: 286, y: 84,  w: 24, h: 30 },
        { word: 'TREE', x: 312, y: 106, w: 24, h: 32 },
      ],
      paint(p, t) {
        const bands = ['#0b1026', '#121a38', '#1b2749', '#26365c', '#33456e'];
        bands.forEach((c, i) => p.rect(0, i * 14, 320, 15, c));
        p.rect(0, 70, 320, 22, '#3c5079');
        for (let i = 0; i < 46; i++) {
          p.rect((i * 71) % 320, (i * 37) % 66, 1, 1,
            (i + Math.floor(t / 600)) % 4 === 0 ? '#ffffff' : '#9fb2c9');
        }
        for (let i = 0; i < 11; i++) firTree(p, 14 + i * 30, 96 + (i % 3), 26 + (i % 4) * 5, '#16321c');
        p.rect(0, 92, 320, 12, '#dfe9f5');
        p.rect(0, 100, 320, 10, '#e6eef8');
        p.rect(0, 108, 320, 92, '#eef4fb');
        firTree(p, 312, 138, 42, '#1c3d22');
        lampPost(p, 286, 128, t);
        // Falling snow: independent columns, so it does not streak diagonally.
        for (let i = 0; i < 40; i++) {
          p.rect((i * 97 + (i % 7) * 13) % 320,
            (i * 53 + Math.floor(t / (28 + (i % 5) * 9))) % 200, 1, 1, '#ffffff');
        }
      },
    },

    // -------------------------------------------------------------- GARDEN --
    garden: {
      id: 'garden', name: 'THE GARDEN', world: 'garden',
      floor: FLOOR, spawn: SPAWN, back: BACK,
      lamps: [
        { x: LAMP_X[0], y: LAMP_Y, lock: { kind: 'word', word: 'APPLE', showPicture: false } },
        { x: LAMP_X[1], y: LAMP_Y, lock: { kind: 'word', word: 'FLOWER', showPicture: false } },
      ],
      things: [
        { id: 'flower', sprite: 'flower', word: 'FLOWER', x: SLOT_X[0], y: SLOT_Y },
        { id: 'fish',   sprite: 'fish',   word: 'FISH',   x: SLOT_X[1], y: SLOT_Y },
        { id: 'apple',  sprite: 'apple',  word: 'APPLE',  x: SLOT_X[2], y: SLOT_Y },
        { id: 'boat',   sprite: 'boat',   word: 'BOAT',   x: SLOT_X[3], y: SLOT_Y },
      ],
      props: [
        { word: 'SUN',  x: 42,  y: 26, w: 28, h: 26 },
        { word: 'TREE', x: 218, y: 54, w: 56, h: 54 },
        { word: 'POND', x: 60,  y: 118, w: 52, h: 16 },
      ],
      paint(p, t) {
        p.rect(0, 0, 320, 96, '#8fd0f0');
        p.rect(0, 62, 320, 34, '#a2daf4');
        glow(p, 42, 26, 26, '#fff3b0');
        p.rect(36, 20, 13, 13, '#ffe9a8');
        p.rect(38, 18, 9, 17, '#ffe9a8');
        p.rect(0, 84, 320, 14, '#3f8a37');
        p.rect(0, 96, 320, 104, '#4a9e3f');
        p.rect(0, 118, 320, 82, '#54ac48');
        p.rect(214, 58, 10, 64, '#5c3a1e');
        p.rect(216, 58, 3, 64, '#7a4f2a');
        for (const [cx, cy, r] of [[204, 52, 20], [232, 50, 19], [218, 38, 21], [206, 34, 14], [234, 36, 14]]) {
          p.ctx.fillStyle = '#2f7a2c';
          p.ctx.beginPath(); p.ctx.ellipse(cx, cy, r, r * 0.8, 0, 0, Math.PI * 2); p.ctx.fill();
        }
        for (const [cx, cy] of [[200, 46], [228, 42], [214, 30], [236, 52], [208, 58]]) {
          p.rect(cx, cy, 3, 3, '#d43d2f');
        }
        p.ctx.fillStyle = '#3a6ea5';
        p.ctx.beginPath(); p.ctx.ellipse(60, 124, 34, 11, 0, 0, Math.PI * 2); p.ctx.fill();
        p.ctx.fillStyle = '#4f88c4';
        p.ctx.beginPath(); p.ctx.ellipse(60, 122, 28, 8, 0, 0, Math.PI * 2); p.ctx.fill();
        for (let i = 0; i < 3; i++) {
          const w = 8 + ((Math.floor(t / 220) + i) % 4) * 4;
          p.rect(60 - w / 2, 119 + i * 3, w, 1, '#8fd0f0');
        }
      },
    },

    // ----------------------------------------------------------------- ARK --
    ark: {
      id: 'ark', name: 'THE ARK', world: 'ark',
      floor: FLOOR, spawn: SPAWN, back: BACK,
      lamps: [
        { x: LAMP_X[0], y: LAMP_Y, lock: { kind: 'word', word: 'LION', showPicture: false } },
        { x: LAMP_X[1], y: LAMP_Y, lock: { kind: 'word', word: 'DOVE', showPicture: false } },
      ],
      // No pictures at all: the word on the crate is the only clue.
      things: [
        { id: 'c-bear', word: 'BEAR', x: SLOT_X[0], y: SLOT_Y, render: 'crate' },
        { id: 'c-lion', word: 'LION', x: SLOT_X[1], y: SLOT_Y, render: 'crate' },
        { id: 'c-dove', word: 'DOVE', x: SLOT_X[2], y: SLOT_Y, render: 'crate' },
        { id: 'c-fish', word: 'FISH', x: SLOT_X[3], y: SLOT_Y, render: 'crate' },
      ],
      props: [
        { word: 'RAIN', x: 90,  y: 52, w: 40, h: 40 },
        { word: 'DOVE', x: 220, y: 28, w: 24, h: 20 },
        { word: 'HAY',  x: 160, y: 132, w: 44, h: 14 },
      ],
      paint(p, t, ctx) {
        p.clear('#3a2717');
        for (let j = 0; j < 126; j += 10) {
          p.rect(0, j, 320, 9, j % 20 === 0 ? '#5c3a1e' : '#4d301a');
          p.rect(0, j + 9, 320, 1, '#2b1a0e');
          for (let i = (j % 20) ? 24 : 60; i < 320; i += 72) p.rect(i, j, 1, 9, '#33200f');
        }
        for (const x of [46, 150, 288]) { p.rect(x, 0, 6, 126, '#3f2713'); p.rect(x + 1, 0, 2, 126, '#59371c'); }
        p.ctx.fillStyle = '#20242c';
        p.ctx.beginPath(); p.ctx.arc(90, 52, 25, 0, Math.PI * 2); p.ctx.fill();
        p.ctx.fillStyle = '#46536b';
        p.ctx.beginPath(); p.ctx.arc(90, 52, 21, 0, Math.PI * 2); p.ctx.fill();
        p.ctx.save();
        p.ctx.beginPath(); p.ctx.arc(90, 52, 21, 0, Math.PI * 2); p.ctx.clip();
        for (let i = 0; i < 26; i++) {
          p.rect(70 + ((i * 29) % 42), 32 + ((i * 17 + Math.floor(t / 25)) % 42), 1, 4, '#9fb2c9');
        }
        p.ctx.restore();
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * Math.PI * 2;
          p.rect(90 + Math.cos(a) * 24 - 1, 52 + Math.sin(a) * 24 - 1, 3, 3, '#7a4f2a');
        }
        p.rect(180, 34, 120, 5, '#3f2713');
        p.sprite(ctx.sprites.dove, 214, 22, { scale: 1 });
        p.rect(0, 126, 320, 74, '#8a6a35');
        p.rect(0, 132, 320, 68, '#96743a');
        for (let i = 0; i < 70; i++) {
          p.rect((i * 113) % 320, 130 + ((i * 71) % 66), 3, 1, '#c8a24f');
        }
      },
    },

    // ---------------------------------------------------------------- RAIL --
    rail: {
      id: 'rail', name: 'THE RAILWAY', world: 'rail',
      floor: FLOOR, spawn: SPAWN, back: BACK,
      lamps: [
        { x: LAMP_X[0], y: LAMP_Y, lock: { kind: 'math', prompt: puzzle.prompt, answer: puzzle.answer } },
        { x: LAMP_X[1], y: LAMP_Y, lock: { kind: 'word', word: 'TRAIN', showPicture: false } },
      ],
      things: [
        ...puzzle.choices.map((v, i) => ({
          id: `num-${v}`, word: String(v), value: v, render: 'number',
          x: SLOT_X[i], y: SLOT_Y, hue: i,
        })),
        { id: 'train', sprite: 'train', word: 'TRAIN', x: SLOT_X[3], y: SLOT_Y },
      ],
      props: [
        { word: 'SKY',   x: 160, y: 14,  w: 50, h: 22 },
        { word: 'CLOUD', x: 54,  y: 26,  w: 48, h: 26 },
        { word: 'HILL',  x: 240, y: 100, w: 62, h: 22 },
      ],
      paint(p, t, ctx) {
        p.rect(0, 0, 320, 100, '#7fd3ff');
        p.rect(0, 66, 320, 34, '#9adfff');
        for (const [cx, cy, s] of [[54, 26, 1], [150, 18, 0.8], [246, 30, 1.1]]) {
          for (const [ox, oy, r] of [[0, 0, 15], [-13, 4, 11], [14, 4, 10]]) {
            p.ctx.fillStyle = '#ffffff';
            p.ctx.beginPath(); p.ctx.ellipse(cx + ox * s, cy + oy * s, r * s, r * 0.7 * s, 0, 0, Math.PI * 2); p.ctx.fill();
          }
        }
        for (const [cx, r] of [[40, 60], [130, 70], [240, 66], [310, 54]]) {
          p.ctx.fillStyle = '#4f8f4a';
          p.ctx.beginPath(); p.ctx.ellipse(cx, 108, r, 26, 0, 0, Math.PI * 2); p.ctx.fill();
        }
        p.rect(0, 100, 320, 26, '#6aa35f');
        p.rect(0, 112, 320, 14, '#75b069');
        const TX = 128, TY = 60;
        p.sprite(ctx.sprites.train, TX, TY, { scale: 3 });
        const puff = Math.floor(t / 260) % 3;
        for (let i = 0; i <= puff; i++) {
          p.ctx.fillStyle = 'rgba(255,255,255,0.85)';
          p.ctx.beginPath(); p.ctx.arc(TX + 18 + i * 12, TY - 8 - i * 9, 5 + i * 2, 0, Math.PI * 2); p.ctx.fill();
        }
        p.rect(0, 124, 320, 5, '#9aa2ad');
        p.rect(0, 129, 320, 71, '#6b5a45');
        p.rect(0, 138, 320, 62, '#75634c');
        // Track, kept above the carrying strip.
        for (let i = 0; i < 12; i++) p.rect(i * 28, 152, 20, 4, '#4a3a28');
        p.rect(0, 149, 320, 3, '#b9c2cc');
        p.rect(0, 157, 320, 3, '#b9c2cc');
      },
    },
  };
}

// ---- the arithmetic --------------------------------------------------------
// Pitched at four operations, decimals and thousands. Distractors sit close to
// the answer so it pays to work it out rather than pick the odd one.
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
  for (let i = choices.length - 1; i > 0; i--) {
    const j = Math.floor(pick() * (i + 1)) % (i + 1);
    [choices[i], choices[j]] = [choices[j], choices[i]];
  }
  return { prompt: sum.prompt, answer: sum.answer, choices };
}
