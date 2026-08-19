// =============================================================================
// ENGINE — tap to walk, tap a thing to carry it, carry it to the lamp.
//
// Deliberate constraints, because the player is four:
//   * one verb only — everything is a tap, nothing needs a drag or a hold
//   * a tap anywhere always does something sensible; taps outside the floor
//     walk to the nearest reachable point rather than being ignored
//   * a wrong answer never costs anything. The lamp shakes, says the word it
//     wants, and you keep what you were carrying
//   * no timers, no death, no way to get stuck
//
// Hit targets are collected during draw into `zones`, so what you can tap is by
// construction exactly what you can see.
// =============================================================================

import { Painter, SPRITES, PALETTE } from './pixels.js';
import { buildRooms, drawLamp, SPRITE_REFS, pickSum } from './rooms.js';

export const W = 320, H = 200;
const SPEED = 62;            // logical px per second
const SAVE_KEY = 'castle-state';

const dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// Speak a word aloud. This is the real teaching engine: any word on screen can
// be tapped to hear it, always, with no penalty and no limit.
export function makeSpeaker() {
  const synth = typeof speechSynthesis !== 'undefined' ? speechSynthesis : null;
  let voice = null;
  const pickVoice = () => {
    if (!synth) return;
    const all = synth.getVoices();
    voice = all.find((v) => /en-GB|en-US/.test(v.lang) && /female|samantha|karen|daniel/i.test(v.name))
      || all.find((v) => v.lang?.startsWith('en')) || null;
  };
  if (synth) { pickVoice(); synth.addEventListener?.('voiceschanged', pickVoice); }
  return (text, { rate = 0.85, pitch = 1.05 } = {}) => {
    if (!synth) return false;
    try {
      synth.cancel();
      const u = new SpeechSynthesisUtterance(String(text).toLowerCase());
      u.rate = rate; u.pitch = pitch;
      if (voice) u.voice = voice;
      synth.speak(u);
      return true;
    } catch { return false; }
  };
}

export function freshState() {
  return { lit: { snow: false, garden: false, ark: false, rail: false }, room: 'hall' };
}

export function loadState() {
  try {
    const raw = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null');
    if (raw && raw.lit && typeof raw.lit === 'object') {
      return { ...freshState(), ...raw, lit: { ...freshState().lit, ...raw.lit } };
    }
  } catch { /* corrupt save is the same as no save */ }
  return freshState();
}

export function saveState(state) {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify({ lit: state.lit, room: state.room })); }
  catch { /* private mode — the castle just forgets */ }
}

// Does the carried thing satisfy this lamp? The two lock kinds share one shape
// so the player learns a single rule.
export function solves(lock, carried) {
  if (!lock || !carried) return false;
  if (lock.kind === 'word') return String(carried.word).toUpperCase() === lock.word.toUpperCase();
  if (lock.kind === 'math') return Number(carried.value) === Number(lock.answer);
  return false;
}

export class Castle {
  constructor(canvas, { speak = makeSpeaker(), state = loadState(), sum = pickSum(), log = () => {} } = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.ctx.imageSmoothingEnabled = false;
    this.p = new Painter(this.ctx);
    this.speak = speak;
    this.log = log;
    this.state = state;
    Object.assign(SPRITE_REFS, SPRITES);

    this.rooms = buildRooms(sum);
    this.carried = null;
    this.zones = [];
    this.t = 0;
    this.shake = 0;
    this.cheer = 0;
    this.banner = null;
    this.finale = 0;
    this.enter(this.rooms[this.state.room] ? this.state.room : 'hall', true);
  }

  // ---- rooms ---------------------------------------------------------------

  enter(id, initial = false) {
    const room = this.rooms[id];
    if (!room) return;
    this.room = room;
    this.state.room = id;
    const s = room.spawn;
    this.player = { x: s.x, y: s.y, tx: s.x, ty: s.y, step: 0 };
    this.pending = null;
    this.cheer = 0;
    // Returning things to their room rather than carrying between worlds keeps
    // each puzzle self-contained and solvable from what is in front of you.
    // Everything must go back on its stand too — a thing carried out of a room
    // and left flagged as taken would vanish for good and strand the puzzle.
    this.carried = null;
    for (const r of Object.values(this.rooms)) for (const t of r.things) t.taken = false;
    this.banner = { text: room.name, until: 2200 };
    this.bannerAt = this.t;
    if (!initial) this.log({ type: 'castle-room', room: id });
    if (id === 'hall' && this.allLit() && !this.state.celebrated) {
      this.state.celebrated = true;
      this.finale = 1;
      this.cheer = 2600;
      this.banner = null; // the finale line says it better than the room name
      this.speak('the castle is awake');
      this.log({ type: 'castle-complete' });
      saveState(this.state);
    }
  }

  allLit() {
    return ['snow', 'garden', 'ark', 'rail'].every((w) => this.state.lit[w]);
  }

  // ---- input ---------------------------------------------------------------

  // Screen pixels to the 320x200 world, honouring the CSS scale-up.
  toWorld(clientX, clientY) {
    const r = this.canvas.getBoundingClientRect();
    return {
      x: ((clientX - r.left) / r.width) * W,
      y: ((clientY - r.top) / r.height) * H,
    };
  }

  tap(clientX, clientY) {
    const { x, y } = this.toWorld(clientX, clientY);
    // Zones are in draw order; later ones are drawn on top, so test backwards.
    for (let i = this.zones.length - 1; i >= 0; i--) {
      const z = this.zones[i];
      if (x >= z.x && x <= z.x + z.w && y >= z.y && y <= z.y + z.h) {
        this.activate(z);
        return z;
      }
    }
    this.walkTo(x, y);
    return null;
  }

  // Every tap gets an interpretation. Outside the floor means the nearest spot
  // on the floor, so a small finger landing on a wall still does what it meant.
  walkTo(x, y) {
    const f = this.room.floor;
    this.player.tx = clamp(x, f.x + 6, f.x + f.w - 6);
    this.player.ty = clamp(y, f.y + 4, f.y + f.h - 2);
  }

  activate(z) {
    if (z.kind === 'say') { this.speak(z.word); return; }
    if (z.kind === 'thing') {
      this.walkToward(z.ref.x, z.ref.y);
      this.pending = { kind: 'pickup', ref: z.ref };
      return;
    }
    if (z.kind === 'lamp') {
      this.walkToward(this.room.lamp.x, this.room.lamp.y);
      this.pending = { kind: 'lamp' };
      return;
    }
    if (z.kind === 'door') {
      this.walkToward(z.ref.x, Math.max(z.ref.y, this.room.floor.y + 8));
      this.pending = { kind: 'door', to: z.ref.to };
      return;
    }
  }

  // Stand just in front of a thing rather than on top of it.
  walkToward(x, y) {
    const f = this.room.floor;
    this.player.tx = clamp(x, f.x + 6, f.x + f.w - 6);
    this.player.ty = clamp(Math.max(y + 6, f.y + 6), f.y + 4, f.y + f.h - 2);
  }

  // ---- actions -------------------------------------------------------------

  pickUp(thing) {
    if (this.carried && this.carried.id === thing.id) { this.speak(thing.word); return; }
    // Swap: whatever you were holding goes back where it came from.
    if (this.carried) this.carried.taken = false;
    thing.taken = true;
    this.carried = thing;
    this.speak(thing.word);
    this.log({ type: 'castle-pickup', room: this.room.id, word: thing.word });
  }

  tryLamp() {
    const room = this.room;
    if (!room.lock || this.state.lit[room.world]) return;
    if (!this.carried) {
      this.shake = 320;
      this.speak(room.lock.kind === 'math' ? 'bring me a number' : room.lock.word);
      return;
    }
    if (solves(room.lock, this.carried)) {
      this.state.lit[room.world] = true;
      this.cheer = 1800;
      this.speak(room.lock.kind === 'math'
        ? `yes! ${room.lock.prompt.replace(/x/g, 'times').replace('/', 'divided by')} is ${room.lock.answer}`
        : `${this.carried.word}! well done`);
      this.log({ type: 'castle-solved', room: room.id, answer: this.carried.word });
      saveState(this.state);
    } else {
      // Never a penalty: say the target again so the answer gets easier, not harder.
      this.shake = 420;
      this.speak(room.lock.kind === 'math' ? room.lock.prompt.replace(/x/g, 'times') : room.lock.word);
      this.log({ type: 'castle-miss', room: room.id, tried: this.carried.word });
    }
  }

  // ---- loop ----------------------------------------------------------------

  update(dt) {
    this.t += dt;
    if (this.shake > 0) this.shake -= dt;
    if (this.cheer > 0) this.cheer -= dt;
    const pl = this.player;
    const d = dist(pl.x, pl.y, pl.tx, pl.ty);
    if (d > 1.2) {
      const step = Math.min(d, (SPEED * dt) / 1000);
      pl.x += ((pl.tx - pl.x) / d) * step;
      pl.y += ((pl.ty - pl.y) / d) * step;
      pl.step += dt;
      pl.facing = pl.tx < pl.x ? -1 : 1;
    } else {
      pl.x = pl.tx; pl.y = pl.ty;
      if (this.pending) {
        const job = this.pending;
        this.pending = null;
        if (job.kind === 'pickup') this.pickUp(job.ref);
        else if (job.kind === 'lamp') this.tryLamp();
        else if (job.kind === 'door') this.enter(job.to);
      }
    }
  }

  // Depth: things lower on the screen are nearer, so they draw bigger and later.
  depthScale(y) {
    const f = this.room.floor;
    const k = clamp((y - f.y) / f.h, 0, 1);
    return 1.7 + k * 0.7;
  }

  draw() {
    const p = this.p, room = this.room;
    this.zones = [];
    this.ctx.save();
    if (this.shake > 0) this.ctx.translate(Math.round(Math.sin(this.t / 26) * 2), 0);

    room.paint(p, this.t, this.state);

    // Everything that stands on the floor, sorted back to front.
    const actors = [];
    for (const thing of room.things) if (!thing.taken) actors.push({ kind: 'thing', ref: thing });
    if (room.lamp) actors.push({ kind: 'lamp', y: room.lamp.y });
    actors.push({ kind: 'player', y: this.player.y });
    actors.sort((a, b) => (a.ref?.y ?? a.y) - (b.ref?.y ?? b.y));

    for (const a of actors) {
      if (a.kind === 'player') this.drawPlayer(p);
      else if (a.kind === 'lamp') this.drawLampAndPlaque(p);
      else this.drawThing(p, a.ref);
    }

    this.drawDoors(p);
    this.drawCarried(p);
    this.drawBanner(p);
    if (this.cheer > 0) this.drawCheer(p);
    if (this.finale && this.allLit() && room.id === 'hall') this.drawFinale(p);
    this.ctx.restore();
  }

  shadow(p, x, y, w) {
    p.ctx.globalAlpha = 0.22;
    p.ctx.fillStyle = '#000000';
    p.ctx.beginPath();
    p.ctx.ellipse(x, y, w, w * 0.3, 0, 0, Math.PI * 2);
    p.ctx.fill();
    p.ctx.globalAlpha = 1;
  }

  drawPlayer(p) {
    const pl = this.player;
    const s = Math.round(this.depthScale(pl.y));
    const moving = dist(pl.x, pl.y, pl.tx, pl.ty) > 1.2;
    const rows = moving && Math.floor(pl.step / 130) % 2 ? SPRITES.kidWalk : SPRITES.kid;
    const w = rows[0].length * s, h = rows.length * s;
    this.shadow(p, pl.x, pl.y, w * 0.42);
    p.sprite(rows, pl.x - w / 2, pl.y - h, { scale: s, flip: pl.facing === -1 });
  }

  // Tapping the picture takes the thing; tapping the word underneath says it.
  // The word zone is pushed last so it wins where the two overlap.
  drawThing(p, thing) {
    if (thing.render === 'crate') {
      this.zones.push({ ...this.drawCrate(p, thing), kind: 'thing', ref: thing });
      return;
    }
    if (thing.render === 'number') {
      this.zones.push({ ...this.drawNumber(p, thing), kind: 'thing', ref: thing });
      return;
    }
    const s = Math.round(this.depthScale(thing.y) * (thing.scale ? thing.scale / 2 : 1));
    const rows = SPRITES[thing.sprite];
    const w = rows[0].length * s, h = rows.length * s;
    this.shadow(p, thing.x, thing.y, w * 0.4);
    p.sprite(rows, thing.x - w / 2, thing.y - h, { scale: s });
    this.zones.push({ x: thing.x - w / 2, y: thing.y - h, w, h, kind: 'thing', ref: thing });
    const plaque = p.label(thing.word, thing.x, thing.y + 5, {
      scale: 1, color: '#fff8dc', bg: 'rgba(12,14,20,0.78)', border: '#8a7a52',
    });
    this.zones.push({ ...plaque, kind: 'say', word: thing.word });
  }

  // A crate with the name stencilled on it — the word is the only clue.
  drawCrate(p, thing) {
    const w = 40, h = 30, x = thing.x - w / 2, y = thing.y - h;
    this.shadow(p, thing.x, thing.y, 20);
    p.rect(x, y, w, h, '#8a5a2c');
    p.dither(x + 2, y + 2, w - 4, h - 4, '#8a5a2c', '#9c6a36', 2);
    p.strokeRect(x, y, w, h, '#5c3a1e');
    p.rect(x, y + 9, w, 2, '#5c3a1e');
    p.rect(x, y + h - 11, w, 2, '#5c3a1e');
    p.text(thing.word, thing.x - p.textWidth(thing.word, 1) / 2, y + 13, { scale: 1, color: '#3a2410' });
    return { x, y, w, h };
  }

  // A Numberblock: a stack he already knows how to read.
  drawNumber(p, thing) {
    const hues = ['#d43d2f', '#3a6ea5', '#4a9e3f', '#8a4fbd'];
    const face = hues[thing.hue % hues.length];
    const label = String(thing.word);
    const w = Math.max(30, p.textWidth(label, 2) + 12), h = 34;
    const x = thing.x - w / 2, y = thing.y - h;
    this.shadow(p, thing.x, thing.y, w * 0.4);
    p.rect(x, y, w, h, face);
    p.ctx.globalAlpha = 0.18; p.rect(x + 2, y + 2, w - 4, 8, '#ffffff'); p.ctx.globalAlpha = 1;
    p.strokeRect(x, y, w, h, '#1a1d24');
    // Eyes, so it reads as a character rather than a sign.
    p.rect(x + w / 2 - 8, y + 5, 5, 5, '#ffffff');
    p.rect(x + w / 2 + 3, y + 5, 5, 5, '#ffffff');
    p.rect(x + w / 2 - 7, y + 7, 3, 3, '#000000');
    p.rect(x + w / 2 + 4, y + 7, 3, 3, '#000000');
    p.text(label, thing.x - p.textWidth(label, 2) / 2, y + 16, { scale: 2, color: '#ffffff', shadow: '#00000066' });
    return { x, y, w, h };
  }

  drawLampAndPlaque(p) {
    const room = this.room;
    const lit = this.state.lit[room.world];
    drawLamp(p, room.lamp, lit, this.t);
    const { x, y } = room.lamp;
    this.zones.push({ x: x - 14, y: y - 44, w: 29, h: 46, kind: 'lamp' });
    if (lit || !room.lock) return;

    // The plaque above the lamp: what it is asking for.
    const lock = room.lock;
    const shakeX = this.shake > 0 ? Math.round(Math.sin(this.t / 22) * 3) : 0;
    const py = y - 72;
    // A post down to the bowl: the sign belongs to this brazier.
    p.rect(x - 1 + shakeX, py + 24, 3, y - 30 - (py + 24), '#3a3f4a');
    if (lock.kind === 'math') {
      const w = p.textWidth(lock.prompt, 2) + 18;
      const cx = clamp(x, 3 + w / 2, W - 3 - w / 2);
      p.rect(cx - w / 2 + shakeX, py, w, 26, 'rgba(10,12,18,0.86)');
      p.strokeRect(cx - w / 2 + shakeX, py, w, 26, '#c8a24f');
      p.text(lock.prompt, cx - p.textWidth(lock.prompt, 2) / 2 + shakeX, py + 9, { scale: 2, color: '#ffe9a8' });
      this.zones.push({ x: cx - w / 2, y: py, w, h: 26, kind: 'say', word: lock.prompt.replace(/x/g, 'times') });
    } else {
      const showPic = lock.showPicture && SPRITES[lock.word.toLowerCase()];
      const tw = p.textWidth(lock.word, 2);
      const w = tw + 18 + (showPic ? 24 : 0);
      const cx = clamp(x, 3 + w / 2, W - 3 - w / 2);
      p.rect(cx - w / 2 + shakeX, py - (showPic ? 6 : 0), w, showPic ? 32 : 26, 'rgba(10,12,18,0.86)');
      p.strokeRect(cx - w / 2 + shakeX, py - (showPic ? 6 : 0), w, showPic ? 32 : 26, '#c8a24f');
      if (showPic) {
        p.sprite(SPRITES[lock.word.toLowerCase()], cx - w / 2 + 5 + shakeX, py - 4, { scale: 1 });
      }
      p.text(lock.word, cx - w / 2 + (showPic ? 28 : 9) + shakeX, py + 4, { scale: 2, color: '#ffe9a8' });
      this.zones.push({ x: cx - w / 2, y: py - 8, w, h: 34, kind: 'say', word: lock.word });
    }
  }

  drawDoors(p) {
    const room = this.room;
    if (room.doors) {
      for (const d of room.doors) {
        this.zones.push({ x: d.x - 18, y: 66, w: 37, h: 72, kind: 'door', ref: { ...d, y: room.floor.y + 10 } });
      }
      return;
    }
    if (!room.back) return;
    // A way home, always in the same corner, always available.
    const b = room.back;
    p.rect(b.x - 4, b.y - 26, 40, 30, 'rgba(10,12,18,0.8)');
    p.strokeRect(b.x - 4, b.y - 26, 40, 30, '#c8a24f');
    p.text('BACK', b.x + 3, b.y - 18, { scale: 1, color: '#ffe9a8' });
    this.zones.push({ x: b.x - 4, y: b.y - 26, w: 40, h: 34, kind: 'door', ref: { to: b.to, x: b.x + 14, y: room.floor.y + 8 } });
  }

  drawCarried(p) {
    p.rect(0, H - 26, W, 26, 'rgba(8,10,14,0.86)');
    p.rect(0, H - 26, W, 1, '#3a4152');
    if (!this.carried) {
      const hint = this.room.things.length ? 'TAP A THING TO PICK IT UP' : 'TAP A DOORWAY TO GO IN';
      p.text(hint, (W - p.textWidth(hint, 1)) / 2, H - 17, { scale: 1, color: '#6d7484' });
      return;
    }
    const c = this.carried;
    p.text('CARRYING', 6, H - 21, { scale: 1, color: '#6d7484' });
    let x = 66;
    if (c.render === 'number') {
      const lw = p.textWidth(c.word, 2) + 10;
      p.rect(x, H - 23, lw, 20, '#3a6ea5');
      p.strokeRect(x, H - 23, lw, 20, '#1a1d24');
      p.text(c.word, x + 5, H - 18, { scale: 2, color: '#ffffff' });
      x += lw + 8;
    } else {
      if (SPRITES[c.sprite]) { p.sprite(SPRITES[c.sprite], x, H - 24, { scale: 1 }); x += 26; }
      p.text(c.word, x, H - 18, { scale: 2, color: '#fff8dc' });
      x += p.textWidth(c.word, 2) + 10;
    }
    // The whole strip speaks, so the word he is holding is always one tap away.
    p.text('HEAR IT', W - 46, H - 21, { scale: 1, color: '#c8a24f' });
    this.zones.push({ x: 0, y: H - 26, w: W, h: 26, kind: 'say', word: c.word });
  }

  drawBanner(p) {
    if (!this.banner) return;
    const age = this.t - this.bannerAt;
    if (age > this.banner.until) { this.banner = null; return; }
    const fade = age > this.banner.until - 500 ? (this.banner.until - age) / 500 : 1;
    const text = this.banner.text;
    const w = p.textWidth(text, 2);
    p.ctx.globalAlpha = clamp(fade, 0, 1);
    p.rect((W - w) / 2 - 8, 6, w + 16, 22, 'rgba(8,10,14,0.8)');
    p.text(text, (W - w) / 2, 12, { scale: 2, color: '#ffe9a8' });
    p.ctx.globalAlpha = 1;
  }

  drawCheer(p) {
    // Sparks going up, the cheapest possible celebration that still reads.
    const n = 26;
    for (let i = 0; i < n; i++) {
      const life = ((this.t / 3 + i * 60) % 200) / 200;
      const x = (i * 53 + 20) % W;
      const y = H - 30 - life * 150;
      const c = ['#ffc21e', '#ff8a2b', '#ffffff', '#7fd3ff'][i % 4];
      p.rect(x, y, 2, 2, c);
    }
  }

  drawFinale(p) {
    const rows = SPRITES.lion;
    const s = 2;
    const bob = Math.sin(this.t / 400) * 2;
    // Stood on the floor, off to one side, clear of the doorways.
    this.shadow(p, 258, 178, 16);
    p.sprite(rows, 258 - (rows[0].length * s) / 2, 178 - rows.length * s + bob, { scale: s });
    const text = 'THE CASTLE IS AWAKE';
    const w = p.textWidth(text, 2);
    p.rect((W - w) / 2 - 8, 30, w + 16, 22, 'rgba(8,10,14,0.8)');
    p.text(text, (W - w) / 2, 36, { scale: 2, color: '#ffe9a8' });
  }
}
