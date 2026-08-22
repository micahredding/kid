// Everything you see. Given a Game, paint it.
//
// Every block is one of Asher's drawings on a ball, with its number stamped on
// top. The ball carries the size and the number carries the arithmetic; the
// drawing is his pixels, unsmoothed and unrecoloured.
//
// The number has to be on the ball. His drawings encode each digit as the
// Numberblocks colour of that digit — Sixteen is a purple Six under a red One,
// Thirty-Two is an orange Two inside a yellow Three — which is a real system,
// and completely unreadable unless you already know it. So the colours say
// which block this is at a glance, and the numeral says what it is worth.

import { LAYOUT, W, H, radiusFor, valueOf } from './config.js';

const MONO = '"SF Mono", Menlo, Consolas, monospace';

const rgb = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const mix = (hex, amount, towards = [255, 255, 255]) => {
  const c = rgb(hex);
  return `rgb(${c.map((v, i) => Math.round(v + (towards[i] - v) * amount)).join(',')})`;
};
// Perceived brightness, 0..1. Two of his colours — the yellow of Thirty-Two and
// the pink of Eight — are pale enough that a white numeral on them reads weakly
// even outlined, so the numeral flips to dark ink over those. His red, green,
// blue and purple all want white. Orange sits at 0.68 and is fine white.
const light = (hex) => {
  const [r, g, b] = rgb(hex);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.72;
};

export class Renderer {
  constructor(ctx, blocks, images) {
    this.ctx = ctx;
    this.blocks = blocks;
    this.images = images;      // tier -> HTMLImageElement
    this.particles = [];
    this.flashes = [];         // floating score numbers
    this.banner = null;        // { text, sub, until }
    this.shake = 0;
    this.t = 0;
    this.numeralFit = new Map();   // "tier:radius" -> font size, measured once
    // Two kinds of drawing, two ways to show them — plus Zero, which is
    // neither:
    //
    //   one colour  — the block IS the number, so it fills the circle edge to
    //                 edge and gets cropped round. A red square is One and
    //                 loses nothing.
    //   more than one — the arrangement is the number (Sixteen's One on top of
    //                 its Six), so it is kept whole and sits on a pale disc of
    //                 its own colour, and it only ever wobbles rather than
    //                 tumbling upside down.
    //   blank       — Zero. He drew an empty page for it, which is the right
    //                 picture, so it gets an empty ball with a dashed edge.
    this.tint = blocks.map((b) => {
      const blank = !!b.blank;
      const solid = !blank && (b.palette?.length ?? 1) === 1;
      return {
        blank,
        solid: solid || blank,
        // A solid block covers its ball, so that ball is only a backdrop. A
        // composed picture sits on a pale wash of its own colour: enough to say
        // "this is the purple one" at a glance, pale enough that the other
        // digits still read.
        ball: blank ? 'rgb(252,252,252)' : solid ? mix(b.color, 0.10) : mix(b.color, 0.76),
        ballDeep: blank ? 'rgb(232,232,236)' : solid ? mix(b.color, 0.0, [0, 0, 0]) : mix(b.color, 0.56),
        ring: blank ? 'rgb(168,168,176)' : mix(b.color, 0.30, [0, 0, 0]),
        dashed: blank,
        // Numerals go on outlined, so they read whatever they land on. White
        // ink on his darker paints, dark ink on the pale ones — and Zero's ball
        // is blank white, so it takes dark ink too.
        ink: blank || light(b.color) ? '#2e1c0c' : '#ffffff',
        inkEdge: blank || light(b.color) ? 'rgba(255,255,255,0.92)' : 'rgba(46,24,10,0.92)',
      };
    });
  }

  // --- juice ---------------------------------------------------------------

  burst(x, y, tier, count = 14) {
    const color = this.blocks[tier]?.color ?? '#ff5577';
    for (let i = 0; i < count; i++) {
      const a = (Math.PI * 2 * i) / count + Math.random() * 0.4;
      const speed = 120 + Math.random() * 260;
      this.particles.push({
        x, y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed - 90,
        life: 0.5 + Math.random() * 0.4, age: 0,
        size: 3 + Math.random() * 5, color,
      });
    }
  }

  flash(x, y, text, color = '#3c2a1e') {
    this.flashes.push({ x, y, text, color, age: 0, life: 0.9 });
  }

  say(text, sub = null, seconds = 1.6) {
    this.banner = { text, sub, until: this.t + seconds };
  }

  handle(events) {
    for (const e of events) {
      if (e.type === 'merge') {
        this.burst(e.x, e.y, e.tier);
        this.flash(e.x, e.y, `+${e.gained}`);
        this.shake = Math.min(9, this.shake + 2 + e.tier * 0.4);
        if (e.chain > 1) this.say(`CHAIN ×${e.chain}!`, null, 1.1);
      } else if (e.type === 'absorb') {
        // A Zero landed on something and added nothing. Worth showing, because
        // that is the whole point of Zero, and worth showing as +0.
        this.burst(e.x, e.y, 0, 8);
        this.flash(e.x, e.y, '+0', '#8a8a92');
      } else if (e.type === 'first') {
        this.say(String(e.value), this.blocks[e.tier].word.toUpperCase(), 1.6);
      } else if (e.type === 'final') {
        this.burst(e.x, e.y, e.tier, 46);
        this.flash(e.x, e.y, `+${e.score}`, '#b8322a');
        this.say('4096!!', 'TWO 2048s ★', 2.8);
        this.shake = 16;
      }
    }
  }

  // --- the frame ----------------------------------------------------------

  draw(game, dt) {
    const ctx = this.ctx;
    this.t += dt;
    this.stepEffects(dt);

    ctx.save();
    if (this.shake > 0.2) {
      ctx.translate((Math.random() - 0.5) * this.shake, (Math.random() - 0.5) * this.shake);
      this.shake *= 0.86;
    }

    this.drawBackground(ctx);
    this.drawJar(ctx, game);

    ctx.save();
    // Blocks are clipped to the jar's width so nothing spills over the walls,
    // and to just above the rim so the held block still shows. The HUD is
    // painted after this, so an overflowing jar passes behind the score rather
    // than over it.
    ctx.beginPath();
    ctx.rect(LAYOUT.left - 2, LAYOUT.dropY - 46, LAYOUT.right - LAYOUT.left + 4, LAYOUT.floor - LAYOUT.dropY + 48);
    ctx.clip();
    this.drawDangerLine(ctx, game);
    if (game.state === 'playing') this.drawHeld(ctx, game);
    for (const b of game.world.bodies) this.drawBlock(ctx, b);
    this.drawParticles(ctx);
    ctx.restore();

    this.drawHeader(ctx, game);
    this.drawLadder(ctx, game);
    this.drawFlashes(ctx);
    this.drawBanner(ctx);
    if (this.titleUp) this.drawTitle(ctx, game);
    else if (game.state === 'over') this.drawGameOver(ctx, game);
    ctx.restore();
  }

  stepEffects(dt) {
    for (const p of this.particles) {
      p.age += dt;
      p.vy += 1500 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
    this.particles = this.particles.filter((p) => p.age < p.life);
    for (const f of this.flashes) { f.age += dt; f.y -= 46 * dt; }
    this.flashes = this.flashes.filter((f) => f.age < f.life);
    if (this.banner && this.t > this.banner.until) this.banner = null;
  }

  drawBackground(ctx) {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#dfe9ff');
    g.addColorStop(0.55, '#c6d8f7');
    g.addColorStop(1, '#a8bfe8');
    ctx.fillStyle = g;
    ctx.fillRect(-20, -20, W + 40, H + 40);
  }

  roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  drawHeader(ctx, game) {
    // Its own band, because a block squeezed above the rim passes behind it.
    const g = ctx.createLinearGradient(0, 0, 0, LAYOUT.headerH);
    g.addColorStop(0, 'rgba(223,233,255,0.97)');
    g.addColorStop(1, 'rgba(223,233,255,0.82)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, LAYOUT.headerH - 10);
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#4a5b80';
    ctx.font = `bold 13px ${MONO}`;
    ctx.textAlign = 'left';
    ctx.fillText('SCORE', 22, 16);
    ctx.fillStyle = '#1e2a44';
    ctx.font = `bold 38px ${MONO}`;
    ctx.fillText(String(game.score), 20, 33);

    ctx.font = `bold 13px ${MONO}`;
    ctx.fillStyle = '#4a5b80';
    ctx.fillText('BEST', 200, 16);
    ctx.font = `bold 20px ${MONO}`;
    ctx.fillStyle = '#1e2a44';
    ctx.fillText(String(this.bestEver ?? 0), 200, 34);

    // Next up, in its own little box.
    const bx = 340, by = 14, bw = 122, bh = 76;
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    this.roundRect(ctx, bx, by, bw, bh, 12);
    ctx.fill();
    ctx.strokeStyle = 'rgba(74,91,128,0.35)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#4a5b80';
    ctx.font = `bold 11px ${MONO}`;
    ctx.textAlign = 'center';
    ctx.fillText('NEXT', bx + bw / 2, by + 7);
    this.drawBall(ctx, bx + bw / 2, by + 46, 24, game.next);
  }

  drawJar(ctx, game) {
    const { left, right, top, floor, wall } = LAYOUT;
    ctx.save();
    // Inside first, so the walls sit on top of it.
    ctx.fillStyle = 'rgba(255,255,255,0.38)';
    this.roundRect(ctx, left, top, right - left, floor - top, 20);
    ctx.fill();

    ctx.strokeStyle = '#6b7fa8';
    ctx.lineWidth = wall;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    // Open at the top: down the left wall, across the floor, up the right.
    ctx.moveTo(left - wall / 2, top - 8);
    ctx.lineTo(left - wall / 2, floor - 16);
    ctx.arcTo(left - wall / 2, floor + wall / 2, left + 18, floor + wall / 2, 22);
    ctx.lineTo(right - 18, floor + wall / 2);
    ctx.arcTo(right + wall / 2, floor + wall / 2, right + wall / 2, floor - 16, 22);
    ctx.lineTo(right + wall / 2, top - 8);
    ctx.stroke();

    // Rim caps, so the open top reads as a rim rather than a cut-off line.
    ctx.fillStyle = '#4f6288';
    for (const x of [left - wall / 2, right + wall / 2]) {
      ctx.beginPath();
      ctx.arc(x, top - 8, wall / 2 + 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // A single soft sheen down the left of the glass.
    const sheen = ctx.createLinearGradient(left, 0, left + 120, 0);
    sheen.addColorStop(0, 'rgba(255,255,255,0.32)');
    sheen.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = sheen;
    ctx.fillRect(left + 3, top + 10, 120, floor - top - 20);
    ctx.restore();
  }

  drawDangerLine(ctx, game) {
    const hot = game.overflowing;
    const pulse = 0.4 + 0.35 * Math.sin(this.t * 7);
    ctx.save();
    ctx.setLineDash([9, 9]);
    ctx.lineWidth = hot ? 4 : 2;
    ctx.strokeStyle = hot ? `rgba(214,48,38,${0.55 + pulse * 0.45})` : 'rgba(74,91,128,0.42)';
    ctx.beginPath();
    ctx.moveTo(LAYOUT.left, LAYOUT.dangerY);
    ctx.lineTo(LAYOUT.right, LAYOUT.dangerY);
    ctx.stroke();
    ctx.restore();
  }

  drawHeld(ctx, game) {
    const r = radiusFor(game.held);
    const ready = game.canDrop;
    // Aim guide: a dotted drop line, so you can see where it lands.
    ctx.save();
    ctx.setLineDash([4, 10]);
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(52,72,110,0.30)';
    ctx.beginPath();
    ctx.moveTo(game.holdX, LAYOUT.dropY + r);
    ctx.lineTo(game.holdX, LAYOUT.floor);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    if (!ready) ctx.globalAlpha = 0.35;
    const bob = ready ? Math.sin(this.t * 4) * 2.5 : 0;
    this.drawBall(ctx, game.holdX, LAYOUT.dropY + bob, r, game.held, 0, 0);
    ctx.restore();
  }

  drawBlock(ctx, b) {
    this.drawBall(ctx, b.x, b.y, b.r, b.tier, b.angle, b.squish);
  }

  drawBall(ctx, x, y, r, tier, angle = 0, squish = 0, label = true) {
    const tint = this.tint[tier] ?? this.tint[0];
    const sx = 1 + squish * 0.16;
    const sy = 1 - squish * 0.16;

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(sx, sy);

    // Shadow under the ball, so the pile has depth.
    ctx.fillStyle = 'rgba(40,60,100,0.16)';
    ctx.beginPath();
    ctx.arc(2, 4, r, 0, Math.PI * 2);
    ctx.fill();

    const g = ctx.createRadialGradient(-r * 0.35, -r * 0.4, r * 0.1, 0, 0, r);
    g.addColorStop(0, tint.ball);
    g.addColorStop(1, tint.ballDeep);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();

    // His drawing, stamped on. Solid blocks may spin freely; anything built out
    // of stacked digits only wobbles, so Sixteen never lands upside down.
    ctx.save();
    ctx.rotate(tint.solid ? angle : Math.max(-0.22, Math.min(0.22, angle)));
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.99, 0, Math.PI * 2);
    ctx.clip();
    if (tint.blank) { /* an empty page stays empty */ }
    else if (tint.solid) this.drawSprite(ctx, tier, 0, 0, r, 'cover');
    else this.drawSprite(ctx, tier, 0, 0, r * 0.94, 'contain');
    ctx.restore();

    ctx.lineWidth = Math.max(2, r * 0.07);
    if (tint.dashed) ctx.setLineDash([Math.max(4, r * 0.32), Math.max(3, r * 0.24)]);
    ctx.strokeStyle = tint.ring;
    ctx.beginPath();
    ctx.arc(0, 0, r - ctx.lineWidth / 2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Highlight before the numeral, so the gloss never sits over the digits.
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.beginPath();
    ctx.ellipse(-r * 0.34, -r * 0.42, r * 0.24, r * 0.16, -0.5, 0, Math.PI * 2);
    ctx.fill();

    if (label) this.drawNumeral(ctx, r, tier, tint);
    ctx.restore();
  }

  // The number itself, centred, upright whatever the ball is doing. A rolling
  // numeral is unreadable, and reading it is the point.
  drawNumeral(ctx, r, tier, tint) {
    if (r < 8) return;                        // too small to read; the ladder labels those
    const text = String(valueOf(tier));
    const key = `${tier}:${Math.round(r)}`;
    let size = this.numeralFit.get(key);
    if (size === undefined) {
      // Start from a size that leaves his drawing visible round the numeral,
      // then shrink until it actually fits across the ball.
      size = r * [1.15, 1.15, 0.92, 0.70, 0.56][Math.min(4, text.length)];
      ctx.font = `bold ${size}px ${MONO}`;
      const room = r * 1.52;
      const w = ctx.measureText(text).width;
      if (w > room) size *= room / w;
      this.numeralFit.set(key, size);
    }
    ctx.font = `bold ${size}px ${MONO}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    ctx.lineWidth = Math.max(2, size * 0.2);
    ctx.strokeStyle = tint.inkEdge;
    ctx.strokeText(text, 0, size * 0.04);
    ctx.fillStyle = tint.ink;
    ctx.fillText(text, 0, size * 0.04);
  }

  // Draw tier art centred at (cx, cy) in a box of half-size `half`.
  // 'contain' keeps the whole picture; 'cover' fills the box and lets the
  // clip crop the overhang.
  drawSprite(ctx, tier, cx, cy, half, fit = 'contain') {
    const img = this.images?.[tier];
    const block = this.blocks[tier];
    if (!img || !img.width) {
      // No art loaded (or running headless): a plain disc still plays.
      ctx.fillStyle = block?.color ?? '#e33';
      ctx.beginPath();
      ctx.arc(cx, cy, half, 0, Math.PI * 2);
      ctx.fill();
      return;
    }
    const span = fit === 'cover'
      ? Math.min(img.width, img.height)
      : Math.max(img.width, img.height);
    const scale = (half * 2) / span;
    const w = img.width * scale, h = img.height * scale;
    ctx.imageSmoothingEnabled = false;   // his blocks stay blocks
    ctx.drawImage(img, cx - w / 2, cy - h / 2, w, h);
  }

  // The chart along the bottom: the whole ladder, doubling left to right.
  // Thirteen rungs is too many to letter on the balls themselves, so the
  // numbers go underneath.
  drawLadder(ctx, game) {
    const n = this.blocks.length;
    const step = (W - 22) / n;
    const r = Math.min(12, step * 0.42);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < n; i++) {
      const x = 11 + step * (i + 0.5);
      const reached = i <= game.best;
      ctx.save();
      ctx.globalAlpha = reached ? 1 : 0.32;
      this.drawBall(ctx, x, LAYOUT.ladderBallY, r, i, 0, 0, false);
      ctx.font = `bold ${i === game.best ? 11 : 10}px ${MONO}`;
      ctx.fillStyle = i === game.best ? '#1e2a44' : '#4a5b80';
      ctx.fillText(String(valueOf(i)), x, LAYOUT.ladderLabelY);
      ctx.restore();
    }
  }

  drawParticles(ctx) {
    for (const p of this.particles) {
      const k = 1 - p.age / p.life;
      ctx.globalAlpha = Math.max(0, k);
      ctx.fillStyle = p.color;
      const s = p.size * (0.4 + k * 0.6);
      ctx.fillRect(p.x - s / 2, p.y - s / 2, s, s);
    }
    ctx.globalAlpha = 1;
  }

  drawFlashes(ctx) {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const f of this.flashes) {
      const k = 1 - f.age / f.life;
      ctx.globalAlpha = Math.max(0, k);
      ctx.font = `bold 22px ${MONO}`;
      ctx.lineWidth = 4;
      ctx.lineJoin = 'round';
      ctx.strokeStyle = 'rgba(255,255,255,0.9)';
      ctx.strokeText(f.text, f.x, f.y);
      ctx.fillStyle = f.color;
      ctx.fillText(f.text, f.x, f.y);
    }
    ctx.globalAlpha = 1;
  }

  // Fit the text to the canvas rather than trusting it: "ONE THOUSAND
  // TWENTY-FOUR" is wider than the jar at the size "1024" wants to be.
  fittedFont(ctx, text, size, room, weight = 'bold') {
    ctx.font = `${weight} ${size}px ${MONO}`;
    const w = ctx.measureText(text).width;
    if (w > room) ctx.font = `${weight} ${Math.floor(size * room / w)}px ${MONO}`;
  }

  drawBanner(ctx) {
    if (!this.banner) return;
    const { text, sub } = this.banner;
    const left = this.banner.until - this.t;
    ctx.save();
    ctx.globalAlpha = Math.min(1, left * 2.4);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    this.fittedFont(ctx, text, 40, W - 60);
    ctx.lineWidth = 8;
    ctx.strokeStyle = 'rgba(255,255,255,0.92)';
    ctx.strokeText(text, W / 2, LAYOUT.top + 54);
    ctx.fillStyle = '#d6472a';
    ctx.fillText(text, W / 2, LAYOUT.top + 54);
    if (sub) {
      this.fittedFont(ctx, sub, 17, W - 60);
      ctx.lineWidth = 5;
      ctx.strokeStyle = 'rgba(255,255,255,0.92)';
      ctx.strokeText(sub, W / 2, LAYOUT.top + 88);
      ctx.fillStyle = '#1e2a44';
      ctx.fillText(sub, W / 2, LAYOUT.top + 88);
    }
    ctx.restore();
  }

  // Shown once, before the first drop: whose game this is, and the two rules.
  drawTitle(ctx, game) {
    ctx.save();
    ctx.fillStyle = 'rgba(10,16,30,0.55)';
    ctx.fillRect(0, 0, W, H);
    const cy = H / 2 - 40;
    ctx.fillStyle = 'rgba(8,14,28,0.93)';
    this.roundRect(ctx, 30, cy - 156, W - 60, 452, 22);
    ctx.fill();
    ctx.strokeStyle = 'rgba(160,196,255,0.35)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#e6eeff';
    ctx.font = `bold 40px ${MONO}`;
    ctx.fillText('NUMBER', W / 2, cy - 108);
    ctx.fillText('MERGE', W / 2, cy - 64);
    ctx.font = `bold 15px ${MONO}`;
    ctx.fillStyle = '#9fc0f0';
    ctx.fillText('numbers drawn by ASHER', W / 2, cy - 22);

    // Two the same add up — shown, not explained. 2 + 2 = 4.
    const y1 = cy + 34;
    this.drawBall(ctx, W / 2 - 96, y1, 24, 2);
    ctx.fillStyle = '#e6eeff';
    ctx.font = `bold 22px ${MONO}`;
    ctx.fillText('+', W / 2 - 58, y1);
    this.drawBall(ctx, W / 2 - 20, y1, 24, 2);
    ctx.fillText('=', W / 2 + 22, y1);
    this.drawBall(ctx, W / 2 + 74, y1, 28, 3);

    // And a Zero adds nothing at all. 4 + 0 = 4.
    const y2 = cy + 100;
    this.drawBall(ctx, W / 2 - 96, y2, 28, 3);
    ctx.fillStyle = '#e6eeff';
    ctx.font = `bold 22px ${MONO}`;
    ctx.fillText('+', W / 2 - 54, y2);
    this.drawBall(ctx, W / 2 - 20, y2, 17, 0);
    ctx.fillText('=', W / 2 + 22, y2);
    this.drawBall(ctx, W / 2 + 74, y2, 28, 3);

    ctx.font = `bold 13px ${MONO}`;
    ctx.fillStyle = '#9fc0f0';
    ctx.fillText('two the same add up — all the way to 2048', W / 2, cy + 154);
    ctx.fillText('a ZERO adds nothing, so it just goes away', W / 2, cy + 176);
    ctx.fillText('point where you want it, then tap', W / 2, cy + 206);
    ctx.fillText('keys: ← → to aim, SPACE to drop', W / 2, cy + 228);

    ctx.font = `bold 20px ${MONO}`;
    ctx.fillStyle = Math.sin(this.t * 4) > 0 ? '#fff' : '#9fc0f0';
    ctx.fillText('TAP TO START', W / 2, cy + 268);
    ctx.restore();
  }

  drawGameOver(ctx, game) {
    ctx.save();
    ctx.fillStyle = 'rgba(10,16,30,0.55)';
    ctx.fillRect(0, 0, W, H);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const cy = H / 2 - 60;

    ctx.fillStyle = 'rgba(8,14,28,0.93)';
    this.roundRect(ctx, 30, cy - 108, W - 60, 452, 22);
    ctx.fill();
    ctx.strokeStyle = 'rgba(160,196,255,0.35)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#e6eeff';
    ctx.font = `bold 44px ${MONO}`;
    ctx.fillText('FULL JAR!', W / 2, cy - 60);

    ctx.font = `bold 18px ${MONO}`;
    ctx.fillStyle = '#9fc0f0';
    ctx.fillText('SCORE', W / 2, cy + 4);
    this.fittedFont(ctx, String(game.score), 56, W - 100);
    ctx.fillStyle = '#fff';
    ctx.fillText(String(game.score), W / 2, cy + 46);

    ctx.font = `bold 16px ${MONO}`;
    ctx.fillStyle = '#9fc0f0';
    ctx.fillText('BIGGEST NUMBER', W / 2, cy + 106);
    this.drawBall(ctx, W / 2, cy + 176, 48, game.best);
    this.fittedFont(ctx, this.blocks[game.best].word.toUpperCase(), 19, W - 100);
    ctx.fillStyle = '#fff';
    ctx.fillText(this.blocks[game.best].word.toUpperCase(), W / 2, cy + 244);

    ctx.font = `bold 20px ${MONO}`;
    ctx.fillStyle = Math.sin(this.t * 4) > 0 ? '#fff' : '#9fc0f0';
    ctx.fillText('TAP TO PLAY AGAIN', W / 2, cy + 304);
    ctx.restore();
  }
}
